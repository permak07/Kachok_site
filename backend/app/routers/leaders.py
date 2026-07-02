from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.crud.leader import get_leaders
from app.schemas.leader import LeadersResponse
from app.dependencies.auth import get_current_user_optional
from app.models.user import User

router=APIRouter(tags=["leadres"])

# Получение списка лидер и посик user в списке
@router.get("/leaders",response_model=LeadersResponse)
async def list_leaders(category:str="bench",
                       db:AsyncSession=Depends(get_db),
                       current_user: User | None = Depends(get_current_user_optional)):
    result=await get_leaders(db,category,
                             current_user_id=current_user.id if current_user else None)
    if not result:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    return result