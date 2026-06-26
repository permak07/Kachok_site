from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, func
from app.core.database import Base

class LocalResult(Base):
    __tablename__="local_result"

    id=Column(Integer,primary_key=True,index=True)
    user_id=Column(Integer,ForeignKey("users.id"),nullable=False)
    category_id=Column(Integer,ForeignKey("category.id"),nullable=False)
    value=Column(Float, nullable=False)
    date=Column(DateTime,server_default=func.now())