from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel import Session, select

from app.auth.user import CheckAuth, create_token, verify_password
from app.config import COOKIE_SECURE, SESSION_COOKIE, TOKEN_EXPIRE_MINUTES
from app.database import get_db
from app.models import User
from app.schemas import LoginIn, SessionUser
from app.serializers import display_name, session_user

router = APIRouter(prefix="/api/v1", tags=["auth"])


@router.post("/login", response_model=SessionUser)
def login(data: LoginIn, response: Response, db: Session = Depends(get_db)):
    account = db.exec(select(User).where(User.email == data.email)).first()
    # Même message dans les deux cas : ne pas révéler quels emails existent.
    if not account or not verify_password(data.password, account.password):
        raise HTTPException(status_code=401, detail="Email ou mot de passe invalide")
    if account.status != "active":
        raise HTTPException(status_code=403, detail="Compte suspendu")

    response.set_cookie(
        key=SESSION_COOKIE,
        value=create_token(account),
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        path="/",
        max_age=TOKEN_EXPIRE_MINUTES * 60,
    )
    return session_user(account, display_name(db, account))


@router.post("/logout")
def logout(response: Response):
    # Le jeton reste valide jusqu'à son expiration ; le supprimer côté client
    # suffit ici. Une vraie révocation demanderait une liste noire serveur.
    response.delete_cookie(key=SESSION_COOKIE, path="/")
    return {"message": "Logged out"}


@router.get("/me", response_model=SessionUser)
def me(account: User = Depends(CheckAuth), db: Session = Depends(get_db)):
    return session_user(account, display_name(db, account))
