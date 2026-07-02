from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from app.models.local_result import LocalResult, ResultStatus
from app.models.global_result import GlobalResult
from app.models.user import User
from app.models.category import Category
from app.crud.stats import format_display

# Форматирует дату в '29 июн'
def format_date_lbl(date_obj: datetime) -> str:
    months_ru = ["", "янв", "фев", "мар", "апр", "май", "июн",
                "июл", "авг", "сен", "окт", "ноя", "дек"]
    return f"{date_obj.day} {months_ru[date_obj.month]}"

async def get_user_activity(db: AsyncSession, user_id: int, limit: int = 20) -> list[dict]:
    activities=[]
    # Локальные результаты
    query = (
        select(LocalResult, Category)
        .join(Category, LocalResult.category_id == Category.id)
        .where(LocalResult.user_id == user_id)
        .order_by(LocalResult.created_at.desc())
        .limit(limit)
    )
    result=await db.execute(query)
    rows=result.all()
    for local_result,category in rows:
        activities.append({
            "type": "result_added",
            "title": f"Новая запись: {category.name} {format_display(local_result.value, category.slug)}",
            "date": local_result.created_at.isoformat(),
            "dateLbl": format_date_lbl(local_result.created_at),
            "meta": {
                "category_slug": category.slug,
                "category_name": category.name,
                "value": local_result.value,
                "display": format_display(local_result.value, category.slug),
                "status": local_result.status,
            }
        })
        # Проверка на статус не DFART
        if local_result.status in [ResultStatus.PENDING, ResultStatus.APPROVED, ResultStatus.REJECTED]:
            activities.append({
                "type": "result_published",
                "title": f"Отправлено на модерацию: {category.name} {format_display(local_result.value, category.slug)}",
                "date": local_result.created_at.isoformat(),  # Используем created_at как приближение
                "dateLbl": format_date_lbl(local_result.created_at),
                "meta": {
                    "category_slug": category.slug,
                    "category_name": category.name,
                    "value": local_result.value,
                    "display": format_display(local_result.value, category.slug),
                    "status": local_result.status,
                }
            })
    # Проверка одобрен ли результат
    query = (
        select(GlobalResult, Category)
        .join(Category, GlobalResult.category_id == Category.id)
        .where(GlobalResult.user_id == user_id)
        .order_by(GlobalResult.approved_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    rows = result.all()
    for global_result, category in rows:
        activities.append({
            "type": "result_approved",
            "title": f"Результат одобрен: {category.name} {format_display(global_result.value, category.slug)}",
            "date": global_result.approved_at.isoformat(),
            "dateLbl": format_date_lbl(global_result.approved_at),
            "meta": {
                "category_slug": category.slug,
                "category_name": category.name,
                "value": global_result.value,
                "display": format_display(global_result.value, category.slug),
            }
        })
    # Проверка на обновление профиля
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    
    if user and (user.gym_name or user.city or user.weight_class):
        activities.append({
            "type": "profile_updated",
            "title": "Обновлён профиль",
            "date": user.created_at.isoformat(),  # Нет updated_at — используем created_at
            "dateLbl": format_date_lbl(user.created_at),
            "meta": {
                "fields": [
                    f for f in ["gym_name", "city", "weight_class"]
                    if getattr(user, f)
                ]
            }
        })
    
    activities.sort(key=lambda x: x["date"], reverse=True)
    return activities[:limit]