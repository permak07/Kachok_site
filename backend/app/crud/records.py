from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.local_result import LocalResult
from app.models.category import Category
from .stats import format_display

# Получение лучших результатов пользователя по каждой категории
async def get_user_records(db:AsyncSession,user_id:int):
    subq=(
        select(
            LocalResult.category_id,
            func.max(LocalResult.value).label("max_value")
        )
        .where(LocalResult.user_id==user_id)
        .group_by(LocalResult.category_id)
        .subquery()
    )

    query = (
        select(LocalResult, Category)
        .join(Category, LocalResult.category_id == Category.id)
        .join(subq,
            (LocalResult.category_id == subq.c.category_id) &
            (LocalResult.value == subq.c.max_value)
        )
        .where(LocalResult.user_id == user_id)
    )
    result=await db.execute(query)
    rows=result.all()

    seen_categories = set()
    records = []
    
    for local_result, category in rows:
        if category.id in seen_categories:
            continue
        seen_categories.add(category.id)
        records.append({
            "category_slug": category.slug,
            "category_name": category.name,
            "value": local_result.value,
            "display": format_display(local_result.value, category.slug),
            "date": local_result.date.strftime("%Y-%m-%d"),
        })
    records.sort(key=lambda x:x["value"],reverse=True)
    return records