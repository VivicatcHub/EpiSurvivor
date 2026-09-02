"""Offres : recherche publique, détail, publication, candidature, signalement."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, col, or_, select

from app.auth.user import (
    Account,
    CheckEmployer,
    CheckOptionalAuth,
    CheckSeeker,
    employer_of,
    seeker_of,
)
from app.database import get_db
from app.models import (
    Application,
    Employer,
    JobOffer,
    JobOfferSkill,
    JobTitle,
    OfferReport,
)
from app.schemas import (
    OFFER_MAX_AGE_DAYS,
    ApplyIn,
    ApplicationOut,
    ListingIn,
    ListingOut,
    ReportIn,
    CONTRACT_TYPES,
)
from app.serializers import (
    application_out,
    get_or_create_job_title,
    get_or_create_skill,
    listing_out,
    listings_out,
    reported_offer_ids,
    skills_by_offer,
)

router = APIRouter(prefix="/api/v1/offers", tags=["offers"])


def _visible_offers():
    """Offres réellement affichables : validées et non archivées (§2.2)."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=OFFER_MAX_AGE_DAYS)
    return (
        select(JobOffer, JobTitle, Employer)
        .join(JobTitle, col(JobTitle.id) == col(JobOffer.job_title_id))
        .join(Employer, col(Employer.id) == col(JobOffer.employer_id))
        .where(JobOffer.moderation_status == "approved")
        .where(col(JobOffer.archived_at).is_(None))
        .where(col(JobOffer.published_at) >= cutoff)
    )


@router.get("", response_model=list[ListingOut])
def search_offers(
    db: Session = Depends(get_db),
    q: str | None = None,
    contract: str | None = None,
    min_lat: float | None = Query(default=None, alias="minLat"),
    max_lat: float | None = Query(default=None, alias="maxLat"),
    min_lng: float | None = Query(default=None, alias="minLng"),
    max_lng: float | None = Query(default=None, alias="maxLng"),
    limit: int = Query(default=200, le=500),
):
    """Recherche publique — aucune authentification (§2.2)."""
    statement = _visible_offers()

    if contract and contract != "toutes":
        if contract not in CONTRACT_TYPES:
            raise HTTPException(status_code=400, detail="Type de contrat inconnu")
        statement = statement.where(JobOffer.contract_type == contract)

    if q and q.strip():
        pattern = f"%{q.strip()}%"
        statement = statement.where(
            or_(
                col(JobTitle.label).ilike(pattern),
                col(Employer.name).ilike(pattern),
                col(JobOffer.city).ilike(pattern),
                col(JobOffer.description).ilike(pattern),
            )
        )

    # La carte interroge par cadre visible : les quatre bornes vont ensemble.
    if None not in (min_lat, max_lat, min_lng, max_lng):
        statement = (
            statement.where(col(JobOffer.latitude).between(min_lat, max_lat))
            .where(col(JobOffer.longitude).between(min_lng, max_lng))
        )

    rows = db.exec(
        statement.order_by(col(JobOffer.published_at).desc()).limit(limit)
    ).all()
    return listings_out(db, list(rows))


@router.get("/{offer_id}", response_model=ListingOut)
def get_offer(offer_id: int, db: Session = Depends(get_db)):
    row = db.exec(_visible_offers().where(JobOffer.id == offer_id)).first()
    if not row:
        raise HTTPException(status_code=404, detail="Offre introuvable")
    offer, title, employer = row

    offer.view_count += 1
    db.add(offer)
    db.commit()
    db.refresh(offer)

    skills = skills_by_offer(db, [offer_id]).get(offer_id, [])
    reported = offer_id in reported_offer_ids(db, [offer_id])
    return listing_out(offer, title.label, employer, skills, reported=reported)


@router.post("", response_model=ListingOut, status_code=201)
def create_offer(
    data: ListingIn,
    account: Account = Depends(CheckEmployer),
    db: Session = Depends(get_db),
):
    employer = employer_of(db, account)
    if employer.subscription_plan == "none":
        raise HTTPException(
            status_code=402,
            detail="Un abonnement est nécessaire pour publier une offre",
        )
    if data.contract not in CONTRACT_TYPES:
        raise HTTPException(status_code=400, detail="Type de contrat inconnu")
    if data.radius_km > employer.plan_radius_km:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Votre formule couvre {employer.plan_radius_km} km de rayon "
                f"de diffusion, pas {data.radius_km} km"
            ),
        )

    title = get_or_create_job_title(db, data.title)
    offer = JobOffer(
        employer_id=employer.id,
        job_title_id=title.id,
        description=data.description,
        contract_type=data.contract,
        # Le code INSEE viendra d'un géocodeur ; à défaut le code postal en
        # tient lieu, la précision commune reste assurée (§3.2).
        insee_code=(data.insee_code or data.postal_code)[:5].rjust(5, "0"),
        latitude=data.lat,
        longitude=data.lng,
        radius_km=data.radius_km,
        salary_label=data.salary,
        address=data.address,
        city=data.city,
        postal_code=data.postal_code[:5],
        # Modération a posteriori : l'offre est en ligne tout de suite, et
        # c'est le signalement (§5) qui la remonte à l'administration.
        moderation_status="approved",
    )
    db.add(offer)
    db.flush()

    for label in data.skills:
        if not label.strip():
            continue
        skill = get_or_create_skill(db, label)
        db.add(JobOfferSkill(job_offer_id=offer.id, skill_id=skill.id))

    db.commit()
    db.refresh(offer)
    return listing_out(offer, title.label, employer, [s.strip() for s in data.skills if s.strip()])


@router.post("/{offer_id}/apply", response_model=ApplicationOut, status_code=201)
def apply_to_offer(
    offer_id: int,
    data: ApplyIn,
    account: Account = Depends(CheckSeeker),
    db: Session = Depends(get_db),
):
    """Postuler — réservé à un chercheur d'emploi authentifié (§2.2)."""
    seeker = seeker_of(db, account)
    row = db.exec(_visible_offers().where(JobOffer.id == offer_id)).first()
    if not row:
        raise HTTPException(status_code=404, detail="Offre introuvable")
    offer, title, employer = row

    already = db.exec(
        select(Application)
        .where(Application.job_seeker_id == seeker.id)
        .where(Application.job_offer_id == offer_id)
    ).first()
    if already:
        raise HTTPException(status_code=409, detail="Vous avez déjà postulé")

    application = Application(
        job_seeker_id=seeker.id,
        job_offer_id=offer_id,
        employer_id=offer.employer_id,
        status="sent",
        message=data.message,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application_out(application, title.label, employer.name, seeker)


@router.post("/{offer_id}/report", status_code=201)
def report_offer(
    offer_id: int,
    data: ReportIn,
    account: Account | None = Depends(CheckOptionalAuth),
    db: Session = Depends(get_db),
):
    """§5 : le signalement est ouvert, y compris sans compte."""
    if not data.reason.strip():
        raise HTTPException(status_code=400, detail="Motif requis")
    offer = db.get(JobOffer, offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offre introuvable")

    db.add(
        OfferReport(
            job_offer_id=offer_id,
            reporter_account_id=account.id if account else None,
            reason=data.reason.strip(),
        )
    )
    db.commit()
    return {"message": "Signalement enregistré"}
