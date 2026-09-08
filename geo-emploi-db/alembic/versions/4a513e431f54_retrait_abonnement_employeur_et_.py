"""retrait de l'abonnement employeur

Genere par `alembic revision --autogenerate` depuis app/models/, sans ajustement
autre que le defaut de downgrade (le squelette "please adjust!" en avait besoin :
sans server_default, reajouter la colonne sur une base deja peuplee echouerait
sur la contrainte NOT NULL).

Instruction du 7 septembre 2026 (Florine Pontaillac) : la publication d'une
offre redevient gratuite, sans abonnement ni formule payante. Cette revision
retire les deux colonnes qui portaient la formule de l'employeur.

Le recentrage des offres deja publiees sur le centroide de leur commune (meme
instruction, §3.2) n'est PAS fait ici : c'est une reprise de donnees qui
appelle l'API Adresse pour chaque offre, incompatible avec un venv de
migrations volontairement limite a sqlmodel (cf. README de ce dossier). Elle
est traitee par la commande dediee `python -m app.recentrer_offres` (voir
geo-emploi-back/app/recentrer_offres.py), a executer juste apres cette
migration — son compte-rendu (offres examinees / recentrees / non resolues)
alimente le journal des modifications (JOURNAL.md).

Revision ID: 4a513e431f54
Revises: 5a2399f10a56
Create Date: 2026-09-07 15:51:24.693123

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4a513e431f54'
down_revision: Union[str, Sequence[str], None] = '5a2399f10a56'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_column('employer', 'abonne_depuis')
    op.drop_column('users', 'subscription_type')


def downgrade() -> None:
    """Downgrade schema.

    Restaure les colonnes avec la formule 'none' par defaut : la publication
    d'une offre redevient gratuite au upgrade, donc un compte existant n'avait
    jamais souscrit. Ne restaure pas les coordonnees street-level recentrees
    par `app.recentrer_offres` : ce recentrage est volontairement irreversible
    (instruction du 7 septembre 2026).
    """
    op.add_column('users', sa.Column('subscription_type', sa.VARCHAR(), server_default='none', autoincrement=False, nullable=False))
    op.add_column('employer', sa.Column('abonne_depuis', sa.DateTime(timezone=True), autoincrement=False, nullable=True))
