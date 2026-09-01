from fastapi import APIRouter, Depends, HTTPException
from pwdlib import PasswordHash
from sqlmodel import Session, select
from app.auth.user import Properties, Register, User
from app.database import get_db
from email_validator import validate_email, EmailNotValidError

router = APIRouter()
password_hash = PasswordHash.recommended()
@router.post("/api/v1/register", response_model=Properties)
def register(data: Register, db: Session = Depends(get_db)):
    email = None
    try:
        obj = validate_email(data.email, check_deliverability=False) # TODO: True in prod
        email = obj.email
    except EmailNotValidError as e:
        print("not valid:", str(e))
    if email is None:
        raise HTTPException(status_code=400, detail="Email isn't valid")
    existinguser = db.exec(select(User).where(User.email == email)).first()
    if data.role != "employeer" and data.role != "jobseeker":
        raise HTTPException(status_code=400, detail="Role isn't valid")
    if existinguser:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(email=data.email, password=password_hash.hash(data.password), firstname=data.firstname, lastname=data.lastname, role=data.role, status="active")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
