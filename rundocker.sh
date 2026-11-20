#!/usr/bin/env bash
# Démarre toute la pile, charge le jeu de démo, puis suit les logs.
# Ctrl+C arrête seulement le suivi des logs. Pour arrêter la pile :
#   docker compose down        # garde la base
#   docker compose down -v     # efface aussi la base
set -euo pipefail
cd "$(dirname "$0")"

# `up -d` rend la main une fois les migrations passées et l'API lancée.
docker compose up --build -d
docker compose run --rm api python -m app.seed --reset

echo "Front : http://localhost:3000 · API : http://localhost:1234/docs"
docker compose logs -f api web
