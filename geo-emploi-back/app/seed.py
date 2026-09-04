"""Jeu de démonstration : comptes, entreprises, offres, candidatures.

    .venv/bin/python -m app.seed          # remplit une base vide
    .venv/bin/python -m app.seed --reset  # vide les données puis remplit

Le script est idempotent : relancé sans --reset sur une base déjà peuplée, il
ne fait rien. Le schéma, lui, reste la propriété d'Alembic — ce script
n'écrit que des lignes.
"""

import json
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from sqlmodel import Session, delete, select
from app.auth.user import password_hash
from app.database import engine
from app.serializers import TYPES_CONTRAT_IN
from app.models import Candidature, Competence, Employer, Experience, JobSeeker, JobSeekerCompetence, Offre, OffreCompetence, Signalement, TitrePoste, User

FIXTURE = Path(__file__).parent / "fixtures" / "demo.json"
DEMO_PASSWORD = "geoemploi2026"
# Les trois comptes de démonstration, un par rôle du sujet.
ADMIN = ("jeb@job-et-bonheur.fr", "Jean-Eudes", "Berlier")
SEEKER = ("camille.aubert@example.fr", "Camille", "Aubert")
# L'employeur de démonstration est la première entreprise de la fixture.
EMPLOYER_EMAIL = "recrutement@rhone-numerique.example.fr"
SEEKER_SKILLS = ["React", "TypeScript", "Next.js", "Accessibilité", "Figma"]
SEEKER_EXPERIENCES = [
    (
        "Développeuse front-end",
        "Studio Rhône",
        date(2023, 9, 1),
        None,
        "Interfaces d'un back-office logistique, design system interne et "
        "passage à Next.js.",
    ),
    (
        "Alternante développement web",
        "Agence Croix-Rousse",
        date(2021, 9, 1),
        date(2023, 8, 31),
        "Sites vitrines et intégration de maquettes, mise en place des tests "
        "end-to-end.",
    ),
]
# Enfants avant parents : les ON DELETE CASCADE du schéma suffiraient, mais
# vider dans l'ordre garde le script lisible et indépendant du schéma.
TABLES = (
    Signalement, Candidature, OffreCompetence, JobSeekerCompetence, Experience,
    Offre, TitrePoste, Competence, JobSeeker, Employer, User,
)

def reset(session: Session) -> None:
    for table in TABLES:
        session.exec(delete(table))
    session.commit()

def _account(
    session: Session,
    email: str,
    role: str,
    firstname: str,
    lastname: str,
    subscription: str = "none",
) -> User:
    account = User(
        email=email,
        password=password_hash.hash(DEMO_PASSWORD),
        firstname=firstname,
        lastname=lastname,
        role=role,
        status="active",
        subscription_type=subscription,
    )
    session.add(account)
    session.flush()
    return account

def _competence(
    session: Session, cache: dict[str, Competence], libelle: str
) -> Competence:
    libelle = libelle.strip()
    if libelle not in cache:
        competence = Competence(libelle=libelle)
        session.add(competence)
        session.flush()
        cache[libelle] = competence
    return cache[libelle]

def _titre(session: Session, cache: dict[str, TitrePoste], libelle: str) -> TitrePoste:
    libelle = libelle.strip()
    if libelle not in cache:
        titre = TitrePoste(libelle=libelle)
        session.add(titre)
        session.flush()
        cache[libelle] = titre
    return cache[libelle]

