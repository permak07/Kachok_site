from pydantic import BaseModel, ConfigDict
from typing import Optional, Any

class ActivityItem(BaseModel):
    type:str
    title:str
    date:str
    dateLbl:str
    meta:dict

    model_config=ConfigDict(from_attributes=True)