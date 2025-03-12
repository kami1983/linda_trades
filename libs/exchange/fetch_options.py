import asyncio
from typing import List, Optional
from libs.database.db_operation import updateDbBatchOptionChain
from libs.database.db_struct import CreateOrderResult, EResultOKXOrder, EResultOpenOrder, EResultOptionChain, EResultOptionPosition
from libs.units.log import recordLog

# '''
# class EResultOptionChain:
#     symbol: str
#     timestamp: int # 这是这个期权链最后更新的时间戳
#     year: int
#     month: int
#     day: int
#     strike: float # 行权价格
#     bid_price:  Optional[float] = None
#     bid_size: Optional[int] = None
#     ask_price: Optional[float] = None
#     ask_size: Optional[int] = None
#     last_price: Optional[float] = None
#     last_size: Optional[int] = None
#     option_type: str # 行权方向，p 或者 c
#     type: int = 1 # 1: vaild
#     status: int = 1 # 1: vaild
# '''

# 返回值是一个数组
async def fetchOptionChain(exchange, code) -> Optional[List[EResultOptionChain]]: 
    '''
    获取期权的市场标记价格，
    @param exchange: 交易所对象
    @param code: 交易对象 ETH | BTC
    @return: EResultOptionChain[]
    '''
    option_chain = await exchange.fetch_option_chain(code)
    res = []
    # 打印返回的期权链信息
    for option in sorted(option_chain.keys()):
        # print(option, option_chain[option]['symbol'], option_chain[option]['timestamp'])
        # print(option_chain[option])
        # 每个 option_chain[option] 的数据结构如下：
        '''
        {'info': {'instType': 'OPTION', 'instId': 'ETH-USD-241028-2150-C', 'last': '', 'lastSz': '0', 'askPx': '0.131', 'askSz': '3501', 'bidPx': '0.127', 'bidSz': '3501', 'open24h': '', 'high24h': '', 'low24h': '', 'volCcy24h': '0', 'vol24h': '0', 'ts': '1730023058403', 'sodUtc0': '', 'sodUtc8': ''}, 'currency': None, 'symbol': 'ETH/USD:ETH-241028-2150-C', 'timestamp': 1730023058403, 'datetime': '2024-10-27T09:57:38.403Z', 'impliedVolatility': None, 'openInterest': None, 'bidPrice': 0.127, 'askPrice': 0.131, 'midPrice': None, 'markPrice': None, 'lastPrice': None, 'underlyingPrice': None, 'change': None, 'percentage': None, 'baseVolume': 0.0, 'quoteVolume': None}
        symbol: ETH/USD:ETH-241028-2150-C
        '''

        # print('symbol:', option_chain[option]['symbol'])
        # print('time:', option_chain[option]['symbol'].split('-')[1])
        
        cell = EResultOptionChain(
            symbol=option_chain[option]['symbol'],
        
            timestamp=option_chain[option]['timestamp'],
            # 从 symbol 中提取年
            year=int(option_chain[option]['symbol'].split('-')[1][:2]),
            month=int(option_chain[option]['symbol'].split('-')[1][2:4]),
            day=int(option_chain[option]['symbol'].split('-')[1][4:6]),
            expiration_date= int(option_chain[option]['symbol'].split('-')[1]),
            strike=float(option_chain[option]['symbol'].split('-')[2]),
            bid_price=option_chain[option]['bidPrice'],
            bid_size=option_chain[option]['info']['bidSz'],
            ask_price=option_chain[option]['askPrice'],
            ask_size=option_chain[option]['info']['askSz'],
            # // 如果 option_chain[option]['info']['last'] 不存在则不设置
            # TODO:: 这个插入不正常。
            # last_price= '' == option_chain[option]['info'].get('last'),
            # // 如果 option_chain[option]['info']['lastSz'] 不存在则设置为 0
            # last_size= option_chain[option]['info'].get('lastSz'),
            option_type=option_chain[option]['symbol'].split('-')[3],
            # 如果 code 是 BTC，那么 type 是 1，如果是 ETH，那么 type 是 2，其他情况是 0
            type=1 if code == 'BTC' else 2 if code == 'ETH' else 0,
            status=1,
        )
        
        
        res.append(cell)
    
    recordLog(f'Fetch OptionChain items count: {len(res)}')
    return res


async def recordOptionChain(exchange, symbol) -> bool:
    '''
    记录期权链数据到数据库
    @param exchange: 交易所对象
    @param data: 期权链数据
    @return: bool
    '''

    if(exchange):
        # 获取期权链信息
        await asyncio.gather(
            updateDbBatchOptionChain(await fetchOptionChain(exchange, symbol)),
        )
        return True
    return False

    



