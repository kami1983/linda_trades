import asyncio
import os
from urllib import request
from libs.database.db_operation import OrderResultToDb, getOptionChainByExpirationDate, getRecentOptionChainByTimestamp, getRecordedOrderList
from libs.database.ohlcv_repo import query_market_daily_ohlcv
from libs.database.options_repo import query_atm_iv_series
# from flask import Flask, jsonify, request
from libs.exchange.exchange import account_balance, createExchangeConn, fetch_orders
from libs.exchange.fetch_options import fetchOpenOrders, fetchOptionChain, fetchPostions, fetchTradeOrdersHistory
from libs.exchange.fetch_ticker import fetchTicker
from libs.units.iv import bsmOptionPrice, calculateIvData, extractIvData, handlerCalculateIv, inferCurrentPrice
from quart import Quart, jsonify, request, make_response
# from flask_cors import CORS
from quart_cors import cors
import traceback
import jwt
from functools import wraps
from datetime import datetime, timedelta, timezone
import ccxt
import sys

from libs.units.unitls import getCrrrentTime, selectOptions
from libs.exchange.lighter_client import lighter_order_books, lighter_recent_trades, lighter_send_tx, lighter_account_by_l1_address, lighter_account_by_index, lighter_account_inactive_orders
from libs.exchange.lighter_signer import signer_create_order, signer_cancel_order, signer_cancel_all_orders

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

def _jsonable(obj):
    """
    Convert SDK return objects (e.g. Pydantic/BaseModel/OpenAPI models) into JSON-serializable structures.
    """
    try:
        # pydantic v2 models
        if hasattr(obj, 'model_dump'):
            return obj.model_dump()
        # openapi-generator models
        if hasattr(obj, 'to_dict'):
            return obj.to_dict()
    except Exception:
        pass
    if isinstance(obj, list) or isinstance(obj, tuple):
        return [_jsonable(x) for x in obj]
    if isinstance(obj, dict):
        return {k: _jsonable(v) for k, v in obj.items()}
    return obj

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
        # print('DEBUG ======> token:', token)
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
        
        # print('DEBUG: price:', price)

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
    expiration_date = request.args.get('edate')
    if expiration_date != None:
        expiration_date = int(expiration_date)
    symbol = str(request.args.get('symbol')).upper()
    price = float(request.args.get('price'))
    # results = await getOptionChainByExpirationDate(expiration_date=expiration_date, code=symbol)
    # # print('results:', results)
    # return jsonify(results)
    try:
        exchange = createExchangeConn()
        result = await fetchOptionChain(exchange, symbol)
        if expiration_date != None:
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

            # print('item:', item)
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


# 获取已经交易的订单，用于恢复webstock丢失的订单数据，调用 fetchMyTrades 方法
@app.route('/api/get_trade_orders_history')
async def get_trade_orders_history():
    '''
    获取已经交易的订单，用于恢复webstock丢失的订单数据
    '''
    try:
        exchange = createExchangeConn()
        trades = await fetchTradeOrdersHistory(exchange)
        return jsonify({"status": True, "data": trades})
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
    # try:
    #     exchange = createExchangeConn()
    #     positions = await fetchPostions(exchange)
    #     return jsonify({"status": True, "data": positions})
    # except Exception as e:
    #     return jsonify({"status": False, "Error message": e.args[0]})
    # finally:
    #     await exchange.close()
    res = await fetch_orders()
    return jsonify(res)


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


# 订单同步按钮，这个会调用 fetchTradeOrdersHistory 方法，获取已经交易的订单，用于恢复webstock丢失的订单数据
@app.route('/api/sync_order_to_db')
@login_required
async def sync_order_to_db(user_data):
    '''
    订单同步按钮，这个会调用 fetchTradeOrdersHistory 方法，获取已经交易的订单，用于恢复webstock丢失的订单数据
    '''
    try:
        exchange = createExchangeConn()
        trades = await fetchTradeOrdersHistory(exchange)
        for trade in trades:
            await OrderResultToDb(trade)
      
        return jsonify({"status": True, "data": trades})
    except Exception as e:
        return jsonify({"status": False, "message": e.args[0]})
    finally:
        await exchange.close()


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

