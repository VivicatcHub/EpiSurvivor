"""Panneau d'administration : modération, comptes, métriques nationales."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, col, func, select

from app.auth.user import CheckAdmin
from app.database import get_db
from app.models import Candidature, Employer, Offre, Signalement, TitrePoste, User
from app.schemas import (
    AccountStatusIn,
    ListingOut,
    MetricsOut,
    ModerationIn,
    ReportOut,
    UserAccountOut,
)
from app.serializers import (
    MODERATION_STATUTS_IN,
    display_name,
    listings_out,
    report_out,
    user_account_out,
)

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


def _count(db: Session, statement) -> int:
    return db.exec(statement).one()


@router.get("/offers", response_model=list[ListingOut])
def all_offers(account: User = Depends(CheckAdmin), db: Session = Depends(get_db)):
    rows = db.exec(
        select(Offre, TitrePoste, Employer)
        .join(TitrePoste, col(TitrePoste.id) == col(Offre.titre_poste_id))
        .join(Employer, col(Employer.id) == col(Offre.employer_id))
        .order_by(col(Offre.date_offre).desc())
    ).all()
    return listings_out(db, list(rows))


@router.patch("/offers/{offer_id}", response_model=ListingOut)
def moderate_offer(
    offer_id: int,
    data: ModerationIn,
    account: User = Depends(CheckAdmin),
    db: Session = Depends(get_db),
):
    statut = MODERATION_STATUTS_IN.get(data.status)
    if statut is None:
        raise HTTPException(status_code=400, detail="Statut de modération inconnu")
    offer = db.get(Offre, offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offre introuvable")

    offer.statut_moderation = statut
    # Valider une offre lève l'archivage : c'est le geste « remettre en ligne ».
    if statut == "validee":
        offer.archivee_le = None
    elif statut == "rejetee":
        offer.archivee_le = datetime.now(timezone.utc)
    db.add(offer)

    # Une décision de modération clôt les signalements en attente sur l'offre.
    for report in db.exec(
        select(Signalement)
        .where(Signalement.offre_id == offer_id)
        .where(Signalement.statut == "ouvert")
    ).all():
        report.statut = "traite" if statut == "rejetee" else "rejete"
        db.add(report)

    db.commit()
    db.refresh(offer)

    titre = db.get(TitrePoste, offer.titre_poste_id)
    employer = db.get(Employer, offer.employer_id)
    return listings_out(db, [(offer, titre, employer)])[0]


@router.get("/reports", response_model=list[ReportOut])
def all_reports(account: User = Depends(CheckAdmin), db: Session = Depends(get_db)):
    rows = db.exec(
        select(Signalement, TitrePoste)
        .join(Offre, col(Offre.id) == col(Signalement.offre_id))
        .join(TitrePoste, col(TitrePoste.id) == col(Offre.titre_poste_id))
        .order_by(col(Signalement.date_creation).desc())
    ).all()
    return [report_out(report, titre.libelle) for report, titre in rows]


@router.get("/users", response_model=list[UserAccountOut])
def all_users(account: User = Depends(CheckAdmin), db: Session = Depends(get_db)):
    accounts = db.exec(select(User).order_by(col(User.created_at).desc())).all()
    return [user_account_out(row, display_name(db, row)) for row in accounts]


@router.patch("/users/{account_id}", response_model=UserAccountOut)
def set_account_status(
    account_id: int,
    data: AccountStatusIn,
    account: User = Depends(CheckAdmin),
    db: Session = Depends(get_db),
):
    if data.status not in ("active", "suspended"):
        raise HTTPException(status_code=400, detail="Statut de compte inconnu")
    target = db.get(User, account_id)
    if not target:
        raise HTTPException(status_code=404, detail="Compte introuvable")
    if target.uid == account.uid:
        raise HTTPException(
            status_code=400, detail="Un administrateur ne peut pas se suspendre"
        )

    target.status = data.status
    db.add(target)
    db.commit()
    db.refresh(target)
    return user_account_out(target, display_name(db, target))


@router.get("/metrics", response_model=MetricsOut)
def metrics(account: User = Depends(CheckAdmin), db: Session = Depends(get_db)):
    return MetricsOut(
        published_listings=_count(
            db,
            select(func.count(col(Offre.id))).where(
                Offre.statut_moderation == "validee"
            ),
        ),
        pending_listings=_count(
            db,
            select(func.count(col(Offre.id))).where(
                Offre.statut_moderation == "en_attente"
            ),
        ),
        reported_listings=_count(
            db,
            select(func.count(func.distinct(col(Signalement.offre_id)))).where(
                Signalement.statut == "ouvert"
            ),
        ),
        accounts=_count(db, select(func.count(col(User.uid)))),
        applications=_count(db, select(func.count(col(Candidature.id)))),
    )
