from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app import crud
from app.schemas.user import UserCreate, UserLogin, UserOut
from app.schemas.token import Token
from app.models.user import User
from app.utils.security import verify_password, create_access_token
from app.dependencies.auth import get_current_user

# Настройка путей в роутере
router=APIRouter(prefix="/auth",tags=["auth"])

# Регистрация
@router.post("/register",response_model=UserOut,status_code=status.HTTP_201_CREATED)
async def register(data:UserCreate,db:AsyncSession=Depends(get_db)):
    if await crud.user.get_user_by_email(db,data.email):
        raise HTTPException(status_code=400,detail="Email уже зарегистрирован")
    if await crud.user.get_user_by_username(db,data.username):
        raise HTTPException(status_code=400, detail="Имя пользователя занято")
    user=await crud.user.create_user(db,data.username,data.email,data.password)
    return user

# Вход
@router.post("/login",response_model=Token)
async def login(data:UserLogin,db:AsyncSession=Depends(get_db)):
    user=await crud.user.get_user_by_email(db,data.email)
    if not user or not verify_password(data.password,user.hashed_password):
        raise HTTPException(status_code=401,detail="Неверный email или пароль")
    token=create_access_token(user.id)
    return {"access_token":token,"token_type":"bearer"}

# Выход
@router.post("/logout")
async def logout():
    return {"detail":"Выход выполнен"}

# Чтение данных о пользователе
@router.get("/me",response_model=UserOut)
async def read_me(current_user:User=Depends(get_current_user)):
    return current_user

# Подтверждение email
@router.post("/confirm-email",response_model=UserOut)
async def confirm_email(email:str,code:str,db:AsyncSession=Depends(get_db)):
    user=await crud.user.verify_user_email(db,email,code)
    if not user:
        raise HTTPException(status_code=400,detail="Неверный email или код")
    return user