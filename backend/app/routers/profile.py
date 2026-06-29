from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserProfileOut,ProfileUpdate
from app.crud.user import update_user_profile

router=APIRouter(prefix="/users/me",tags=["profile"])

# Получение данный о пользователе
@router.get("/profile",response_model=UserProfileOut)
async def get_profile(current_user:User=Depends(get_current_user),db:AsyncSession=Depends(get_db)):
    return current_user

# обновление данных о пользователе
@router.patch("/profile",response_model=UserProfileOut)
async def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    user=await update_user_profile(db,current_user.id,update_data)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user