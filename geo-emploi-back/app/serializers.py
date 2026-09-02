"""Passage modèle SQL → DTO d'API.

Un seul endroit décide de la forme envoyée au front : les routes ne
construisent pas de dictionnaires à la main.
"""

from datetime import datetime, timedelta, timezone

from sqlmodel import Session, col, select

from app.models import (
    Account,
    Application,
    Employer,
    Experience,
    JobOffer,
    JobOfferSkill,
    JobSeeker,
    JobSeekerSkill,
    JobTitle,
    OfferReport,
    Skill,
)
from app.schemas import (
    ApplicationOut,
    CompanyOut,
    ExperienceOut,
    ListingOut,
    ReportOut,
    SeekerProfileOut,
    SessionUser,
    UserAccountOut,
)
from app.schemas import OFFER_MAX_AGE_DAYS


def _aware(moment: datetime) -> datetime:
    """psycopg peut rendre un datetime naïf selon la session : on normalise."""
    return moment if moment.tzinfo else moment.replace(tzinfo=timezone.utc)


def is_expired(offer: JobOffer) -> bool:
    cutoff = datetime.now(timezone.utc) - timedelta(days=OFFER_MAX_AGE_DAYS)
    return offer.archived_at is not None or _aware(offer.published_at) < cutoff


def listing_status(offer: JobOffer, *, reported: bool = False) -> str:
    """Statut affiché, dérivé de l'état réel de l'offre.

    L'ordre va du plus explicite au plus déductif : une offre retirée par la
    modération reste « refusée » même une fois périmée — sinon l'employeur ne
    saurait jamais pourquoi elle a quitté la carte.
    """
    if offer.moderation_status == "rejected":
        return "refusee"
    if is_expired(offer):
        return "archivee"
    if reported:
        return "signalee"
    if offer.moderation_status == "pending":
        return "en_attente"
    return "publiee"


# --------------------------------------------------------------- agrégation
def skills_by_offer(db: Session, offer_ids: list[int]) -> dict[int, list[str]]:
    if not offer_ids:
        return {}
    rows = db.exec(
        select(JobOfferSkill.job_offer_id, Skill.label)
        .join(Skill, col(Skill.id) == col(JobOfferSkill.skill_id))
        .where(col(JobOfferSkill.job_offer_id).in_(offer_ids))
    ).all()
    grouped: dict[int, list[str]] = {}
    for offer_id, label in rows:
        grouped.setdefault(offer_id, []).append(label)
    return grouped


def reported_offer_ids(db: Session, offer_ids: list[int]) -> set[int]:
    if not offer_ids:
        return set()
    rows = db.exec(
        select(OfferReport.job_offer_id)
        .where(col(OfferReport.job_offer_id).in_(offer_ids))
        .where(OfferReport.status == "open")
    ).all()
    return set(rows)


def seeker_skills(db: Session, seeker_id: int) -> list[str]:
    return list(
        db.exec(
            select(Skill.label)
            .join(JobSeekerSkill, col(JobSeekerSkill.skill_id) == col(Skill.id))
            .where(JobSeekerSkill.job_seeker_id == seeker_id)
            .order_by(col(Skill.label))
        ).all()
    )


def get_or_create_skill(db: Session, label: str) -> Skill:
    clean = label.strip()
    skill = db.exec(select(Skill).where(Skill.label == clean)).first()
    if skill is None:
        skill = Skill(label=clean)
        db.add(skill)
        db.flush()
    return skill


def get_or_create_job_title(db: Session, label: str) -> JobTitle:
    clean = label.strip()
    title = db.exec(select(JobTitle).where(JobTitle.label == clean)).first()
    if title is None:
        title = JobTitle(label=clean)
        db.add(title)
        db.flush()
    return title


# ------------------------------------------------------------ sérialisation
def listing_out(
    offer: JobOffer,
    title: str,
    employer: Employer,
    skills: list[str],
    *,
    reported: bool = False,
) -> ListingOut:
    return ListingOut(
        id=str(offer.id),
        title=title,
        company_id=str(employer.id),
        company=employer.name,
        contract=offer.contract_type,
        salary=offer.salary_label or "Non précisé",
        description=offer.description or "",
        skills=skills,
        address=offer.address or "",
        city=offer.city,
        postal_code=offer.postal_code or "",
        radius_km=offer.radius_km,
        published_at=_aware(offer.published_at).date(),
        status=listing_status(offer, reported=reported),
        views=offer.view_count,
        lat=float(offer.latitude),
        lng=float(offer.longitude),
    )


