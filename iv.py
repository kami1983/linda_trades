import math
import numpy as np
from db_struct import EResultIvData, EResultOptionChain
from option_greeks import delta, gamma, theta
from scipy.stats import norm
from scipy.optimize import brentq
# from implied_volatility import BlackScholes

# from py_vollib.black_scholes import black_scholes
from py_vollib.black_scholes.implied_volatility import implied_volatility
# from py_vollib.black_scholes.greeks import delta, gamma, theta, vega, rho
# from py_vollib.black_scholes import option_price

import time

def cacluateIVRate(P, S, K, T, flag, r=0.05):
    '''
    计算隐含波动率
    @param P: 期权的市场价格
    @param S: 当前标的资产的价格
    @param K: 期权行权价格
    @param T: 距离到期时间
    @param r: 无风险利率
    @param flag: 看涨期权 (c = call, p = put)
    '''
    iv = implied_volatility(P, S, K, T, r, flag)
    return iv


def calculateIvData(option: EResultOptionChain, current_price) -> EResultIvData:
    '''
    计算隐含波动率数据
    @param option EResultOptionChain，期权结果数据，因为这是一个已有值所以速度更快
    @param current_price: 当前标的资产的价格
    '''
    return handlerCalculateIv(option.symbol, current_price, option.bid_price, option.ask_price)

async def extractIvData(exchange, symbol, current_price) -> EResultIvData:
    '''
    提取隐含波动率数据，这个方法会从交易所获取最新的标记数据，所以更精准
    @param exchange: 交易所对象
    @param symbol: 期权的 symbol
    @param current_price: 当前标的资产的价格

    '''
     # 获取最新的标记数据
    ticker = await exchange.fetch_ticker(symbol=symbol)
    # print('ticker:', ticker)
    return handlerCalculateIv(symbol, current_price, ticker['bid'], ticker['ask'])
    
def handlerCalculateIv(symbol, current_price, bid, ask )-> EResultIvData:
    '''
    处理计算隐含波动率数据
    @param symbol: 期权的 symbol
    @param current_price: 当前标的资产的价格
    @param bid: 买方价格
    @param ask: 卖方价格
    '''
    # 买方美元价值
    bid_price = 0 if bid == None else bid
    bid_usd = 0 if bid == None else bid * current_price
    # 卖方美元价值
    ask_price = 0 if ask == None else ask
    ask_usd = 0 if ask == None else ask * current_price
    # 计算买卖差值
    ask_bid_diff = ask_price - bid_price
    # 买方溢价率
    bid_premium = 0 if bid_price == 0 else ask_bid_diff / bid_price
    # 卖方折价率
    ask_premium = 0 if ask_price == 0 else ask_bid_diff / ask_price

    # print("symbol AA - ", symbol)
    # print("symbol.split('-') BB :", symbol.split('-'))

    # print('买方美元价值：', bid_price, '卖方美元价值：', ask_price, '买卖差值：', ask_bid_diff, '买方溢价率：', bid_premium, '卖方折价率：', ask_premium)
    # 将期权的 symbol = ETH/USD:ETH-241108-2650-C 转换成时间戳。
    # 提取 241108，分割 - ，再提取 2650，再提取 C。
    execute_date = symbol.split('-')[1]
    execute_year = int(execute_date[:2])
    execute_month = int(execute_date[2:4])
    execute_day = int(execute_date[4:6])
    expiration_time = f'20{execute_year}-{execute_month}-{execute_day} 18:00:00'
    execute_flag = str(symbol.split('-')[3]).lower()
    
    excute_strike = float(symbol.split('-')[2])

    # print('expiration_time:', expiration_time)
    # expiration_date = 2024-11-8 18:00:00
    # 将字符串转换为时间戳
    time_array = time.strptime(expiration_time, "%Y-%m-%d %H:%M:%S")
    timestamp = int(time.mktime(time_array))
    current_time =int(time.time())
    # 计算剩余天数
    day_left = (timestamp-current_time)/(3600*24)
    # print("Current time", current_time , "Timestamp:", timestamp, '剩余时间：（天）', day_left)

    S = current_price  # 当前标的资产的价格 (BTC/USD)
    P = bid_usd  # 期权的市场价格 (BTC)
    K = excute_strike  # 期权行权价格
    T = (day_left/365)  # 距离到期时间 (年)
    r = 0.045  # 无风险利率
    flag = execute_flag   # 看涨期权 (c = call, p = put)
    s_iv = implied_volatility(P, S, K, T, r, flag)
    # print(f"卖方，隐含波动率: {iv * 100:.2f}%， P: {P}")

    P = ask_usd
    b_iv = implied_volatility(P, S, K, T, r, flag)
    # print(f"买方，隐含波动率: {iv * 100:.2f}%， P: {P}")

    # # 计算 Delta
    # d1 = (math.log(S / K) + (r + 0.5 * s_iv ** 2) * T) / (s_iv * math.sqrt(T))
    # if flag == 'c':  # Call Option
    #     delta = norm.cdf(d1)
    # else:  # Put Option
    #     delta = norm.cdf(d1) - 1

    # 打印参数
    print(f"标的资产价格: {S}, 行权价格: {K}, 到期时间: {T}, 无风险利率: {r}, 期权类型: {flag}, 卖方隐含波动率: {s_iv}, 买方隐含波动率: {b_iv}")

    # # 使用平均波动率来计算 Delta
    # # avg_iv = (s_iv + b_iv) / 2  # 使用买卖波动率的平均值
    # avg_iv = s_iv # 使用卖方波动率，因为卖方波动率更接近实际波动率
    # d1 = (math.log(S / K) + (r + 0.5 * avg_iv ** 2) * T) / (avg_iv * math.sqrt(T))

    # if flag == 'c':  # Call Option
    #     delta = norm.cdf(d1)
    # else:  # Put Option
    #     delta = norm.cdf(d1) - 1

    # delta = calculate_delta(S, K, T, r, s_iv, flag)
    # delta = delta(s=S,k=K,r=r,T,sigma,n)
    _delta = delta(s=S,k=K,r=r,T=T,sigma=s_iv,n=1 if flag == 'c' else -1)
    _gamma = gamma(s=S,k=K,r=r,T=T,sigma=s_iv)
    _theta = theta(s=S,k=K,r=r,T=T,sigma=s_iv,n=1 if flag == 'c' else -1)

    # 计算内在价值和时间价值,需要区分看涨和看跌期权
    # 这里的 intrinsic_value 指的是看涨期权的内在价值
    intrinsic_value = max(S - K, 0)
    # 为什么使用 bid_price 而不是 ask_price 来计算时间价值？
    # 因为我们是期权的卖方，我们的收益是 bid_price
    time_value = bid_usd - intrinsic_value

    if flag == 'p':
        intrinsic_value = max(K - S, 0)
        time_value = bid_usd - intrinsic_value


    return EResultIvData(
        symbol=symbol,
        current_price=current_price,
        bid_price=bid_price,
        bid_usd=bid_usd,
        ask_price=ask_price,
        ask_usd=ask_usd,
        ask_bid_diff=ask_bid_diff,
        bid_premium=bid_premium,
        ask_premium=ask_premium,
        execute_time=expiration_time,
        execute_flag=execute_flag,
        excute_strike=excute_strike,
        day_left=day_left,
        current_time=current_time,
        execute_date=execute_date,
        s_iv=s_iv,
        b_iv=b_iv,
        delta=_delta,
        gamma=_gamma,
        theta=_theta,
        intrinsic_value=intrinsic_value,
        time_value=time_value
    )