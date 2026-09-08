"""Passage modèle SQL → DTO d'API.

Un seul endroit décide de la forme envoyée au front : les routes ne
construisent pas de dictionnaires à la main.

C'est aussi la frontière des vocabulaires. La base parle français, comme le
reste du schéma (`statut = 'envoyee'`, `'en_attente'`, `'ouvert'`) ; le contrat
d'API parle la langue du front (`'sent'`, `'pending'`, `'open'`, cf.
lib/schemas.ts). Les tables ci-dessous sont le seul point de passage entre les
deux : aucune route ne manipule un statut de base directement.
"""

from datetime import datetime, timedelta, timezone
from sqlmodel import Session, col, select
from app.models import Candidature, Competence, Employer, Experience, JobSeeker, JobSeekerCompetence, Offre, OffreCompetence, Signalement, TitrePoste, User
from app.schemas import OFFER_MAX_AGE_DAYS, ApplicationOut, CompanyOut, ExperienceOut, ListingOut, ReportOut, SeekerProfileOut, SessionUser, UserAccountOut

# --------------------------------------------------------- vocabulaires
# base → API. Les valeurs de gauche sont celles du schéma : ce sont exactement
# celles que la migration initiale avait posées en types énumérés, avant que
# 31a383d592da ne les repasse en texte libre. La contrainte a disparu de la
# base, la convention non — ces tables la tiennent.
#
# L'inverse est dérivé, pour ne décrire la correspondance qu'une fois :
# ajouter un statut se fait sur une seule ligne.
CANDIDATURE_STATUTS = {
    "envoyee": "sent",
    "vue": "viewed",
    "en_cours": "in_review",
    "acceptee": "accepted",
    "refusee": "rejected",
}
MODERATION_STATUTS = {
    "en_attente": "pending",
    "validee": "approved",
    "rejetee": "rejected",
}
SIGNALEMENT_STATUTS = {
    "ouvert": "open",
    "traite": "reviewed",
    "rejete": "dismissed",
}
TYPES_CONTRAT = {
    "cdi": "permanent",
    "cdd": "fixed_term",
    "interim": "temp_agency",
    "stage": "internship",
    "alternance": "apprenticeship",
    "freelance": "freelance",
}

def _invert(table: dict[str, str]) -> dict[str, str]:
    return {value: key for key, value in table.items()}

CANDIDATURE_STATUTS_IN = _invert(CANDIDATURE_STATUTS)
MODERATION_STATUTS_IN = _invert(MODERATION_STATUTS)
SIGNALEMENT_STATUTS_IN = _invert(SIGNALEMENT_STATUTS)
TYPES_CONTRAT_IN = _invert(TYPES_CONTRAT)

def _aware(moment: datetime) -> datetime:
    """psycopg peut rendre un datetime naïf selon la session : on normalise."""
    return moment if moment.tzinfo else moment.replace(tzinfo=timezone.utc)

def is_expired(offer: Offre) -> bool:
    cutoff = datetime.now(timezone.utc) - timedelta(days=OFFER_MAX_AGE_DAYS)
    return offer.archivee_le is not None or _aware(offer.date_offre) < cutoff

def listing_status(offer: Offre, *, reported: bool = False) -> str:
    """Statut affiché, dérivé de l'état réel de l'offre.

    L'ordre va du plus explicite au plus déductif : une offre retirée par la
    modération reste « refusée » même une fois périmée — sinon l'employeur ne
    saurait jamais pourquoi elle a quitté la carte.
    """
    if offer.statut_moderation == "rejetee":
        return "refusee"
    if is_expired(offer):
        return "archivee"
    if reported:
        return "signalee"
    if offer.statut_moderation == "en_attente":
        return "en_attente"
    return "publiee"

# --------------------------------------------------------------- agrégation
def skills_by_offer(db: Session, offer_ids: list[int]) -> dict[int, list[str]]:
    if not offer_ids:
        return {}
    rows = db.exec(select(OffreCompetence.offre_id, Competence.libelle)
        .join(Competence, col(Competence.id) == col(OffreCompetence.competence_id))
        .where(col(OffreCompetence.offre_id).in_(offer_ids))
    ).all()
    grouped: dict[int, list[str]] = {}
    for offer_id, libelle in rows:
        grouped.setdefault(offer_id, []).append(libelle)
    return grouped

def reported_offer_ids(db: Session, offer_ids: list[int]) -> set[int]:
    if not offer_ids:
        return set()
    rows = db.exec(select(Signalement.offre_id)
        .where(col(Signalement.offre_id).in_(offer_ids))
        .where(Signalement.statut == "ouvert")
    ).all()
    return set(rows)

def seeker_skills(db: Session, seeker_id: int) -> list[str]:
    return list(db.exec(select(Competence.libelle).join(JobSeekerCompetence,col(JobSeekerCompetence.competence_id) == col(Competence.id),)
        .where(JobSeekerCompetence.job_seeker_id == seeker_id)
        .order_by(col(Competence.libelle))
        ).all()
    )

