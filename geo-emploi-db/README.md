# geo-emploi-db

Migrations Alembic du schéma PostgreSQL de geo-emploi.

Ce dossier ne contient **que** les migrations : le serveur PostgreSQL est fourni
à côté (`compose.yaml` ici, ou la pile complète à la racine du dépôt) et n'est
pas géré ici.

## Le schéma vient des modèles

La source de vérité est le paquet SQLModel du backend,
`geo-emploi-back/app/models/`. Les révisions de ce dossier en sont **dérivées**
(`alembic revision --autogenerate`), elles ne sont pas écrites à la main.

`alembic/env.py` ajoute donc `../geo-emploi-back` au `sys.path` et importe
`app.models` : c'est ce qui peuple `SQLModel.metadata`, comparé à la base par
`--autogenerate`. Ces modèles ne dépendent que de `sqlmodel` — volontairement,
pour que le venv des migrations reste léger.

Conséquence pratique : **un `--autogenerate` qui ne détecte rien est la preuve
que la base et les modèles concordent.** C'est le test le plus utile de ce
dossier.

## Prérequis

- Python 3.12+
- une base PostgreSQL accessible

## Installation

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## Configuration

`alembic/env.py` lit l'URL de connexion dans `DATABASE_URL` — depuis
l'environnement, ou depuis un `.env` placé à la racine de ce dossier. À défaut,
elle est reconstruite depuis les `POSTGRES_*` du `.env`, c'est-à-dire les mêmes
variables que celles consommées par `compose.yaml` : un seul endroit où changer
les identifiants. Rien n'est écrit dans `alembic.ini`, et `.env` n'est pas
versionné.

```bash
cp .env.example .env
export DATABASE_URL=postgresql+psycopg2://user:password@host:5432/geo_emploi
```

Si aucune des deux sources n'est renseignée, Alembic s'arrête avec un message
explicite.

## Utilisation

```bash
.venv/bin/alembic upgrade head       # appliquer toutes les migrations
.venv/bin/alembic current            # révision appliquée
.venv/bin/alembic history --verbose  # historique
.venv/bin/alembic downgrade -1       # revenir d'une révision
.venv/bin/alembic upgrade head --sql # générer le SQL sans l'exécuter
```

Nouvelle migration — on modifie d'abord le modèle, puis :

```bash
.venv/bin/alembic revision --autogenerate -m "ce que ça change"
```

Le squelette généré porte un `# please adjust!` qu'il faut honorer : Alembic
crée les clés étrangères sans nom (`create_foreign_key(None, ...)`), ce qui rend
le `downgrade` inapplicable. Nommer les contraintes qu'on ajoute.

## Migrations

| Révision                          | Contenu                                                    |
| --------------------------------- | ---------------------------------------------------------- |
| `b81284c6a677` initial schema     | schéma de domaine généré depuis les modèles                |
| `31a383d592da` enums vers text    | les statuts et le type de contrat repassent en texte libre |
| `5a2399f10a56` offres localisées… | localisation et salaire des offres, signalements, cascades |

`31a383d592da` retire les types énumérés : plus de contrainte de valeurs côté
base. La convention, elle, subsiste — les valeurs du schéma restent celles que
les ENUM portaient (`cdi`, `en_cours`, `rejetee`…), et
`geo-emploi-back/app/serializers.py` est le seul endroit qui les traduit vers le
vocabulaire de l'API (`permanent`, `in_review`, `rejected`).

`5a2399f10a56` apporte ce que les écrans utilisent réellement : adresse, ville,
code postal, code INSEE, fourchette de salaire et date d'archivage sur `offre` ;
la table d'association `offre_competence` ; la table `signalement` (§5 du sujet
— le signalement est ouvert aux visiteurs anonymes, d'où un `compte_id`
nullable) ; le message porté par une `candidature`. Elle pose surtout les
`ON DELETE CASCADE` qui manquaient : sans eux, supprimer un compte (RGPD §3.3)
échouait sur une violation de clé étrangère dès qu'un profil existait. Seul
`signalement.compte_id` prend `SET NULL` — un signalement reste instruit après
le départ de son auteur.

## Schéma

`users` porte l'authentification et se spécialise en `job_seeker` ou `employer`
(1-1, `ON DELETE CASCADE`). `competence` et `titre_poste` sont des référentiels
partagés ; `job_seeker_competence` et `offre_competence` les associent
respectivement à un candidat et à une offre. `experience` historise les postes
d'un candidat, `offre` les annonces d'un employeur (géolocalisées : code INSEE,
lat/lon, rayon), `candidature` la candidature d'un `job_seeker` sur une `offre`
— unique par couple (candidat, offre) — et `signalement` les signalements
déposés sur une offre.
