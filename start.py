
import time
import ccxt.async_support as ccxt
import os
import aiomysql

from db_operation import getDbSwapPrice
from dotenv import load_dotenv
from fetch_options import fetchOptionChain, recordOptionChain
from fetch_ticker import *
load_dotenv()

key = os.getenv('OKEX_API_KEY')
secret = os.getenv('OKEX_API_SECRET')
password = os.getenv('OKEX_API_PASSWORD')

mysql_user = os.getenv('MYSQL_USER')
mysql_password = os.getenv('MYSQL_PASSWORD')
mysql_host = os.getenv('MYSQL_HOST')
mysql_port = int(os.getenv('MYSQL_PORT', 3306))



exchange = ccxt.okx({
    'apiKey': key,
    'secret': secret,
    'password': password,
})


# 获取账户余额
import asyncio

getCrrrentTime = lambda: int(time.time())

# fetch_tick_time
FTT = dict()
# 数组的第一位是一个时间戳，第二位是一个要触发的时间间隔
FTT['recordTokenPrice'] = [0, 10]
FTT['fetchBTCOptionChain'] = [0, 7200]
FTT['fetchETHOptionChain'] = [getCrrrentTime()+3600, 7200]

async def main():
    
    
    try:
        # 不断获取数据库中的最新数据
        while True:
            print('------------------->>> Main loop')
            current_time = getCrrrentTime()
            # 打印当前时间戳
            print(f"Current timestamp: {current_time}")

            # 每隔10秒记录一次价格
            if(current_time - FTT['recordTokenPrice'][0] > FTT['recordTokenPrice'][1]):
                print('🍎 Update: recordTokenPrice')
                FTT['recordTokenPrice'][0] = current_time
                asyncio.create_task(recordTokenPrice(exchange))

            if(current_time - FTT['fetchBTCOptionChain'][0] > FTT['fetchBTCOptionChain'][1]):
                print('🍇 Update: fetchBTCOptionChain')
                FTT['fetchBTCOptionChain'][0] = current_time
                asyncio.create_task(recordOptionChain(exchange, 'BTC'))
                

            db_data = await getDbSwapPrice('BTC/USD:BTC')
            print('Db data:', db_data)

            await asyncio.sleep(1)

    except asyncio.CancelledError:
        # print("Main loop has been cancelled")
        recordLog("Main loop has been cancelled")
    except Exception as e:
        # print("An error occurred:", e)
        recordLog(f"An error occurred: {e}")
    finally:
        await exchange.close()
        # print("Resources have been closed.")
        recordLog("Resources have been closed.")
    

asyncio.run(main())

