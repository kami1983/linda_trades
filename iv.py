import numpy as np
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

def calc_implied_volatility(price, spot, strike, time_to_expiry, rate, option_type):
    """
    计算欧式期权的隐含波动率
    """
    bs_model = BlackScholes(
        price=price,
        S=spot,
        K=strike,
        t=time_to_expiry,
        r=rate,
        flag=option_type
    )
    return bs_model.implied_volatility()

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