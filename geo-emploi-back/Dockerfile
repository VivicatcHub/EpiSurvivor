FROM python:3.12-slim

# psycopg2-binary embarque ses libs, mais le client psql sert au diagnostic
# et à l'attente de la base au démarrage.
RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 1234
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "1234"]
