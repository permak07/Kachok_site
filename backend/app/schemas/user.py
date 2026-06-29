from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password:str

class UserLogin(BaseModel):
    email:EmailStr
    password:str

class UserOut(BaseModel):
    id:int
    username: str
    email:str
    role:str
    email_verified: bool
    created_at: datetime
    model_config=ConfigDict(from_attributes=True)

class UserProfileOut(BaseModel):
    id: int
    username: str
    email: str
    role: str
    email_verified: bool
    created_at: datetime
    gym_name: Optional[str] = None
    city: Optional[str] = None
    weight_class: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class ProfileUpdate(BaseModel):
    gym_name: Optional[str] = None
    city: Optional[str] = None
    weight_class: Optional[int] = None