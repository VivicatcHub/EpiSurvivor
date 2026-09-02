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

from app.auth.user import hash_password
from app.database import engine
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

TABLES = (
    OfferReport, Application, JobOfferSkill, JobSeekerSkill, Experience,
    JobOffer, JobTitle, Skill, JobSeeker, Employer, Account,
)


def reset(session: Session) -> None:
    for table in TABLES:
        session.exec(delete(table))
    session.commit()


def _account(
    session: Session, email: str, role: str, name: str | None = None
) -> Account:
    account = Account(
        email=email, password_hash=hash_password(DEMO_PASSWORD), role=role,
        status="active", display_name=name,
    )
    session.add(account)
    session.flush()
    return account


def _skill(session: Session, cache: dict[str, Skill], label: str) -> Skill:
    label = label.strip()
    if label not in cache:
        skill = Skill(label=label)
        session.add(skill)
        session.flush()
        cache[label] = skill
    return cache[label]


def _title(session: Session, cache: dict[str, JobTitle], label: str) -> JobTitle:
    label = label.strip()
    if label not in cache:
        title = JobTitle(label=label)
        session.add(title)
        session.flush()
        cache[label] = title
    return cache[label]


def seed(session: Session) -> None:
    data = json.loads(FIXTURE.read_text(encoding="utf-8"))
    now = datetime.now(timezone.utc)
    skills: dict[str, Skill] = {}
    titles: dict[str, JobTitle] = {}

    # ------------------------------------------------------------- comptes
    admin_account = _account(session, ADMIN[0], "admin", f"{ADMIN[1]} {ADMIN[2]}")

    seeker_account = _account(session, SEEKER[0], "job_seeker")
    seeker = JobSeeker(
        account_id=seeker_account.id,
        first_name=SEEKER[1],
        last_name=SEEKER[2],
        headline="Développeuse front-end — 3 ans d'expérience",
        city="Lyon",
        available_from=(now + timedelta(days=30)).date(),
    )
    session.add(seeker)
    session.flush()

    for label in SEEKER_SKILLS:
        session.add(
            JobSeekerSkill(
                job_seeker_id=seeker.id, skill_id=_skill(session, skills, label).id
            )
        )
    for role, company, start, end, description in SEEKER_EXPERIENCES:
        session.add(
            Experience(
                job_seeker_id=seeker.id,
                job_title_id=_title(session, titles, role).id,
                company_name=company,
                contract_type="permanent" if end is None else "apprenticeship",
                start_date=start,
                end_date=end,
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
        account = _account(session, email, "employer")
        employer = Employer(
            account_id=account.id,
            name=company["name"],
            siret=str(81234567800000 + index),
            verification_status="verified",
            sector="Édition de logiciels" if index == 0 else None,
            city=company["city"],
            contact_email=email,
            subscription_plan="standard",
            subscribed_at=now - timedelta(days=90),
            plan_radius_km=15,
            plan_price_eur=400,
        )
        session.add(employer)
        session.flush()
        employers[company["key"]] = employer

    # -------------------------------------------------------------- offres
    STATUS = {"publiee": "approved", "en_attente": "pending", "signalee": "approved"}
    offers: list[JobOffer] = []
    for item in data["offers"]:
        employer = employers[item["companyKey"]]
        # Les formules ne couvrent que 15 km : la fixture est ramenée au
        # plafond plutôt que de créer des offres qu'aucun employeur ne
        # pourrait publier via l'API.
        radius = min(item["radiusKm"], employer.plan_radius_km)
        offer = JobOffer(
            employer_id=employer.id,
            job_title_id=_title(session, titles, item["title"]).id,
            description=item["description"],
            contract_type=item["contract"],
            insee_code=item["postalCode"],
            latitude=item["lat"],
            longitude=item["lng"],
            radius_km=radius,
            view_count=item["views"],
            moderation_status=STATUS[item["status"]],
            salary_label=item["salary"],
            address=item["address"],
            city=item["city"],
            postal_code=item["postalCode"],
            # Dates relatives au jour du seed : la démo ne périme pas.
            published_at=now - timedelta(days=item["daysAgo"]),
        )
        session.add(offer)
        session.flush()
        offers.append(offer)

        for label in item["skills"]:
            session.add(
                JobOfferSkill(
                    job_offer_id=offer.id, skill_id=_skill(session, skills, label).id
                )
            )

        if item["status"] == "signalee":
            session.add(
                OfferReport(
                    job_offer_id=offer.id,
                    reason="Annonce suspecte : aucune trace de l'entreprise, "
                    "demande de virement à l'embauche.",
                    status="open",
                )
            )

    # -------------------------------------------------------- candidatures
    for offer, message, status in (
        (offers[0], "Bonjour, votre stack correspond exactement à mon parcours.", "in_review"),
        (offers[5], "Je serais ravie de travailler sur le parcours mobile.", "viewed"),
        (offers[1], "Disponible immédiatement pour les permanences.", "sent"),
    ):
        session.add(
            Application(
                job_seeker_id=seeker.id,
                job_offer_id=offer.id,
                employer_id=offer.employer_id,
                status=status,
                message=message,
                created_at=now - timedelta(days=2),
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
        elif session.exec(select(Account).limit(1)).first():
            print("Base déjà peuplée — rien à faire (utilisez --reset pour repartir de zéro).")
            return 0
        seed(session)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
