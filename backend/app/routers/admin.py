from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.dependencies.auth import get_current_admin
from app.models.local_result import LocalResult, ResultStatus
from app.models.global_result import GlobalResult
from app.models.user import User
from app.models.category import Category
from app.crud.stats import format_display

router=APIRouter(prefix="/admin",tags=["admin"],dependencies=[Depends(get_current_admin)])

# Статистика для админ-панели
@router.get("/overview")
async def admin_overview(
    db:AsyncSession=Depends(get_db)):
    users_count=await db.execute(func.count(User.id))
    pending_count=await db.execute(select(func.count(LocalResult.id)).where(LocalResult.status==ResultStatus.PENDING))
    categories_count=await db.execute(select(func.count(Category.id)))
    return {
        "users": users_count.scalar(),
        "pending": pending_count.scalar(),
        "categories": categories_count.scalar()
    }
# Получение результатов на модерацию
@router.get("/results")
async def admin_results(status:str="pending", db:AsyncSession=Depends(get_db)):
    try:
        status_enum=ResultStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный статус")
    query=(
        select(LocalResult,User,Category)
        .join(User,LocalResult.user_id==User.id)
        .join(Category,LocalResult.category_id==Category.id)
        .where(LocalResult.status==status_enum)
        .order_by(LocalResult.created_at.desc())
    )
    results=await db.execute(query)
    rows=results.all()

    items=[]
    for local_result,user,category in rows:
        display_name = user.username.replace("_", " ").title()
        
        items.append({
            "id": local_result.id,
            "username": user.username,
            "display_name": display_name,
            "category_name": category.name,
            "display": format_display(local_result.value, category.slug),
            "note": local_result.note,
            "status": local_result.status,
        })
    
    return items
    
# Одобрение результата
@router.post("/results/{result_id}/approve")
async def admin_approve(result_id:int,db:AsyncSession=Depends(get_db)):
    result=await db.execute(select(LocalResult).where(LocalResult.id==result_id))
    local_result=result.scalar_one_or_none()

    if not local_result or local_result.status != ResultStatus.PENDING:
        raise HTTPException(status_code=404, detail="Результат не найден или не на модерации")
    local_result.status=ResultStatus.APPROVED
    global_result=GlobalResult(
        user_id=local_result.user_id,
        category_id=local_result.category_id,
        value=local_result.value,
        date=local_result.date
    )
    db.add(global_result)
    await db.commit()
    return {"status": "approved", "id": result_id}

# Отклонение результата
@router.post("/results/{result_id}/reject")
async def admin_reject(result_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LocalResult).where(LocalResult.id == result_id))
    local_result = result.scalar_one_or_none()
    
    if not local_result or local_result.status != ResultStatus.PENDING:
        raise HTTPException(status_code=404, detail="Результат не найден или не на модерации")
    local_result.status = ResultStatus.REJECTED
    await db.commit()
    return {"status": "rejected", "id": result_id}