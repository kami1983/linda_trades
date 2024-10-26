
from dataclasses import dataclass
from typing import Optional

@dataclass
class EResultSwapPrice:
    symbol: str
    last: float
    bid: Optional[float] = None
    ask: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    timestamp: int = None
    datetime: Optional[str] = None
    type: int = 1 # 1: vaild
    status: int = 1 # 1: vaild