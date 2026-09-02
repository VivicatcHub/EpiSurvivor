"""Le cycle offre → candidature, et le signalement qui la remonte à la
modération.
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CHAR,
    CheckConstraint,
    Column,
    DateTime,
    Integer,
    Numeric,
    Text,
    UniqueConstraint,
)
from sqlmodel import Field, SQLModel

from app.models.columns import created_at, fk


class Offre(SQLModel, table=True):
    __tablename__ = "offre"
    __table_args__ = (
        CheckConstraint("perimetre_km > 0", name="ck_offre_perimetre"),
    )

    id: int | None = Field(default=None, primary_key=True)
    employer_id: int = Field(sa_column=fk("employer.id", cascade=True))
    titre_poste_id: int = Field(sa_column=fk("titre_poste.id"))
    description: str | None = Field(default=None, sa_column=Column(Text))
    type_contrat: str = Field(sa_column=Column(Text, nullable=False))
    latitude: Decimal = Field(sa_column=Column(Numeric(9, 6), nullable=False))
    longitude: Decimal = Field(sa_column=Column(Numeric(9, 6), nullable=False))
    perimetre_km: int = Field(
        default=20, sa_column=Column(Integer, nullable=False, server_default="20")
    )
    nb_vues: int = Field(
        default=0, sa_column=Column(Integer, nullable=False, server_default="0")
    )
    statut_moderation: str = Field(
        default="en_attente",
        sa_column=Column(Text, nullable=False, server_default="en_attente"),
    )
    date_offre: datetime | None = Field(default=None, sa_column=created_at())
    # Localisation lisible : la carte place l'offre avec lat/lng, la fiche et
    # la recherche plein texte ont besoin du libelle.
    code_insee: str = Field(
        default="00000",
        sa_column=Column(CHAR(5), nullable=False, server_default="00000"),
    )
    adresse: str | None = Field(default=None, sa_column=Column(Text))
    ville: str = Field(default="", sa_column=Column(Text, nullable=False, server_default=""))
    code_postal: str | None = Field(default=None, sa_column=Column(Text))
    # Fourchette libre ('32-38 k€', 'Selon profil') : jamais compare, seulement
    # affiche, donc du texte et non un Numeric.
    salaire: str | None = Field(default=None, sa_column=Column(Text))
    # Non NULL = sortie de la carte (peremption a 30 jours, ou refus de
    # moderation). Cf. app/schemas.py:OFFER_MAX_AGE_DAYS.
    archivee_le: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )


class OffreCompetence(SQLModel, table=True):
    """Compétences demandées par une offre. Pendant de job_seeker_competence."""

    __tablename__ = "offre_competence"

    offre_id: int = Field(sa_column=fk("offre.id", primary_key=True, cascade=True))
    competence_id: int = Field(sa_column=fk("competence.id", primary_key=True))


class Candidature(SQLModel, table=True):
    __tablename__ = "candidature"
    __table_args__ = (
        UniqueConstraint(
            "job_seeker_id", "offre_id", name="uq_candidature_seeker_offre"
        ),
    )

    id: int | None = Field(default=None, primary_key=True)
    job_seeker_id: int = Field(sa_column=fk("job_seeker.id", cascade=True))
    offre_id: int = Field(sa_column=fk("offre.id", cascade=True))
    # Dénormalisé depuis offre.employer_id : permet de lister les candidatures
    # reçues par un employeur sans passer par offre.
    employer_id: int = Field(sa_column=fk("employer.id", cascade=True))
    statut: str = Field(
        default="envoyee",
        sa_column=Column(Text, nullable=False, server_default="envoyee"),
    )
    # Lettre de motivation, facultative.
    message: str | None = Field(default=None, sa_column=Column(Text))
    date_creation: datetime | None = Field(default=None, sa_column=created_at())


class Signalement(SQLModel, table=True):
    """§5 : signalement d'une offre, ouvert au public.

    `compte_id` est nullable (ON DELETE SET NULL) : le signalement reste
    instruit même anonyme, ou après suppression du compte de son auteur.
    """

    __tablename__ = "signalement"

    id: int | None = Field(default=None, primary_key=True)
    offre_id: int = Field(sa_column=fk("offre.id", cascade=True))
    compte_id: int | None = Field(default=None, sa_column=fk("users.uid", nullable=True))
    motif: str = Field(sa_column=Column(Text, nullable=False))
    statut: str = Field(
        default="ouvert",
        sa_column=Column(Text, nullable=False, server_default="ouvert"),
    )
    date_creation: datetime | None = Field(default=None, sa_column=created_at())
