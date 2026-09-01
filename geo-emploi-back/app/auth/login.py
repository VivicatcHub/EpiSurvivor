from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Response
from jose import jwt
from pwdlib import PasswordHash
from sqlmodel import Session, select
from app.auth.user import Login, User
from app.config import TOKEN_EXPIRE_MINUTES, ALGORITHM, SECRET_KEY
from app.database import get_db

router = APIRouter()
password_hash = PasswordHash.recommended()

@router.post("/api/v1/login")
def login(data: Login, response: Response, db: Session = Depends(get_db)):
    user = db.exec(select(User).where(User.email == data.email)).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not password_hash.verify(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    # TODO: do active
    expire = datetime.now(timezone.utc) + timedelta(minutes=int(TOKEN_EXPIRE_MINUTES))
    token = jwt.encode({"uid": str(user.uid), "exp": expire}, str(SECRET_KEY), algorithm=str(ALGORITHM))
    response.set_cookie(key="geosession", value=token, httponly=True, secure=False, samesite="lax", max_age=int(TOKEN_EXPIRE_MINUTES) * 60)
    return {"message": "Login successful"}

# TODO: do something to delete the god damn cookie session serversided?
@router.post("/api/v1/logout")
def logout(response: Response):
    response.delete_cookie(key="geosession")
    return {"message": "Logged out"}
