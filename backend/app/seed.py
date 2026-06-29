from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.category import Category

CATEGORIES=[
    {"name": "Жим", "slug": "bench"},
    {"name": "Подтягивания", "slug": "pullups"},
    {"name": "Комплекс", "slug": "complex"},
    {"name": "На раз", "slug": "one_rep"},
    {"name": "Тоннаж", "slug": "tonnage"}
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
    
# Для ручного запуска
async def run_seed():
    async with AsyncSessionLocal() as db:
        await seed_categories(db)

if __name__=="__main__":
    import asyncio
    asyncio.run(run_seed())