from datetime import datetime, timezone

from email_validator import EmailNotValidError, validate_email
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel import Session, select

from app.auth.user import create_token, hash_password
from app.config import COOKIE_SECURE, SESSION_COOKIE, TOKEN_EXPIRE_MINUTES
from app.database import get_db
from app.models import Account, Employer, JobSeeker
from app.schemas import ROLES, RegisterIn, SessionUser
from app.serializers import session_user

router = APIRouter(prefix="/api/v1", tags=["auth"])

# Formule d'entrée du sujet : 400 €/mois, 15 km de rayon de diffusion.
STANDARD_PLAN = {"plan_price_eur": 400, "plan_radius_km": 15}


@router.post("/register", response_model=SessionUser, status_code=201)
def register(data: RegisterIn, response: Response, db: Session = Depends(get_db)):
    try:
        # check_deliverability=False : en démo on ne veut pas dépendre du DNS.
        email = validate_email(data.email, check_deliverability=False).normalized
    except EmailNotValidError as error:
        raise HTTPException(status_code=400, detail=f"Email invalide : {error}")

    if data.role not in ("job_seeker", "employer"):
        raise HTTPException(
            status_code=400,
            detail=f"Rôle invalide, attendu l'un de {ROLES[:2]}",
        )
    if db.exec(select(Account).where(Account.email == email)).first():
        raise HTTPException(status_code=409, detail="Email déjà enregistré")

    account = Account(
        email=email,
        password_hash=hash_password(data.password),
        role=data.role,
        status="active",
    )
    db.add(account)
    db.flush()  # pour disposer de account.id avant d'écrire le profil lié

    if data.role == "employer":
        name = (data.company or f"{data.firstname} {data.lastname}").strip()
        db.add(
            Employer(
                account_id=account.id,
                name=name,
                siret=data.siret or None,
                contact_email=email,
                subscription_plan="standard",
                subscribed_at=datetime.now(timezone.utc),
                **STANDARD_PLAN,
            )
        )
    else:
        name = f"{data.firstname} {data.lastname}".strip()
        db.add(
            JobSeeker(
                account_id=account.id,
                first_name=data.firstname,
                last_name=data.lastname,
            )
        )

    db.commit()
    db.refresh(account)

    # L'inscription ouvre la session : pas de second aller-retour de login.
    response.set_cookie(
        key=SESSION_COOKIE,
        value=create_token(account),
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        path="/",
        max_age=TOKEN_EXPIRE_MINUTES * 60,
    )
    return session_user(account, name)
