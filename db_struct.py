
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
    bid_usd: float
    ask_price: float
    ask_usd: float
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


    # "collateral": 0.0067589397784254,
    # "contractSize": 1,
    # "contracts": 1,
    # "datetime": "2024-11-16T08:09:36.221Z",
    # "entryPrice": 0.039,
    # "hedged": false,
    # "id": "1987837573570101248",
    # "initialMargin": null,
    # "initialMarginPercentage": null,
    # "lastPrice": null,
    # "lastUpdateTimestamp": 1732107310933,
    # "leverage": null,
    # "liquidationPrice": null,
    # "maintenanceMargin": 0.0008170502193306,
    # "maintenanceMarginPercentage": 0,
    # "marginMode": "isolated",
    # "marginRatio": 0.1208,
    # "markPrice": 0.0517050219330564,
    # "notional": 19.340481110224097,
    # "percentage": -32.57697931552918,
    # "realizedPnl": -0.000003,
    # "side": "short",
    # "stopLossPrice": null,
    # "symbol": "BTC/USD:BTC-241129-92000-C",
    # "takeProfitPrice": null,
    # "timestamp": 1731744576221,
    # "unrealizedPnl": -0.0001270502193306

@dataclass
class EResultOptionPosition:
    symbol: str
    timestamp: int
    datetime: str
    side: str
    collateral: float
    contractSize: int
    contracts: int
    entryPrice: float
    hedged: bool
    id: str
    maintenanceMargin: float
    maintenanceMarginPercentage: float
    marginMode: str
    marginRatio: float
    markPrice: float
    notional: float
    percentage: float
    realizedPnl: float
    unrealizedPnl: float
    lastUpdateTimestamp: int
    initialMargin: Optional[float] = None
    initialMarginPercentage: Optional[float] = None
    lastPrice: Optional[float] = None
    leverage: Optional[float] = None
    liquidationPrice: Optional[float] = None
    stopLossPrice: Optional[float] = None
    takeProfitPrice: Optional[float] = None
    


    
        # "amount": 1,
        # "average": null,
        # "clientOrderId": null,
        # "cost": 0,
        # "datetime": "2024-11-20T12:55:56.142Z",
        # "fee": {
        #     "cost": 0,
        #     "currency": "BTC"
        # },
        # "fees": [
        #     {
        #         "cost": 0,
        #         "currency": "BTC"
        #     }
        # ],
        # "filled": 0,
        # "id": "2000010447760261120",
        # "lastTradeTimestamp": null,
        # "lastUpdateTimestamp": 1732107356142,
        # "postOnly": null,
        # "price": 0.1,
        # "reduceOnly": false,
        # "remaining": 1,
        # "side": "sell",
        # "status": "open",
        # "stopLossPrice": null,
        # "stopPrice": null,
        # "symbol": "BTC/USD:BTC-241129-100000-C",
        # "takeProfitPrice": null,
        # "timeInForce": null,
        # "timestamp": 1732107356142,
        # "trades": [],
        # "triggerPrice": null,
        # "type": "limit"

@dataclass
class EResultOpenOrder:
    symbol: str
    timestamp: int
    datetime: str
    amount: int
    cost: float
    fee: dict
    fees: list
    filled: int
    id: str
    lastUpdateTimestamp: int
    price: float
    reduceOnly: bool
    remaining: int
    side: str
    status: str
    trades: list
    type: str
    stopLossPrice: Optional[float] = None
    stopPrice: Optional[float] = None
    takeProfitPrice: Optional[float] = None
    timeInForce: Optional[str] = None
    postOnly: Optional[bool] = None
    triggerPrice: Optional[float] = None
    lastTradeTimestamp: Optional[int] = None
    average: Optional[float] = None
    clientOrderId: Optional[str] = None