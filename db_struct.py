
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


'''
okx_orders

`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键 ID',
    `inst_type` VARCHAR(50) NOT NULL COMMENT '产品类型',
    `inst_id` VARCHAR(100) NOT NULL COMMENT '产品 ID',
    `tgt_ccy` VARCHAR(50) DEFAULT '' COMMENT '目标币种',
    `ccy` VARCHAR(50) DEFAULT '' COMMENT '币种',
    `ord_id` VARCHAR(100) NOT NULL COMMENT '订单 ID',
    `cl_ord_id` VARCHAR(100) NOT NULL COMMENT '客户端订单 ID',
    `algo_cl_ord_id` VARCHAR(100) DEFAULT '' COMMENT '算法订单客户端 ID',
    `algo_id` VARCHAR(100) DEFAULT '' COMMENT '算法订单 ID',
    `tag` VARCHAR(100) NOT NULL COMMENT '标签',
    `px` DECIMAL(20, 8) NOT NULL COMMENT '价格',
    `sz` DECIMAL(20, 8) NOT NULL COMMENT '数量',
    `notional_usd` DECIMAL(20, 8) NOT NULL COMMENT '名义价值（USD）',
    `ord_type` VARCHAR(50) NOT NULL COMMENT '订单类型',
    `side` VARCHAR(50) NOT NULL COMMENT '方向',
    `pos_side` VARCHAR(50) NOT NULL COMMENT '持仓方向',
    `td_mode` VARCHAR(50) NOT NULL COMMENT '交易模式',
    `acc_fill_sz` DECIMAL(20, 8) NOT NULL COMMENT '累计成交数量',
    `fill_notional_usd` DECIMAL(20, 8) DEFAULT NULL COMMENT '成交名义价值（USD）',
    `avg_px` DECIMAL(20, 8) NOT NULL COMMENT '平均成交价格',
    `state` VARCHAR(50) NOT NULL COMMENT '订单状态',
    `lever` DECIMAL(20, 8) NOT NULL COMMENT '杠杆',
    `pnl` DECIMAL(20, 8) NOT NULL COMMENT '盈亏',
    `fee_ccy` VARCHAR(50) NOT NULL COMMENT '手续费币种',
    `fee` DECIMAL(20, 8) NOT NULL COMMENT '手续费',
    `rebate_ccy` VARCHAR(50) NOT NULL COMMENT '返佣币种',
    `rebate` DECIMAL(20, 8) NOT NULL COMMENT '返佣金额',
    `category` VARCHAR(50) NOT NULL COMMENT '分类',
    `u_time` BIGINT NOT NULL COMMENT '更新时间',
    `c_time` BIGINT NOT NULL COMMENT '创建时间',
    `source` VARCHAR(100) DEFAULT '' COMMENT '来源',
    `reduce_only` VARCHAR(10) NOT NULL COMMENT '仅减仓',
    `cancel_source` VARCHAR(100) DEFAULT '' COMMENT '取消来源',
    `quick_mgn_type` VARCHAR(100) DEFAULT '' COMMENT '快速保证金类型',
    `stp_id` VARCHAR(100) DEFAULT '' COMMENT 'STP ID',
    `stp_mode` VARCHAR(50) NOT NULL COMMENT 'STP 模式',
    `attach_algo_cl_ord_id` VARCHAR(100) DEFAULT '' COMMENT '附加算法订单客户端 ID',
    `last_px` DECIMAL(20, 8) NOT NULL COMMENT '最新价格',
    `is_tp_limit` VARCHAR(10) NOT NULL COMMENT '是否为止盈限价单',
    `sl_trigger_px` DECIMAL(20, 8) DEFAULT NULL COMMENT '止损触发价格',
    `sl_trigger_px_type` VARCHAR(50) DEFAULT '' COMMENT '止损触发价格类型',
    `tp_ord_px` DECIMAL(20, 8) DEFAULT NULL COMMENT '止盈订单价格',
    `tp_trigger_px` DECIMAL(20, 8) DEFAULT NULL COMMENT '止盈触发价格',
    `tp_trigger_px_type` VARCHAR(50) DEFAULT '' COMMENT '止盈触发价格类型',
    `sl_ord_px` DECIMAL(20, 8) DEFAULT NULL COMMENT '止损订单价格',
    `fill_px` DECIMAL(20, 8) DEFAULT NULL COMMENT '成交价格',
    `trade_id` VARCHAR(100) DEFAULT '' COMMENT '成交 ID',
    `fill_sz` DECIMAL(20, 8) NOT NULL COMMENT '成交数量',
    `fill_time` BIGINT DEFAULT NULL COMMENT '成交时间',
    `fill_pnl` DECIMAL(20, 8) NOT NULL COMMENT '成交盈亏',
    `fill_fee` DECIMAL(20, 8) NOT NULL COMMENT '成交手续费',
    `fill_fee_ccy` VARCHAR(50) DEFAULT '' COMMENT '成交手续费币种',
    `exec_type` VARCHAR(50) DEFAULT '' COMMENT '执行类型',
    `fill_px_vol` DECIMAL(20, 8) DEFAULT NULL COMMENT '成交价格波动',
    `fill_px_usd` DECIMAL(20, 8) DEFAULT NULL COMMENT '成交价格（USD）',
    `fill_mark_vol` DECIMAL(20, 8) DEFAULT NULL COMMENT '成交标记波动',
    `fill_fwd_px` DECIMAL(20, 8) DEFAULT NULL COMMENT '成交远期价格',
    `fill_mark_px` DECIMAL(20, 8) DEFAULT NULL COMMENT '成交标记价格',
    `amend_source` VARCHAR(100) DEFAULT '' COMMENT '修改来源',
    `req_id` VARCHAR(100) DEFAULT '' COMMENT '请求 ID',
    `amend_result` VARCHAR(100) DEFAULT '' COMMENT '修改结果',
    `code` VARCHAR(50) NOT NULL COMMENT '状态码',
    `msg` VARCHAR(255) DEFAULT '' COMMENT '消息',
    `px_type` VARCHAR(50) NOT NULL COMMENT '价格类型',
    `px_usd` DECIMAL(20, 8) NOT NULL COMMENT '价格（USD）',
    `px_vol` DECIMAL(20, 8) NOT NULL COMMENT '价格波动',
    `linked_algo_ord_algo_id` VARCHAR(100) DEFAULT '' COMMENT '关联算法订单 ID',
    `attach_algo_ords` TEXT DEFAULT NULL COMMENT '附加算法订单列表',
    INDEX `idx_ord_id` (`ord_id`),
    INDEX `idx_cl_ord_id` (`cl_ord_id`),
    INDEX `idx_inst_id` (`inst_id`),
    INDEX `idx_state` (`state`),
    INDEX `idx_c_time` (`c_time`),
    INDEX `idx_u_time` (`u_time`),
    INDEX `idx_px` (`px`),
    INDEX `idx_sz` (`sz`),
    INDEX `idx_notional_usd` (`notional_usd`),
    INDEX `idx_avg_px` (`avg_px`),
    INDEX `idx_pnl` (`pnl`),
    INDEX `idx_px_usd` (`px_usd`),
    INDEX `idx_px_vol` (`px_vol`)
'''
@dataclass
class EResultOKXOrder:
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


