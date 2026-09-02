from sqlmodel import Session, create_engine

from app.config import DATABASE_URL

# Le schema n'est pas cree ici : les tables viennent des migrations alembic de
# geo-emploi-db, generees depuis app/models/ (aucun create_all).
#
# pool_pre_ping : en dev la base tourne dans un conteneur qu'on redemarre
# souvent, sans ca la premiere requete apres un restart part en erreur.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)


def get_db():
    with Session(engine) as session:
        yield session
