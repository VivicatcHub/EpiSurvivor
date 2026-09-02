from fastapi import APIRouter, Depends, Response
from sqlmodel import Session

from app.auth.user import Account, CheckAuth
from app.config import SESSION_COOKIE
from app.database import get_db

router = APIRouter(prefix="/api/v1", tags=["auth"])


@router.delete("/deleteaccount")
async def delete_account(
    response: Response,
    account: Account = Depends(CheckAuth),
    db: Session = Depends(get_db),
):
    """RGPD §3.3 : suppression réelle du compte.

    Les profils, offres et candidatures liés partent avec, via les
    ON DELETE CASCADE du schéma — rien à supprimer à la main ici.
    """
    db.delete(account)
    db.commit()
    response.delete_cookie(key=SESSION_COOKIE, path="/")
    return {"message": "Account deleted"}
