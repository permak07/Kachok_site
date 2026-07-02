from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.achievements import AchievementItem
from app.crud.achievements import get_user_achievements
from typing import List

router=APIRouter(prefix="/users/me",tags=["achievements"])

# Получение списока достижений пользователя
@router.get("/achievements",response_model=List[AchievementItem])
async def user_achievements(current_user:User=Depends(get_current_user),db:AsyncSession=Depends(get_db)):
    return await get_user_achievements(db,current_user)
