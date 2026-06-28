from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.config import settings
from app.crud.user import get_user_by_id
from app.models.user import User

oauth2_scheme=OAuth2PasswordBearer(tokenUrl="/auth/login")

# Данные о пользователе
async def get_current_user(token:str=Depends(oauth2_scheme),db:AsyncSession=Depends(get_db))->User:
    exception=HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить учетные данные",
        headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload=jwt.decode(token,settings.SECRET_KEY,algorithms=[settings.ALGORITHM])
        user_id:str=payload.get("sub")
        if user_id is None:
            raise exception
    except JWTError:
        raise exception
    user=await get_user_by_id(db,int(user_id))
    if user is None:
        raise exception
    return user

# Требование прав администратора
async def require_admin(current_user:User=Depends(get_current_user))->User:
    if current_user.role!="admin":
        raise HTTPException(status_code=403,detail="Требуются права администратора")
    return current_user