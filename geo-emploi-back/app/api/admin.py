"""Panneau d'administration : modération, comptes, métriques nationales."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, col, func, select

from app.auth.user import Account, CheckAdmin
from app.database import get_db
from app.models import Application, Employer, JobOffer, JobTitle, OfferReport
from app.schemas import (
    AccountStatusIn,
    ListingOut,
    MetricsOut,
    ModerationIn,
    ReportOut,
    UserAccountOut,
)
from app.serializers import display_name, listings_out, report_out, user_account_out

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

MODERATION_STATUSES = ("pending", "approved", "rejected")


def _count(db: Session, statement) -> int:
    return db.exec(statement).one()


@router.get("/offers", response_model=list[ListingOut])
def all_offers(account: Account = Depends(CheckAdmin), db: Session = Depends(get_db)):
    rows = db.exec(
        select(JobOffer, JobTitle, Employer)
        .join(JobTitle, col(JobTitle.id) == col(JobOffer.job_title_id))
        .join(Employer, col(Employer.id) == col(JobOffer.employer_id))
        .order_by(col(JobOffer.published_at).desc())
    ).all()
    return listings_out(db, list(rows))


@router.patch("/offers/{offer_id}", response_model=ListingOut)
def moderate_offer(
    offer_id: int,
    data: ModerationIn,
    account: Account = Depends(CheckAdmin),
    db: Session = Depends(get_db),
):
    if data.status not in MODERATION_STATUSES:
        raise HTTPException(status_code=400, detail="Statut de modération inconnu")
    offer = db.get(JobOffer, offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offre introuvable")

    offer.moderation_status = data.status
    # Valider une offre lève l'archivage : c'est le geste « remettre en ligne ».
    if data.status == "approved":
        offer.archived_at = None
    elif data.status == "rejected":
        offer.archived_at = datetime.now(timezone.utc)
    db.add(offer)

    # Une décision de modération clôt les signalements en attente sur l'offre.
    for report in db.exec(
        select(OfferReport)
        .where(OfferReport.job_offer_id == offer_id)
        .where(OfferReport.status == "open")
    ).all():
        report.status = "reviewed" if data.status == "rejected" else "dismissed"
        db.add(report)

    db.commit()
    db.refresh(offer)

    title = db.get(JobTitle, offer.job_title_id)
    employer = db.get(Employer, offer.employer_id)
    return listings_out(db, [(offer, title, employer)])[0]


@router.get("/reports", response_model=list[ReportOut])
def all_reports(account: Account = Depends(CheckAdmin), db: Session = Depends(get_db)):
    rows = db.exec(
        select(OfferReport, JobTitle)
        .join(JobOffer, col(JobOffer.id) == col(OfferReport.job_offer_id))
        .join(JobTitle, col(JobTitle.id) == col(JobOffer.job_title_id))
        .order_by(col(OfferReport.created_at).desc())
    ).all()
    return [report_out(report, title.label) for report, title in rows]


@router.get("/users", response_model=list[UserAccountOut])
def all_users(account: Account = Depends(CheckAdmin), db: Session = Depends(get_db)):
    accounts = db.exec(
        select(Account).order_by(col(Account.created_at).desc())
    ).all()
    return [user_account_out(row, display_name(db, row)) for row in accounts]


@router.patch("/users/{account_id}", response_model=UserAccountOut)
def set_account_status(
    account_id: int,
    data: AccountStatusIn,
    account: Account = Depends(CheckAdmin),
    db: Session = Depends(get_db),
):
    if data.status not in ("active", "suspended"):
        raise HTTPException(status_code=400, detail="Statut de compte inconnu")
    target = db.get(Account, account_id)
    if not target:
        raise HTTPException(status_code=404, detail="Compte introuvable")
    if target.id == account.id:
        raise HTTPException(
            status_code=400, detail="Un administrateur ne peut pas se suspendre"
        )

    target.status = data.status
    db.add(target)
    db.commit()
    db.refresh(target)
    return user_account_out(target, display_name(db, target))


@router.get("/metrics", response_model=MetricsOut)
def metrics(account: Account = Depends(CheckAdmin), db: Session = Depends(get_db)):
    return MetricsOut(
        published_listings=_count(
            db,
            select(func.count(col(JobOffer.id))).where(
                JobOffer.moderation_status == "approved"
            ),
        ),
        pending_listings=_count(
            db,
            select(func.count(col(JobOffer.id))).where(
                JobOffer.moderation_status == "pending"
            ),
        ),
        reported_listings=_count(
            db,
            select(func.count(func.distinct(col(OfferReport.job_offer_id)))).where(
                OfferReport.status == "open"
            ),
        ),
        accounts=_count(db, select(func.count(col(Account.id)))),
        applications=_count(db, select(func.count(col(Application.id)))),
    )
