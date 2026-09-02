import os

from dotenv import load_dotenv
from sqlmodel import Session, create_engine

load_dotenv()

# Le conteneur postgres (geo-emploi-db/compose.yaml) écoute sur 5432 en interne
# et compose le publie sur POSTGRES_PORT : depuis l'hôte c'est ce port qu'on
# vise. Depuis un conteneur, passer DATABASE_URL avec le bon hôte.
#
# Le schéma n'est pas créé ici : les tables viennent des migrations alembic de
# geo-emploi-db, générées depuis app/models.py.
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg2://admin:admin@localhost:5555/geo_emploi"
)
engine = create_engine(DATABASE_URL)


def get_db():
    with Session(engine) as session:
        yield session


def get_db():
    with Session(engine) as session:
        yield session
