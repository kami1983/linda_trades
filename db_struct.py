
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
    infer_price: float
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

# acc_fill_sz	0.0	2.0	累计成交数量从 0.0 变为 2.0。
# fill_notional_usd	0.0	1957.66	成交名义价值从 0.0 变为 1957.66。
# avg_px	0.0	0.0245	平均成交价格从 0.0 变为 0.0245。
# state	'live'	'filled'	订单状态从 live 变为 filled。
# pnl	0.0	-2e-05	盈亏从 0.0 变为 -2e-05。
# fee	0.0	-6e-06	手续费从 0.0 变为 -6e-06。
# fill_px	0.0	0.0245	成交价格从 0.0 变为 0.0245。
# trade_id	''	'3'	成交 ID 从空值变为 '3'。
# fill_sz	0.0	2.0	成交数量从 0.0 变为 2.0。
# fill_time	0	1735965493919	成交时间从 0 变为 1735965493919。
# fill_pnl	0.0	-2e-05	成交盈亏从 0.0 变为 -2e-05。
# fill_fee	0.0	-6e-06	成交手续费从 0.0 变为 -6e-06。
# fill_fee_ccy	''	'BTC'	成交手续费币种从空值变为 'BTC'。
# exec_type	''	'T'	执行类型从空值变为 'T'。
# fill_px_vol	0.0	0.454110654296875	成交价格波动从 0.0 变为 0.454110654296875。
# fill_px_usd	0.0	2398.1335	成交价格（USD）从 0.0 变为 2398.1335。
# fill_mark_vol	0.0	0.4406829467773438	成交标记波动从 0.0 变为 0.4406829467773438。
# fill_fwd_px	0.0	98768.25	成交远期价格从 0.0 变为 98768.25。
# fill_mark_px	0.0	0.024165055314007245	成交标记价格从 0.0 变为 0.024165055314007245。
# u_time	1735965493918	1735965493919	更新时间从 1735965493918 变为 1735965493919。
# last_px	0.0235	0.0245	最新价格从 0.0235 变为 0.0245。
@dataclass
class EResultOKXOrder:
    api_key: str
    inst_type: str
    inst_id: str
    tgt_ccy: str
    ccy: str
    ord_id: str
    cl_ord_id: str
    algo_cl_ord_id: str
    algo_id: str
    tag: str
    px: float
    sz: float
    notional_usd: float
    ord_type: str
    side: str
    pos_side: str
    td_mode: str
    acc_fill_sz: float
    fill_notional_usd: float
    avg_px: float
    state: str
    lever: float
    pnl: float
    fee_ccy: str
    fee: float
    rebate_ccy: str
    rebate: float
    category: str
    u_time: int
    c_time: int
    source: str
    reduce_only: str
    cancel_source: str
    quick_mgn_type: str
    stp_id: str
    stp_mode: str
    attach_algo_cl_ord_id: str
    last_px: float
    is_tp_limit: str
    sl_trigger_px: float
    sl_trigger_px_type: str
    tp_ord_px: float
    tp_trigger_px: float
    tp_trigger_px_type: str
    sl_ord_px: float
    fill_px: float
    trade_id: str
    fill_sz: float
    fill_time: int
    fill_pnl: float
    fill_fee: float
    fill_fee_ccy: str
    exec_type: str
    fill_px_vol: float
    fill_px_usd: float
    fill_mark_vol: float
    fill_fwd_px: float
    fill_mark_px: float
    amend_source: str
    req_id: str
    amend_result: str
    code: str
    msg: str
    px_type: str
    px_usd: float
    px_vol: float
    linked_algo_ord_algo_id: str
    attach_algo_ords: str


