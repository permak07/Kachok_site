from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import AsyncSessionLocal
from app.seed import seed_categories,seed_global_results,seed_fake_users
from app.routers import (auth, public, profile,
                         leaders, results,
                         stats, records, admin,
                         achievements)

# Создание категорий
@asynccontextmanager
async def lifespan(app:FastAPI):
    print("[STARTUP] Запуск seed...")
    async with AsyncSessionLocal() as db:
        await seed_categories(db)
        await seed_fake_users(db)
        await seed_global_results(db)
    print("[STARTUP] Seed завершён.")
    yield

# Приложение
app=FastAPI(
    title="Kachok_API",
    version="0.1.0",
    description="Backend for the Kachok site",
    lifespan=lifespan
)

# Даёт разрешение на действия
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Подключение роутера аутентификации
app.include_router(auth.router)
# Подключение роутера категорий
app.include_router(public.router)
# Подключение роутера профиля
app.include_router(profile.router)
# Подключение роутера лидерборда
app.include_router(leaders.router)
# Подключение роутера локальных результатов
app.include_router(results.router)
# Подключение роутера статистики пользователя
app.include_router(stats.router)
# Подключение роутера рекордов пользователя
app.include_router(records.router)
# Подключение роутера админа
app.include_router(admin.router)
# Подключение роутера достижений
app.include_router(achievements.router)

# Эндпоинт для проверки работы
@app.get("/ping")
async def ping():
    return {"status": "ok","message":"Server is running"}