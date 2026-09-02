#!/bin/sh
# Lancement du backend seul, contre une base déjà migrée.
# Pour la pile complète (base + API + front), voir compose.yaml à la racine.
set -e

docker build -t geo-emploi-back .
docker run --rm \
  -p 1234:1234 \
  --network host \
  --env-file app/.env \
  geo-emploi-back
