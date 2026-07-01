from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.records import RecordItem
from app.crud.records import get_user_records

router=APIRouter(prefix="/users/me",tags=["records"])

# Получение рекордов ползователя
@router.get("/records",response_model=list[RecordItem])
async def user_records(current_user:User=Depends(get_current_user),
                       db:AsyncSession=Depends(get_db)):
    return await get_user_records(db,current_user.id)