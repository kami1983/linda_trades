

import asyncio

from iv import bsmOptionPrice, _WillDelCacluateBSM, inferCurrentPrice
# from option_greeks import delta, gamma, theta
# from py_vollib.black_scholes.implied_volatility import implied_volatility


# async def main():

#     # 获取当前的时间戳
#     # timestamp = int(time.time())
#     # 2024-10-29 16:00:00
#     # 将字符串转换为时间戳
#     timeArray = time.strptime("2024-10-31 16:00:00", "%Y-%m-%d %H:%M:%S")
#     timestamp = int(time.mktime(timeArray))
#     print('timestamp :', timestamp)
#     options = await getRecentOptionChainByTimestamp(timestamp)
#     expiration_date, options_data = options['expiration_date'], options['data']

#     print(expiration_date)
#     # 假设我是一个期权卖方，那么我就要留出一个安全区间，这个安全区间是标的资产价格的 10% 左右
#     atmOptionC = findAtmOptions(options_data, 71988 * 1.1, 'C')
#     print('atmOptionC:', atmOptionC)
#     atmOptionP = findAtmOptions(options_data, 71988 * 0.9, 'P')
#     print('atmOptionP:', atmOptionP)

# def callDetails():
#     S = 2.7780  # 当前标的资产的价格 (BTC/USD)
#     P = 0.298  # 期权的市场价格 (BTC)
#     K = 2.5000  # 期权行权价格
#     T = 40/365  # 距离到期时间 (年)
#     r = 0.045  # 无风险利率
#     flag = "c"  # 看涨期权 (c = call, p = put)

#     print("IMT ---------")
#     showGreeks(S=S, P=P, K=K, T=T, r=r, flag=flag)

# def callAtmDetails():
#     S = 2.7780  # 当前标的资产的价格 (BTC/USD)
#     P = 0.0781  # 期权的市场价格 (BTC)
#     K = 2.8  # 期权行权价格
#     T = 40/365  # 距离到期时间 (年)
#     r = 0.045  # 无风险利率
#     flag = "c"  # 看涨期权 (c = call, p = put)

#     print("ATM ---------")
#     showGreeks(S=S, P=P, K=K, T=T, r=r, flag=flag)

# def putDetails():
#     S = 2.7780  # 当前标的资产的价格 (BTC/USD)
#     P = 0.0200  # 期权的市场价格 (BTC)
#     K = 2.6000  # 期权行权价格
#     T = 40/365  # 距离到期时间 (年)
#     r = 0.045  # 无风险利率
#     flag = "p"  # 看涨期权 (c = call, p = put)
    
#     print("OTM ----------")
#     showGreeks(S=S, P=P, K=K, T=T, r=r, flag=flag)

# def showGreeks(S,P,K,T,r,flag):
#     _iv = implied_volatility(P, S, K, T, r, flag)
#     print(f"隐含波动率: {_iv * 100:.2f}%")

#     _delta = delta(s=S,k=K,r=r,T=T,sigma=_iv,n=1 if flag == 'c' else -1)
#     print(f"Delta: {_delta:.2f}")

#     _gamma = gamma(s=S,k=K,r=r,T=T,sigma=_iv)
#     print(f"Gamma: {_gamma}")

#     _theta = theta(s=S,k=K,r=r,T=T,sigma=_iv,n=1 if flag == 'c' else -1)
#     print(f"Theta: {_theta}")

async def main():
    # callDetails()
    # callAtmDetails()
    # putDetails()



    current_price=97843.7
    strike_price=98000
    iv=0.56
    r=0.045
    day_left=10.17

    res = _WillDelCacluateBSM(current_price=current_price, strike_price=strike_price, iv=iv, r=r, day_left=day_left)
    print('res: ', res, 1/98000*res)


    res2 = bsmOptionPrice(current_price=current_price, strike_price=strike_price, iv=iv, r=r, day_left=day_left, option_type='c')
    print('res2 C: ', res2)

    res3 = bsmOptionPrice(current_price=current_price, strike_price=strike_price, iv=iv, r=r, day_left=day_left, option_type='p')
    print('res3 P: ', res3)

    # infer_price = infer_current_price(buy_price=(0.037*current_price), strike_price=strike_price, iv=iv, r=r, day_left=day_left, option_type='c')
    infer_price = inferCurrentPrice(buy_price=res2, strike_price=strike_price, iv=iv, r=r, day_left=day_left, option_type='c')
    print('infer_price: ', infer_price)


asyncio.run(main())
