import os
import sys
from logging.config import fileConfig
from pathlib import Path
from urllib.parse import quote_plus

from alembic import context
from dotenv import load_dotenv
from sqlalchemy import engine_from_config
from sqlalchemy import pool

# Le schéma est défini par les modèles SQLModel du back : on les rend
# importables depuis ici pour que --autogenerate les voie.
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "geo-emploi-back"))

from sqlmodel import SQLModel  # noqa: E402
from app import models  # noqa: E402,F401  (enregistre les tables)

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# L'URL de connexion vient de l'environnement (ou du .env local), jamais de
# alembic.ini : pas de credentials versionnés.
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))


def get_url() -> str:
    """URL de connexion, dans l'ordre de priorité :

    1. DATABASE_URL si elle est définie (staging, CI, base distante) ;
    2. sinon reconstruite depuis les POSTGRES_* du .env, c'est-à-dire les
       mêmes variables que celles consommées par compose.yaml. Un seul
       endroit où changer les identifiants.
    """
    url = os.getenv("DATABASE_URL")
    if url:
        return url

    user = os.getenv("POSTGRES_USER")
    password = os.getenv("POSTGRES_PASSWORD")
    database = os.getenv("POSTGRES_DB")
    if not (user and password and database):
        raise RuntimeError(
            "Connexion introuvable : renseigne POSTGRES_USER, "
            "POSTGRES_PASSWORD et POSTGRES_DB dans .env "
            "(cf. .env.example), ou bien DATABASE_URL directement."
        )

    # Le conteneur écoute sur 5432, compose.yaml le publie sur POSTGRES_PORT :
    # depuis l'hôte, où tourne alembic, c'est ce port-là qu'il faut viser.
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5555")

    return (
        f"postgresql+psycopg2://{quote_plus(user)}:{quote_plus(password)}"
        f"@{host}:{port}/{database}"
    )


# %% : configparser interpole les %, un mot de passe qui en contient casserait.
config.set_main_option("sqlalchemy.url", get_url().replace("%", "%%"))

# Source de vérité du schéma : le paquet app/models/ côté geo-emploi-back.
# `alembic revision --autogenerate -m "..."` diffe la base contre ces modèles.
target_metadata = SQLModel.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
