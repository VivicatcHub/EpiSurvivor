"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-08-31

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


# --------------------------------------------------------------------------
# Types énumérés — déclarés une fois, créés explicitement dans upgrade().
# create_type=False sur les colonnes : sinon SQLAlchemy réémet un CREATE TYPE
# au premier create_table qui les utilise.
# --------------------------------------------------------------------------
account_role = postgresql.ENUM(
    "job_seeker", "employer", "admin",
    name="account_role", create_type=False,
)
account_status = postgresql.ENUM(
    "active", "suspended",
    name="account_status", create_type=False,
)
verif_status = postgresql.ENUM(
    "pending", "verified", "rejected",
    name="verif_status", create_type=False,
)
moder_status = postgresql.ENUM(
    "pending", "approved", "rejected",
    name="moder_status", create_type=False,
)
app_status = postgresql.ENUM(
    "sent", "viewed", "in_review", "accepted", "rejected",
    name="app_status", create_type=False,
)
contract_type = postgresql.ENUM(
    "permanent", "fixed_term", "temp_agency",
    "internship", "apprenticeship", "freelance",
    name="contract_type", create_type=False,
)

ENUMS = (
    account_role,
    account_status,
    verif_status,
    moder_status,
    app_status,
    contract_type,
)


def upgrade() -> None:
    bind = op.get_bind()

    # CITEXT est une extension, pas un type de base.
    op.execute("CREATE EXTENSION IF NOT EXISTS citext")

    for enum in ENUMS:
        enum.create(bind, checkfirst=True)

    # ---------------------------------------------------------------- account
    op.create_table(
        "account",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), nullable=False),
        sa.Column("email", postgresql.CITEXT(), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("role", account_role, nullable=False),
        sa.Column("status", account_status, nullable=False, server_default="active"),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email", name="uq_account_email"),
    )

    # ------------------------------------------------------------- job_seeker
    op.create_table(
        "job_seeker",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), nullable=False),
        sa.Column("account_id", sa.BigInteger(), nullable=False),
        sa.Column("last_name", sa.Text(), nullable=False),
        sa.Column("first_name", sa.Text(), nullable=False),
        sa.Column("phone", sa.Text(), nullable=True),
        sa.Column("available_from", sa.Date(), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["account_id"], ["account.id"],
            name="fk_job_seeker_account", ondelete="CASCADE",
        ),
        sa.UniqueConstraint("account_id", name="uq_job_seeker_account"),
    )

    # --------------------------------------------------------------- employer
    op.create_table(
        "employer",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), nullable=False),
        sa.Column("account_id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("siret", sa.CHAR(14), nullable=True),
        sa.Column("phone", sa.Text(), nullable=True),
        sa.Column(
            "verification_status",
            verif_status,
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["account_id"], ["account.id"],
            name="fk_employer_account", ondelete="CASCADE",
        ),
        sa.UniqueConstraint("account_id", name="uq_employer_account"),
        sa.UniqueConstraint("siret", name="uq_employer_siret"),
    )

    # ------------------------------------------------------------------ skill
    op.create_table(
        "skill",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), nullable=False),
        sa.Column("label", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("label", name="uq_skill_label"),
    )

    # ------------------------------------------------------- job_seeker_skill
    op.create_table(
        "job_seeker_skill",
        sa.Column("job_seeker_id", sa.BigInteger(), nullable=False),
        sa.Column("skill_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(
            ["job_seeker_id"], ["job_seeker.id"],
            name="fk_jss_job_seeker", ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["skill_id"], ["skill.id"],
            name="fk_jss_skill", ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("job_seeker_id", "skill_id"),
    )
    op.create_index("ix_jss_skill_id", "job_seeker_skill", ["skill_id"])

    # -------------------------------------------------------------- job_title
    op.create_table(
        "job_title",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), nullable=False),
        sa.Column("label", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("label", name="uq_job_title_label"),
    )

    # ------------------------------------------------------------- experience
    op.create_table(
        "experience",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), nullable=False),
        sa.Column("job_seeker_id", sa.BigInteger(), nullable=False),
        sa.Column("job_title_id", sa.BigInteger(), nullable=False),
        sa.Column("company_name", sa.Text(), nullable=False),
        sa.Column("contract_type", contract_type, nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["job_seeker_id"], ["job_seeker.id"],
            name="fk_experience_job_seeker", ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["job_title_id"], ["job_title.id"],
            name="fk_experience_job_title",
        ),
        sa.CheckConstraint(
            "end_date IS NULL OR end_date >= start_date",
            name="ck_experience_dates",
        ),
    )
    op.create_index("ix_experience_job_seeker_id", "experience", ["job_seeker_id"])

    # -------------------------------------------------------------- job_offer
    op.create_table(
        "job_offer",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), nullable=False),
        sa.Column("employer_id", sa.BigInteger(), nullable=False),
        sa.Column("job_title_id", sa.BigInteger(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("contract_type", contract_type, nullable=False),
        sa.Column("insee_code", sa.CHAR(5), nullable=False),
        sa.Column(
            "insee_district_code",
            sa.CHAR(5),
            nullable=False,
            server_default="00000",
        ),
        sa.Column("latitude", sa.Numeric(9, 6), nullable=False),
        sa.Column("longitude", sa.Numeric(9, 6), nullable=False),
        sa.Column("radius_km", sa.Integer(), nullable=False, server_default="20"),
        sa.Column("view_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "moderation_status",
            moder_status,
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "published_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["employer_id"], ["employer.id"],
            name="fk_job_offer_employer", ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["job_title_id"], ["job_title.id"],
            name="fk_job_offer_job_title",
        ),
        sa.CheckConstraint("radius_km > 0", name="ck_job_offer_radius"),
        sa.CheckConstraint(
            "latitude BETWEEN -90 AND 90", name="ck_job_offer_latitude",
        ),
        sa.CheckConstraint(
            "longitude BETWEEN -180 AND 180", name="ck_job_offer_longitude",
        ),
    )
    op.create_index("ix_job_offer_employer_id", "job_offer", ["employer_id"])
    op.create_index("ix_job_offer_insee_code", "job_offer", ["insee_code"])
    op.create_index(
        "ix_job_offer_moderation_status", "job_offer", ["moderation_status"],
    )
    op.create_index(
        "ix_job_offer_coords", "job_offer", ["latitude", "longitude"],
    )

    # ------------------------------------------------------------ application
    op.create_table(
        "application",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), nullable=False),
        sa.Column("job_seeker_id", sa.BigInteger(), nullable=False),
        sa.Column("job_offer_id", sa.BigInteger(), nullable=False),
        sa.Column("employer_id", sa.BigInteger(), nullable=False),
        sa.Column("status", app_status, nullable=False, server_default="sent"),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["job_seeker_id"], ["job_seeker.id"],
            name="fk_application_job_seeker", ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["job_offer_id"], ["job_offer.id"],
            name="fk_application_job_offer", ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["employer_id"], ["employer.id"],
            name="fk_application_employer",
        ),
        sa.UniqueConstraint(
            "job_seeker_id", "job_offer_id", name="uq_application_seeker_offer",
        ),
    )
    op.create_index("ix_application_job_offer_id", "application", ["job_offer_id"])
    op.create_index("ix_application_employer_id", "application", ["employer_id"])


def downgrade() -> None:
    bind = op.get_bind()

    # Ordre inverse des dépendances.
    op.drop_table("application")
    op.drop_table("job_offer")
    op.drop_table("experience")
    op.drop_table("job_title")
    op.drop_table("job_seeker_skill")
    op.drop_table("skill")
    op.drop_table("employer")
    op.drop_table("job_seeker")
    op.drop_table("account")

    # drop_table ne supprime pas les types : sans ça, un ré-upgrade échoue
    # sur « type ... already exists ».
    for enum in reversed(ENUMS):
        enum.drop(bind, checkfirst=True)
