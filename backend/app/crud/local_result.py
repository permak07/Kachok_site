from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.local_result import LocalResult, ResultStatus
from app.models.category import Category
from datetime import datetime

# Создание лок. результата
async def create_result(
    db: AsyncSession,
    user_id: int,
    category_id: int,
    value: float,
    date: datetime,
    note: str | None = None,
    publish: bool = False
    ) -> LocalResult:
    if date.tzinfo is not None:
        date = date.replace(tzinfo=None)
    # Определяем статус
    status=ResultStatus.PENDING if publish else ResultStatus.DRAFT

    result=LocalResult(
        user_id=user_id,
        category_id=category_id,
        value=value,
        date=date,
        status=status,
        note=note
    )
    db.add(result)
    await db.commit()
    await db.refresh(result)
    return result

# Получение лок. результатов пользователя по категории
async def get_user_results(db:AsyncSession,user_id:int,category_id:int|None=None)->list[LocalResult]:
    query=select(LocalResult).where(LocalResult.user_id==user_id)
    if category_id:
        query=query.where(LocalResult.category_id==category_id)
    query=query.order_by(LocalResult.date.desc())
    result=await db.execute(query)
    return result.scalars().all()

# Получение конкретного лок. результата пользователя
async def get_result_by_id(db:AsyncSession,result_id:int,user_id:int)->LocalResult|None:
    result=await db.execute(
        select(LocalResult).where(
            LocalResult.id==result_id,
            LocalResult.user_id==user_id
            )
    )
    return result.scalar_one_or_none()

# Обновление данных результата
async def update_result(db:AsyncSession,result_id:int,user_id:int,data:dict)->LocalResult|None:
    result= await get_result_by_id(db,result_id,user_id)
    if not result:
        return None
    if result.status==ResultStatus.APPROVED:
        return None
    
    for field,value in data.items():
        if hasattr(result,field) and value is not None:
            setattr(result,field,value)
    await db.commit()
    await db.refresh(result)
    return result

# Удаление результата
async def delete_result(db:AsyncSession,result_id:int,user_id:int)->bool:
    result = await get_result_by_id(db,result_id,user_id)
    if not result:
        return False
    await db.delete(result)
    await db.commit()
    return True

# Оправка результата администратору
async def publish_result(db:AsyncSession,result_id:int,user_id:int)->LocalResult|None:
    result=await get_result_by_id(db,result_id,user_id)
    if not result or result.status!=ResultStatus.DRAFT:
        return None
    result.status=ResultStatus.PENDING
    await db.commit()
    await db.refresh(result)
    return result