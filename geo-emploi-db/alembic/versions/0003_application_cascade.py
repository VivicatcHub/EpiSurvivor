"""cascade sur application.employer_id

`fk_application_job_seeker` et `fk_application_job_offer` sont en CASCADE
depuis 0001, mais `fk_application_employer` était resté en NO ACTION. Un
employeur ayant reçu au moins une candidature ne pouvait donc pas supprimer
son compte : la suppression échouait en ForeignKeyViolation, alors que le
sujet impose un droit à l'effacement réellement exerçable (§3.3).

Supprimer l'employeur efface déjà ses offres, donc les candidatures qui les
visent : la ligne d'`application` n'a aucune raison de survivre à son
employeur.

Revision ID: 0003_application_cascade
Revises: 0002_app_fields
Create Date: 2026-09-02

"""
from alembic import op

revision = "0003_application_cascade"
down_revision = "0002_app_fields"
branch_labels = None
depends_on = None

CONSTRAINT = "fk_application_employer"


def upgrade() -> None:
    op.drop_constraint(CONSTRAINT, "application", type_="foreignkey")
    op.create_foreign_key(
        CONSTRAINT,
        "application",
        "employer",
        ["employer_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint(CONSTRAINT, "application", type_="foreignkey")
    op.create_foreign_key(
        CONSTRAINT, "application", "employer", ["employer_id"], ["id"],
    )
