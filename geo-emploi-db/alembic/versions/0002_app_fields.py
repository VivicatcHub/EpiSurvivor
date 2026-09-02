"""champs applicatifs : offres, candidatures, signalements, abonnements

Le schéma 0001 modélise le domaine ; cette révision ajoute ce que les écrans
du front consomment réellement (libellé de salaire, adresse postale affichée,
compétences d'une offre, message de candidature) et deux briques du sujet qui
n'avaient pas de table : le signalement d'offre frauduleuse (§5) et
l'abonnement employeur.

Revision ID: 0002_app_fields
Revises: 0001_initial_schema
Create Date: 2026-09-02

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002_app_fields"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


subscription_plan = postgresql.ENUM(
    "none", "standard", "premium",
    name="subscription_plan", create_type=False,
)
report_status = postgresql.ENUM(
    "open", "reviewed", "dismissed",
    name="report_status", create_type=False,
)

ENUMS = (subscription_plan, report_status)


def upgrade() -> None:
    bind = op.get_bind()
    for enum in ENUMS:
        enum.create(bind, checkfirst=True)

    # --------------------------------------------------------------- account
    # Nom affiché dans l'en-tête. Les comptes admin n'ont ni job_seeker ni
    # employer : sans cette colonne, il ne reste que le préfixe de l'email.
    op.add_column("account", sa.Column("display_name", sa.Text(), nullable=True))

    # ------------------------------------------------------------ job_seeker
    # Accroche et ville affichées sur la fiche profil.
    op.add_column("job_seeker", sa.Column("headline", sa.Text(), nullable=True))
    op.add_column("job_seeker", sa.Column("city", sa.Text(), nullable=True))

    # -------------------------------------------------------------- employer
    op.add_column("employer", sa.Column("sector", sa.Text(), nullable=True))
    op.add_column("employer", sa.Column("city", sa.Text(), nullable=True))
    op.add_column(
        "employer", sa.Column("contact_email", postgresql.CITEXT(), nullable=True),
    )
    op.add_column(
        "employer",
        sa.Column(
            "subscription_plan",
            subscription_plan,
            nullable=False,
            server_default="none",
        ),
    )
    op.add_column(
        "employer",
        sa.Column("subscribed_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    # Le rayon de diffusion autorisé dépend de la formule : il est porté par
    # l'employeur, et contrôlé à la publication d'une offre.
    op.add_column(
        "employer",
        sa.Column("plan_radius_km", sa.Integer(), nullable=False, server_default="15"),
    )
    op.add_column(
        "employer",
        sa.Column("plan_price_eur", sa.Integer(), nullable=False, server_default="0"),
    )

    # ------------------------------------------------------------- job_offer
    op.add_column("job_offer", sa.Column("salary_label", sa.Text(), nullable=True))
    op.add_column("job_offer", sa.Column("address", sa.Text(), nullable=True))
    op.add_column(
        "job_offer",
        sa.Column("city", sa.Text(), nullable=False, server_default=""),
    )
    op.add_column("job_offer", sa.Column("postal_code", sa.CHAR(5), nullable=True))
    # §2.2 : archivage automatique au-delà de 30 jours. La colonne rend l'état
    # explicite (et réversible par un admin) plutôt que déduit d'un calcul de
    # date dispersé dans le code.
    op.add_column(
        "job_offer",
        sa.Column("archived_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_job_offer_published_at", "job_offer", ["published_at"],
    )

    # ------------------------------------------------------- job_offer_skill
    op.create_table(
        "job_offer_skill",
        sa.Column("job_offer_id", sa.BigInteger(), nullable=False),
        sa.Column("skill_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(
            ["job_offer_id"], ["job_offer.id"],
            name="fk_jos_job_offer", ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["skill_id"], ["skill.id"],
            name="fk_jos_skill", ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("job_offer_id", "skill_id"),
    )
    op.create_index("ix_jos_skill_id", "job_offer_skill", ["skill_id"])

    # ----------------------------------------------------------- application
    op.add_column("application", sa.Column("message", sa.Text(), nullable=True))

    # --------------------------------------------------------- offer_report
    # §5 du sujet : le signalement est ouvert aux visiteurs anonymes, d'où un
    # reporter_account_id nullable (ON DELETE SET NULL : supprimer un compte
    # ne doit pas effacer le signalement instruit par la modération).
    op.create_table(
        "offer_report",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), nullable=False),
        sa.Column("job_offer_id", sa.BigInteger(), nullable=False),
        sa.Column("reporter_account_id", sa.BigInteger(), nullable=True),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("status", report_status, nullable=False, server_default="open"),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["job_offer_id"], ["job_offer.id"],
            name="fk_offer_report_job_offer", ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["reporter_account_id"], ["account.id"],
            name="fk_offer_report_account", ondelete="SET NULL",
        ),
    )
    op.create_index("ix_offer_report_job_offer_id", "offer_report", ["job_offer_id"])
    op.create_index("ix_offer_report_status", "offer_report", ["status"])


def downgrade() -> None:
    bind = op.get_bind()

    op.drop_table("offer_report")
    op.drop_column("application", "message")
    op.drop_table("job_offer_skill")
    op.drop_index("ix_job_offer_published_at", table_name="job_offer")
    for column in ("archived_at", "postal_code", "city", "address", "salary_label"):
        op.drop_column("job_offer", column)
    for column in (
        "plan_price_eur", "plan_radius_km", "subscribed_at",
        "subscription_plan", "contact_email", "city", "sector",
    ):
        op.drop_column("employer", column)
    op.drop_column("job_seeker", "city")
    op.drop_column("job_seeker", "headline")
    op.drop_column("account", "display_name")

    for enum in reversed(ENUMS):
        enum.drop(bind, checkfirst=True)
