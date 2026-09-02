from sqlmodel import Session, create_engine

from app.config import DATABASE_URL

# pool_pre_ping : en dev la base tourne dans un conteneur qu'on redémarre
# souvent, sans ça la première requête après un restart part en erreur.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)


def get_db():
    with Session(engine) as session:
        yield session
