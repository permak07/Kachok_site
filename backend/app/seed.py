from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.category import Category
from app.models.global_result import GlobalResult
from app.utils.security import hash_password
from datetime import datetime

CATEGORIES=[
    {"name": "Жим", "slug": "bench"},
    {"name": "Подтягивания", "slug": "pullups"},
    {"name": "Комплекс", "slug": "complex"},
    {"name": "На раз", "slug": "one_rep"},
    {"name": "Тоннаж", "slug": "tonnage"}
]
FAKE_USERS = [
    {"username": "ivan_p", "email": "ivan@test.com", "gym_name": "PLATOXA GYM", "weight_class": 93},
    {"username": "max_s", "email": "max@test.com", "gym_name": "АТЛАНТ", "weight_class": 83},
    {"username": "dima_k", "email": "dima@test.com", "gym_name": "PLATOXA GYM", "weight_class": 105},
    {"username": "sasha_m", "email": "sasha@test.com", "gym_name": "Iron Gym", "weight_class": 74},
]

FAKE_RESULTS = [
    # Жим 
    {"user_id": 4, "category_id": 1, "value": 160, "date": "2026-06-10"},
    {"user_id": 2, "category_id": 1, "value": 150, "date": "2026-06-15"},
    {"user_id": 1, "category_id": 1, "value": 120, "date": "2026-06-20"},
    {"user_id": 3, "category_id": 1, "value": 110, "date": "2026-06-12"},
    {"user_id": 5, "category_id": 1, "value": 95, "date": "2026-06-18"},
    
    # Подтягивания
    {"user_id": 2, "category_id": 2, "value": 30, "date": "2026-06-12"}, 
    {"user_id": 4, "category_id": 2, "value": 25, "date": "2026-06-08"},
    {"user_id": 1, "category_id": 2, "value": 20, "date": "2026-06-18"},
    {"user_id": 3, "category_id": 2, "value": 18, "date": "2026-06-14"},
    
    # Комплекс
    {"user_id": 2, "category_id": 3, "value": 140, "date": "2026-06-15"},
    {"user_id": 1, "category_id": 3, "value": 165, "date": "2026-06-19"},
    {"user_id": 4, "category_id": 3, "value": 180, "date": "2026-06-11"},
]

# Проверка на начилие категорий и создание
async def seed_categories(db: AsyncSession):
    for cat_data in CATEGORIES:
        result = await db.execute(
            select(Category).where(Category.name == cat_data["name"])
        )
        existing = result.scalar_one_or_none()
        if existing:
            # Обновляем slug, если его нет
            if not existing.slug:
                existing.slug = cat_data["slug"]
                print(f"[SEED] Обновлён slug для: {cat_data['name']} → {cat_data['slug']}")
            else:
                print(f"[SEED] Категория уже есть: {cat_data['name']}")
        else:
            # Создаём новую
            category = Category(**cat_data)
            db.add(category)
            print(f"[SEED] Создана категория: {cat_data['name']}")
    
    await db.commit()

# Тестовые результаты для лидерборда с созданием фейковых пользователей
async def seed_global_results(db: AsyncSession):
    result = await db.execute(select(GlobalResult))
    if result.scalars().first():
        print("[SEED] global_result уже есть")
        return
    
    # Получаем id
    from app.models.user import User
    users_result = await db.execute(select(User.username, User.id))
    user_ids = {row.username: row.id for row in users_result.all()}
    
    # Получаем category_id
    cat_result = await db.execute(select(Category.slug, Category.id))
    cat_ids = {row.slug: row.id for row in cat_result.all()}
    
    FAKE_RESULTS_DYNAMIC = [
        {"username": "dima_k", "category": "bench", "value": 160, "date": "2026-06-10"},
        {"username": "ivan_p", "category": "bench", "value": 150, "date": "2026-06-15"},
        {"username": "Nikita", "category": "bench", "value": 120, "date": "2026-06-20"},
        {"username": "max_s", "category": "bench", "value": 110, "date": "2026-06-12"},
        {"username": "sasha_m", "category": "bench", "value": 95, "date": "2026-06-18"},
        {"username": "ivan_p", "category": "pullups", "value": 30, "date": "2026-06-12"},
        {"username": "dima_k", "category": "pullups", "value": 25, "date": "2026-06-08"},
        {"username": "Nikita", "category": "pullups", "value": 20, "date": "2026-06-18"},
        {"username": "max_s", "category": "pullups", "value": 18, "date": "2026-06-14"},
        {"username": "ivan_p", "category": "complex", "value": 140, "date": "2026-06-15"},
        {"username": "Nikita", "category": "complex", "value": 165, "date": "2026-06-19"},
        {"username": "dima_k", "category": "complex", "value": 180, "date": "2026-06-11"},
    ]
    
    for r in FAKE_RESULTS_DYNAMIC:
        user_id = user_ids.get(r["username"])
        category_id = cat_ids.get(r["category"])
        
        if not user_id or not category_id:
            print(f"[SEED] SKIP: {r['username']} или {r['category']} не найдены")
            continue
        
        gr = GlobalResult(
            user_id=user_id,
            category_id=category_id,
            value=r["value"],
            date=datetime.strptime(r["date"], "%Y-%m-%d")
        )
        db.add(gr)
    
    await db.commit()
    print("[SEED] global_result созданы")

# Для ручного запуска
async def run_seed():
    async with AsyncSessionLocal() as db:
        await seed_categories(db)
        await seed_global_results(db)

if __name__=="__main__":
    import asyncio
    asyncio.run(run_seed())