from pydantic import BaseModel

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str = "admin"