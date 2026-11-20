FROM python:3.12-slim

# Pas de __pycache__ écrit par le conteneur (il serait possédé par root
# si le code est monté depuis l'hôte).
ENV PYTHONDONTWRITEBYTECODE=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 1234
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "1234"]
