
import time
import ccxt.async_support as ccxt
import os
import traceback

from db_operation import getDbSwapPrice, getRecentOptionChainByTimestamp
from dotenv import load_dotenv
from libs.exchange.exchange import createExchangeConn
from fetch_options import fetchOptionChain, recordOptionChain
from fetch_ticker import *
from libs.units.iv import extractIvData
from libs.units.log import toRecordIvData
from libs.units.unitls import getCrrrentTime, selectOptions
from py_vollib.black_scholes.implied_volatility import implied_volatility

load_dotenv()

# key = os.getenv('OKEX_API_KEY')
# secret = os.getenv('OKEX_API_SECRET')
# password = os.getenv('OKEX_API_PASSWORD')


# 获取期权对应的币种
option_coins = [str(i).strip() for i in os.getenv('OPTION_COIN', 'ETH,BTC').split(',')]
# 偏移量表示要读取的期权日期
option_office_days = [int(i) for i in os.getenv('OPTION_OFFSET_DAYS', '2,10').split(',')]
# 表示要获取的期权价格
option_office_rate = [float(i) for i in os.getenv('OPTION_OFFSET_RATE', '0.1,0.9').split(',')]

if len(option_office_days) != len(option_office_rate) or len(option_office_days) != len(option_coins):
    print('Error: option_office_days, option_office_rate, option_coins length is not equal.')
    exit()

print('option_coins:', option_coins)
print('option_office_days:', option_office_days)
print('option_office_rate:', option_office_rate)

# 系统设置每次只能获取一批次的期权数据（效率因素），所以要设置一个当前期权读取下标循环值
option_offset_index = 0
option_max_count = len(option_office_days)

exchange = createExchangeConn()

# 获取账户余额
import asyncio

# 读取 .env 文件 的 LOOP_INTERVAL_OF_TOKEN_PRICE
LOOP_INTERVAL_OF_TOKEN_PRICE = int(os.getenv('LOOP_INTERVAL_OF_TOKEN_PRICE', 61))
LOOP_INTERVAL_OF_FETCH_ETH_OPTION_CHAIN = int(os.getenv('LOOP_INTERVAL_OF_FETCH_ETH_OPTION_CHAIN', 7201))
LOOP_INTERVAL_OF_FETCH_BTC_OPTION_CHAIN = int(os.getenv('LOOP_INTERVAL_OF_FETCH_BTC_OPTION_CHAIN', 7201))

print('LOOP_INTERVAL_OF_TOKEN_PRICE:', LOOP_INTERVAL_OF_TOKEN_PRICE)
print('LOOP_INTERVAL_OF_FETCH_ETH_OPTION_CHAIN:', LOOP_INTERVAL_OF_FETCH_ETH_OPTION_CHAIN)
print('LOOP_INTERVAL_OF_FETCH_BTC_OPTION_CHAIN:', LOOP_INTERVAL_OF_FETCH_BTC_OPTION_CHAIN)

# fetch_tick_time
FTT = dict()
# 数组的第一位是一个时间戳，第二位是一个要触发的时间间隔
FTT['recordTokenPrice'] = [0, LOOP_INTERVAL_OF_TOKEN_PRICE]
# FTT['fetchBTCOptionChain'] = [0, 7200]
# FTT['fetchETHOptionChain'] = [getCrrrentTime()+3600, 7200]
FTT['fetchETHOptionChain'] = [0, LOOP_INTERVAL_OF_FETCH_ETH_OPTION_CHAIN]
FTT['fetchBTCOptionChain'] = [getCrrrentTime()+3600, LOOP_INTERVAL_OF_FETCH_BTC_OPTION_CHAIN]

async def main():
    
    # 生命要修改的全局变量
    global option_offset_index  
    
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
                    
                    _coin_name = option_coins[option_offset_index]
                    _offset_day = option_office_days[option_offset_index]
                    _offset_rate = option_office_rate[option_offset_index]

                    btc_price, eth_price = price_data['data']['btc_price'], price_data['data']['eth_price']
                    option_chains = await getRecentOptionChainByTimestamp(current_time, _coin_name, _offset_day)
                    expiration_date, options_data = option_chains['expiration_date'], option_chains['data']
                    print('Locked option date: ', expiration_date)
                    print('ATM price:', eth_price)
                    # 假设我是一个期权卖方，那么我就要留出一个安全区间，这个安全区间是标的资产价格的 10% 左右
                    atmOptionC = selectOptions(options_data, eth_price * (1+_offset_rate), 'C')
                    if(atmOptionC == None):
                        print('wran: atmOptionC is None')
                        continue

                    print('atmOptionC A:', atmOptionC.symbol, atmOptionC.strike, ' END')

                    call_iv_res = await extractIvData(exchange, symbol=atmOptionC.symbol, current_price=eth_price) # {'b'=> 0.87, 's'=> 0.86, 'diff'=> 0.01, 'bid_premium'=>, 'ask_premium'=>}
                    print('call_iv_res:', call_iv_res)

                    toRecordIvData(current_time, call_iv_res)

                    atmOptionP = selectOptions(options_data, eth_price * (1-_offset_rate), 'P')
                    if(atmOptionP == None):
                        print('wran: atmOptionP is None')
                        continue
                    print('atmOptionP:', atmOptionP.symbol, atmOptionP.strike)

                    put_iv_res = await extractIvData(exchange, symbol=atmOptionP.symbol, current_price=eth_price) # {'b'=> 0.87, 's'=> 0.86, 'diff'=> 0.01, 'bid_premium'=>, 'ask_premium'=>}
                    print('put_iv_res:', put_iv_res)

                    toRecordIvData(current_time, put_iv_res)

                    option_offset_index=(option_offset_index+1)%option_max_count

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
        error_details = traceback.format_exc()  # 获取完整的堆栈信息
        print(error_details)
    finally:
        await exchange.close()
        # print("Resources have been closed.")
        recordLog("Resources have been closed.")
    

asyncio.run(main())

