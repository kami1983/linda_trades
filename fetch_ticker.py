import asyncio
from typing import Optional

from db_operation import getDbConn, updateDbSwapPrice
from db_struct import EResultSwapPrice
from log import recordLog
from unitls import timeToStr

# symbol = 'BTC-USD-SWAP'
# symbol = 'ETH-USD-SWAP'
async def fetchTicker(exchange, symbol) -> Optional[EResultSwapPrice]: 

    try:
    
        # 获取期权的市场标记价格（可能间接反映波动率）
        # symbol = 'BTC/USD:BTC-241026-68250-C'
        ticker = await exchange.fetch_ticker(symbol)
        # {
        #     'symbol': 'BTC/USD:BTC',
        #     'timestamp': 1729909713806,
        #     'datetime': '2024-10-26T02:28:33.806Z',
        #     'high': 68744.0,
        #     'low': 65500.0,
        #     'bid': 66650.0,
        #     'bidVolume': 1173.0,
        #     'ask': 66650.1,
        #     'askVolume': 821.0,
        #     'vwap': None,
        #     'open': 67896.3,
        #     'close': 66650.3,
        #     'last': 66650.3,
        #     'previousClose': None,
        #     'change': -1246.0,
        #     'percentage': -1.8351515472860818,
        #     'average': 67273.3,
        #     'baseVolume': 14342238.0,
        #     'quoteVolume': None,
        #     'markPrice': None,
        #     'indexPrice': None,
        #     'info': {
        #         'instType': 'SWAP',
        #         'instId': 'BTC-USD-SWAP',
        #         'last': '66650.3',
        #         'lastSz': '1',
        #         'askPx': '66650.1',
        #         'askSz': '821',
        #         'bidPx': '66650',
        #         'bidSz': '1173',
        #         'open24h': '67896.3',
        #         'high24h': '68744',
        #         'low24h': '65500',
        #         'volCcy24h': '21357.4335',
        #         'vol24h': '14342238',
        #         'ts': '1729909713806',
        #         'sodUtc0': '66584',
        #         'sodUtc8': '67650.1'
        #     }
        # }
        
        result = EResultSwapPrice(
            symbol=ticker['symbol'],
            last=ticker['last'],
            bid=ticker.get('bid'),
            ask=ticker.get('ask'),
            high=ticker.get('high'),
            low=ticker.get('low'),
            timestamp=ticker['timestamp'],
            datetime=ticker.get('datetime'),
        )

        return result


    except Exception as e:
        print(f"An error occurred on fetch ticker: {e}")

    

async def recordTokenPrice(exchange) -> dict['status': bool, 'data': Optional[dict]]:
    if(exchange):

        eth_task = asyncio.create_task(fetchTicker(exchange, 'ETH-USD-SWAP'))
        btc_task = asyncio.create_task(fetchTicker(exchange, 'BTC-USD-SWAP'))
        
        btc_price, eth_price = await asyncio.gather(btc_task, eth_task)

        recordLog(f'Fetch BTC price: {btc_price.last}, {timeToStr(btc_price.timestamp)}')
        recordLog(f'Fetch ETH price: {eth_price.last}, {timeToStr(eth_price.timestamp)}')

        
        await asyncio.gather(
            updateDbSwapPrice(btc_price),
            updateDbSwapPrice(eth_price)
        )

        # await updateDbSwapPrice(btc_price)
        # await updateDbSwapPrice(eth_price)

        return {'status': True,'data': {'btc_price': btc_price.last, 'eth_price': eth_price.last}}
    return {'status': False, 'data': None}