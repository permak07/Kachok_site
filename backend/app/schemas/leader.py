from pydantic import BaseModel, ConfigDict
from typing import Optional

class LeaderItem(BaseModel):
    rank:int
    user_id:int
    username:str
    display_name:str
    gym_name:Optional[str] = None
    weight_class:Optional[int] = None
    value:float
    unit:str
    display:str
    model_config = ConfigDict(from_attributes=True)

class LeaderCategory(BaseModel):
    id:int
    name:str
    slug:str
    unit:str
    model_config = ConfigDict(from_attributes=True)

class LeadersResponse(BaseModel):
    category:LeaderCategory
    podium:list[LeaderItem]
    table:list[LeaderItem]
    current_user:Optional[LeaderItem]=None
    model_config = ConfigDict(from_attributes=True)