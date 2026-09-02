"""Modèles SQLModel calqués sur le schéma Alembic de geo-emploi-db.

⚠️ Ces classes ne créent rien : le schéma est la propriété des migrations
(`geo-emploi-db/alembic`). Toute colonne ajoutée ici doit d'abord exister dans
une révision Alembic, sinon la requête part en erreur au runtime.

Les ENUM PostgreSQL sont déclarés avec `create_type=False` pour la même
raison — c'est la migration qui les a créés.
"""

from datetime import date, datetime, timezone

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlmodel import Field, SQLModel


def _enum(name: str, *values: str, default: str | None = None, nullable: bool = False):
    """Colonne adossée à un ENUM PostgreSQL déjà créé par Alembic."""
    return sa.Column(
        postgresql.ENUM(*values, name=name, create_type=False),
        nullable=nullable,
        server_default=default,
    )


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Account(SQLModel, table=True):
    __tablename__ = "account"

    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(sa_column=sa.Column(postgresql.CITEXT(), nullable=False, unique=True))
    password_hash: str
    display_name: str | None = None
    role: str = Field(sa_column=_enum("account_role", "job_seeker", "employer", "admin"))
    status: str = Field(
        default="active",
        sa_column=_enum("account_status", "active", "suspended", default="active"),
    )
    created_at: datetime = Field(default_factory=_now)


class JobSeeker(SQLModel, table=True):
    __tablename__ = "job_seeker"

    id: int | None = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="account.id")
    last_name: str
    first_name: str
    phone: str | None = None
    available_from: date | None = None
    headline: str | None = None
    city: str | None = None
    created_at: datetime = Field(default_factory=_now)


class Employer(SQLModel, table=True):
    __tablename__ = "employer"

    id: int | None = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="account.id")
    name: str
    siret: str | None = None
    phone: str | None = None
    verification_status: str = Field(
        default="pending",
        sa_column=_enum(
            "verif_status", "pending", "verified", "rejected", default="pending",
        ),
    )
    sector: str | None = None
    city: str | None = None
    contact_email: str | None = Field(
        default=None, sa_column=sa.Column(postgresql.CITEXT(), nullable=True),
    )
    subscription_plan: str = Field(
        default="none",
        sa_column=_enum(
            "subscription_plan", "none", "standard", "premium", default="none",
        ),
    )
    subscribed_at: datetime | None = None
    plan_radius_km: int = 15
    plan_price_eur: int = 0
    created_at: datetime = Field(default_factory=_now)


class Skill(SQLModel, table=True):
    __tablename__ = "skill"

    id: int | None = Field(default=None, primary_key=True)
    label: str


class JobSeekerSkill(SQLModel, table=True):
    __tablename__ = "job_seeker_skill"

    job_seeker_id: int = Field(foreign_key="job_seeker.id", primary_key=True)
    skill_id: int = Field(foreign_key="skill.id", primary_key=True)


class JobOfferSkill(SQLModel, table=True):
    __tablename__ = "job_offer_skill"

    job_offer_id: int = Field(foreign_key="job_offer.id", primary_key=True)
    skill_id: int = Field(foreign_key="skill.id", primary_key=True)


class JobTitle(SQLModel, table=True):
    __tablename__ = "job_title"

    id: int | None = Field(default=None, primary_key=True)
    label: str


class Experience(SQLModel, table=True):
    __tablename__ = "experience"

    id: int | None = Field(default=None, primary_key=True)
    job_seeker_id: int = Field(foreign_key="job_seeker.id")
    job_title_id: int = Field(foreign_key="job_title.id")
    company_name: str
    contract_type: str | None = Field(
        default=None,
        sa_column=_enum(
            "contract_type", "permanent", "fixed_term", "temp_agency",
            "internship", "apprenticeship", "freelance", nullable=True,
        ),
    )
    start_date: date
    end_date: date | None = None
    description: str | None = None


class JobOffer(SQLModel, table=True):
    __tablename__ = "job_offer"

    id: int | None = Field(default=None, primary_key=True)
    employer_id: int = Field(foreign_key="employer.id")
    job_title_id: int = Field(foreign_key="job_title.id")
    description: str | None = None
    contract_type: str = Field(
        sa_column=_enum(
            "contract_type", "permanent", "fixed_term", "temp_agency",
            "internship", "apprenticeship", "freelance",
        ),
    )
    insee_code: str
    insee_district_code: str = "00000"
    latitude: float = Field(sa_column=sa.Column(sa.Numeric(9, 6), nullable=False))
    longitude: float = Field(sa_column=sa.Column(sa.Numeric(9, 6), nullable=False))
    radius_km: int = 20
    view_count: int = 0
    moderation_status: str = Field(
        default="pending",
        sa_column=_enum(
            "moder_status", "pending", "approved", "rejected", default="pending",
        ),
    )
    salary_label: str | None = None
    address: str | None = None
    city: str = ""
    postal_code: str | None = None
    archived_at: datetime | None = None
    published_at: datetime = Field(default_factory=_now)


class Application(SQLModel, table=True):
    __tablename__ = "application"

    id: int | None = Field(default=None, primary_key=True)
    job_seeker_id: int = Field(foreign_key="job_seeker.id")
    job_offer_id: int = Field(foreign_key="job_offer.id")
    employer_id: int = Field(foreign_key="employer.id")
    status: str = Field(
        default="sent",
        sa_column=_enum(
            "app_status", "sent", "viewed", "in_review", "accepted", "rejected",
            default="sent",
        ),
    )
    message: str | None = None
    created_at: datetime = Field(default_factory=_now)


class OfferReport(SQLModel, table=True):
    __tablename__ = "offer_report"

    id: int | None = Field(default=None, primary_key=True)
    job_offer_id: int = Field(foreign_key="job_offer.id")
    reporter_account_id: int | None = Field(default=None, foreign_key="account.id")
    reason: str
    status: str = Field(
        default="open",
        sa_column=_enum(
            "report_status", "open", "reviewed", "dismissed", default="open",
        ),
    )
    created_at: datetime = Field(default_factory=_now)
