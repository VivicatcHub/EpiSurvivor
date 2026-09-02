"""Grille tarifaire des abonnements employeur.

La formule souscrite est une donnée (`users.subscription_type`) ; son tarif et
son rayon de diffusion sont une règle, pas une colonne — les stocker à côté du
nom de la formule les laisserait dériver au premier changement de prix.

Plus la zone de diffusion est large, plus l'abonnement est élevé (§ tarifs).
"""

PLANS: dict[str, dict[str, int]] = {
    "none": {"price_eur": 0, "radius_km": 0},
    "standard": {"price_eur": 400, "radius_km": 15},
    "premium": {"price_eur": 900, "radius_km": 50},
}


def plan_of(subscription_type: str) -> dict[str, int]:
    """Formule d'un compte, `none` si la valeur stockée est inconnue."""
    return PLANS.get(subscription_type, PLANS["none"])