# 新增一个以市场价平仓的操作 【对于期权这个方法无法使用，期权是通过反向开单实现平仓的】
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
        result = await exchange.close_position(symbol=symbol, side='short', params=params)
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


        # print('DEBUG A: symbol ========= :', symbol, 'side:', side, 'amount:', amount, 'price:', price, 'type:', type)
        # return jsonify({"status": False, "message": "Not implemented!"})
        # call async def create_order(self, symbol: str, type: OrderType, side: OrderSide, amount: float, price: Num = None, params={}):
        result = await exchange.create_order(symbol=symbol, type=type, side=side, amount=amount, price=price, params=params)
        # print('DEBUG B: result ---------- :', result)
        return jsonify({"status": True, "data": result})
    except Exception as e:
        return jsonify({"status": False, "message": e.args[0]})
    finally:
        await exchange.close()


def safe_string(dictionary, key):
    return str(dictionary[key]) 

@app.route('/api/add_margin')
@login_required
async def add_margin(user_data):
    '''
    @param: symbol: 期权的symbol
    @param: amount: 增加或减少的保证金数量
    @param: type: 修改的类型，可以是add或者reduce
    '''
    try:
        exchange = createExchangeConn()
        symbol = str(request.args.get('symbol')).upper()
        amount = float(request.args.get('amount'))
        result = await exchange.add_margin(symbol=symbol, amount=amount, params={})
        return jsonify({"status": True, "data": result})
    except Exception as e:
        print('DEBUG: modify_margin = error:', e)
        print(traceback.print_exc())
        print(e.__traceback__.tb_frame.f_globals["__file__"])   # 发生异常所在的文件
        print(e.__traceback__.tb_lineno)
        return jsonify({"status": False, "message": e.args[0]})
    finally:
        await exchange.close()

# reduce_margin
@app.route('/api/reduce_margin')
@login_required
async def reduce_margin(user_data):
    '''
    @param: symbol: 期权的symbol
    @param: amount: 增加或减少的保证金数量
    @param: type: 修改的类型，可以是add或者reduce
    '''
    try:
        exchange = createExchangeConn()
        symbol = str(request.args.get('symbol')).upper()
        amount = float(request.args.get('amount'))
        result = await exchange.reduce_margin(symbol=symbol, amount=amount, params={})
        return jsonify({"status": True, "data": result})
    except Exception as e:
        return jsonify({"status": False, "message": e.args[0]})
    finally:
        await exchange.close()

# 调用方法，修改某个订单下单的价格
@app.route('/api/cacluate_options_price')
async def cacluate_options_price():
    price = float(request.args.get('price'))
    strike = float(request.args.get('strike'))
    iv = float(request.args.get('iv'))
    day_left = float(request.args.get('day_left'))
    option_type= str(request.args.get('option_type')).lower()
    r = 0.045
    order_price = bsmOptionPrice(current_price=price, strike_price=strike, iv=iv, r=r, day_left=day_left, option_type=option_type)
    token_amount = order_price / price
    # print('order_price:', order_price)
    current_time = getCrrrentTime()

    
    # 接下来要 day_left 转换成日期，计算成 241108 这种格式
    # symbol 的格式 'ETH/USD:ETH-241108-2650-C'
    execute_time = current_time + int(day_left) * 24 * 60 * 60
    # print('execute_time:', execute_time)
    # 转换成 241108 这种格式
    excute_date = datetime.fromtimestamp(execute_time).strftime('%y%m%d')
    # print('excute_date:', excute_date)
    symbol = f'KAMI/USD:KAMI-{excute_date}-{strike}-{option_type.upper()}'

    ivData = handlerCalculateIv(symbol=symbol, current_price=price, bid=token_amount, ask=token_amount)

    return jsonify({"status": True, "data": {"order_price": order_price, "token_amount": token_amount, "ivData": ivData}})
    
    # handlerCalculateIv(symbol='ETH/USD:ETH-241108-2650-C', current_price=price, bid=option_price, ask=option_price)


# inferCurrentPrice
@app.route('/api/infer_current_price')
async def infer_current_price():   
    # buy_price, strike_price, iv, r, day_left, option_type=
    buy_price = float(request.args.get('buy_price'))
    strike_price = float(request.args.get('strike'))
    iv = float(request.args.get('iv'))
    r = 0.045
    day_left = float(request.args.get('day_left'))
    option_type= str(request.args.get('option_type')).lower()
    current_price = inferCurrentPrice(buy_price=buy_price, strike_price=strike_price, iv=iv, r=r, day_left=day_left, option_type=option_type)
    return jsonify({"status": True, "data": current_price})

