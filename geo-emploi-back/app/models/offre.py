"""Le cycle offre → candidature."""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, Column, Integer, Numeric, Text, UniqueConstraint
from sqlmodel import Field, SQLModel

from app.models.columns import created_at, fk
from app.models.enums import (
    STATUT_CAND,
    STATUT_MODER,
    TYPE_CONTRAT,
    StatutCandidature,
    StatutModer,
    TypeContrat,
)


class Offre(SQLModel, table=True):
    __tablename__ = "offre"
    __table_args__ = (
        CheckConstraint("perimetre_km > 0", name="ck_offre_perimetre"),
    )

    id: int | None = Field(default=None, primary_key=True)
    employer_id: int = Field(sa_column=fk("employer.id"))
    titre_poste_id: int = Field(sa_column=fk("titre_poste.id"))
    description: str | None = Field(default=None, sa_column=Column(Text))
    type_contrat: TypeContrat = Field(sa_column=Column(TYPE_CONTRAT, nullable=False))
    latitude: Decimal = Field(sa_column=Column(Numeric(9, 6), nullable=False))
    longitude: Decimal = Field(sa_column=Column(Numeric(9, 6), nullable=False))
    perimetre_km: int = Field(
        default=20, sa_column=Column(Integer, nullable=False, server_default="20")
    )
    nb_vues: int = Field(
        default=0, sa_column=Column(Integer, nullable=False, server_default="0")
    )
    statut_moderation: StatutModer = Field(
        default=StatutModer.EN_ATTENTE,
        sa_column=Column(
            STATUT_MODER,
            nullable=False,
            server_default=StatutModer.EN_ATTENTE.value,
        ),
    )
    date_offre: datetime | None = Field(default=None, sa_column=created_at())


class Candidature(SQLModel, table=True):
    __tablename__ = "candidature"
    __table_args__ = (
        UniqueConstraint(
            "job_seeker_id", "offre_id", name="uq_candidature_seeker_offre"
        ),
    )

    id: int | None = Field(default=None, primary_key=True)
    job_seeker_id: int = Field(sa_column=fk("job_seeker.id"))
    offre_id: int = Field(sa_column=fk("offre.id"))
    # Dénormalisé depuis offre.employer_id : permet de lister les candidatures
    # reçues par un employeur sans passer par offre.
    employer_id: int = Field(sa_column=fk("employer.id"))
    statut: StatutCandidature = Field(
        default=StatutCandidature.ENVOYEE,
        sa_column=Column(
            STATUT_CAND,
            nullable=False,
            server_default=StatutCandidature.ENVOYEE.value,
        ),
    )
    date_creation: datetime | None = Field(default=None, sa_column=created_at())
