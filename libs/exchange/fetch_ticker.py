import asyncio
from typing import Optional

from libs.database.db_operation import getDbConn, updateDbSwapPrice
from libs.database.db_struct import EResultSwapPrice
from libs.units.log import recordLog
from libs.units.unitls import timeToStr

# symbol = 'BTC-USD-SWAP'
# symbol = 'ETH-USD-SWAP'
async def fetchTicker(exchange, symbol) -> Optional[EResultSwapPrice]: 

    try:
    
        # 获取期权的市场标记价格（可能间接反映波动率）
        # symbol = 'BTC/USD:BTC-241026-68250-C'
        ticker = await exchange.fetch_ticker(symbol)
        
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