@app.route('/api/get_recorded_order_list')
async def get_recorded_order_list():
    '''
    Result:
        {
        "data": [
            {
                "acc_fill_sz": "1.00000000000000000000",
                "avg_px": "0.03650000000000000000",
                "exec_type": "T",
                "fee": "-0.00000300000000000000",
                "fill_fee": "-0.00000300000000000000",
                "fill_fee_ccy": "BTC",
                "fill_fwd_px": "101461.96000000000000000000",
                "fill_mark_px": "0.03974776224326395000",
                "fill_mark_vol": "0.49500412719726560000",
                "fill_notional_usd": "1006.53100000000010000000",
                "fill_pnl": "0E-20",
                "fill_px": "0.03650000000000000000",
                "fill_px_usd": "3673.83815000000000000000",
                "fill_px_vol": "0.44373469848632810000",
                "fill_sz": "1.00000000000000000000",
                "fill_time": 1736257195926,
                "inst_id": "BTC-USD-250117-100000-C",
                "last_px": "0.03650000000000000000",
                "ord_id": "2139255964565905408",
                "pnl": "0E-20",
                "state": "filled",
                "trade_id": "14",
                "u_time": 1736257195928
            },
            {
                "acc_fill_sz": "1.00000000000000000000",
                "avg_px": "0.02700000000000000000",
                "exec_type": "T",
                "fee": "-0.00000300000000000000",
                "fill_fee": "-0.00000300000000000000",
                "fill_fee_ccy": "BTC",
                "fill_fwd_px": "101461.96000000000000000000",
                "fill_mark_px": "0.02534538841552121000",
                "fill_mark_vol": "0.49500412719726560000",
                "fill_notional_usd": "1006.53100000000010000000",
                "fill_pnl": "0E-20",
                "fill_px": "0.02700000000000000000",
                "fill_px_usd": "2717.63370000000000000000",
                "fill_px_vol": "0.52063884155273430000",
                "fill_sz": "1.00000000000000000000",
                "fill_time": 1736257196039,
                "inst_id": "BTC-USD-250117-100000-P",
                "last_px": "0.02700000000000000000",
                "ord_id": "2139255968357556224",
                "pnl": "0E-20",
                "state": "filled",
                "trade_id": "4",
                "u_time": 1736257196040
            },
            {
                "acc_fill_sz": "1.00000000000000000000",
                "avg_px": "0.02650000000000000000",
                "exec_type": "T",
                "fee": "-0.00000300000000000000",
                "fill_fee": "-0.00000300000000000000",
                "fill_fee_ccy": "BTC",
                "fill_fwd_px": "101533.71000000000000000000",
                "fill_mark_px": "0.02502548646817879400",
                "fill_mark_vol": "0.49500412719726560000",
                "fill_notional_usd": "1007.27000000000000000000",
                "fill_pnl": "-0.00000500000000000000",
                "fill_px": "0.02650000000000000000",
                "fill_px_usd": "2669.26550000000000000000",
                "fill_px_vol": "0.51819744018554690000",
                "fill_sz": "1.00000000000000000000",
                "fill_time": 1736257921685,
                "inst_id": "BTC-USD-250117-100000-P",
                "last_px": "0.02650000000000000000",
                "ord_id": "2139280316996919296",
                "pnl": "-0.00000500000000000000",
                "state": "filled",
                "trade_id": "5",
                "u_time": 1736257921686
            },
            {
                "acc_fill_sz": "1.00000000000000000000",
                "avg_px": "0.03800000000000000000",
                "exec_type": "T",
                "fee": "-0.00000300000000000000",
                "fill_fee": "-0.00000300000000000000",
                "fill_fee_ccy": "BTC",
                "fill_fwd_px": "101533.62000000000000000000",
                "fill_mark_px": "0.04012676523917927500",
                "fill_mark_vol": "0.49500412719726560000",
                "fill_notional_usd": "1007.27000000000000000000",
                "fill_pnl": "-0.00001500000000000000",
                "fill_px": "0.03800000000000000000",
                "fill_px_usd": "3827.62600000000000000000",
                "fill_px_vol": "0.46143485839843750000",
                "fill_sz": "1.00000000000000000000",
                "fill_time": 1736257922875,
                "inst_id": "BTC-USD-250117-100000-C",
                "last_px": "0.03800000000000000000",
                "ord_id": "2139280356893138944",
                "pnl": "-0.00001500000000000000",
                "state": "filled",
                "trade_id": "15",
                "u_time": 1736257922876
            },
            {
                "acc_fill_sz": "1.00000000000000000000",
                "avg_px": "0.01350000000000000000",
                "exec_type": "T",
                "fee": "-0.00000300000000000000",
                "fill_fee": "-0.00000300000000000000",
                "fill_fee_ccy": "BTC",
                "fill_fwd_px": "96142.64000000000000000000",
                "fill_mark_px": "0.01305851265027827900",
                "fill_mark_vol": "0.41382753173828130000",
                "fill_notional_usd": "955.48500000000000000000",
                "fill_pnl": "0E-20",
                "fill_px": "0.01350000000000000000",
                "fill_px_usd": "1289.90475000000000000000",
                "fill_px_vol": "0.42847593994140630000",
                "fill_sz": "1.00000000000000000000",
                "fill_time": 1736320604605,
                "inst_id": "BTC-USD-250110-96000-C",
                "last_px": "0.01350000000000000000",
                "ord_id": "2141383606740058112",
                "pnl": "0E-20",
                "state": "filled",
                "trade_id": "13",
                "u_time": 1736320604605
            }
        ],
        "status": true
    }
    '''
    try:
        result = await getRecordedOrderList()
        return jsonify({"status": True, "data": result})
    except Exception as e:
        return jsonify({"status": False, "message": e.args[0]})
    


