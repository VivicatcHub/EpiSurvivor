"""Comptes et profils : un compte `users`, et au plus un profil candidat ou
employeur rattaché.
"""

from datetime import date, datetime, timezone
from sqlalchemy import CHAR, Column, Date, DateTime, Text
from sqlmodel import Field, SQLModel
from app.models.columns import created_at, fk

class User(SQLModel, table=True):
    """Le `compte` du schéma. Modèle préexistant, laissé tel quel : table
    `users`, PK `uid`, et role/status en str plutôt qu'en type énuméré.

    Les valeurs de `role` sont celles du contrat d'API : 'job_seeker',
    'employer', 'admin' (cf. app/schemas.py, lib/schemas.ts).
    `subscription_type` porte la formule de l'employeur ('none', 'standard',
    'premium') ; son tarif et son rayon se déduisent en code (api/employer.py),
    ils ne sont pas stockés.
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
    compte_id: int = Field(sa_column=fk("users.uid", unique=True, cascade=True))
    nom: str = Field(sa_column=Column(Text, nullable=False))
    prenom: str = Field(sa_column=Column(Text, nullable=False))
    telephone: str | None = Field(default=None, sa_column=Column(Text))
    disponibilite: date | None = Field(default=None, sa_column=Column(Date))
    # Accroche et ville affichées sur le profil public.
    titre_pro: str | None = Field(default=None, sa_column=Column(Text))
    ville: str | None = Field(default=None, sa_column=Column(Text))
    created_at: datetime | None = Field(default=None, sa_column=created_at())

class Employer(SQLModel, table=True):
    __tablename__ = "employer"
    id: int | None = Field(default=None, primary_key=True)
    compte_id: int = Field(sa_column=fk("users.uid", unique=True, cascade=True))
    nom: str = Field(sa_column=Column(Text, nullable=False))
    siret: str | None = Field(default=None, sa_column=Column(CHAR(14), unique=True))
    telephone: str | None = Field(default=None, sa_column=Column(Text))
    statut_verification: str = Field(default="en_attente",sa_column=Column(Text, nullable=False, server_default="en_attente"))
    created_at: datetime | None = Field(default=None, sa_column=created_at())
    adresse: str | None = Field(default=None, sa_column=Column(Text))
    # '00000' par defaut : a l'inscription l'employeur ne saisit que sa raison
    # sociale, la commune arrive avec la premiere offre (ou un geocodeur).
    code_insee: str = Field(default="00000", sa_column=Column(CHAR(5), nullable=False, server_default="00000"))
    code_insee_arrondissement: str = Field(default="00000", sa_column=Column(CHAR(5), nullable=False, server_default="00000"))
    secteur: str | None = Field(default=None, sa_column=Column(Text))
    ville: str | None = Field(default=None, sa_column=Column(Text))
    # Adresse de candidature, si elle differe de celle du compte.
    email_contact: str | None = Field(default=None, sa_column=Column(Text))
    # Date de souscription a la formule portee par users.subscription_type.
    abonne_depuis: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
