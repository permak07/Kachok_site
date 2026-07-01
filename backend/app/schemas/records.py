from pydantic import BaseModel,ConfigDict

class RecordItem(BaseModel):
    category_slug:str
    category_name:str
    value:float
    display:str
    date:str
    
    model_config=ConfigDict(from_attributes=True)