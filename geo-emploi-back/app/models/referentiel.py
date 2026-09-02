"""Libellés partagés : compétences et titres de poste."""

from sqlalchemy import Column, Text
from sqlmodel import Field, SQLModel


class Competence(SQLModel, table=True):
    __tablename__ = "competence"

    id: int | None = Field(default=None, primary_key=True)
    libelle: str = Field(sa_column=Column(Text, nullable=False, unique=True))


class TitrePoste(SQLModel, table=True):
    __tablename__ = "titre_poste"

    id: int | None = Field(default=None, primary_key=True)
    libelle: str = Field(sa_column=Column(Text, nullable=False, unique=True))
