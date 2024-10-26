import ccxt.async_support as ccxt

print(ccxt.exchanges)  # print a list of all available exchange classespyenv

# 读取 .env 文件 的 key 和 secret
import ccxt.async_support as ccxt
import os

from dotenv import load_dotenv 
load_dotenv()

key = os.getenv('OKEX_API_KEY')
secret = os.getenv('OKEX_API_SECRET')
password = os.getenv('OKEX_API_PASSWORD')

exchange = ccxt.okx({
    'apiKey': key,
    'secret': secret,
    'password': password,
})

# 获取账户余额
import asyncio

async def main():

    # 获取账户余额

    balance = await exchange.fetch_balance()
    # 转换JSON输出
    print(balance['total'])
    print(balance['free'])
    print(balance['used'])

    # options = await exchange.fetch_option_chain('BTC-USD', {
    #     'instId': 'BTC-USD-221230-4000-C',
    #     'optType': 'C',
    # })
    # print(options)

    # 获取期权链信息
    code = 'BTC'  # 或其他您关注的期权标的
    specific_symbol = 'BTC/USD:BTC-241026-68250-C'  # 指定的期权合约
    try:
        # option_chain = await exchange.fetch_option_chain(code=code)
        # # 获取指定合约的数据
        # option_data = option_chain.get(specific_symbol)
        # print(option_data)
        # # # 打印返回的期权链信息
        # # for option in sorted(option_chain.keys()):
        # #     print(option, option_chain[option])

        print('###############################')
        # trades = await exchange.fetch_trades(symbol=specific_symbol)
        # print(trades)

        # # 获取所有市场信息
        # markets = await exchange.fetch_markets()
        # # print(markets)
        # # 筛选出期权市场
        # # option_markets = [market for market in markets if market['type'] == 'option']
        # # for option in option_markets:
        # #     print(option)
        # option_market = next((market for market in markets if market['symbol'] == specific_symbol), None)
        # print(option_market)

        print('###############################')


        # 获取期权的市场标记价格（可能间接反映波动率）
        # symbol = 'BTC/USD:BTC-241026-68250-C'
        ticker = await exchange.fetch_ticker(symbol=specific_symbol)
        print(ticker)  # 获取标记价格

        # # S：这是比特币的当前市场价格（BTC/USD）。你可以通过 fetch_ticker('BTC/USD') 获取这个值。
        # S = 68295.0
        # # K：这是从你的 fetch_ticker 数据中提取的行权价格 68250。
        # K = 68250.0
        # # P：期权的市场价格（0.007 BTC），这是 fetch_ticker 数据中的 last。
        # P = 0.007
        # # T：到期时间，可以通过 timestamp 和当前时间差异计算。
        # T = 0.25
        # # r：无风险利率，假设 5%（0.05）。
        # r = 0.05

        # # iv = implied_volatility_call(P, S, K, T, r)
        # # print(f"隐含波动率: {iv * 100:.2f}%")
        

    except Exception as e:
        print(f"An error occurred: {e}")

    await exchange.close()


# Run the async function

asyncio.run(main())
