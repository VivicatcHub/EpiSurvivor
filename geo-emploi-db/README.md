# geo-emploi-db

Base de données PostgreSQL de geo-emploi et ses migrations Alembic.

## Stack

| Composant | Version | Rôle |
|---|---|---|
| PostgreSQL | 17 (alpine) | base, extension `citext` |
| Alembic | 1.19 | migrations versionnées |
| SQLAlchemy | 2.0 | couche DDL utilisée par les migrations |
| psycopg2 | 2.9 | driver |

## Démarrage

```bash
cp .env.example .env      # ajuster le port si 5432 est déjà pris localement
make up                   # lance le conteneur postgres et attend qu'il soit healthy
make migrate              # crée le venv si besoin, puis alembic upgrade head
```

`make psql` ouvre un shell psql dans le conteneur, `make down` arrête la stack.

## Migrations

```bash
make current              # révision appliquée
make history              # historique
make migrate              # upgrade head
make downgrade            # downgrade -1
make reset                # supprime le volume, recrée, remigre
```

Nouvelle migration :

```bash
.venv/bin/alembic revision -m "add xxx"
```

Les migrations sont écrites à la main : il n'y a pas de modèles SQLAlchemy dans
ce repo, donc `--autogenerate` n'a rien à comparer (`target_metadata = None`).

## Configuration

`alembic.ini` ne contient aucune URL. `alembic/env.py` lit `DATABASE_URL` depuis
l'environnement ou le `.env` local, avec un repli sur les variables
`POSTGRES_*`. `.env` n'est pas versionné.

Depuis l'hôte, l'hôte de la base est `localhost` ; depuis un autre conteneur du
réseau compose, c'est `db`.

## Schéma (0001_initial_schema)

`account` porte l'authentification (email `CITEXT`, donc unicité insensible à la
casse) et se spécialise en `job_seeker` ou `employer` (1-1, `ON DELETE CASCADE`).
`skill` / `job_title` sont des référentiels partagés, `job_seeker_skill` la table
d'association. `experience` historise les postes d'un candidat, `job_offer` les
annonces d'un employeur (géolocalisées : code INSEE, lat/lon, rayon), et
`application` la candidature d'un `job_seeker` sur une `job_offer` — unique par
couple (candidat, offre).

Les statuts sont des ENUM PostgreSQL : `account_role`, `account_status`,
`verif_status`, `moder_status`, `app_status`, `contract_type`.
