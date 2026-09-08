#!/usr/bin/env bash
# Lancement du backend seul, contre la base de geo-emploi-db.
# Pour la pile complete (base + migrations + API + front), voir compose.yaml
# a la racine du depot.
set -euo pipefail

cd "$(dirname "$0")"
DB_DIR="../geo-emploi-db"

if [ ! -f "$DB_DIR/.env" ]; then
	echo "manque $DB_DIR/.env (cf. $DB_DIR/.env.example)" >&2
	exit 1
fi

# La base d'abord : --wait bloque jusqu'au healthcheck de compose.yaml, sinon
# le back demarre avant que postgres accepte les connexions.
docker compose -f "$DB_DIR/compose.yaml" up -d --wait

# Memes identifiants que compose.yaml et alembic : un seul endroit ou les changer.
set -a
. "$DB_DIR/.env"
set +a

# Applique les migrations Alembic (le back ne cree aucune table lui-meme).
# Contexte a la racine du depot : l'image a besoin de geo-emploi-back/app/models.
docker build -t geo-emploi-db-migrate -f "$DB_DIR/Dockerfile" "$DB_DIR/.."
docker run --rm \
	--network geo-emploi-db \
	-e DATABASE_URL="postgresql+psycopg2://$POSTGRES_USER:$POSTGRES_PASSWORD@local:5432/$POSTGRES_DB" \
	geo-emploi-db-migrate

docker build -t geo-emploi-back .

# Le back tourne dans un conteneur : "localhost" y designe le conteneur lui-meme,
# pas l'hote. On l'attache au reseau de la base (nom fixe dans compose.yaml) et on
# vise le service par son nom, sur le port interne 5432. Le port publie, lui, est
# limite a 127.0.0.1 et reste reserve aux acces depuis l'hote.
docker run --rm \
	-p 1234:1234 \
	-v "$(pwd)/app:/app/app" \
	--network geo-emploi-db \
	-e DATABASE_URL="postgresql+psycopg2://$POSTGRES_USER:$POSTGRES_PASSWORD@local:5432/$POSTGRES_DB" \
	geo-emploi-back