@app.route('/api/account_balance')
async def api_account_balance():
    # '''
    # Result:
    #     {
    #     "data": {
    #         "free": {
    #             "ADA": 3000.0,
    #             "BTC": 2.987497209392031,
    #             "ETH": 14.983602450252652,
    #             "JFI": 300.0,
    #             "LTC": 30.0,
    #             "OKB": 300.0,
    #             "PAX": 9000.0,
    #             "SUSHI": 998.435273292,
    #             "TRX": 30000.0,
    #             "TUSD": 9000.0,
    #             "UNI": 1500.0,
    #             "USDC": 9000.0,
    #             "USDK": 9000.0,
    #             "USDT": 9961.290478299716
    #         },
    #         "timestamp": 1736307197322,
    #         "total": {
    #             "ADA": 3000.0,
    #             "BTC": 2.9975888729442217,
    #             "ETH": 14.983602450252652,
    #             "JFI": 300.0,
    #             "LTC": 30.0,
    #             "OKB": 300.0,
    #             "PAX": 9000.0,
    #             "SUSHI": 998.435273292,
    #             "TRX": 30000.0,
    #             "TUSD": 9000.0,
    #             "UNI": 1500.0,
    #             "USDC": 9000.0,
    #             "USDK": 9000.0,
    #             "USDT": 9961.290478299716
    #         },
    #         "used": {
    #             "ADA": 0.0,
    #             "BTC": 0.0100916635521907,
    #             "ETH": 0.0,
    #             "JFI": 0.0,
    #             "LTC": 0.0,
    #             "OKB": 0.0,
    #             "PAX": 0.0,
    #             "SUSHI": 0.0,
    #             "TRX": 0.0,
    #             "TUSD": 0.0,
    #             "UNI": 0.0,
    #             "USDC": 0.0,
    #             "USDK": 0.0,
    #             "USDT": 0.0
    #         }
    #     },
    #     "status": true
    # }
    # '''
    # try:
    #     exchange = createExchangeConn()
    #     balance = await exchange.fetch_balance()
    #     return jsonify({"status": True, "data": {
    #         "total": balance['total'],
    #         "free": balance['free'],
    #         "used": balance['used'],
    #         "timestamp": balance['timestamp']
    #     }})
    # except Exception as e:
    #     return jsonify({"status": False, "message": e.args[0]})
    # finally:
    #     await exchange.close()

    # print('Debug A account_balance')
    res = await account_balance()
    return jsonify(res)