def CreateOrderResult(order ):
    return EResultOKXOrder(
        inst_type=order.get("instType", ""),
        inst_id=order.get("instId", ""),
        tgt_ccy=order.get("tgtCcy", ""),
        ccy=order.get("ccy", ""),
        ord_id=order.get("ordId", ""),
        cl_ord_id=order.get("clOrdId", ""),
        algo_cl_ord_id=order.get("algoClOrdId", ""),
        algo_id=order.get("algoId", ""),
        tag=order.get("tag", ""),
        px=float(order.get("px", 0)),
        sz=float(order.get("sz", 0)),
        notional_usd=float(order.get("notionalUsd", 0)),
        ord_type=order.get("ordType", ""),
        side=order.get("side", ""),
        pos_side=order.get("posSide", ""),
        td_mode=order.get("tdMode", ""),
        acc_fill_sz=float(order.get("accFillSz", 0)),
        fill_notional_usd=float(order.get("fillNotionalUsd", 0)),
        avg_px=float(order.get("avgPx", 0)),
        state=order.get("state", ""),
        lever=float(order.get("lever", 0)),
        pnl=float(order.get("pnl", 0)),
        fee_ccy=order.get("feeCcy", ""),
        fee=float(order.get("fee", 0)),
        rebate_ccy=order.get("rebateCcy", ""),
        rebate=float(order.get("rebate", 0)),
        category=order.get("category", ""),
        u_time=int(order.get("uTime", 0)),
        c_time=int(order.get("cTime", 0)),
        source=order.get("source", ""),
        reduce_only=order.get("reduceOnly", ""),
        cancel_source=order.get("cancelSource", ""),
        quick_mgn_type=order.get("quickMgnType", ""),
        stp_id=order.get("stpId", ""),
        stp_mode=order.get("stpMode", ""),
        attach_algo_cl_ord_id=order.get("attachAlgoClOrdId", ""),
        last_px=float(order.get("lastPx", 0)),
        is_tp_limit=order.get("isTpLimit", ""),
        sl_trigger_px=float(order.get("slTriggerPx", 0)),
        sl_trigger_px_type=order.get("slTriggerPxType", ""),
        tp_ord_px=float(order.get("tpOrdPx", 0)),
        tp_trigger_px=float(order.get("tpTriggerPx", 0)),
        tp_trigger_px_type=order.get("tpTriggerPxType", ""),
        sl_ord_px=float(order.get("slOrdPx", 0)),
        fill_px=float(order.get("fillPx", 0)),
        trade_id=order.get("tradeId", ""),
        fill_sz=float(order.get("fillSz", 0)),
        fill_time=int(order.get("fillTime", 0)),
        fill_pnl=float(order.get("fillPnl", 0)),
        fill_fee=float(order.get("fillFee", 0)),
        fill_fee_ccy=order.get("fillFeeCcy", ""),
        exec_type=order.get("execType", ""),
        fill_px_vol=float(order.get("fillPxVol", 0)),
        fill_px_usd=float(order.get("fillPxUsd", 0)),
        fill_mark_vol=float(order.get("fillMarkVol", 0)),
        fill_fwd_px=float(order.get("fillFwdPx", 0)),
        fill_mark_px=float(order.get("fillMarkPx", 0)),
        amend_source=order.get("amendSource", ""),
        req_id=order.get("reqId", ""),
        amend_result=order.get("amendResult", ""),
        code=order.get("code", ""),
        msg=order.get("msg", ""),
        px_type=order.get("pxType", ""),
        px_usd=float(order.get("pxUsd", 0)),
        px_vol=float(order.get("pxVol", 0)),
        linked_algo_ord_algo_id=order.get("linkedAlgoOrd", {}).get("algoId", ""),
        attach_algo_ords=str(order.get("attachAlgoOrds", []))
    )