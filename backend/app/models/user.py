from sqlalchemy import Column, Integer, String, func, DateTime,Boolean
from app.core.database import Base

class User(Base):
    __tablename__="users"

    id=Column(Integer,primary_key=True,index=True)
    username=Column(String(50),unique=True,nullable=False,index=True)
    email=Column(String(100),unique=True,nullable=False,index=True)
    hashed_password=Column(String(255),nullable=False)
    role=Column(String(20),default="user")
    created_at=Column(DateTime,server_default=func.now())
    email_verified = Column(Boolean, default=False)
    verification_code = Column(String(10), nullable=True)
    gym_name = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    weight_class = Column(Integer, nullable=True)