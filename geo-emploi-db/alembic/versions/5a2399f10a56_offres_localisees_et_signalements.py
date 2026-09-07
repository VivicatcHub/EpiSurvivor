"""offres localisees, signalements, cascades de suppression

Genere par `alembic revision --autogenerate` depuis app/models/, puis ajuste
comme le demande le squelette : les contraintes creees ici sont nommees, sinon
postgres leur donne un nom auto et le downgrade n'a rien a viser.

Trois choses arrivent dans cette revision :

  - l'offre porte sa localisation lisible (adresse, ville, code postal, code
    INSEE), sa fourchette de salaire et sa date d'archivage. La carte plaçait
    deja l'offre en lat/lng ; la fiche et la recherche plein texte ont besoin
    du libelle ;
  - deux tables nouvelles : `offre_competence` (les competences demandees par
    une offre, pendant de job_seeker_competence) et `signalement` (§5) ;
  - les suppressions cascadent. Sans ca, supprimer un compte (RGPD §3.3)
    echouait sur une violation de cle etrangere des qu'un profil existait.
    Seul `signalement.compte_id` prend SET NULL : un signalement reste
    instruit apres le depart de son auteur.

Revision ID: 5a2399f10a56
Revises: 31a383d592da
Create Date: 2026-09-02 14:23:28.424128

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5a2399f10a56'
down_revision: Union[str, Sequence[str], None] = '31a383d592da'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'offre_competence',
        sa.Column('offre_id', sa.Integer(), nullable=False),
        sa.Column('competence_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ['competence_id'], ['competence.id'],
            name=op.f('fk_offre_competence_competence'),
        ),
        sa.ForeignKeyConstraint(
            ['offre_id'], ['offre.id'],
            name=op.f('fk_offre_competence_offre'), ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('offre_id', 'competence_id'),
    )
    op.create_table(
        'signalement',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('offre_id', sa.Integer(), nullable=False),
        sa.Column('compte_id', sa.Integer(), nullable=True),
        sa.Column('motif', sa.Text(), nullable=False),
        sa.Column('statut', sa.Text(), server_default='ouvert', nullable=False),
        sa.Column(
            'date_creation', sa.DateTime(timezone=True),
            server_default=sa.text('now()'), nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ['compte_id'], ['users.uid'],
            name=op.f('fk_signalement_compte'), ondelete='SET NULL',
        ),
        sa.ForeignKeyConstraint(
            ['offre_id'], ['offre.id'],
            name=op.f('fk_signalement_offre'), ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id'),
    )

    op.add_column('candidature', sa.Column('message', sa.Text(), nullable=True))
    op.drop_constraint(op.f('candidature_job_seeker_id_fkey'), 'candidature', type_='foreignkey')
    op.drop_constraint(op.f('candidature_employer_id_fkey'), 'candidature', type_='foreignkey')
    op.drop_constraint(op.f('candidature_offre_id_fkey'), 'candidature', type_='foreignkey')
    op.create_foreign_key('fk_candidature_job_seeker', 'candidature', 'job_seeker', ['job_seeker_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_candidature_employer', 'candidature', 'employer', ['employer_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_candidature_offre', 'candidature', 'offre', ['offre_id'], ['id'], ondelete='CASCADE')

    op.add_column('employer', sa.Column('secteur', sa.Text(), nullable=True))
    op.add_column('employer', sa.Column('ville', sa.Text(), nullable=True))
    op.add_column('employer', sa.Column('email_contact', sa.Text(), nullable=True))
    op.add_column('employer', sa.Column('abonne_depuis', sa.DateTime(timezone=True), nullable=True))
    # A l'inscription, l'employeur ne saisit que sa raison sociale : la commune
    # arrive avec la premiere offre. La colonne reste NOT NULL, avec un defaut.
    op.alter_column('employer', 'code_insee', server_default='00000')
    op.drop_constraint(op.f('employer_compte_id_fkey'), 'employer', type_='foreignkey')
    op.create_foreign_key('fk_employer_compte', 'employer', 'users', ['compte_id'], ['uid'], ondelete='CASCADE')

    op.add_column('job_seeker', sa.Column('titre_pro', sa.Text(), nullable=True))
    op.add_column('job_seeker', sa.Column('ville', sa.Text(), nullable=True))
    op.drop_constraint(op.f('job_seeker_compte_id_fkey'), 'job_seeker', type_='foreignkey')
    op.create_foreign_key('fk_job_seeker_compte', 'job_seeker', 'users', ['compte_id'], ['uid'], ondelete='CASCADE')

    op.add_column('offre', sa.Column('code_insee', sa.CHAR(length=5), server_default='00000', nullable=False))
    op.add_column('offre', sa.Column('adresse', sa.Text(), nullable=True))
    op.add_column('offre', sa.Column('ville', sa.Text(), server_default='', nullable=False))
    op.add_column('offre', sa.Column('code_postal', sa.Text(), nullable=True))
    op.add_column('offre', sa.Column('salaire', sa.Text(), nullable=True))
    op.add_column('offre', sa.Column('archivee_le', sa.DateTime(timezone=True), nullable=True))
    op.drop_constraint(op.f('offre_employer_id_fkey'), 'offre', type_='foreignkey')
    op.create_foreign_key('fk_offre_employer', 'offre', 'employer', ['employer_id'], ['id'], ondelete='CASCADE')


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_offre_employer', 'offre', type_='foreignkey')
    op.create_foreign_key(op.f('offre_employer_id_fkey'), 'offre', 'employer', ['employer_id'], ['id'])
    op.drop_column('offre', 'archivee_le')
    op.drop_column('offre', 'salaire')
    op.drop_column('offre', 'code_postal')
    op.drop_column('offre', 'ville')
    op.drop_column('offre', 'adresse')
    op.drop_column('offre', 'code_insee')

    op.drop_constraint('fk_job_seeker_compte', 'job_seeker', type_='foreignkey')
    op.create_foreign_key(op.f('job_seeker_compte_id_fkey'), 'job_seeker', 'users', ['compte_id'], ['uid'])
    op.drop_column('job_seeker', 'ville')
    op.drop_column('job_seeker', 'titre_pro')

    op.drop_constraint('fk_employer_compte', 'employer', type_='foreignkey')
    op.create_foreign_key(op.f('employer_compte_id_fkey'), 'employer', 'users', ['compte_id'], ['uid'])
    op.alter_column('employer', 'code_insee', server_default=None)
    op.drop_column('employer', 'abonne_depuis')
    op.drop_column('employer', 'email_contact')
    op.drop_column('employer', 'ville')
    op.drop_column('employer', 'secteur')

    op.drop_constraint('fk_candidature_offre', 'candidature', type_='foreignkey')
    op.drop_constraint('fk_candidature_employer', 'candidature', type_='foreignkey')
    op.drop_constraint('fk_candidature_job_seeker', 'candidature', type_='foreignkey')
    op.create_foreign_key(op.f('candidature_offre_id_fkey'), 'candidature', 'offre', ['offre_id'], ['id'])
    op.create_foreign_key(op.f('candidature_employer_id_fkey'), 'candidature', 'employer', ['employer_id'], ['id'])
    op.create_foreign_key(op.f('candidature_job_seeker_id_fkey'), 'candidature', 'job_seeker', ['job_seeker_id'], ['id'])
    op.drop_column('candidature', 'message')

    op.drop_table('signalement')
    op.drop_table('offre_competence')
