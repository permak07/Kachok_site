from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.category import Category
from app.schemas.result import ResultCreate, ResultUpdate, ResultOut
from app.crud.local_result import (
    create_result, get_user_results, get_result_by_id,
    update_result, delete_result, publish_result
)

router=APIRouter(prefix="/users/me/results",tags=["results"])

# Форматирование результата для ответа
def format_result(result,category:Category)->dict:
    if category.slug in ["bench", "tonnage", "one_rep"]:
        unit = "kg"
        display = f"{int(result.value)} кг"
    elif category.slug == "pullups":
        unit = "reps"
        display = f"{int(result.value)} раз"
    elif category.slug == "complex":
        unit = "sec"
        minutes = int(result.value) // 60
        seconds = int(result.value) % 60
        display = f"{minutes}:{seconds:02d} мин."
    else:
        unit = ""
        display = str(result.value)
    return {
        "id": result.id,
        "category_id": result.category_id,
        "category_name": category.name,
        "category_slug": category.slug,
        "value": result.value,
        "unit": unit,
        "display": display,
        "date": result.date,
        "status": result.status,
        "note": result.note,
        "created_at": result.created_at,
    }

# Добавление результата
@router.post("",response_model=ResultOut,status_code=status.HTTP_201_CREATED)
async def add_result(data:ResultCreate,current_user:User=Depends(get_current_user),db:AsyncSession=Depends(get_db)):
    cat_result=await db.execute(select(Category).where(Category.id==data.category_id))
    category=cat_result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    result=await create_result(
        db=db,
        user_id=current_user.id,
        category_id=data.category_id,
        value=data.value,
        date=data.date,
        note=data.note,
        publish=data.publish
    )
    return format_result(result,category)

# Получение всех своих результатов
@router.get("",response_model=list[ResultOut])
async def list_results(category_id:int|None=None,current_user:User=Depends(get_current_user),db:AsyncSession=Depends(get_db)):
    results=await get_user_results(db,current_user.id,category_id)
    if not results:
        return []
    category_ids=list(set(r.category_id for r in results))
    cat_result=await db.execute(

        select(Category).where(Category.id.in_(category_ids))
    )
    categories={c.id:c for c in cat_result.scalars().all()}
    return [format_result(r,categories[r.category_id]) for r in results]

# Обновление своего результата
@router.patch("/{result_id}",response_model=ResultOut)
async def edit_result(result_id:int,data:ResultUpdate,current_user:User=Depends(get_current_user),db:AsyncSession=Depends(get_db)):
    update_data={k:v for k,v in data.model_dump().items() if v is not None}
    result=await update_result(db,result_id,current_user.id,update_data)
    if not result:
        raise HTTPException(
            status_code=404, 
            detail="Результат не найден или нельзя редактировать"
        )
    cat_result=await db.execute(select(Category).where(Category.id==result.category_id))
    category=cat_result.scalar_one()
    return format_result(result,category)

# Удалить свой результат
@router.delete("/{result_id}",status_code=status.HTTP_204_NO_CONTENT)
async def remove_result(result_id:int,current_user:User=Depends(get_current_user),db:AsyncSession=Depends(get_db)):
    check=await delete_result(db,result_id,current_user.id)
    if not check:
         raise HTTPException(status_code=404, detail="Результат не найден")
    
# Отправить результат на модерацию
@router.post("/{result_id}/publish",response_model=ResultOut)
async def send_to_moderation(result_id:int,current_user:User=Depends(get_current_user),db:AsyncSession=Depends(get_db)):
    result=await publish_result(db,result_id,current_user.id)
    if not result:
        raise HTTPException(
            status_code=400,
            detail="Нельзя отправить на модерацию"
        )
    cat_result=await db.execute(select(Category).where(Category.id==result.category_id))
    category=cat_result.scalar_one()
    return format_result(result,category)