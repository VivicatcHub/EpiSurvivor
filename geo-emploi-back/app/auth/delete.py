from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from app.auth import user
from app.auth.user import User
from app.database import get_db

router = APIRouter()

@router.delete("/api/v1/deleteaccount", dependencies=[Depends(user.CheckAuth)])
async def delete(user: user.User = Depends(user.CheckAuth), db: Session = Depends(get_db)):
    db.delete(user)
    db.commit()
    return {"message": "Account deleted"}
