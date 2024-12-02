import asyncio
import os
from urllib import request
from db_operation import getOptionChainByExpirationDate, getRecentOptionChainByTimestamp
# from flask import Flask, jsonify, request
from exchange import createExchangeConn
from fetch_options import fetchOpenOrders, fetchOptionChain, fetchPostions
from fetch_ticker import fetchTicker
from iv import calculateIvData, extractIvData
from quart import Quart, jsonify, request, make_response
# from flask_cors import CORS
from quart_cors import cors
import traceback
import jwt
from functools import wraps
from datetime import datetime, timedelta, timezone

from unitls import getCrrrentTime, selectOptions

APP_PORT = os.getenv('APP_PORT', 5000)
CORS_ORIGIN = os.getenv('CORS_ORIGIN', 'http://localhost:3000')


# app = Flask(__name__)
app = Quart(__name__)
# CORS(app)
# app = cors(app, allow_origin="*")
app = cors(app, 
           allow_origin=CORS_ORIGIN,  # 设置前端地址
           allow_credentials=True)  # 允许携带 cookie 或凭据


# Secret key for JWT
SECRET_KEY = os.getenv('ADMIN_SESSION_SECRET', '')
admin_user = os.getenv('ADMIN_USER', 'admin')
admin_password = os.getenv('ADMIN_PASSWORD', '123456')

# Mock database for user credentials
USERS = {
    admin_user: admin_password
}

# Generate JWT token
def generate_token(username):
    payload = {
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),  # 使用时区感知的 UTC 时间
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

# Decode and validate JWT token
def decode_token(token):
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return decoded
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# Login endpoint
@app.route('/login', methods=['POST'])
async def login():
    data = await request.json
    username = data.get("username")
    password = data.get("password")
    # print('username:', username, 'password:', password)

    # Validate user credentials
    if username in USERS and USERS[username] == password:
        token = generate_token(username)
        response = await make_response(jsonify({"message": "Login successful"}))
        response.set_cookie("auth_token", token, httponly=True)
        return response
    return jsonify({"error": "Invalid credentials"}), 401

# 获取当前登录的用户
@app.route('/current_user', methods=['GET'])
async def current_user():
    token = request.cookies.get("auth_token")
    if not token:
        # 如果没有 token，直接返回未授权状态
        return jsonify({"status": False, "message": "Unauthorized"}), 200

    try:
        # 解码 token，decode_token 应该是一个实现了 JWT 解码逻辑的方法
        user_data = decode_token(token)
        if not user_data:
            return jsonify({"status": False, "message": "Invalid or expired token"}), 200
        
        # 返回解码后的用户数据
        return jsonify({"status": True, "data": user_data}), 200
    except Exception as e:
        # 捕获潜在的解码异常（比如格式错误、过期等）
        return jsonify({"status": False, "message": str(e)}), 200


def login_required(f):
    @wraps(f)
    async def decorated_function(*args, **kwargs):
        token = request.cookies.get("auth_token")
        print('DEBUG ======> token:', token)
        if not token:
            return jsonify({"error": "Unauthorized"}), 401

        user_data = decode_token(token)
        if not user_data:
            return jsonify({"error": "Invalid or expired token"}), 401

        # 将解码后的用户数据传递给实际的视图函数
        kwargs['user_data'] = user_data
        return await f(*args, **kwargs)
    return decorated_function

# Logout endpoint
@app.route('/logout', methods=['POST'])
async def logout():
    response = await make_response(jsonify({"message": "Logged out"}))
    response.delete_cookie("auth_token")
    return response


# Protected API endpoint
@app.route('/protected', methods=['GET'])
@login_required
async def protected():
    token = request.cookies.get("auth_token")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    user_data = decode_token(token)
    if not user_data:
        return jsonify({"error": "Invalid or expired token"}), 401

    return jsonify({"message": f"Hello, {user_data['username']}!"})


@app.route('/api/current_price')
async def get_current_price():
    try:
        # 获取URL参数
        symbol = str(request.args.get('symbol')).upper()
        if symbol != 'BTC' and symbol != 'ETH':
            return jsonify({"status": False, "message": "Symbol is not supported!"})
        
        exchange = createExchangeConn()
        task = asyncio.create_task(fetchTicker(exchange, f'{symbol}-USD-SWAP'))
        price = await asyncio.gather(task)
        
        print('DEBUG: price:', price)

        return jsonify({"status": True, "data": {"price": price[0].last, "symbol": symbol } })
    except Exception as e:
        return jsonify({"status": False, "message":e.args[0]})
    finally:
        await exchange.close()

