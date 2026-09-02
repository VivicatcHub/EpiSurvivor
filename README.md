# GéoEmploi

Service public de recherche d'emploi géolocalisée — Ministère du Job et Bonheur.
Le projet est découpé en trois dépôts qui forment **une seule application** :

| Dossier            | Rôle                                                                 | Port |
| ------------------ | -------------------------------------------------------------------- | ---- |
| `geo-emploi-db`    | Schéma PostgreSQL et migrations Alembic — **propriétaire du schéma**  | 5555 |
| `geo-emploi-back`  | API REST FastAPI : authentification, offres, candidatures, modération | 1234 |
| `geo-emploi-front` | Application Next.js 16 : carte publique, espaces des trois rôles      | 3000 |

## Comment les trois tiers se parlent

```
navigateur ──► Next.js (serveur) ──► FastAPI ──► PostgreSQL
            ▲                    ▲            ▲
    cookie httpOnly    cookie relayé    schéma Alembic
```

Trois décisions structurent l'ensemble :

1. **Le schéma appartient à Alembic.** Le backend déclare des modèles SQLModel
   calqués sur les tables (`geo-emploi-back/app/models.py`) mais n'appelle
   jamais `create_all`. Toute colonne nouvelle passe d'abord par une migration.

2. **Le navigateur ne parle jamais au backend.** Les Server Components, Server
   Actions et Route Handlers de Next appellent l'API et relaient le cookie de
   session. `API_URL` n'est donc pas dans le bundle, il n'y a pas de CORS à
   négocier, et le JWT reste dans un cookie `httpOnly` — illisible par un
   script injecté (§3.1 du sujet).

3. **Un seul vocabulaire.** L'API répond en camelCase avec les valeurs de la
   base (`job_seeker`, `permanent`, `in_review`). `app/schemas.py` et
   `lib/schemas.ts` décrivent les mêmes objets ; le français n'apparaît qu'à
   l'affichage, dans `geo-emploi-front/lib/labels.ts`.

L'autorisation est vérifiée trois fois, volontairement : `proxy.ts` (optimiste,
sur le cookie seul), `lib/dal.ts` (au rendu de la page) et le backend (qui
tranche). Une Server Action est un endpoint POST public : masquer un bouton
n'autorise rien.

## Démarrage — Docker

```bash
docker compose up --build
docker compose run --rm api python -m app.seed --reset   # jeu de démonstration
```

Le front est alors sur http://localhost:3000, l'API sur http://localhost:1234
(documentation interactive : http://localhost:1234/docs).

`compose.yaml` enchaîne les services dans l'ordre : la base doit répondre avant
que les migrations tournent, et les migrations doivent être terminées avant que
l'API démarre.

## Démarrage — local, service par service

```bash
# 1. Base
docker run -d --name geo-emploi-pg \
  -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin -e POSTGRES_DB=geo_emploi \
  -p 5555:5432 -v geo-emploi-pgdata:/var/lib/postgresql/data postgres:16

# 2. Migrations
cd geo-emploi-db
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env      # puis y ajouter DATABASE_URL (voir README du dossier)
.venv/bin/alembic upgrade head

# 3. API
cd ../geo-emploi-back
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp app/.env.example app/.env
.venv/bin/python -m app.seed --reset
.venv/bin/uvicorn app.main:app --port 1234 --reload

# 4. Front
cd ../geo-emploi-front
npm install
cp .env.example .env.local
npm run dev
```

## Comptes de démonstration

Créés par `app/seed.py`, mot de passe commun **`geoemploi2026`** :

| Rôle              | Adresse                                  |
| ----------------- | ---------------------------------------- |
| Administration    | `jeb@job-et-bonheur.fr`                  |
| Chercheur d'emploi| `camille.aubert@example.fr`              |
| Employeur         | `recrutement@rhone-numerique.example.fr` |

Le jeu de données couvre 42 entreprises et 44 offres réparties sur toute la
France, dont une en attente de validation et une signalée — de quoi voir la
carte, la modération et les signalements sans rien saisir.

## Endpoints

| Méthode  | Chemin                                | Accès              |
| -------- | ------------------------------------- | ------------------ |
| `POST`   | `/api/v1/register`, `/api/v1/login`   | public             |
| `POST`   | `/api/v1/logout`                      | public             |
| `GET`    | `/api/v1/me`                          | connecté           |
| `DELETE` | `/api/v1/deleteaccount`               | connecté (RGPD)    |
| `GET`    | `/api/v1/offers`, `/api/v1/offers/:id`| **public** (§2.2)  |
| `POST`   | `/api/v1/offers`                      | employeur abonné   |
| `POST`   | `/api/v1/offers/:id/apply`            | chercheur d'emploi |
| `POST`   | `/api/v1/offers/:id/report`           | **public** (§5)    |
| `GET`    | `/api/v1/seeker/profile`, `/applications` | chercheur      |
| `GET`    | `/api/v1/employer/company`, `/offers`, `/applications` | employeur |
| `PUT`    | `/api/v1/employer/subscription`       | employeur          |
| `PATCH`  | `/api/v1/employer/applications/:id`   | employeur (la sienne) |
| `GET`    | `/api/v1/admin/offers`, `/users`, `/reports`, `/metrics` | admin |
| `PATCH`  | `/api/v1/admin/offers/:id`, `/users/:id` | admin           |

La recherche accepte `?q=`, `?contract=` et un cadre de carte
`?minLat=&maxLat=&minLng=&maxLng=` — c'est ce que la carte appelle, débouncé,
à chaque déplacement, via le BFF `app/api/offres/route.ts`.

## Points du sujet couverts par l'intégration

- **§2.2 carte sans compte** — `/offres` n'est pas dans le matcher de `proxy.ts`.
- **§2.2 candidature authentifiée** — vérifiée dans la Server Action *et* par
  `CheckSeeker` côté API.
- **§2.2 archivage à 30 jours** — colonne `archived_at`, balayage au démarrage
  de l'API, et filtre sur la date dans la recherche (un retard de tâche ne
  peut donc pas remettre une offre périmée sur la carte).
- **§3.2 précision commune** — `insee_code`, latitude/longitude et rayon portés
  par chaque offre.
- **§3.3 RGPD** — suppression de compte réelle (confirmation par saisie de
  l'e-mail), cascade en base, position jamais persistée.
- **§5 signalement** — ouvert aux visiteurs anonymes, remonté dans l'onglet
  « Signalements » de l'administration.