def listings_out(db: Session, rows: list[tuple[JobOffer, JobTitle, Employer]]):
    """Sérialise un lot d'offres en deux requêtes, pas 2×N."""
    offer_ids = [offer.id for offer, _, _ in rows if offer.id is not None]
    skills = skills_by_offer(db, offer_ids)
    reported = reported_offer_ids(db, offer_ids)
    return [
        listing_out(
            offer,
            title.label,
            employer,
            skills.get(offer.id or 0, []),
            reported=offer.id in reported,
        )
        for offer, title, employer in rows
    ]


def application_out(
    application: Application,
    title: str,
    company: str,
    seeker: JobSeeker,
) -> ApplicationOut:
    return ApplicationOut(
        id=str(application.id),
        listing_id=str(application.job_offer_id),
        listing_title=title,
        listing_company=company,
        seeker_id=str(application.job_seeker_id),
        seeker_name=f"{seeker.first_name} {seeker.last_name}".strip(),
        message=application.message or "",
        status=application.status,
        sent_at=_aware(application.created_at).date(),
    )


def experience_out(experience: Experience, title: str) -> ExperienceOut:
    end = experience.end_date.year if experience.end_date else "aujourd'hui"
    return ExperienceOut(
        id=str(experience.id),
        role=title,
        company=experience.company_name,
        period=f"{experience.start_date.year} — {end}",
        description=experience.description or "",
    )


def seeker_profile_out(
    seeker: JobSeeker,
    account: Account,
    skills: list[str],
    experiences: list[ExperienceOut],
    caught: int,
) -> SeekerProfileOut:
    if seeker.available_from:
        availability = f"Disponible à partir du {seeker.available_from:%d/%m/%Y}"
    else:
        availability = "Disponible immédiatement"
    return SeekerProfileOut(
        id=str(seeker.id),
        name=f"{seeker.first_name} {seeker.last_name}".strip(),
        email=account.email,
        headline=seeker.headline or "",
        city=seeker.city or "",
        availability=availability,
        skills=skills,
        experiences=experiences,
        caught=caught,
    )


def company_out(employer: Employer, account: Account) -> CompanyOut:
    return CompanyOut(
        id=str(employer.id),
        name=employer.name,
        siret=employer.siret or "",
        sector=employer.sector or "",
        city=employer.city or "",
        contact_email=employer.contact_email or account.email,
        plan=employer.subscription_plan,
        plan_price=employer.plan_price_eur,
        radius_km=employer.plan_radius_km,
        subscribed_since=(
            _aware(employer.subscribed_at).date() if employer.subscribed_at else None
        ),
    )


def session_user(account: Account, display_name: str) -> SessionUser:
    return SessionUser(
        id=str(account.id),
        name=display_name,
        email=account.email,
        role=account.role,
        status=account.status,
        created_at=_aware(account.created_at),
    )


def display_name(db: Session, account: Account) -> str:
    """Nom affiché dans l'en-tête : raison sociale ou nom de la personne."""
    if account.display_name:
        return account.display_name
    if account.role == "employer":
        employer = db.exec(
            select(Employer).where(Employer.account_id == account.id)
        ).first()
        if employer:
            return employer.name
    else:
        seeker = db.exec(
            select(JobSeeker).where(JobSeeker.account_id == account.id)
        ).first()
        if seeker:
            return f"{seeker.first_name} {seeker.last_name}".strip()
    return account.email.split("@")[0]


def user_account_out(account: Account, name: str) -> UserAccountOut:
    return UserAccountOut(
        id=str(account.id),
        name=name,
        email=account.email,
        role=account.role,
        status=account.status,
        created_at=_aware(account.created_at).date(),
    )


def report_out(report: OfferReport, listing_title: str) -> ReportOut:
    return ReportOut(
        id=str(report.id),
        listing_id=str(report.job_offer_id),
        listing_title=listing_title,
        reason=report.reason,
        status=report.status,
        created_at=_aware(report.created_at).date(),
    )
