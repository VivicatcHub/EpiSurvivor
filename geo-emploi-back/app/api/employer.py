"""Espace employeur : entreprise, abonnement, offres publiées, candidatures."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, col, select
from app.auth.user import CheckEmployer, employer_of
from app.database import get_db
from app.models import Candidature, Employer, JobSeeker, Offre, TitrePoste, User
from app.plans import PLANS, plan_of
from app.schemas import ApplicationOut, ApplicationStatusIn, CompanyOut, ListingOut,SubscriptionIn
from app.serializers import CANDIDATURE_STATUTS_IN, application_out, company_out, listings_out

router = APIRouter(prefix="/api/v1/employer", tags=["employer"])

def _company(db: Session, account: User, employer: Employer) -> CompanyOut:
    plan = plan_of(account.subscription_type)
    return company_out(employer, account, plan["price_eur"], plan["radius_km"])

@router.get("/company", response_model=CompanyOut)
def get_company(account: User = Depends(CheckEmployer), db: Session = Depends(get_db)):
    return _company(db, account, employer_of(db, account))

@router.put("/subscription", response_model=CompanyOut)
def set_subscription(data: SubscriptionIn, account: User = Depends(CheckEmployer), db: Session = Depends(get_db)):
    if data.plan not in PLANS:
        raise HTTPException(status_code=400, detail="Formule inconnue")
    employer = employer_of(db, account)
    account.subscription_type = data.plan
    employer.abonne_depuis = None if data.plan == "none" else (employer.abonne_depuis or datetime.now(timezone.utc))
    db.add(account)
    db.add(employer)
    db.commit()
    db.refresh(account)
    db.refresh(employer)
    return _company(db, account, employer)

@router.get("/offers", response_model=list[ListingOut])
def my_offers(account: User = Depends(CheckEmployer), db: Session = Depends(get_db)):
    """Toutes les offres de l'entreprise, y compris archivées et signalées."""
    employer = employer_of(db, account)
    rows = db.exec(select(Offre, TitrePoste, Employer)
        .join(TitrePoste, col(TitrePoste.id) == col(Offre.titre_poste_id))
        .join(Employer, col(Employer.id) == col(Offre.employer_id))
        .where(Offre.employer_id == employer.id)
        .order_by(col(Offre.date_offre).desc())
    ).all()
    return listings_out(db, list(rows))

@router.get("/applications", response_model=list[ApplicationOut])
def received_applications(account: User = Depends(CheckEmployer), db: Session = Depends(get_db)):
    employer = employer_of(db, account)
    rows = db.exec(
        select(Candidature, TitrePoste, JobSeeker)
        .join(Offre, col(Offre.id) == col(Candidature.offre_id))
        .join(TitrePoste, col(TitrePoste.id) == col(Offre.titre_poste_id))
        .join(JobSeeker, col(JobSeeker.id) == col(Candidature.job_seeker_id))
        .where(Candidature.employer_id == employer.id)
        .order_by(col(Candidature.date_creation).desc())
    ).all()
    return [application_out(application, titre.libelle, employer.nom, seeker) for application, titre, seeker in rows]

@router.patch("/applications/{application_id}", response_model=ApplicationOut)
def update_application_status(application_id: int, data: ApplicationStatusIn, account: User = Depends(CheckEmployer), db: Session = Depends(get_db)):
    statut = CANDIDATURE_STATUTS_IN.get(data.status)
    if statut is None:
        raise HTTPException(status_code=400, detail="Statut inconnu")
    employer = employer_of(db, account)
    application = db.get(Candidature, application_id)
    # Le contrôle porte sur la propriété de la ressource, pas sur l'UI :
    # l'endpoint est appelable directement.
    if not application or application.employer_id != employer.id:
        raise HTTPException(status_code=404, detail="Candidature introuvable")
    application.statut = statut
    db.add(application)
    db.commit()
    db.refresh(application)
    offer = db.get(Offre, application.offre_id)
    titre = db.get(TitrePoste, offer.titre_poste_id)
    seeker = db.get(JobSeeker, application.job_seeker_id)
    return application_out(application, titre.libelle, employer.nom, seeker)
