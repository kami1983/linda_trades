import math
import numpy as np
from db_struct import EResultIvData
from scipy.stats import norm
from scipy.optimize import brentq
# from implied_volatility import BlackScholes

# from py_vollib.black_scholes import black_scholes
from py_vollib.black_scholes.implied_volatility import implied_volatility
# from py_vollib.black_scholes.greeks import delta, gamma, theta, vega, rho
# from py_vollib.black_scholes import option_price

import time

# # Black-Scholes 看涨期权定价公式
# def black_scholes_call(S, K, T, r, sigma):
#     d1 = (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
#     d2 = d1 - sigma * np.sqrt(T)
#     call_price = S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
#     return call_price

# # # 定义隐含波动率计算函数
# # def implied_volatility_call(market_price, S, K, T, r):
# #     # 使用数值方法反推出 sigma (隐含波动率)
# #     def objective_function(sigma):
# #         return black_scholes_call(S, K, T, r, sigma) - market_price
# #     # 使用 brentq 方法找到使得方程成立的隐含波动率
# #     return brentq(objective_function, 1e-5, 2)

# def implied_volatility_call(market_price, S, K, T, r):
#     # 使用数值方法反推出 sigma (隐含波动率)
#     def objective_function(sigma):
#         return black_scholes_call(S, K, T, r, sigma) - market_price

#     # 检查目标函数在区间两端的值
#     print(f"objective_function(1e-5): {objective_function(1e-5)}")
#     print(f"objective_function(2): {objective_function(5)}")

#     # 如果两个结果的符号相同，将会导致 brentq 报错
#     return brentq(objective_function, 1e-5, 5)

# # 参数
# S = 30000  # BTC/USD 当前价格，假设为 30000 美元
# K = 68250  # 行权价格
# P = 0.007  # 期权的市场价格 (BTC)
# r = 0.05  # 无风险利率，假设为 5%

# # 计算期权剩余到期时间，以年为单位
# expiry_timestamp = 1729956751000 / 1000 # 到期时间，单位为秒
# current_timestamp = time.time()  # 当前时间戳
# print([expiry_timestamp, current_timestamp])
# T = (expiry_timestamp - current_timestamp) / (365 * 24 * 60 * 60)  # 到期时间，以年为单位

# # 计算隐含波动率
# iv = implied_volatility_call(P, S, K, T, r)
# print(f"隐含波动率: {iv}%")

# def calc_implied_volatility(price, spot, strike, time_to_expiry, rate, option_type):
#     """
#     计算欧式期权的隐含波动率
#     """
#     bs_model = BlackScholes(
#         price=price,
#         S=spot,
#         K=strike,
#         t=time_to_expiry,
#         r=rate,
#         flag=option_type
#     )
#     return bs_model.implied_volatility()

# # 测试数据

# S = 68295  # 当前标的资产的价格 (BTC/USD)
# P = 0.007*S  # 期权的市场价格 (BTC)
# K = 68250  # 期权行权价格
# T = 1/365  # 距离到期时间 (年)
# r = 0.001  # 无风险利率
# flag = "c"  # 看涨期权 (c = call, p = put)

# # 测试数据
# P = 10  # 期权的市场价格 (BTC)
# S = 100  # 当前标的资产的价格 (BTC/USD)
# K = 95  # 期权行权价格
# T = 1  # 距离到期时间 (年)
# r = 0.05  # 无风险利率
# flag = "c"  # 看涨期权 (c = call, p = put)

S = 67458.9  # 当前标的资产的价格 (BTC/USD)
P = 0.0016*S  # 期权的市场价格 (BTC)
K = 68250  # 期权行权价格
T = 1/365/24*16  # 距离到期时间 (年)
r = 0.05  # 无风险利率
flag = "c"  # 看涨期权 (c = call, p = put)

# implied_volatility = calc_implied_volatility(price, spot, strike, time_to_expiry, rate, option_type)
# print("隐含波动率:", implied_volatility)

iv = implied_volatility(P, S, K, T, r, flag)
print(f"隐含波动率: {iv * 100:.2f}%")


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




async def extractIvData(exchange, symbol, current_price) -> EResultIvData:
    print('DEBUG - extractIvData = ', symbol, 'current_price = ', current_price)
     # 获取最新的标记数据
    ticker = await exchange.fetch_ticker(symbol=symbol)
    print('symbol extractIvData = ', symbol, 'ticker = ', ticker)  # 获取标记价格

    # 买方美元价值
    bid_price = 0 if ticker['bid'] == None else ticker['bid'] * current_price
    # 卖方美元价值
    ask_price = 0 if ticker['ask'] == None else ticker['ask'] * current_price
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
    P = bid_price  # 期权的市场价格 (BTC)
    K = excute_strike  # 期权行权价格
    T = (1/365)*(day_left)  # 距离到期时间 (年)
    r = 0.05  # 无风险利率
    flag = execute_flag   # 看涨期权 (c = call, p = put)
    s_iv = implied_volatility(P, S, K, T, r, flag)
    # print(f"卖方，隐含波动率: {iv * 100:.2f}%， P: {P}")

    P = ask_price
    b_iv = implied_volatility(P, S, K, T, r, flag)
    # print(f"买方，隐含波动率: {iv * 100:.2f}%， P: {P}")

    # # 计算 Delta
    # d1 = (math.log(S / K) + (r + 0.5 * s_iv ** 2) * T) / (s_iv * math.sqrt(T))
    # if flag == 'c':  # Call Option
    #     delta = norm.cdf(d1)
    # else:  # Put Option
    #     delta = norm.cdf(d1) - 1

    # 使用平均波动率来计算 Delta
    avg_iv = (s_iv + b_iv) / 2  # 使用买卖波动率的平均值
    d1 = (math.log(S / K) + (r + 0.5 * avg_iv ** 2) * T) / (avg_iv * math.sqrt(T))

    if flag == 'c':  # Call Option
        delta = norm.cdf(d1)
    else:  # Put Option
        delta = norm.cdf(d1) - 1


    return EResultIvData(
        symbol=symbol,
        current_price=current_price,
        bid_price=bid_price,
        ask_price=ask_price,
        ask_bid_diff=ask_bid_diff,
        bid_premium=bid_premium,
        ask_premium=ask_premium,
        execute_time=expiration_time,
        execute_flag=execute_flag,
        excute_strike=excute_strike,
        day_left=day_left,
        current_time=current_time,
        s_iv=s_iv,
        b_iv=b_iv,
        delta=delta
    )
    