@app.route('/api/atm_iv')
async def get_atm_iv():
    
    try:
        # 获取URL参数
        symbol = str(request.args.get('symbol')).upper()
        if symbol != 'BTC' and symbol != 'ETH':
            return jsonify({"status": False, "message": "Symbol is not supported!"})
        
        price = float(request.args.get('price'))
        if price <= 0:
            return jsonify({"status": False, "message": "Price is invalid!"})
        
        rate = float(request.args.get('rate'))/100
        
        day = int(request.args.get('day'))
        if day <= 0:
            return jsonify({"status": False, "message": "Day is invalid!"})
        
        exchange = createExchangeConn()
        current_time = getCrrrentTime()
        _coin_name = symbol
        _offset_day = day
        _offset_rate = rate

        print('current_time:', current_time, 'coin_name:', _coin_name, 'offset_day:', _offset_day, 'offset_rate:', _offset_rate)

        option_chains = await getRecentOptionChainByTimestamp(current_time, _coin_name, _offset_day)
        expiration_date, options_data = option_chains['expiration_date'], option_chains['data']
        
        atmOptionC = selectOptions(options_data, price * (1+_offset_rate), 'C')
        if(atmOptionC == None):
            print('wran: atmOptionC is None')
            return jsonify({"status": False, "message": "atmOptionC is None!"})

        call_iv_res = await extractIvData(exchange, symbol=atmOptionC.symbol, current_price=price)
        print('call_iv_res:', call_iv_res)

        atmOptionP = selectOptions(options_data, price * (1-_offset_rate), 'P')
        if(atmOptionP == None):
            print('wran: atmOptionP is None')
            return jsonify({"status": False, "message": "atmOptionP is None!"})
        
        print('atmOptionP:', atmOptionP.symbol, atmOptionP.strike)

        put_iv_res = await extractIvData(exchange, symbol=atmOptionP.symbol, current_price=price)
        print('put_iv_res:', put_iv_res)

        return jsonify({"status": True, "data": {"call_iv": call_iv_res, "put_iv": put_iv_res }})
    except Exception as e:
        print("An error occurred:", e)
        traceback.print_exc()  # 打印详细的错误跟踪信息
        return jsonify({"status": False, "message": e.args[0]})
    finally:
        await exchange.close()


@app.route('/api/option_chain')
async def get_option_chain():
    # 获取URL参数
    symbol = str(request.args.get('symbol')).upper()
    offset= int(request.args.get('offset'))
    current_time = getCrrrentTime()
    option_chains = await getRecentOptionChainByTimestamp(current_time, symbol, offset)
    expiration_date, options_data = option_chains['expiration_date'], option_chains['data']
    return jsonify([expiration_date, options_data])


@app.route('/api/iv_data')
async def get_iv_data():
    # 获取URL参数
    symbol = str(request.args.get('symbol')).upper()
    flag= str(request.args.get('flag')).upper()
    sidx= int(request.args.get('sidx'))
    edate= int(request.args.get('edate'))
    
    # current_time = getCrrrentTime()
    # option_chains = await getRecentOptionChainByTimestamp(current_time, 'ETH', 3)
    # expiration_date, options_data = option_chains['expiration_date'], option_chains['data']

    file_name = f'trace_data/iv_data/{symbol}-{edate}-{flag}.csv'
    print('file_name:', file_name)
    # 判断文件是否存在如果不粗中直接返回 return jsonify([])
    if not os.path.exists(file_name):
        return jsonify([])

    # 从文件中读取数据
    res_data = []
    with open(file_name, 'r') as f:
        for line in f:
            data = line.strip().split(',')
            res_data.append(data)
        f.close()

    # timestamp, current_price, buy_iv, sell_iv
    # res_data = [
    #     [1730786255, 2000, 2500, 0.82, 0.92],
    #   [1730886255, 2000, 2400, 0.62, 0.42],
    #   [1730986255, 2000, 2544, 0.72, 0.82],
    #   [1731086255, 2000, 2422, 0.52, 0.42],
    #   [1731186255, 2000, 2231, 0.52, 0.72],
    #   [1731286255, 2000, 1233, 0.82, 0.102],
    # ]
    
    if -1 == sidx:
        return jsonify(res_data)
    else:
        if len(res_data) <= int(sidx):
            return jsonify([])
        return jsonify(res_data[sidx:])
    
