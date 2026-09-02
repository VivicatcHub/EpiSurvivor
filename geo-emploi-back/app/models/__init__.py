"""Schéma métier, en SQLModel.

Ces modèles sont la source de vérité du schéma : les migrations alembic de
geo-emploi-db sont générées depuis eux (`alembic revision --autogenerate`), et
non écrites à la main.

Importer ce package suffit à peupler `SQLModel.metadata` : c'est ce que fait
alembic/env.py. Il ne dépend que de sqlmodel, volontairement — pas de fastapi
ni de jose, pour que le venv des migrations reste léger.
"""

from app.models.candidat import Experience, JobSeekerCompetence
from app.models.compte import Employer, JobSeeker, User
from app.models.offre import Candidature, Offre, OffreCompetence, Signalement
from app.models.referentiel import Competence, TitrePoste

__all__ = [
    "Candidature",
    "Competence",
    "Employer",
    "Experience",
    "JobSeeker",
    "JobSeekerCompetence",
    "Offre",
    "OffreCompetence",
    "Signalement",
    "TitrePoste",
    "User",
]
