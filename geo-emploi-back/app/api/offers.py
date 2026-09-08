"""Offres : recherche publique, détail, publication, candidature, signalement."""

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, col, or_, select
from app.auth.user import CheckEmployer, CheckOptionalAuth, CheckSeeker, employer_of, seeker_of
from app.database import get_db
from app.geocoding import commune_centroid
from app.models import Candidature, Employer, Offre, OffreCompetence, Signalement, TitrePoste, User
from app.schemas import MAX_RADIUS_KM, OFFER_MAX_AGE_DAYS, ApplicationOut, ApplyIn, ListingIn, ListingOut, ReportIn
from app.serializers import TYPES_CONTRAT_IN, application_out, get_or_create_competence, get_or_create_titre_poste, listing_out, listings_out, reported_offer_ids, skills_by_offer

router = APIRouter(prefix="/api/v1/offers", tags=["offers"])

def _visible_offers():
    """Offres réellement affichables : validées et non archivées (§2.2)."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=OFFER_MAX_AGE_DAYS)
    return (select(Offre, TitrePoste, Employer)
        .join(TitrePoste, col(TitrePoste.id) == col(Offre.titre_poste_id))
        .join(Employer, col(Employer.id) == col(Offre.employer_id))
        .where(Offre.statut_moderation == "validee")
        .where(col(Offre.archivee_le).is_(None))
        .where(col(Offre.date_offre) >= cutoff)
    )

@router.get("", response_model=list[ListingOut])
def search_offers(db: Session = Depends(get_db), q: str | None = None, contract: str | None = None, min_lat: float | None = Query(default=None, alias="minLat"), max_lat: float | None = Query(default=None, alias="maxLat"), min_lng: float | None = Query(default=None, alias="minLng"), max_lng: float | None = Query(default=None, alias="maxLng"), limit: int = Query(default=200, le=500)):
    """Recherche publique — aucune authentification (§2.2)."""
    statement = _visible_offers()
    if contract and contract != "toutes":
        type_contrat = TYPES_CONTRAT_IN.get(contract)
        if type_contrat is None:
            raise HTTPException(status_code=400, detail="Type de contrat inconnu")
        statement = statement.where(Offre.type_contrat == type_contrat)
    if q and q.strip():
        pattern = f"%{q.strip()}%"
        statement = statement.where(
            or_(
                col(TitrePoste.libelle).ilike(pattern),
                col(Employer.nom).ilike(pattern),
                col(Offre.ville).ilike(pattern),
                col(Offre.description).ilike(pattern),
            )
        )
    # La carte interroge par cadre visible : les quatre bornes vont ensemble.
    if None not in (min_lat, max_lat, min_lng, max_lng):
        statement = (
            statement.where(col(Offre.latitude).between(min_lat, max_lat))
            .where(col(Offre.longitude).between(min_lng, max_lng))
        )
    rows = db.exec(
        statement.order_by(col(Offre.date_offre).desc()).limit(limit)
    ).all()
    return listings_out(db, list(rows))

@router.get("/{offer_id}", response_model=ListingOut)
def get_offer(offer_id: int, db: Session = Depends(get_db)):
    row = db.exec(_visible_offers().where(Offre.id == offer_id)).first()
    if not row:
        raise HTTPException(status_code=404, detail="Offre introuvable")
    offer, titre, employer = row
    offer.nb_vues += 1
    db.add(offer)
    db.commit()
    db.refresh(offer)
    skills = skills_by_offer(db, [offer_id]).get(offer_id, [])
    reported = offer_id in reported_offer_ids(db, [offer_id])
    return listing_out(offer, titre.libelle, employer, skills, reported=reported)

@router.post("", response_model=ListingOut, status_code=201)
def create_offer(data: ListingIn, account: User = Depends(CheckEmployer), db: Session = Depends(get_db)):
    employer = employer_of(db, account)
    type_contrat = TYPES_CONTRAT_IN.get(data.contract)
    if type_contrat is None:
        raise HTTPException(status_code=400, detail="Type de contrat inconnu")
    if data.radius_km > MAX_RADIUS_KM:
        raise HTTPException(
            status_code=400,
            detail=f"Le rayon de diffusion ne peut pas dépasser {MAX_RADIUS_KM} km",
        )
    # Le code INSEE vient d'un géocodeur ; à défaut le code postal en tient
    # lieu. La position stockée n'est jamais celle saisie par l'employeur :
    # elle est recalculée au centroïde de la commune (§3.2 — la précision ne
    # descend jamais à la rue).
    code_insee = (data.insee_code or data.postal_code or "")[:5].rjust(5, "0")
    centroid = commune_centroid(code_insee, data.postal_code, data.city)
    if centroid is None:
        raise HTTPException(status_code=400, detail="Code postal ou commune introuvable")
    latitude, longitude = centroid
    titre = get_or_create_titre_poste(db, data.title)
    offer = Offre(
        employer_id=employer.id,
        titre_poste_id=titre.id,
        description=data.description,
        type_contrat=type_contrat,
        code_insee=code_insee,
        latitude=latitude,
        longitude=longitude,
        perimetre_km=data.radius_km,
        salaire=data.salary,
        adresse=data.address,
        ville=data.city,
        code_postal=(data.postal_code or "")[:5],
        # Modération a posteriori : l'offre est en ligne tout de suite, et
        # c'est le signalement (§5) qui la remonte à l'administration.
        statut_moderation="validee",
    )
    db.add(offer)
    db.flush()
    labels = [label.strip() for label in data.skills if label.strip()]
    for label in labels:
        competence = get_or_create_competence(db, label)
        db.add(OffreCompetence(offre_id=offer.id, competence_id=competence.id))
    db.commit()
    db.refresh(offer)
    return listing_out(offer, titre.libelle, employer, labels)

@router.post("/{offer_id}/apply", response_model=ApplicationOut, status_code=201)
def apply_to_offer(offer_id: int, data: ApplyIn, account: User = Depends(CheckSeeker), db: Session = Depends(get_db)):
    """Postuler — réservé à un chercheur d'emploi authentifié (§2.2)."""
    seeker = seeker_of(db, account)
    row = db.exec(_visible_offers().where(Offre.id == offer_id)).first()
    if not row:
        raise HTTPException(status_code=404, detail="Offre introuvable")
    offer, titre, employer = row
    already = db.exec(
        select(Candidature)
        .where(Candidature.job_seeker_id == seeker.id)
        .where(Candidature.offre_id == offer_id)
    ).first()
    if already:
        raise HTTPException(status_code=409, detail="Vous avez déjà postulé")
    application = Candidature(
        job_seeker_id=seeker.id,
        offre_id=offer_id,
        employer_id=offer.employer_id,
        statut="envoyee",
        message=data.message,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application_out(application, titre.libelle, employer.nom, seeker)

@router.post("/{offer_id}/report", status_code=201)
def report_offer(offer_id: int, data: ReportIn, account: User | None = Depends(CheckOptionalAuth), db: Session = Depends(get_db)):
    """§5 : le signalement est ouvert, y compris sans compte."""
    if not data.reason.strip():
        raise HTTPException(status_code=400, detail="Motif requis")
    offer = db.get(Offre, offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offre introuvable")
    db.add(Signalement(offre_id=offer_id, compte_id=account.uid if account else None, motif=data.reason.strip()))
    db.commit()
    return {"message": "Signalement enregistré"}