# 获取某个行权日的T型期权报价列表
@app.route('/api/t_option_chain')
async def get_t_option_chain():
    '''
    获取某个行权日的T型期权报价列表
    '''
    expiration_date = int(request.args.get('edate'))
    symbol = str(request.args.get('symbol')).upper()
    price = float(request.args.get('price'))
    # results = await getOptionChainByExpirationDate(expiration_date=expiration_date, code=symbol)
    # # print('results:', results)
    # return jsonify(results)
    try:
        exchange = createExchangeConn()
        result = await fetchOptionChain(exchange, symbol)
        result = [item for item in result if item.expiration_date == expiration_date]
        # 对 result 按照 strike 进行排序
        result = sorted(result, key=lambda x: x.strike)
        warp_result = []
        # 遍历 result 的数据，计算其 IVdata （EResultIvData）
        for item in result:
            iv_data = None
            if(item.ask_price == 0 or 
               item.bid_price == 0 or 
               item.ask_price == None or 
               item.bid_price == None or 
               item.ask_size == 0 or 
               item.bid_size == 0):
                iv_data = None
            else:
                try:
                    iv_data = calculateIvData(option=item, current_price=price)
                except Exception as e:
                    iv_data = None
                    print('Error:', e)

            print('item:', item)
            warp_result.append([item, iv_data])

        return jsonify({"status": True, "data": warp_result})

    except Exception as e:
        return jsonify({"status": False, "message": e.args[0]})
    finally:
        await exchange.close()

@app.route('/api/extract_iv_data')
async def get_extract_iv_data():
    '''
    提取某个期权的隐含波动率数据
    '''
    try:
        exchange = createExchangeConn()
        symbol = str(request.args.get('symbol')).upper()
        current_price = float(request.args.get('current_price'))
        results = await extractIvData(exchange, symbol=symbol, current_price=current_price)
        return jsonify({"status": True, "data": results})
    except Exception as e:
        return jsonify({"status": False, "message": e.args[0]})
    finally:
        await exchange.close()

# 获取我的期权订单
@app.route('/api/postion_orders')
async def get_postion_orders():
    '''
    获取我的期权订单
    '''
    try:
        exchange = createExchangeConn()
        positions = await fetchPostions(exchange)
        return jsonify({"status": True, "data": positions})
    except Exception as e:
        return jsonify({"status": False, "Error message": e.args[0]})
    finally:
        await exchange.close()

@app.route('/api/open_orders')
async def get_open_orders():
    '''
    获取我的期权订单
    '''
    try:
        exchange = createExchangeConn()
        open_orders = await fetchOpenOrders(exchange)
        return jsonify({"status": True, "data": open_orders})
    except Exception as e:
        return jsonify({"status": False, "Error message": e.args[0]})
    finally:
        await exchange.close()


# # 这是一个非常综合的方法，会尝试向交易所请求多个数据，两张期权详细数据，一个当前币种的数据。
# @app.route('/api/postion_infos')
# async def get_postion_infos():
#     try:
#         exchange = createExchangeConn()
#         # 获取要关闭的期权数据
#         finalopt = str(request.args.get('finalopt')).upper()
#         task_will_final_option = fetchOptionChain(exchange, finalopt)
#         # 获取当前币种的价格
#         symbol = str(request.args.get('symbol')).upper()
#         task_price = asyncio.create_task(fetchTicker(exchange, f'{symbol}-USD-SWAP'))
#         open_orders, positions, price = await asyncio.gather(task_open_orders, task_positions, task_price)

#     except Exception as e:
#         return jsonify({"status": False, "message": e.args[0]})
#     finally:
#         await exchange.close()

# 调用一个方法，取消某个订单
@app.route('/api/cancel_order')
@login_required
async def cancel_order(user_data):
    try:
        exchange = createExchangeConn()
        order_id = str(request.args.get('orderid'))
        symbol = str(request.args.get('symbol')).upper()
        result = await exchange.cancel_order(id=order_id, symbol=symbol)
        return jsonify({"status": True, "data": result})
    except Exception as e:
        return jsonify({"status": False, "message": e.args[0]})
    finally:
        await exchange.close()

