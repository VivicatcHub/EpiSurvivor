"""Comptes et profils : un compte `users`, et au plus un profil candidat ou
employeur rattaché.
"""

from datetime import date, datetime, timezone

from sqlalchemy import CHAR, Column, Date, Text
from sqlmodel import Field, SQLModel

from app.models.columns import created_at, fk


class User(SQLModel, table=True):
    """Le `compte` du schéma. Modèle préexistant, laissé tel quel : table
    `users`, PK `uid`, et role/status en str plutôt qu'en type énuméré.
    """

    __tablename__ = "users"

    uid: int | None = Field(default=None, primary_key=True)
    firstname: str
    lastname: str
    email: str = Field(index=True, unique=True)
    password: str
    role: str
    status: str = "active"
    subscription_type: str = "none"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class JobSeeker(SQLModel, table=True):
    __tablename__ = "job_seeker"

    id: int | None = Field(default=None, primary_key=True)
    compte_id: int = Field(sa_column=fk("users.uid", unique=True))
    nom: str = Field(sa_column=Column(Text, nullable=False))
    prenom: str = Field(sa_column=Column(Text, nullable=False))
    telephone: str | None = Field(default=None, sa_column=Column(Text))
    disponibilite: date | None = Field(default=None, sa_column=Column(Date))
    created_at: datetime | None = Field(default=None, sa_column=created_at())


class Employer(SQLModel, table=True):
    __tablename__ = "employer"

    id: int | None = Field(default=None, primary_key=True)
    compte_id: int = Field(sa_column=fk("users.uid", unique=True))
    nom: str = Field(sa_column=Column(Text, nullable=False))
    siret: str | None = Field(default=None, sa_column=Column(CHAR(14), unique=True))
    telephone: str | None = Field(default=None, sa_column=Column(Text))
    statut_verification: str = Field(
        default="en_attente",
        sa_column=Column(Text, nullable=False, server_default="en_attente"),
    )
    created_at: datetime | None = Field(default=None, sa_column=created_at())
    adresse: str | None = Field(default=None, sa_column=Column(Text))
    code_insee: str = Field(sa_column=Column(CHAR(5), nullable=False))
    code_insee_arrondissement: str = Field(
        default="00000",
        sa_column=Column(CHAR(5), nullable=False, server_default="00000"),
    )
