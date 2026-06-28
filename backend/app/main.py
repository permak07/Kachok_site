from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth

app=FastAPI(
    title="Kachok_API",
    version="0.1.0",
    description="Backend for the Kachok site"
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