# geo-emploi-db

Migrations Alembic du schéma PostgreSQL de geo-emploi.

Ce dossier ne contient **que** les migrations : le serveur PostgreSQL (docker
compose, service managé, instance locale…) est fourni à côté et n'est pas géré
ici.

## Prérequis

- Python 3.12+
- une base PostgreSQL accessible, avec un rôle autorisé à `CREATE EXTENSION`
  (la première migration active `citext`)

## Installation

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## Configuration

`alembic/env.py` lit l'URL de connexion dans `DATABASE_URL` — depuis
l'environnement, ou depuis un `.env` placé à la racine de ce dossier. Rien n'est
écrit dans `alembic.ini`, et `.env` n'est pas versionné.

```bash
export DATABASE_URL=postgresql+psycopg2://user:password@host:5432/geo_emploi
```

Si la variable est absente, Alembic s'arrête avec un message explicite.

## Utilisation

```bash
.venv/bin/alembic upgrade head      # appliquer toutes les migrations
.venv/bin/alembic current           # révision appliquée
.venv/bin/alembic history --verbose # historique
.venv/bin/alembic downgrade -1      # revenir d'une révision
.venv/bin/alembic upgrade head --sql # générer le SQL sans l'exécuter
```

Nouvelle migration :

```bash
.venv/bin/alembic revision -m "add xxx"
```

Les migrations sont écrites à la main : il n'y a pas de modèles SQLAlchemy dans
ce repo, donc `--autogenerate` n'a rien à comparer (`target_metadata = None`).

## Migrations

| Révision                   | Contenu                                                       |
| -------------------------- | ------------------------------------------------------------- |
| `0001_initial_schema`      | schéma de domaine, ENUM, contraintes                          |
| `0002_app_fields`          | champs consommés par l'application, signalements, abonnements  |
| `0003_application_cascade` | `application.employer_id` en `ON DELETE CASCADE`               |

`0002_app_fields` ajoute ce que les écrans utilisent réellement : `display_name`
sur `account` (les comptes admin n'ont ni `job_seeker` ni `employer`), accroche
et ville sur `job_seeker`, secteur / contact / abonnement sur `employer`,
libellé de salaire et adresse postale sur `job_offer`, la table d'association
`job_offer_skill`, le message porté par une `application`, et la table
`offer_report` (§5 du sujet — le signalement est ouvert aux visiteurs anonymes,
d'où un `reporter_account_id` nullable).

`0003_application_cascade` corrige une asymétrie de `0001` : les deux autres
clés étrangères d'`application` étaient en `CASCADE`, celle vers `employer`
non. Un employeur ayant reçu une candidature ne pouvait donc pas supprimer son
compte, ce que le RGPD impose (§3.3).

## Schéma (0001_initial_schema)

`account` porte l'authentification (email `CITEXT`, donc unicité insensible à la
casse) et se spécialise en `job_seeker` ou `employer` (1-1, `ON DELETE CASCADE`).
`skill` / `job_title` sont des référentiels partagés, `job_seeker_skill` la table
d'association. `experience` historise les postes d'un candidat, `job_offer` les
annonces d'un employeur (géolocalisées : code INSEE, lat/lon, rayon), et
`application` la candidature d'un `job_seeker` sur une `job_offer` — unique par
couple (candidat, offre).

Les statuts sont des ENUM PostgreSQL créés explicitement par la migration :
`account_role`, `account_status`, `verif_status`, `moder_status`, `app_status`,
`contract_type`.