@app.route('/ccxt/version')
async def ccxt_version():
    return jsonify({"status": True, "data": {"ccxt_version": ccxt.__version__, "sys_executable": sys.executable}})

@app.route('/api/lighter/order_books')
async def api_lighter_order_books():
    try:
        market = str(request.args.get('market'))
        if not market:
            return jsonify({"status": False, "message": "market is required"}), 400
        limit = request.args.get('limit')
        limit_v = int(limit) if limit is not None and limit != '' else None
        data = await lighter_order_books(market=market, limit=limit_v)
        return jsonify({"status": True, "data": _jsonable(data)})
    except Exception as e:
        return jsonify({"status": False, "message": str(e)}), 200

@app.route('/api/lighter/config')
async def api_lighter_config():
    try:
        # Expose minimal safe config needed by frontend
        return jsonify({
            "status": True,
            "data": {
                "l1_address": os.getenv("LIGHTER_L1_ADDRESS", ""),
                "api_key_public_key": os.getenv("LIGHTER_API_KEY_PUBLIC_KEY", ""),
                "api_key_index": os.getenv("LIGHTER_API_KEY_INDEX", "")
            }
        })
    except Exception as e:
        return jsonify({"status": False, "message": str(e)}), 200

@app.route('/api/lighter/recent_trades')
async def api_lighter_recent_trades():
    try:
        market = str(request.args.get('market'))
        if not market:
            return jsonify({"status": False, "message": "market is required"}), 400
        limit = request.args.get('limit')
        limit_v = int(limit) if limit is not None and limit != '' else None
        data = await lighter_recent_trades(market=market, limit=limit_v)
        return jsonify({"status": True, "data": _jsonable(data)})
    except Exception as e:
        return jsonify({"status": False, "message": str(e)}), 200

@app.route('/api/lighter/send_tx', methods=['POST'])
@login_required
async def api_lighter_send_tx(user_data):
    try:
        body = await request.json
        if not body or not isinstance(body, dict):
            return jsonify({"status": False, "message": "JSON body required"}), 400
        data = await lighter_send_tx(body)
        return jsonify({"status": True, "data": _jsonable(data)})
    except Exception as e:
        return jsonify({"status": False, "message": str(e)}), 200

@app.route('/api/lighter/account_by_l1')
@login_required
async def api_lighter_account_by_l1(user_data):
    try:
        address = str(request.args.get('address'))
        if not address:
            return jsonify({"status": False, "message": "address is required"}), 400
        data = await lighter_account_by_l1_address(address)
        return jsonify({"status": True, "data": _jsonable(data)})
    except Exception as e:
        return jsonify({"status": False, "message": str(e)}), 200

@app.route('/api/lighter/account_by_index')
@login_required
async def api_lighter_account_by_index(user_data):
    try:
        index_str = request.args.get('index')
        if index_str is None or index_str == '':
            return jsonify({"status": False, "message": "index is required"}), 400
        index = int(index_str)
        data = await lighter_account_by_index(index)
        return jsonify({"status": True, "data": _jsonable(data)})
    except Exception as e:
        return jsonify({"status": False, "message": str(e)}), 200

@app.route('/api/lighter/account_inactive_orders')
@login_required
async def api_lighter_account_inactive_orders(user_data):
    try:
        account_index_str = request.args.get('account_index')
        if account_index_str is None or account_index_str == '':
            return jsonify({"status": False, "message": "account_index is required"}), 400
        account_index = int(account_index_str)
        # Support both 'cursor' and legacy 'index'
        cursor_param_raw = request.args.get('cursor')
        if cursor_param_raw is None or cursor_param_raw == '':
            cursor_param_raw = request.args.get('index')
        limit_str = request.args.get('limit') or '50'
        # Normalize cursor: treat '0' / 'null' / '' as None (first page should omit cursor)
        cursor_val_str = None
        if cursor_param_raw is not None:
            raw = str(cursor_param_raw).strip().lower()
            if raw not in ['', '0', 'null', 'none']:
                cursor_val_str = str(cursor_param_raw)
        limit = int(limit_str)
        data = await lighter_account_inactive_orders(account_index=account_index, cursor=cursor_val_str, limit=limit)
        return jsonify({"status": True, "data": _jsonable(data)})
    except Exception as e:
        return jsonify({
            "status": False,
            "message": str(e),
            "debug": {
                "req_account_index": account_index_str,
                "req_cursor": request.args.get('cursor'),
                "req_index": request.args.get('index'),
                "normalized_cursor": cursor_val_str,
                "limit": request.args.get('limit'),
                "server_account_index": os.getenv("LIGHTER_ACCOUNT_INDEX", ""),
                "server_api_key_index": os.getenv("LIGHTER_API_KEY_INDEX", "")
            }
        }), 200

