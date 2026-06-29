from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey,String
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class ResultStatus(str,enum.Enum):
    DRAFT="draft"
    PENDING="pending"
    APPROVED="approved"
    REJECTED="rejected"

class LocalResult(Base):
    __tablename__="local_result"

    id=Column(Integer,primary_key=True,index=True)
    user_id=Column(Integer,ForeignKey("users.id"),nullable=False)
    category_id=Column(Integer,ForeignKey("category.id"),nullable=False)
    value=Column(Float, nullable=False)
    date=Column(DateTime,server_default=func.now())
    status = Column(String(20), default=ResultStatus.DRAFT.value)
    note = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())