"""Espace employeur : entreprise, abonnement, offres publiées, candidatures."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, col, select

from app.auth.user import Account, CheckEmployer, employer_of
from app.database import get_db
from app.models import Application, Employer, JobOffer, JobSeeker, JobTitle
from app.schemas import (
    ApplicationOut,
    ApplicationStatusIn,
    CompanyOut,
    ListingOut,
    SubscriptionIn,
)
from app.serializers import application_out, company_out, listings_out

router = APIRouter(prefix="/api/v1/employer", tags=["employer"])

APP_STATUSES = ("sent", "viewed", "in_review", "accepted", "rejected")

# Grille tarifaire du sujet : plus la zone de diffusion est large, plus
# l'abonnement est élevé.
PLANS = {
    "none": {"plan_price_eur": 0, "plan_radius_km": 0},
    "standard": {"plan_price_eur": 400, "plan_radius_km": 15},
    "premium": {"plan_price_eur": 900, "plan_radius_km": 50},
}


@router.get("/company", response_model=CompanyOut)
def get_company(
    account: Account = Depends(CheckEmployer), db: Session = Depends(get_db)
):
    return company_out(employer_of(db, account), account)


@router.put("/subscription", response_model=CompanyOut)
def set_subscription(
    data: SubscriptionIn,
    account: Account = Depends(CheckEmployer),
    db: Session = Depends(get_db),
):
    if data.plan not in PLANS:
        raise HTTPException(status_code=400, detail="Formule inconnue")
    employer = employer_of(db, account)
    employer.subscription_plan = data.plan
    employer.plan_price_eur = PLANS[data.plan]["plan_price_eur"]
    employer.plan_radius_km = PLANS[data.plan]["plan_radius_km"]
    employer.subscribed_at = (
        None if data.plan == "none" else (employer.subscribed_at or datetime.now(timezone.utc))
    )
    db.add(employer)
    db.commit()
    db.refresh(employer)
    return company_out(employer, account)


@router.get("/offers", response_model=list[ListingOut])
def my_offers(
    account: Account = Depends(CheckEmployer), db: Session = Depends(get_db)
):
    """Toutes les offres de l'entreprise, y compris archivées et signalées."""
    employer = employer_of(db, account)
    rows = db.exec(
        select(JobOffer, JobTitle, Employer)
        .join(JobTitle, col(JobTitle.id) == col(JobOffer.job_title_id))
        .join(Employer, col(Employer.id) == col(JobOffer.employer_id))
        .where(JobOffer.employer_id == employer.id)
        .order_by(col(JobOffer.published_at).desc())
    ).all()
    return listings_out(db, list(rows))


@router.get("/applications", response_model=list[ApplicationOut])
def received_applications(
    account: Account = Depends(CheckEmployer), db: Session = Depends(get_db)
):
    employer = employer_of(db, account)
    rows = db.exec(
        select(Application, JobTitle, JobSeeker)
        .join(JobOffer, col(JobOffer.id) == col(Application.job_offer_id))
        .join(JobTitle, col(JobTitle.id) == col(JobOffer.job_title_id))
        .join(JobSeeker, col(JobSeeker.id) == col(Application.job_seeker_id))
        .where(Application.employer_id == employer.id)
        .order_by(col(Application.created_at).desc())
    ).all()
    return [
        application_out(application, title.label, employer.name, seeker)
        for application, title, seeker in rows
    ]


@router.patch("/applications/{application_id}", response_model=ApplicationOut)
def update_application_status(
    application_id: int,
    data: ApplicationStatusIn,
    account: Account = Depends(CheckEmployer),
    db: Session = Depends(get_db),
):
    if data.status not in APP_STATUSES:
        raise HTTPException(status_code=400, detail="Statut inconnu")
    employer = employer_of(db, account)

    application = db.get(Application, application_id)
    # Le contrôle porte sur la propriété de la ressource, pas sur l'UI :
    # l'endpoint est appelable directement.
    if not application or application.employer_id != employer.id:
        raise HTTPException(status_code=404, detail="Candidature introuvable")

    application.status = data.status
    db.add(application)
    db.commit()
    db.refresh(application)

    offer = db.get(JobOffer, application.job_offer_id)
    title = db.get(JobTitle, offer.job_title_id)
    seeker = db.get(JobSeeker, application.job_seeker_id)
    return application_out(application, title.label, employer.name, seeker)
