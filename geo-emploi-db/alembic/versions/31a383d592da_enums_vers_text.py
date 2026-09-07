"""enums vers text

Les statuts et le type de contrat redeviennent du texte libre : plus de types
enumeres cote base, donc plus de contrainte sur les valeurs. Les valeurs deja
stockees sont conservees telles quelles (cast enum -> text).

Revision ID: 31a383d592da
Revises: b81284c6a677
Create Date: 2026-09-02 10:02:25.091319

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '31a383d592da'
down_revision: Union[str, Sequence[str], None] = 'b81284c6a677'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Les types enumeres a supprimer, avec leurs valeurs : le downgrade les recree
# a l'identique.
ENUMS = {
    "statut_cand": ("envoyee", "vue", "en_cours", "acceptee", "refusee"),
    "statut_verif": ("en_attente", "verifie", "rejete"),
    "statut_moder": ("en_attente", "validee", "rejetee"),
    "type_contrat": ("cdi", "cdd", "interim", "stage", "alternance", "freelance"),
}

# (table, colonne, type enum, valeur par defaut ou None, nullable)
COLUMNS = (
    ("candidature", "statut", "statut_cand", "envoyee", False),
    ("employer", "statut_verification", "statut_verif", "en_attente", False),
    ("offre", "statut_moderation", "statut_moder", "en_attente", False),
    ("offre", "type_contrat", "type_contrat", None, False),
    ("experience", "type_contrat", "type_contrat", None, True),
)


def upgrade() -> None:
    """Upgrade schema."""
    for table, column, enum_name, default, nullable in COLUMNS:
        # Le defaut est stocke comme 'envoyee'::statut_cand : il depend du type
        # enum et empecherait son DROP. On le retire avant de changer le type,
        # on le repose ensuite en texte.
        if default is not None:
            op.execute(f"ALTER TABLE {table} ALTER COLUMN {column} DROP DEFAULT")
        op.alter_column(
            table,
            column,
            existing_type=postgresql.ENUM(*ENUMS[enum_name], name=enum_name),
            type_=sa.Text(),
            existing_nullable=nullable,
            postgresql_using=f"{column}::text",
        )
        if default is not None:
            op.execute(
                f"ALTER TABLE {table} ALTER COLUMN {column} SET DEFAULT '{default}'"
            )

    # Plus aucune colonne ne les reference : sans ce DROP ils resteraient
    # orphelins dans la base.
    for enum_name in ENUMS:
        op.execute(f"DROP TYPE {enum_name}")


def downgrade() -> None:
    """Downgrade schema."""
    for enum_name, values in ENUMS.items():
        postgresql.ENUM(*values, name=enum_name).create(op.get_bind())

    for table, column, enum_name, default, nullable in reversed(COLUMNS):
        if default is not None:
            op.execute(f"ALTER TABLE {table} ALTER COLUMN {column} DROP DEFAULT")
        op.alter_column(
            table,
            column,
            existing_type=sa.Text(),
            type_=postgresql.ENUM(*ENUMS[enum_name], name=enum_name),
            existing_nullable=nullable,
            postgresql_using=f"{column}::{enum_name}",
        )
        if default is not None:
            op.execute(
                f"ALTER TABLE {table} ALTER COLUMN {column} "
                f"SET DEFAULT '{default}'::{enum_name}"
            )
