from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.activity import ActivityItem
from app.crud.activity import get_user_activity

router=APIRouter(prefix="/users/me",tags=["activity"])


@router.get("/activity",response_model=List[ActivityItem])
async def user_activity(limit:int=Query(20,ge=1,le=50,description="Количество событий"),
                        current_user:User=Depends(get_current_user),
                        db:AsyncSession=Depends(get_db)):
    return await get_user_activity(db, current_user.id, limit)