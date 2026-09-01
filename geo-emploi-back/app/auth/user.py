from datetime import datetime, timezone
from fastapi import Depends, HTTPException, Request, Cookie
from pydantic import EmailStr
from sqlmodel import select, Session, Field, SQLModel
from typing import Annotated
from app.config import ALGORITHM, SECRET_KEY
from jose import jwt
from jose.exceptions import JWTError
from app.database import get_db

class User(SQLModel, table=True):
    __tablename__ = "users"
    uid: int | None = Field(default=None, primary_key=True)
    firstname: str
    lastname: str
    email: str = Field(index=True, unique=True)
    password: str
    role: str
    status: str = "active"
    subscription_type: str = "none"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
