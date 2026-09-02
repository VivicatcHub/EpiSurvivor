"""Le cycle offre → candidature."""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, Column, Integer, Numeric, Text, UniqueConstraint
from sqlmodel import Field, SQLModel

from app.models.columns import created_at, fk


class Offre(SQLModel, table=True):
    __tablename__ = "offre"
    __table_args__ = (
        CheckConstraint("perimetre_km > 0", name="ck_offre_perimetre"),
    )

    id: int | None = Field(default=None, primary_key=True)
    employer_id: int = Field(sa_column=fk("employer.id"))
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
    statut: str = Field(
        default="envoyee",
        sa_column=Column(Text, nullable=False, server_default="envoyee"),
    )
    date_creation: datetime | None = Field(default=None, sa_column=created_at())
