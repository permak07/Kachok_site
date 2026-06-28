from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime

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