# Signer endpoints
@app.route('/api/lighter/signer/create_order', methods=['POST'])
@login_required
async def api_lighter_signer_create_order(user_data):
    try:
        body = await request.json
        required = ['market_index', 'client_order_index', 'base_amount', 'price', 'is_ask']
        for k in required:
            if k not in body:
                return jsonify({"status": False, "message": f"{k} is required"}), 400
        tx, tx_hash = await signer_create_order(
            market_index=int(body['market_index']),
            client_order_index=int(body['client_order_index']),
            base_amount=int(body['base_amount']),
            price=int(body['price']),
            is_ask=bool(body['is_ask']),
            order_type=body.get('order_type'),
            time_in_force=body.get('time_in_force'),
            reduce_only=bool(body.get('reduce_only') or False),
            trigger_price=int(body.get('trigger_price') or 0),
        )
        return jsonify({"status": True, "data": {"tx": _jsonable(tx), "tx_hash": tx_hash}})
    except Exception as e:
        return jsonify({"status": False, "message": str(e)}), 200

@app.route('/api/lighter/signer/cancel_order', methods=['POST'])
@login_required
async def api_lighter_signer_cancel_order(user_data):
    try:
        body = await request.json
        required = ['market_index', 'order_index']
        for k in required:
            if k not in body:
                return jsonify({"status": False, "message": f"{k} is required"}), 400
        tx, tx_hash = await signer_cancel_order(
            market_index=int(body['market_index']),
            order_index=int(body['order_index']),
        )
        return jsonify({"status": True, "data": {"tx": _jsonable(tx), "tx_hash": tx_hash}})
    except Exception as e:
        return jsonify({"status": False, "message": str(e)}), 200

@app.route('/api/lighter/signer/cancel_all_orders', methods=['POST'])
@login_required
async def api_lighter_signer_cancel_all_orders(user_data):
    try:
        body = await request.json
        tif = body.get('time_in_force')
        tx, tx_hash = await signer_cancel_all_orders(time_in_force=tif)
        return jsonify({"status": True, "data": {"tx": _jsonable(tx), "tx_hash": tx_hash}})
    except Exception as e:
        return jsonify({"status": False, "message": str(e)}), 200

@app.route('/api/ohlcv_daily')
@login_required
async def api_ohlcv_daily(user_data):
    try:
        exchange = str(request.args.get('exchange') or 'okx').lower()
        symbol = str(request.args.get('symbol'))
        limit = int(request.args.get('limit') or 500)
        since_ts = request.args.get('since_ts')
        if since_ts is not None and since_ts != '':
            since_ts = int(since_ts)
        else:
            since_ts = None

        if not symbol:
            return jsonify({"status": False, "message": "symbol is required"}), 400

        rows = await query_market_daily_ohlcv(exchange=exchange, symbol=symbol, timeframe='1d', limit=limit, since_ts=since_ts)
        return jsonify({"status": True, "data": rows})
    except Exception as e:
        return jsonify({"status": False, "message": str(e)}), 200

@app.route('/api/atm_iv_series')
@login_required
async def api_atm_iv_series(user_data):
    try:
        exchange = str(request.args.get('exchange') or 'okx').lower()
        base = str(request.args.get('base') or 'ETH').upper()
        expiry = int(request.args.get('expiry'))
        limit = int(request.args.get('limit') or 2000)
        threshold = float(request.args.get('threshold') or 0.01)
        rows = await query_atm_iv_series(exchange=exchange, base=base, expiry=expiry, limit=limit, atm_threshold_pct=threshold)
        return jsonify({"status": True, "data": rows})
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=APP_PORT, debug=False)


