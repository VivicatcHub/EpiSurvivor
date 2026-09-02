from datetime import datetime
from fastapi import Depends, HTTPException, Request, Cookie
from pydantic import EmailStr
from sqlmodel import select, Session, SQLModel
from typing import Annotated
from app.config import ALGORITHM, SECRET_KEY
from jose import jwt
from jose.exceptions import JWTError
from app.database import get_db
# La table vit dans app/models.py avec le reste du schéma (source des
# migrations alembic) ; réexportée ici, le modèle est inchangé.
from app.models import User

class Register(SQLModel):
    email: str
    password: str
    firstname: str
    lastname: str
    role: str

class Login(SQLModel):
    email: str
    password: str

class Properties(SQLModel):
    uid: int
    firstname: str
    lastname: str
    email: str
    role: str
    status: str
    created_at: datetime

async def CheckAuth(request: Request, geosession : Annotated[str | None, Cookie()] = "", db: Session = Depends(get_db)) -> User:
    try:
        payload = jwt.decode(geosession, str(SECRET_KEY), algorithms=[str(ALGORITHM)])
        uid: str = payload.get("uid")
        user = db.exec(select(User).where(User.uid == int(uid))).first()
        if not user:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    except jwt.JWTError as e:
        raise HTTPException(status_code=403, detail="Forbidden")
