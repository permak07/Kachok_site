from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app import crud
from app.schemas.category import CategoryOut

router=APIRouter(tags=["public"])

@router.get("/categories",response_model=list[CategoryOut])
async def list_categories(db:AsyncSession=Depends(get_db)):
    return await crud.category.get_categories(db)