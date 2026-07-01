from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.stats import StatsResponse
from app.crud.stats import get_user_stats
from typing import Optional

router=APIRouter(prefix="/users/me",tags=["stats"])

# Получение stats пользователя
@router.get("/stats",response_model=StatsResponse)
async def user_stats(category_id:Optional[int]=Query(None),
                     current_user:User=Depends(get_current_user),
                     db:AsyncSession=Depends(get_db)):
    return await get_user_stats(db,current_user.id,category_id)