from email_validator import EmailNotValidError, validate_email
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel import Session, select
from app.auth.user import create_token, password_hash
from app.config import COOKIE_SECURE, SESSION_COOKIE, TOKEN_EXPIRE_MINUTES
from app.database import get_db
from app.models import Employer, JobSeeker, User
from app.schemas import ROLES, RegisterIn, SessionUser
from app.serializers import session_user

router = APIRouter(prefix="/api/v1", tags=["auth"])

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
    if db.exec(select(User).where(User.email == email)).first():
        raise HTTPException(status_code=409, detail="Email déjà enregistré")

    account = User(
        email=email,
        password=password_hash.hash(data.password),
        firstname=data.firstname,
        lastname=data.lastname,
        role=data.role,
        status="active",
    )
    db.add(account)
    db.flush()  # pour disposer de account.uid avant d'écrire le profil lié

    if data.role == "employer":
        name = (data.company or f"{data.firstname} {data.lastname}").strip()
        db.add(
            Employer(
                compte_id=account.uid,
                nom=name,
                siret=data.siret or None,
                email_contact=email,
            )
        )
    else:
        name = f"{data.firstname} {data.lastname}".strip()
        db.add(
            JobSeeker(
                compte_id=account.uid,
                prenom=data.firstname,
                nom=data.lastname,
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
