from pydantic import BaseModel, ConfigDict

class AchievementItem(BaseModel):
    id:str
    name:str
    desc:str
    icon:str
    unlocked:bool

    model_config=ConfigDict(from_attributes=True)