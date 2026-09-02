"""Types énumérés du schéma, mappés sur des types PostgreSQL nommés."""

from enum import Enum

from sqlalchemy import Enum as SAEnum


class StatutVerif(str, Enum):
    EN_ATTENTE = "en_attente"
    VERIFIE = "verifie"
    REJETE = "rejete"


class StatutModer(str, Enum):
    EN_ATTENTE = "en_attente"
    VALIDEE = "validee"
    REJETEE = "rejetee"


class StatutCandidature(str, Enum):
    ENVOYEE = "envoyee"
    VUE = "vue"
    EN_COURS = "en_cours"
    ACCEPTEE = "acceptee"
    REFUSEE = "refusee"


class TypeContrat(str, Enum):
    CDI = "cdi"
    CDD = "cdd"
    INTERIM = "interim"
    STAGE = "stage"
    ALTERNANCE = "alternance"
    FREELANCE = "freelance"


def _pg_enum(python_enum: type[Enum], name: str) -> SAEnum:
    """values_callable : sans lui SQLAlchemy stocke le NOM du membre
    ('EN_ATTENTE') au lieu de sa valeur ('en_attente')."""
    return SAEnum(
        python_enum, name=name, values_callable=lambda e: [m.value for m in e]
    )


# Instances partagées, à réutiliser dans les colonnes : TYPE_CONTRAT sert à la
# fois à experience et à offre, et deux instances du même type nommé
# produiraient deux CREATE TYPE.
STATUT_VERIF = _pg_enum(StatutVerif, "statut_verif")
STATUT_MODER = _pg_enum(StatutModer, "statut_moder")
STATUT_CAND = _pg_enum(StatutCandidature, "statut_cand")
TYPE_CONTRAT = _pg_enum(TypeContrat, "type_contrat")

# Pas de role_compte ni de statut_compte : User.role et User.status sont des
# str dans le modèle existant, qui reste la référence.
