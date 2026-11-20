import os
import warnings
from dotenv import load_dotenv

load_dotenv()

def _env(name: str, default: str) -> str:
    value = os.getenv(name)
    return default if value is None or value == "" else value

# La base est celle de geo-emploi-db : le schéma appartient à Alembic, le
# backend ne fait que s'y connecter (aucun create_all, cf. app/database.py).
DATABASE_URL = _env("DATABASE_URL", "postgresql+psycopg2://admin:admin@localhost:5555/geo_emploi")
_PLACEHOLDER_SECRET = "ChangeMe123!"
SECRET_KEY = _env("JWT_SECRETKEY", _PLACEHOLDER_SECRET)
ALGORITHM = _env("JWT_ALGORITHM", "HS256")
TOKEN_EXPIRE_MINUTES = int(_env("TOKEN_EXPIRE_MINUTES", "60"))
SESSION_COOKIE = "geosession"
# secure=False en local (http://), à passer à True derrière HTTPS.
COOKIE_SECURE = _env("COOKIE_SECURE", "false").lower() == "true"
# Le front appelle l'API depuis son serveur Node (pas de CORS), mais on garde
# l'origine autorisée pour les appels navigateur directs et pour Swagger.
CORS_ORIGINS = [
    origin.strip()
    for origin in _env("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

# La clé par défaut n'est acceptable qu'en local : derrière HTTPS (donc hors
# dev), l'API refuse de démarrer avec elle ; en local, elle prévient.
if SECRET_KEY == _PLACEHOLDER_SECRET:
    if COOKIE_SECURE:
        raise RuntimeError("JWT_SECRETKEY doit être défini (clé par défaut refusée avec COOKIE_SECURE=true).")
    warnings.warn("JWT_SECRETKEY non défini : clé de développement utilisée.", stacklevel=1)
