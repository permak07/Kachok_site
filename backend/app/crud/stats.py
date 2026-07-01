from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
from typing import Optional
from app.models.local_result import LocalResult
from app.models.category import Category

# Форматирование значения в строчку
def format_display(value: float, slug: str) -> str:
    if slug in ["bench", "tonnage", "one_rep"]:
        return f"{int(value)} кг"
    elif slug == "pullups":
        return f"{int(value)} раз"
    elif slug == "complex":
        minutes = int(value) // 60
        seconds = int(value) % 60
        return f"{minutes}:{seconds:02d} мин."
    else:
        return str(value)

# Статистика пользователя для профиля
async def get_user_stats(db: AsyncSession, user_id: int, category_id: Optional[int] = None):
    # Все категории
    cat_result = await db.execute(select(Category).order_by(Category.id))
    categories = cat_result.scalars().all()
    
    # Для каждой категории ищем лучший результат
    cards = {}
    cardIds = []
    
    for cat in categories:
        cardIds.append(cat.slug)
        query = (
            select(func.max(LocalResult.value))
            .where(
                LocalResult.user_id == user_id,
                LocalResult.category_id == cat.id
            )
        )
        result = await db.execute(query)
        best_value = result.scalar()
        if best_value:
            # Форматируем
            if cat.slug in ["bench", "squat", "deadlift", "tonnage", "one_rep"]:
                display = f"{int(best_value)} кг"
            elif cat.slug == "pullups":
                display = f"{int(best_value)} раз"
            elif cat.slug == "complex":
                minutes = int(best_value) // 60
                seconds = int(best_value) % 60
                display = f"{minutes}:{seconds:02d} мин."
            else:
                display = str(best_value)
            
            cards[cat.slug] = {
                "lbl": cat.name,
                "val": display,
                "delta": "0",  # TODO: вычислить изменение за месяц
                "deltaDown": False,
                "acc": True,
            }
    
    # 3. Делаем график и историю
    bars = []
    hist = []
    cmp = []
    chartTitle = "Динамика — выберите категорию"
    
    if category_id:
        cat_result = await db.execute(select(Category).where(Category.id == category_id))
        category = cat_result.scalar_one_or_none()
        if category:
            chartTitle = f"Динамика {category.name} — 6 месяцев"
            six_months_ago = datetime.now() - timedelta(days=180)
            
            query = (
                select(LocalResult)
                .where(
                    LocalResult.user_id == user_id,
                    LocalResult.category_id == category_id,
                    LocalResult.date >= six_months_ago
                )
                .order_by(LocalResult.date.asc())
                .limit(6)
            )
            result = await db.execute(query)
            results = result.scalars().all()
            
            # Для графика нормализуем 0-100
            if results:
                values = [r.value for r in results]
                max_val = max(values) if max(values) > 0 else 1
                bars = [int((v / max_val) * 100) for v in values]
            
            # История последние 5
            for r in reversed(results[-5:]):
                if category.slug in ["bench", "tonnage", "one_rep"]:
                    val_display = f"{int(r.value)} кг"
                elif category.slug == "pullups":
                    val_display = f"{int(r.value)} раз"
                elif category.slug == "complex":
                    minutes = int(r.value) // 60
                    seconds = int(r.value) % 60
                    val_display = f"{minutes}:{seconds:02d} мин."
                else:
                    val_display = str(r.value)
                
                date_obj = r.date
                months_ru= ["", "янв", "фев", "мар", "апр", "май", "июн", 
                            "июл", "авг", "сен", "окт", "ноя", "дек"]
                date_lbl = f"{date_obj.day} {months_ru[date_obj.month]}"
                
                hist.append({
                    "name": category.name,
                    "date": date_obj.strftime("%Y-%m-%d"),
                    "dateLbl": date_lbl,
                    "val": val_display,
                })
            
            # Средний результат
            # TODO: сделать вычисление среднего результата
            cmp = [
                [f"Твой {category.name.lower()}", val_display],
                ["Средний по залу", "—"],
                [f"Топ-10 Иркутска", "—"],
                ["Твой ранг", "—"],
            ]
    
    return {
        "cards": cards,
        "cardIds": cardIds,
        "chartTitle": chartTitle,
        "bars": bars,
        "cmp": cmp,
        "hist": hist,
    }