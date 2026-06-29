from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.crud.leader import get_leaders
from app.schemas.leader import LeadersResponse

router=APIRouter(tags=["leadres"])

@router.get("/leaders",response_model=LeadersResponse)
async def list_leaders(category:str="bench",db:AsyncSession=Depends(get_db)):
    result=await get_leaders(db,category)
    if not result:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    return result