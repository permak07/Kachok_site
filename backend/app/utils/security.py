from datetime import datetime, timedelta
from jose import jwt 
from passlib.context import CryptContext
from app.core.config import settings
import random

# объект работающий с хэшами
context=CryptContext(schemes=["bcrypt"],deprecated="auto")

# Хэширование
def hash_password(password:str)->str:
    return context.hash(password)

# Проверка пароля
def verify_password(plain_password:str, hashed_password:str)->bool:
    return context.verify(plain_password,hashed_password)

# Создание токена
def create_access_token(user_id:int)->str:
    expire=datetime.utcnow()+timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode={"sub":str(user_id),"exp":expire}
    return jwt.encode(to_encode,settings.SECRET_KEY,algorithm=settings.ALGORITHM)

# Генерация кода проверки
def generate_vetification_code()->str:
    return f"{random.randint(100000,999999)}"