def seed(session: Session) -> None:
    data = json.loads(FIXTURE.read_text(encoding="utf-8"))
    now = datetime.now(timezone.utc)
    competences: dict[str, Competence] = {}
    titres: dict[str, TitrePoste] = {}

    # ------------------------------------------------------------- comptes
    admin_account = _account(session, ADMIN[0], "admin", ADMIN[1], ADMIN[2])

    seeker_account = _account(session, SEEKER[0], "job_seeker", SEEKER[1], SEEKER[2])
    seeker = JobSeeker(
        compte_id=seeker_account.uid,
        prenom=SEEKER[1],
        nom=SEEKER[2],
        titre_pro="Développeuse front-end — 3 ans d'expérience",
        ville="Lyon",
        disponibilite=(now + timedelta(days=30)).date(),
    )
    session.add(seeker)
    session.flush()

    for libelle in SEEKER_SKILLS:
        session.add(
            JobSeekerCompetence(
                job_seeker_id=seeker.id,
                competence_id=_competence(session, competences, libelle).id,
            )
        )
    for role, company, start, end, description in SEEKER_EXPERIENCES:
        session.add(
            Experience(
                job_seeker_id=seeker.id,
                titre_poste_id=_titre(session, titres, role).id,
                entreprise=company,
                type_contrat="cdi" if end is None else "alternance",
                date_debut=start,
                date_fin=end,
                description=description,
            )
        )

    # --------------------------------------------------------- entreprises
    employers: dict[str, Employer] = {}
    for index, company in enumerate(data["companies"]):
        # Seule la première entreprise a un compte connectable : les autres
        # existent pour peupler la carte, pas pour la démonstration.
        email = (
            EMPLOYER_EMAIL
            if index == 0
            else f"rh+{company['key']}@geoemploi.example.fr"
        )
        account = _account(
            session, email, "employer", "Service", "Recrutement", "standard"
        )
        employer = Employer(
            compte_id=account.uid,
            nom=company["name"],
            siret=str(81234567800000 + index),
            statut_verification="verifie",
            secteur="Édition de logiciels" if index == 0 else None,
            ville=company["city"],
            email_contact=email,
            abonne_depuis=now - timedelta(days=90),
        )
        session.add(employer)
        session.flush()
        employers[company["key"]] = employer

    # -------------------------------------------------------------- offres
    # Statuts de la fixture → vocabulaire de la base (cf. serializers.py).
    STATUT = {"publiee": "validee", "en_attente": "en_attente", "signalee": "validee"}
    # Toutes les entreprises de démonstration sont en formule standard.
    PLAN_RADIUS_KM = 15
    offers: list[Offre] = []
    for item in data["offers"]:
        employer = employers[item["companyKey"]]
        # Les formules ne couvrent que 15 km : la fixture est ramenée au
        # plafond plutôt que de créer des offres qu'aucun employeur ne
        # pourrait publier via l'API.
        radius = min(item["radiusKm"], PLAN_RADIUS_KM)
        offer = Offre(
            employer_id=employer.id,
            titre_poste_id=_titre(session, titres, item["title"]).id,
            description=item["description"],
            # La fixture parle la langue de l'API : on stocke la valeur base.
            type_contrat=TYPES_CONTRAT_IN[item["contract"]],
            code_insee=item["postalCode"],
            latitude=item["lat"],
            longitude=item["lng"],
            perimetre_km=radius,
            nb_vues=item["views"],
            statut_moderation=STATUT[item["status"]],
            salaire=item["salary"],
            adresse=item["address"],
            ville=item["city"],
            code_postal=item["postalCode"],
            # Dates relatives au jour du seed : la démo ne périme pas.
            date_offre=now - timedelta(days=item["daysAgo"]),
        )
        session.add(offer)
        session.flush()
        offers.append(offer)

        for libelle in item["skills"]:
            session.add(
                OffreCompetence(
                    offre_id=offer.id,
                    competence_id=_competence(session, competences, libelle).id,
                )
            )

        if item["status"] == "signalee":
            session.add(
                Signalement(
                    offre_id=offer.id,
                    motif="Annonce suspecte : aucune trace de l'entreprise, "
                    "demande de virement à l'embauche.",
                    statut="ouvert",
                )
            )

    # -------------------------------------------------------- candidatures
    for offer, message, statut in (
        (offers[0], "Bonjour, votre stack correspond exactement à mon parcours.", "en_cours"),
        (offers[5], "Je serais ravie de travailler sur le parcours mobile.", "vue"),
        (offers[1], "Disponible immédiatement pour les permanences.", "envoyee"),
    ):
        session.add(
        Candidature(
                job_seeker_id=seeker.id,
                offre_id=offer.id,
                employer_id=offer.employer_id,
                statut=statut,
                message=message,
                date_creation=now - timedelta(days=2),
            )
        )
    session.commit()
    print(f"Seed terminé : {len(data['companies'])} entreprises, {len(offers)} offres.")
    print(f"  admin      {ADMIN[0]}")
    print(f"  chercheur  {SEEKER[0]}")
    print(f"  employeur  {EMPLOYER_EMAIL}")
    print(f"  mot de passe commun : {DEMO_PASSWORD}")
    print(f"  (compte administrateur : {admin_account.email})")

def main() -> int:
    with Session(engine) as session:
        if "--reset" in sys.argv:
            reset(session)
        elif session.exec(select(User).limit(1)).first():
            print("Base déjà peuplée — rien à faire (utilisez --reset pour repartir de zéro).")
            return 0
        seed(session)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
