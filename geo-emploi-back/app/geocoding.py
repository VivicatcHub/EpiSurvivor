"""Centroïde d'une commune (§3.2 — la précision d'une offre ne descend jamais
à la rue, quelle que soit l'adresse saisie par l'employeur).

Source : l'API Adresse (api-adresse.data.gouv.fr), service de l'État, gratuit
et sans clé — la seule source de géocodage retenue par la Direction Numérique
pour GéoEmploi. Une recherche `type=municipality` renvoie le centre officiel
de la commune (et gère correctement les arrondissements de Paris/Lyon/
Marseille, contrairement à une recherche par simple code postal).
"""

import httpx

SEARCH_API = "https://api-adresse.data.gouv.fr/search/"
TIMEOUT = 5.0

def commune_centroid(code_insee: str, code_postal: str | None = None, city: str | None = None) -> tuple[float, float] | None:
    """Coordonnées du centre de la commune, ou None si elle est introuvable.

    Le code postal est la requête la plus fiable (l'employeur ne saisit
    jamais de code INSEE) ; le code INSEE, quand il est disponible et diffère
    du code postal, affine la recherche. Un code postal secondaire d'une
    grande ville (ex. 31400 pour Toulouse) n'a parfois pas d'entrée
    « municipality » propre : le nom de ville sert alors de dernier repli.
    """
    attempts = []
    if code_postal:
        params: dict[str, str] = {"q": code_postal}
        if code_insee and code_insee != code_postal:
            params["citycode"] = code_insee
        attempts.append(params)
    if code_insee:
        attempts.append({"q": code_insee})
    if city:
        attempts.append({"q": city})
    for params in attempts:
        try:
            response = httpx.get(
                SEARCH_API,
                params={**params, "type": "municipality", "limit": 1},
                timeout=TIMEOUT,
            )
            response.raise_for_status()
        except httpx.HTTPError:
            continue
        features = response.json().get("features") or []
        if not features:
            continue
        lng, lat = features[0]["geometry"]["coordinates"]
        return lat, lng
    return None
