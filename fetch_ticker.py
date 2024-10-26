



from typing import Optional

from db_operation import updateDbSwapPrice
from db_struct import EResultSwapPrice
from unitls import timeToStr

# symbol = 'BTC-USD-SWAP'
# symbol = 'ETH-USD-SWAP'
async def fetch_ticker(exchange, symbol) -> Optional[EResultSwapPrice]: 

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
        # print(result)  # 获取标记价格

        return result


    except Exception as e:
        print(f"An error occurred on fetch ticker: {e}")

    

async def recordTokenPrice(connection, exchange) -> bool:
    if(connection and exchange):
        btc_price = await fetch_ticker(exchange, 'BTC-USD-SWAP')
        print('BTC' , btc_price.last, timeToStr(btc_price.timestamp))
        await updateDbSwapPrice(connection, btc_price)
        eth_price = await fetch_ticker(exchange, 'ETH-USD-SWAP')
        print('ETH' , eth_price.last, timeToStr(eth_price.timestamp))
        await updateDbSwapPrice(connection, eth_price)
        return True
    return False