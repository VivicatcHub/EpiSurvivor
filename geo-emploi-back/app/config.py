import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("jwt_secretkey")
ALGORITHM = os.getenv("jwt_algorithm")
TOKEN_EXPIRE_MINUTES = os.getenv("token_expire_minutes")
