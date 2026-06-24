from sqlalchemy import Column, String, Integer
from app.core.database import Base

class Category(Base):
    __tablename__="category"

    id=Column(Integer,primary_key=True, index=True)
    name=Column(String(50),unique=True,nullable=False,index=True)