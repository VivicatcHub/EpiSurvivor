# Image d'exécution des migrations : elle ne sert qu'à appliquer le schéma,
# puis s'arrête. La base, elle, est le service `db` de compose.yaml.
FROM python:3.12-slim

WORKDIR /migrations

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY alembic.ini .
COPY alembic ./alembic

CMD ["alembic", "upgrade", "head"]
