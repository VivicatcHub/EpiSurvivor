"""Colonnes récurrentes du schéma.

Ce sont des fabriques, pas des constantes : une instance de Column appartient à
une seule table, on ne peut pas la partager entre deux modèles.
"""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, func


def created_at() -> Column:
    """TIMESTAMPTZ NOT NULL DEFAULT now(), rempli par postgres."""
    return Column(DateTime(timezone=True), nullable=False, server_default=func.now())


def fk(
    target: str,
    *,
    unique: bool = False,
    primary_key: bool = False,
    cascade: bool = False,
    nullable: bool = False,
) -> Column:
    """Clé étrangère vers `target`, donné sous la forme 'table.colonne'.

    NOT NULL par défaut. `cascade` ajoute ON DELETE CASCADE : la ligne
    disparaît avec son parent. Une clé `nullable` prend ON DELETE SET NULL à
    la place — la ligne survit à son parent, en perdant le lien (c'est le cas
    du signalement, qui reste instruit même si son auteur supprime son compte).
    """
    if cascade and nullable:
        raise ValueError("cascade et nullable s'excluent : choisir l'un des deux")
    on_delete = "CASCADE" if cascade else ("SET NULL" if nullable else None)
    return Column(
        Integer,
        ForeignKey(target, ondelete=on_delete),
        nullable=nullable,
        unique=unique,
        primary_key=primary_key,
    )
