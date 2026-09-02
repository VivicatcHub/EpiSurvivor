# Image d'exécution des migrations : elle ne sert qu'à appliquer le schéma,
# puis s'arrête. La base, elle, est le service `db` de compose.yaml.
#
# Le contexte de build est la RACINE du dépôt, pas geo-emploi-db : alembic/env.py
# importe les modèles SQLModel du back (`app.models`), qui sont la source de
# vérité du schéma. L'arborescence du dépôt est donc reproduite telle quelle
# dans l'image, sinon le chemin relatif que remonte env.py ne mène nulle part.
#
#   docker build -f geo-emploi-db/Dockerfile .
FROM python:3.12-slim

WORKDIR /repo

COPY geo-emploi-db/requirements.txt geo-emploi-db/
RUN pip install --no-cache-dir -r geo-emploi-db/requirements.txt

COPY geo-emploi-db/alembic.ini geo-emploi-db/
COPY geo-emploi-db/alembic geo-emploi-db/alembic
# Seuls les modèles, pas tout le back : ils ne dépendent que de sqlmodel, ce
# qui garde cette image légère (cf. le docstring de app/models/__init__.py).
COPY geo-emploi-back/app/models geo-emploi-back/app/models

WORKDIR /repo/geo-emploi-db
CMD ["alembic", "upgrade", "head"]
