from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import AsyncSessionLocal
from app.seed import seed_categories
from app.routers import auth

# Создание категорий
@asynccontextmanager
async def lifespan(app:FastAPI):
    print("[STARTUP] Запуск seed...")
    async with AsyncSessionLocal() as db:
        await seed_categories(db)
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

# Эндпоинт для проверки работы
@app.get("/ping")
async def ping():
    return {"status": "ok","message":"Server is running"}