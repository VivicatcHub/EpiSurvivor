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
) -> Column:
    """Clé étrangère NOT NULL vers `target`, donné sous la forme
    'table.colonne'. `cascade` ajoute ON DELETE CASCADE."""
    return Column(
        Integer,
        ForeignKey(target, ondelete="CASCADE" if cascade else None),
        nullable=False,
        unique=unique,
        primary_key=primary_key,
    )
