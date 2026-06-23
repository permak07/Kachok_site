from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Базовый класс, от которого буду наследовать все таблицы 
Base = declarative_base()

# Асинхронный движок. URL базы беру из конфига
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,  # Вывожу SQL-запросы в консоль для удобной отладки
)

# Фабрика для быстрого создания асинхронных сессий
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Защита от потери данных объекта после коммита
)

# Функция-зависимость: открывает сессию для эндпоинта и сама закрывает её после ответа
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