# order_item = 
#     {
#         "amount": 1,
#         "average": null,
#         "clientOrderId": null,
#         "cost": 0,
#         "datetime": "2024-11-20T12:55:56.142Z",
#         "fee": {
#             "cost": 0,
#             "currency": "BTC"
#         },
#         "fees": [
#             {
#                 "cost": 0,
#                 "currency": "BTC"
#             }
#         ],
#         "filled": 0,
#         "id": "2000010447760261120",
#         "lastTradeTimestamp": null,
#         "lastUpdateTimestamp": 1732107356142,
#         "postOnly": null,
#         "price": 0.1,
#         "reduceOnly": false,
#         "remaining": 1,
#         "side": "sell",
#         "status": "open",
#         "stopLossPrice": null,
#         "stopPrice": null,
#         "symbol": "BTC/USD:BTC-241129-100000-C",
#         "takeProfitPrice": null,
#         "timeInForce": null,
#         "timestamp": 1732107356142,
#         "trades": [],
#         "triggerPrice": null,
#         "type": "limit"
#     }


# @dataclass
# class EResultOpenOrder:
#     symbol: str
#     timestamp: int
#     datetime: str
#     amount: int
#     average: Optional[float] = None
#     clientOrderId: Optional[str] = None
#     cost: float
#     fee: dict
#     fees: list
#     filled: int
#     id: str
#     lastTradeTimestamp: Optional[int] = None
#     lastUpdateTimestamp: int
#     postOnly: Optional[bool] = None
#     price: float
#     reduceOnly: bool
#     remaining: int
#     side: str
#     status: str
#     stopLossPrice: Optional[float] = None
#     stopPrice: Optional[float] = None
#     takeProfitPrice: Optional[float] = None
#     timeInForce: Optional[str] = None
#     trades: list
#     triggerPrice: Optional[float] = None
#     type: str
async def fetchOpenOrders(exchange) -> List[EResultOptionPosition]:
    '''
    获取期权持仓数据
    @param exchange: 交易所对象
    @return: List[EResultOptionPosition]
    '''
    open_orders = await exchange.fetch_open_orders()
    res = []
    for order in open_orders:
        res.append(EResultOpenOrder(
            symbol=order['symbol'],
            timestamp=order['timestamp'],
            datetime=order['datetime'],
            amount=order['amount'],
            average=order['average'],
            clientOrderId=order['clientOrderId'],
            cost=order['cost'],
            fee=order['fee'],
            fees=order['fees'],
            filled=order['filled'],
            id=order['id'],
            lastTradeTimestamp=order['lastTradeTimestamp'],
            lastUpdateTimestamp=order['lastUpdateTimestamp'],
            postOnly=order['postOnly'],
            price=order['price'],
            reduceOnly=order['reduceOnly'],
            remaining=order['remaining'],
            side=order['side'],
            status=order['status'],
            stopLossPrice=order['stopLossPrice'],
            stopPrice=order['stopPrice'],
            takeProfitPrice=order['takeProfitPrice'],
            timeInForce=order['timeInForce'],
            trades=order['trades'],
            triggerPrice=order['triggerPrice'],
            type=order['type'],
        ))

    if(len(res) != len(open_orders)):
        raise Exception('Error: fetchOpenOrders data not match with original data') 
    return res

async def fetchPostions (exchange) -> List[EResultOpenOrder]:
    '''
    获取期权的开仓订单
    @param exchange: Exchange 交易所对象
    @return: List[EResultOpenOrder]
    '''
    postions = await exchange.fetch_positions(params={'instType': 'OPTION'})
    res = []
    for order in postions:
        res.append(EResultOptionPosition(
            symbol=order['symbol'],
            timestamp=order['timestamp'],
            datetime=order['datetime'],
            side=order['side'],
            collateral=order['collateral'],
            contractSize=order['contractSize'],
            contracts=order['contracts'],
            entryPrice=order['entryPrice'],
            hedged=order['hedged'],
            id=order['id'],
            initialMargin=order['initialMargin'],
            initialMarginPercentage=order['initialMarginPercentage'],
            lastPrice=order['lastPrice'],
            lastUpdateTimestamp=order['lastUpdateTimestamp'],
            leverage=order['leverage'],
            liquidationPrice=order['liquidationPrice'],
            maintenanceMargin=order['maintenanceMargin'],
            maintenanceMarginPercentage=order['maintenanceMarginPercentage'],
            marginMode=order['marginMode'],
            marginRatio=order['marginRatio'],
            markPrice=order['markPrice'],
            notional=order['notional'],
            percentage=order['percentage'],
            realizedPnl=order['realizedPnl'],
            stopLossPrice=order['stopLossPrice'],
            takeProfitPrice=order['takeProfitPrice'],
            unrealizedPnl=order['unrealizedPnl'],
        ))

    if(len(res) != len(postions)):
        raise Exception('Error: fetchPostions data not match with original data') 
    
    return res


# Call async def fetch_my_trades(self, symbol: Str = None, since: Int = None, limit: Int = None, params={})
async def fetchTradeOrdersHistory(exchange) -> List[EResultOKXOrder]:
    '''
    获取我的交易记录
    @param exchange: 交易所对象
    @param symbol: 交易对
    @return: List[EResultOpenOrder]
    '''
    trades = await exchange.private_get_trade_orders_history(params={'instType': 'OPTION', 'state': 'filled'})

    res = []
    for trade in trades['data']:
        res.append(CreateOrderResult(exchange.apiKey, trade))
    return res
    