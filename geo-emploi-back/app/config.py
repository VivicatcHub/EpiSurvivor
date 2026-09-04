import os
from dotenv import load_dotenv

load_dotenv()

def _env(name: str, default: str) -> str:
    value = os.getenv(name)
    return default if value is None or value == "" else value

# La base est celle de geo-emploi-db : le schéma appartient à Alembic, le
# backend ne fait que s'y connecter (aucun create_all, cf. app/database.py).
DATABASE_URL = _env("DATABASE_URL", "postgresql+psycopg2://admin:admin@localhost:5555/geo_emploi")
SECRET_KEY = _env("JWT_SECRETKEY", "ChangeMe123!")
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
