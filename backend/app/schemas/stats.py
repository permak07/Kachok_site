from pydantic import BaseModel, ConfigDict
from typing import Optional

class StatCard(BaseModel):
    lbl: str
    val: str 
    delta: str = "0"
    deltaDown: bool = False
    acc: bool = True

class StatsResponse(BaseModel):
    cards: dict[str, StatCard]
    cardIds: list[str]
    chartTitle: str
    bars: list[int]
    cmp: list[list[str]]
    hist: list[dict]

    model_config = ConfigDict(from_attributes=True)