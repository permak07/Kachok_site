from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
from app.models.local_result import LocalResult
from app.models.global_result import GlobalResult
from app.models.user import User
from app.models.category import Category

# Проверка достижений пользователя
async def get_user_achievements(db:AsyncSession,user:User)->list[dict]:
    # Есть ли каакой-то результат
    result=await db.execute(select(func.count(LocalResult.id)).where(LocalResult.user_id==user.id))
    has_results=result.scalar()>0

    # Входит ли в топ 10
    top_10_unlocked = False
    if has_results:
        cat_result = await db.execute(select(Category))
        categories = cat_result.scalars().all()
        
        for cat in categories:
            query = (
                select(GlobalResult.user_id)
                .where(GlobalResult.category_id == cat.id)
                .order_by(GlobalResult.value.desc())
                .limit(10)
            )
            top_result = await db.execute(query)
            top_user_ids = [row.user_id for row in top_result.all()]
            
            if user.id in top_user_ids:
                top_10_unlocked = True
                break

    # 7 дней подряд с записями
    week_streak_unlocked = False
    if has_results:
        query = (
            select(func.distinct(func.date(LocalResult.date)))
            .where(LocalResult.user_id == user.id)
            .order_by(func.date(LocalResult.date).desc())
        )
        dates_result = await db.execute(query)
        dates = [row[0] for row in dates_result.all()]
        
        # Проверяем 7 подряд
        if len(dates) >= 7:
            streak = 1
            for i in range(1, len(dates)):
                if dates[i-1] - dates[i] == timedelta(days=1):
                    streak += 1
                    if streak >= 7:
                        week_streak_unlocked = True
                        break
                else:
                    streak = 1
    
    # Проверяем указан ли зал
    gym_member_unlocked = user.gym_name is not None and user.gym_name.strip() != ""
    
    achievements = [
        {
            "id": "first_login",
            "name": "Первый вход",
            "desc": "Вы вошли в систему впервые",
            "icon": "medal",
            "unlocked": True,
        },
        {
            "id": "first_result",
            "name": "Первая запись",
            "desc": "Запишите свой первый результат",
            "icon": "record",
            "unlocked": has_results,
        },
        {
            "id": "top_10",
            "name": "Топ-10",
            "desc": "Войдите в топ-10 по любой категории",
            "icon": "top",
            "unlocked": top_10_unlocked,
        },
        {
            "id": "week_streak",
            "name": "Недельная серия",
            "desc": "Тренируйтесь 7 дней подряд",
            "icon": "streak",
            "unlocked": week_streak_unlocked,
        },
        {
            "id": "gym_member",
            "name": "Член зала",
            "desc": "Укажите свой зал в профиле",
            "icon": "gym",
            "unlocked": gym_member_unlocked,
        },
    ]
    
    return achievements