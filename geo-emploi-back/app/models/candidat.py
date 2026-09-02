"""Ce qui décrit un candidat : ses compétences et son parcours.

Les deux disparaissent avec le job_seeker (ON DELETE CASCADE).
"""

from datetime import date

from sqlalchemy import CheckConstraint, Column, Date, Text
from sqlmodel import Field, SQLModel

from app.models.columns import fk


class JobSeekerCompetence(SQLModel, table=True):
    __tablename__ = "job_seeker_competence"

    job_seeker_id: int = Field(
        sa_column=fk("job_seeker.id", primary_key=True, cascade=True)
    )
    competence_id: int = Field(sa_column=fk("competence.id", primary_key=True))


class Experience(SQLModel, table=True):
    __tablename__ = "experience"
    __table_args__ = (
        CheckConstraint(
            "date_fin IS NULL OR date_fin >= date_debut", name="ck_experience_dates"
        ),
    )

    id: int | None = Field(default=None, primary_key=True)
    job_seeker_id: int = Field(sa_column=fk("job_seeker.id", cascade=True))
    titre_poste_id: int = Field(sa_column=fk("titre_poste.id"))
    entreprise: str = Field(sa_column=Column(Text, nullable=False))
    type_contrat: str | None = Field(default=None, sa_column=Column(Text))
    date_debut: date = Field(sa_column=Column(Date, nullable=False))
    # NULL = poste actuel.
    date_fin: date | None = Field(default=None, sa_column=Column(Date))
    description: str | None = Field(default=None, sa_column=Column(Text))
