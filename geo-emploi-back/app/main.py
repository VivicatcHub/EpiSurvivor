from fastapi import Request, Depends, FastAPI
from app.auth import register, login, user, delete
from app.database import create_db

app = FastAPI()
create_db()

@app.get("/")
def index():
    return {"message": "hi"}

@app.get("/health")
def health():
    return {"message": "OK"}

# TODO: user.User bruh find a better name for user.py
# TODO: remove /me and make something like /api/v1/profile
@app.get("/me", dependencies=[Depends(user.CheckAuth)])
async def me(request: Request, user: user.User = Depends(user.CheckAuth)) -> str:
    print(user)
    return "e"

app.include_router(register.router)
app.include_router(login.router)
app.include_router(delete.router)
