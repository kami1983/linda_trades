
import time
import ccxt.async_support as ccxt
import os
import aiomysql

from db_operation import getDbSwapPrice, getRecentOptionChainByTimestamp
from dotenv import load_dotenv
from fetch_options import fetchOptionChain, recordOptionChain
from fetch_ticker import *
from iv import extractIvData
from unitls import selectOptions
from py_vollib.black_scholes.implied_volatility import implied_volatility

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
# FTT['fetchBTCOptionChain'] = [0, 7200]
# FTT['fetchETHOptionChain'] = [getCrrrentTime()+3600, 7200]
FTT['fetchETHOptionChain'] = [0, 7200]
FTT['fetchBTCOptionChain'] = [getCrrrentTime()+3600, 7200]

async def main():
    
    
    try:
        # 不断获取数据库中的最新数据
        while True:
            print('------------------->>> Main loop')
            current_time = getCrrrentTime()
            # 打印当前时间戳
            print(f"Current timestamp: {current_time}")

            if(current_time - FTT['fetchBTCOptionChain'][0] > FTT['fetchBTCOptionChain'][1]):
                print('🍇 Update: fetchBTCOptionChain')
                FTT['fetchBTCOptionChain'][0] = current_time
                asyncio.create_task(recordOptionChain(exchange, 'BTC'))

            if(current_time - FTT['fetchETHOptionChain'][0] > FTT['fetchETHOptionChain'][1]):
                print('🍇 Update: fetchETHOptionChain')
                FTT['fetchETHOptionChain'][0] = current_time
                asyncio.create_task(recordOptionChain(exchange, 'ETH'))

            # 
            if(current_time - FTT['recordTokenPrice'][0] > FTT['recordTokenPrice'][1]):
                print('🍎 Update: recordTokenPrice')
                FTT['recordTokenPrice'][0] = current_time
                price_data = await asyncio.create_task(recordTokenPrice(exchange))
                if price_data['status'] == True:
                    btc_price, eth_price = price_data['data']['btc_price'], price_data['data']['eth_price']

                    option_chains = await getRecentOptionChainByTimestamp(current_time, 'ETH', 4)
                    expiration_date, options_data = option_chains['expiration_date'], option_chains['data']
                    print('Locked option date: ', expiration_date)
                    print('ATM price:', eth_price)
                    # 假设我是一个期权卖方，那么我就要留出一个安全区间，这个安全区间是标的资产价格的 10% 左右
                    atmOptionC = selectOptions(options_data, eth_price * 1.1, 'C')
                    print('atmOptionC B:', atmOptionC.symbol, atmOptionC.strike)

                    call_iv_res = await extractIvData(exchange, symbol=atmOptionC.symbol, current_price=eth_price) # {'b'=> 0.87, 's'=> 0.86, 'diff'=> 0.01, 'bid_premium'=>, 'ask_premium'=>}
                    print('call_iv_res:', call_iv_res)
                    atmOptionP = selectOptions(options_data, eth_price * 0.9, 'P')
                    print('atmOptionP:', atmOptionP.symbol, atmOptionP.strike)

                    put_iv_res = await extractIvData(exchange, symbol=atmOptionP.symbol, current_price=eth_price) # {'b'=> 0.87, 's'=> 0.86, 'diff'=> 0.01, 'bid_premium'=>, 'ask_premium'=>}
                    print('put_iv_res:', put_iv_res)
                else:
                    recordLog('Fetch token price failed.')


            # db_data = await getDbSwapPrice('BTC/USD:BTC')
            # print('Db data:', db_data)

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

