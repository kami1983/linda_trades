
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

@dataclass
class EResultOptionChain:
    symbol: str
    timestamp: int # 这是这个期权链最后更新的时间戳
    year: int
    month: int
    day: int
    expiration_date: int # 到期时间
    strike: float # 行权价格
    option_type: str # 行权方向，P 或者 C
    bid_price:  Optional[float] = None
    bid_size: Optional[int] = None
    ask_price: Optional[float] = None
    ask_size: Optional[int] = None
    last_price: Optional[float] = None
    last_size: Optional[int] = None
    type: int = 1 # 1: vaild
    status: int = 1 # 1: vaild
    

@dataclass
class EResultIvData:
    symbol: str
    current_price: float
    bid_price: float
    ask_price: float
    ask_bid_diff: float
    bid_premium: float
    ask_premium: float
    execute_time: str
    execute_flag: str
    excute_strike: float
    day_left: float
    current_time: int
    execute_date: str
    s_iv: float
    b_iv: float
    delta: float
    gamma: float
    theta: float
    intrinsic_value: float
    time_value: float