def get_or_create_competence(db: Session, libelle: str) -> Competence:
    clean = libelle.strip()
    competence = db.exec(select(Competence).where(Competence.libelle == clean)
    ).first()
    if competence is None:
        competence = Competence(libelle=clean)
        db.add(competence)
        db.flush()
    return competence

def get_or_create_titre_poste(db: Session, libelle: str) -> TitrePoste:
    clean = libelle.strip()
    titre = db.exec(select(TitrePoste).where(TitrePoste.libelle == clean)).first()
    if titre is None:
        titre = TitrePoste(libelle=clean)
        db.add(titre)
        db.flush()
    return titre

# ------------------------------------------------------------ sérialisation
def listing_out(offer: Offre, titre: str, employer: Employer, skills: list[str], *, reported: bool = False) -> ListingOut:
    return ListingOut(
        id=str(offer.id),
        title=titre,
        company_id=str(employer.id),
        company=employer.nom,
        contract=TYPES_CONTRAT[offer.type_contrat],
        salary=offer.salaire or "Non précisé",
        description=offer.description or "",
        skills=skills,
        address=offer.adresse or "",
        city=offer.ville,
        postal_code=offer.code_postal or "",
        radius_km=offer.perimetre_km,
        published_at=_aware(offer.date_offre).date(),
        status=listing_status(offer, reported=reported),
        views=offer.nb_vues,
        lat=float(offer.latitude),
        lng=float(offer.longitude),
    )

def listings_out(db: Session, rows: list[tuple[Offre, TitrePoste, Employer]]):
    """Sérialise un lot d'offres en deux requêtes, pas 2×N."""
    offer_ids = [offer.id for offer, _, _ in rows if offer.id is not None]
    skills = skills_by_offer(db, offer_ids)
    reported = reported_offer_ids(db, offer_ids)
    return [
        listing_out(offer, titre.libelle, employer, skills.get(offer.id or 0, []), reported=offer.id in reported)
        for offer, titre, employer in rows
    ]

def application_out(application: Candidature, titre: str, company: str, seeker: JobSeeker) -> ApplicationOut:
    return ApplicationOut(
        id=str(application.id),
        listing_id=str(application.offre_id),
        listing_title=titre,
        listing_company=company,
        seeker_id=str(application.job_seeker_id),
        seeker_name=f"{seeker.prenom} {seeker.nom}".strip(),
        message=application.message or "",
        status=CANDIDATURE_STATUTS[application.statut],
        sent_at=_aware(application.date_creation).date(),
    )

def experience_out(experience: Experience, titre: str) -> ExperienceOut:
    end = experience.date_fin.year if experience.date_fin else "aujourd'hui"
    return ExperienceOut(
        id=str(experience.id),
        role=titre,
        company=experience.entreprise,
        period=f"{experience.date_debut.year} — {end}",
        description=experience.description or "",
    )

def seeker_profile_out(seeker: JobSeeker, account: User, skills: list[str], experiences: list[ExperienceOut]) -> SeekerProfileOut:
    if seeker.disponibilite:
        availability = f"Disponible à partir du {seeker.disponibilite:%d/%m/%Y}"
    else:
        availability = "Disponible immédiatement"
    return SeekerProfileOut(
        id=str(seeker.id),
        name=f"{seeker.prenom} {seeker.nom}".strip(),
        email=account.email,
        headline=seeker.titre_pro or "",
        city=seeker.ville or "",
        availability=availability,
        skills=skills,
        experiences=experiences,
    )

def company_out(employer: Employer, account: User, radius_km: int) -> CompanyOut:
    return CompanyOut(
        id=str(employer.id),
        name=employer.nom,
        siret=employer.siret or "",
        sector=employer.secteur or "",
        city=employer.ville or "",
        contact_email=employer.email_contact or account.email,
        radius_km=radius_km,
    )

def session_user(account: User, display_name: str) -> SessionUser:
    return SessionUser(
        id=str(account.uid),
        name=display_name,
        email=account.email,
        role=account.role,
        status=account.status,
        created_at=_aware(account.created_at),
    )

def display_name(db: Session, account: User) -> str:
    """Nom affiché dans l'en-tête : raison sociale ou nom de la personne."""
    if account.role == "employer":
        employer = db.exec(
            select(Employer).where(Employer.compte_id == account.uid)
        ).first()
        if employer:
            return employer.nom
    full = f"{account.firstname} {account.lastname}".strip()
    return full or account.email.split("@")[0]

def user_account_out(account: User, name: str) -> UserAccountOut:
    return UserAccountOut(
        id=str(account.uid),
        name=name,
        email=account.email,
        role=account.role,
        status=account.status,
        created_at=_aware(account.created_at).date(),
    )

def report_out(report: Signalement, listing_title: str) -> ReportOut:
    return ReportOut(
        id=str(report.id),
        listing_id=str(report.offre_id),
        listing_title=listing_title,
        reason=report.motif,
        status=SIGNALEMENT_STATUTS[report.statut],
        created_at=_aware(report.date_creation).date(),
    )
