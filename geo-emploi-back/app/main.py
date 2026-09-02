from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, col, select

from app.api import admin, employer, offers, seeker
from app.auth import delete, login, register
from app.config import CORS_ORIGINS
from app.database import engine
from app.models import JobOffer
from app.schemas import OFFER_MAX_AGE_DAYS


def archive_expired_offers() -> int:
    """§2.2 : une offre de plus de 30 jours sort de la carte.

    Passe balai au démarrage. En production ce serait une tâche planifiée ;
    la recherche filtre de toute façon sur la date, donc un retard d'exécution
    ne rend jamais une offre périmée visible.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=OFFER_MAX_AGE_DAYS)
    with Session(engine) as session:
        expired = session.exec(
            select(JobOffer)
            .where(col(JobOffer.archived_at).is_(None))
            .where(col(JobOffer.published_at) < cutoff)
        ).all()
        for offer in expired:
            offer.archived_at = datetime.now(timezone.utc)
            session.add(offer)
        session.commit()
        return len(expired)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Le schéma appartient à Alembic (geo-emploi-db) : aucun create_all ici.
    archive_expired_offers()
    yield


app = FastAPI(
    title="GéoEmploi API",
    version="1.0.0",
    description="API du service GéoEmploi — Ministère du Job et Bonheur.",
    lifespan=lifespan,
)

# Le front appelle l'API depuis son serveur Node, mais Swagger et les appels
# navigateur directs en ont besoin. allow_credentials : le cookie de session.
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}


app.include_router(register.router)
app.include_router(login.router)
app.include_router(delete.router)
app.include_router(offers.router)
app.include_router(seeker.router)
app.include_router(employer.router)
app.include_router(admin.router)
