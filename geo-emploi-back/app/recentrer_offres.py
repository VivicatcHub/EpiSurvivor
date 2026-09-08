"""Reprise des offres déjà publiées : recentrage sur le centroïde de leur
commune (§3.2 — instruction du 7 septembre 2026, Florine Pontaillac).

Les coordonnées stockées jusqu'ici étaient celles pointées par l'employeur
sur la carte au moment de la publication, potentiellement à la rue. Cette
commande les recalcule via l'API Adresse (app.geocoding.commune_centroid),
la même source que celle désormais utilisée à la création d'une offre
(app/api/offers.py), et écrase les coordonnées existantes — irréversiblement,
comme demandé.

    .venv/bin/python -m app.recentrer_offres

Rejouable sans dégât : une offre déjà à son centroïde n'est pas comptée comme
déplacée, et relancer la commande ne fait que confirmer l'état stable.
"""

from math import asin, cos, radians, sin, sqrt
from sqlmodel import Session, select
from app.database import engine
from app.geocoding import commune_centroid
from app.models import Offre

def _distance_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Distance à vol d'oiseau, en mètres (formule de haversine)."""
    r = 6_371_000
    dlat, dlng = radians(lat2 - lat1), radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return 2 * r * asin(sqrt(a))

def recentrer(session: Session) -> None:
    offers = session.exec(select(Offre)).all()
    moved = 0
    unresolved: list[int] = []
    displacements: list[tuple[int, float]] = []

    for offer in offers:
        centroid = commune_centroid(offer.code_insee, offer.code_postal, offer.ville)
        if centroid is None:
            unresolved.append(offer.id)
            continue
        lat, lng = centroid
        distance = _distance_m(float(offer.latitude), float(offer.longitude), lat, lng)
        if distance > 1:  # tolérance : une offre déjà au centroïde ne compte pas comme déplacée
            moved += 1
            displacements.append((offer.id, distance))
        offer.latitude = lat
        offer.longitude = lng
        session.add(offer)

    session.commit()

    print(f"Offres examinées : {len(offers)}")
    print(f"Offres recentrées sur leur commune : {moved}")
    print(f"Offres non résolues (commune introuvable) : {len(unresolved)}")
    if unresolved:
        print(f"  identifiants : {unresolved}")
    if displacements:
        average = sum(d for _, d in displacements) / len(displacements)
        print(f"Déplacement moyen : {average:.0f} m")
        top5 = sorted(displacements, key=lambda item: item[1], reverse=True)[:5]
        print("Cinq plus gros déplacements :")
        for offer_id, distance in top5:
            print(f"  offre {offer_id} : {distance:.0f} m")

def main() -> int:
    with Session(engine) as session:
        recentrer(session)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
