from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class ResultCreate(BaseModel):
    category_id: int
    value: float
    date: datetime
    note: Optional[str] = None
    publish: bool = False

class ResultUpdate(BaseModel):
    value: Optional[float] = None
    date: Optional[datetime] = None
    note: Optional[str] = None

class ResultOut(BaseModel):
    id: int
    category_id: int
    category_name: str
    category_slug: str
    value: float
    unit: str
    display: str
    date: datetime
    status: str
    note: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)