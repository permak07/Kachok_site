from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.utils.security import hash_password,generate_vetification_code
from app.utils.email import send_verification_email

# Поиск по email
async def get_user_by_email(db:AsyncSession,email:str)->User|None:
    result=await db.execute(select(User).where(User.email==email))
    return result.scalar_one_or_none()

# Поиск по никнейму
async def get_user_by_username(db:AsyncSession, username:str)->User|None:
    result= await db.execute(select(User).where(User.username==username))
    return result.scalar_one_or_none()

# Поиск по id
async def get_user_by_id(db:AsyncSession,user_id:int)->User|None:
    result=await db.execute(select(User).where(User.id==user_id))
    return result.scalar_one_or_none()

# Создание пользователя
async def create_user(db: AsyncSession,username:str,email:str,password:str)->User:
    user=User(
        username=username,
        email=email,
        hashed_password=hash_password(password),
        verification_code=generate_vetification_code(),
        role="user",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    await send_verification_email(user.email,user.verification_code)
    return user

# Проверка email и кода
async def verify_user_email(db:AsyncSession,email:str,code:str)->User|None:
    result=await db.execute(select(User).where(User.email==email,User.verification_code==code))
    user=result.scalar_one_or_none()
    if user:
        user.email_verified=True
        user.verification_code=None
        await db.commit()
    return user