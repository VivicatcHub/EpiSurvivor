"""Session : hachage du mot de passe, jeton JWT, dépendances d'autorisation.

Le jeton voyage dans un cookie `geosession` httpOnly — jamais dans
localStorage, où n'importe quel script injecté le lirait (§3.1 du sujet).

Le compte est le modèle `User` du schéma (table `users`, PK `uid`) : les DTO
d'entrée/sortie, eux, vivent dans app/schemas.py avec le reste du contrat.
"""

from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException
from jose import jwt
from jose.exceptions import JWTError
from pwdlib import PasswordHash
from sqlmodel import Session, select

from app.config import ALGORITHM, SECRET_KEY, TOKEN_EXPIRE_MINUTES
from app.database import get_db
from app.models import Employer, JobSeeker, User

password_hash = PasswordHash.recommended()


def hash_password(raw: str) -> str:
    return password_hash.hash(raw)


def verify_password(raw: str, hashed: str) -> bool:
    return password_hash.verify(raw, hashed)


def create_token(account: User) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"uid": str(account.uid), "role": account.role, "exp": expire},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


async def CheckAuth(
    geosession: Annotated[str | None, Cookie()] = None,
    db: Session = Depends(get_db),
) -> User:
    if not geosession:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(geosession, SECRET_KEY, algorithms=[ALGORITHM])
        uid = int(payload["uid"])
    except (JWTError, KeyError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid session")

    account = db.exec(select(User).where(User.uid == uid)).first()
    if not account:
        raise HTTPException(status_code=401, detail="Invalid session")
    # Un compte suspendu garde son cookie mais perd l'accès : la modération
    # doit produire un effet immédiat, sans attendre l'expiration du jeton.
    if account.status != "active":
        raise HTTPException(status_code=403, detail="Account suspended")
    return account


async def CheckOptionalAuth(
    geosession: Annotated[str | None, Cookie()] = None,
    db: Session = Depends(get_db),
) -> User | None:
    """Session facultative : la carte et le signalement restent publics."""
    if not geosession:
        return None
    try:
        return await CheckAuth(geosession=geosession, db=db)
    except HTTPException:
        return None


def require_role(*roles: str):
    async def guard(account: User = Depends(CheckAuth)) -> User:
        if account.role not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return account

    return guard


CheckSeeker = require_role("job_seeker")
CheckEmployer = require_role("employer")
CheckAdmin = require_role("admin")


def seeker_of(db: Session, account: User) -> JobSeeker:
    seeker = db.exec(
        select(JobSeeker).where(JobSeeker.compte_id == account.uid)
    ).first()
    if not seeker:
        raise HTTPException(status_code=404, detail="Job seeker profile not found")
    return seeker


def employer_of(db: Session, account: User) -> Employer:
    employer = db.exec(
        select(Employer).where(Employer.compte_id == account.uid)
    ).first()
    if not employer:
        raise HTTPException(status_code=404, detail="Employer profile not found")
    return employer