# 调用方法，修改某个订单下单的价格
@app.route('/api/change_order_price')
@login_required
async def change_order_price(user_data):
    try:
        exchange = createExchangeConn()
        order_id = str(request.args.get('orderid'))
        symbol = str(request.args.get('symbol')).upper()
        price = float(request.args.get('price'))
        type = str(request.args.get('type'))
        side = str(request.args.get('side'))
        # Call: async def edit_order(self, id: str, symbol: str, type: OrderType, side: OrderSide, amount: Num = None, price: Num = None, params={}):
        result = await exchange.edit_order(id=order_id, symbol=symbol, type=type, side=side, price=price)
        return jsonify({"status": True, "data": result})
    except Exception as e:
        return jsonify({"status": False, "message": e.args[0]})
    finally:
        await exchange.close()

# 新增一个以市场价平仓的操作
@app.route('/api/close_position')
@login_required
async def close_position(user_data):
    try:
        exchange = createExchangeConn()
        symbol = str(request.args.get('symbol')).upper()
        order_id = str(request.args.get('orderid'))
        side = str(request.args.get('side')).lower()
        params = {}
        if(order_id == None or order_id == ''):
            params = {}
        else:
            params = {'clientOrderId': order_id}

        print('DEBUG: symbol: A ---- close_position', symbol, 'side:', side, 'params:', params)
        
        result = await exchange.close_position(symbol=symbol, side='short')
        print('DEBUG: result: B ---- ', result)
        return jsonify({"status": True, "data": result})
    except Exception as e:
        return jsonify({"status": False, "message": e.args[0]})
    finally:
        await exchange.close()

# 新增一个以市场价开仓的操作
@app.route('/api/create_position')
@login_required
async def create_position(user_data):
    '''
    @return: {"status": True, "data": {
        "data": {
            "amount": null,
            "average": null,
            "clientOrderId": "e847386590ce4dBC37ec4f2dcb3e7833",
            "cost": null,
            "datetime": null,
            "fee": null,
            "fees": [],
            "filled": null,
            "id": "2031839127239000066",
            "info": {
            "clOrdId": "e847386590ce4dBC37ec4f2dcb3e7833",
            "ordId": "2031839127239000066",
            "sCode": "0",
            "sMsg": "Order placed",
            "tag": "e847386590ce4dBC",
            "ts": "1733055924709"
            },
            "lastTradeTimestamp": null,
            "lastUpdateTimestamp": null,
            "postOnly": null,
            "price": null,
            "reduceOnly": false,
            "remaining": null,
            "side": "sell",
            "status": null,
            "stopLossPrice": null,
            "stopPrice": null,
            "symbol": "BTC/USD:BTC-241213-100000-C",
            "takeProfitPrice": null,
            "timeInForce": null,
            "timestamp": null,
            "trades": [],
            "triggerPrice": null,
            "type": "limit"
        },
        "status": true
        }
    }
    '''
    try:
        exchange = createExchangeConn()
        
        symbol = str(request.args.get('symbol')).upper()
    
        side = str(request.args.get('side')).lower()
        amount = float(request.args.get('amount'))
        price = float(request.args.get('price'))
        type = str(request.args.get('type')).lower()

        if type == 'market':
            price = None

        # 设置保证金模式，全仓或者逐仓，全仓是 cross，逐仓是 isolated
        # exchange.set_margin_mode('isolated', symbol)

        params = {
            'marginMode': 'isolated'
        }


        print('DEBUG A: symbol ========= :', symbol, 'side:', side, 'amount:', amount, 'price:', price, 'type:', type)
        # return jsonify({"status": False, "message": "Not implemented!"})
        # call async def create_order(self, symbol: str, type: OrderType, side: OrderSide, amount: float, price: Num = None, params={}):
        result = await exchange.create_order(symbol=symbol, type=type, side=side, amount=amount, price=price, params=params)
        print('DEBUG B: result ---------- :', result)
        return jsonify({"status": True, "data": result})
    except Exception as e:
        return jsonify({"status": False, "message": e.args[0]})
    finally:
        await exchange.close()



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=APP_PORT, debug=True)


