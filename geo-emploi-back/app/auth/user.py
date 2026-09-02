"""Session : hachage du mot de passe, jeton JWT, dépendances d'autorisation.

Le jeton voyage dans un cookie `geosession` httpOnly — jamais dans
localStorage, où n'importe quel script injecté le lirait (§3.1 du sujet).
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
from app.models import Account, Employer, JobSeeker

password_hash = PasswordHash.recommended()

# Conservé pour les imports existants : le modèle de compte s'appelle
# désormais Account, aligné sur la table `account` d'Alembic.
User = Account


def hash_password(raw: str) -> str:
    return password_hash.hash(raw)


def verify_password(raw: str, hashed: str) -> bool:
    return password_hash.verify(raw, hashed)


def create_token(account: Account) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"uid": str(account.id), "role": account.role, "exp": expire},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


async def CheckAuth(
    geosession: Annotated[str | None, Cookie()] = None,
    db: Session = Depends(get_db),
) -> Account:
    if not geosession:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(geosession, SECRET_KEY, algorithms=[ALGORITHM])
        uid = int(payload["uid"])
    except (JWTError, KeyError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid session")

    account = db.exec(select(Account).where(Account.id == uid)).first()
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
) -> Account | None:
    """Session facultative : la carte et le signalement restent publics."""
    if not geosession:
        return None
    try:
        return await CheckAuth(geosession=geosession, db=db)
    except HTTPException:
        return None


def require_role(*roles: str):
    async def guard(account: Account = Depends(CheckAuth)) -> Account:
        if account.role not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return account

    return guard


CheckSeeker = require_role("job_seeker")
CheckEmployer = require_role("employer")
CheckAdmin = require_role("admin")


def seeker_of(db: Session, account: Account) -> JobSeeker:
    seeker = db.exec(
        select(JobSeeker).where(JobSeeker.account_id == account.id)
    ).first()
    if not seeker:
        raise HTTPException(status_code=404, detail="Job seeker profile not found")
    return seeker


def employer_of(db: Session, account: Account) -> Employer:
    employer = db.exec(
        select(Employer).where(Employer.account_id == account.id)
    ).first()
    if not employer:
        raise HTTPException(status_code=404, detail="Employer profile not found")
    return employer