def CreateOrderResult(record_key, order):
    def safe_float(value, default=0.0):
        """安全地将字符串转换为浮点数，如果为空字符串则返回默认值"""
        return float(value) if value != "" else default

    def safe_int(value, default=0):
        """安全地将字符串转换为整数，如果为空字符串则返回默认值"""
        return int(value) if value != "" else default

    return EResultOKXOrder(
        api_key=record_key,
        inst_type=order.get("instType", ""),
        inst_id=order.get("instId", ""),
        tgt_ccy=order.get("tgtCcy", ""),
        ccy=order.get("ccy", ""),
        ord_id=order.get("ordId", ""),
        cl_ord_id=order.get("clOrdId", ""),
        algo_cl_ord_id=order.get("algoClOrdId", ""),
        algo_id=order.get("algoId", ""),
        tag=order.get("tag", ""),
        px=safe_float(order.get("px", "0")),
        sz=safe_float(order.get("sz", "0")),
        notional_usd=safe_float(order.get("notionalUsd", "0")),
        ord_type=order.get("ordType", ""),
        side=order.get("side", ""),
        pos_side=order.get("posSide", ""),
        td_mode=order.get("tdMode", ""),
        acc_fill_sz=safe_float(order.get("accFillSz", "0")),
        fill_notional_usd=safe_float(order.get("fillNotionalUsd", "0")),
        avg_px=safe_float(order.get("avgPx", "0")),
        state=order.get("state", ""),
        lever=safe_float(order.get("lever", "0")),
        pnl=safe_float(order.get("pnl", "0")),
        fee_ccy=order.get("feeCcy", ""),
        fee=safe_float(order.get("fee", "0")),
        rebate_ccy=order.get("rebateCcy", ""),
        rebate=safe_float(order.get("rebate", "0")),
        category=order.get("category", ""),
        u_time=safe_int(order.get("uTime", "0")),
        c_time=safe_int(order.get("cTime", "0")),
        source=order.get("source", ""),
        reduce_only=order.get("reduceOnly", ""),
        cancel_source=order.get("cancelSource", ""),
        quick_mgn_type=order.get("quickMgnType", ""),
        stp_id=order.get("stpId", ""),
        stp_mode=order.get("stpMode", ""),
        attach_algo_cl_ord_id=order.get("attachAlgoClOrdId", ""),
        last_px=safe_float(order.get("lastPx", "0")),
        is_tp_limit=order.get("isTpLimit", ""),
        sl_trigger_px=safe_float(order.get("slTriggerPx", "0")),
        sl_trigger_px_type=order.get("slTriggerPxType", ""),
        tp_ord_px=safe_float(order.get("tpOrdPx", "0")),
        tp_trigger_px=safe_float(order.get("tpTriggerPx", "0")),
        tp_trigger_px_type=order.get("tpTriggerPxType", ""),
        sl_ord_px=safe_float(order.get("slOrdPx", "0")),
        fill_px=safe_float(order.get("fillPx", "0")),
        trade_id=order.get("tradeId", ""),
        fill_sz=safe_float(order.get("fillSz", "0")),
        fill_time=safe_int(order.get("fillTime", "0")),
        fill_pnl=safe_float(order.get("fillPnl", "0")),
        fill_fee=safe_float(order.get("fillFee", "0")),
        fill_fee_ccy=order.get("fillFeeCcy", ""),
        exec_type=order.get("execType", ""),
        fill_px_vol=safe_float(order.get("fillPxVol", "0")),
        fill_px_usd=safe_float(order.get("fillPxUsd", "0")),
        fill_mark_vol=safe_float(order.get("fillMarkVol", "0")),
        fill_fwd_px=safe_float(order.get("fillFwdPx", "0")),
        fill_mark_px=safe_float(order.get("fillMarkPx", "0")),
        amend_source=order.get("amendSource", ""),
        req_id=order.get("reqId", ""),
        amend_result=order.get("amendResult", ""),
        code=order.get("code", ""),
        msg=order.get("msg", ""),
        px_type=order.get("pxType", ""),
        px_usd=safe_float(order.get("pxUsd", "0")),
        px_vol=safe_float(order.get("pxVol", "0")),
        linked_algo_ord_algo_id=order.get("linkedAlgoOrd", {}).get("algoId", ""),
        attach_algo_ords=str(order.get("attachAlgoOrds", []))
    )
