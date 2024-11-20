import asyncio
import os
from urllib import request
from db_operation import getOptionChainByExpirationDate, getRecentOptionChainByTimestamp
# from flask import Flask, jsonify, request
from exchange import createExchangeConn
from fetch_options import fetchOptionChain
from fetch_ticker import fetchTicker
from iv import calculateIvData, extractIvData
from quart import Quart, jsonify, request
# from flask_cors import CORS
from quart_cors import cors
import traceback

from unitls import getCrrrentTime, selectOptions

APP_PORT = os.getenv('APP_PORT', 5000)

# app = Flask(__name__)
app = Quart(__name__)
# CORS(app)
app = cors(app, allow_origin="*")

@app.route('/api/data')
def get_data():
    return jsonify({"message": "Hello from Flask!"})




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
@app.route('/api/my_option_orders')
async def get_my_option_orders():
    '''
    获取我的期权订单
    '''
    try:
        exchange = createExchangeConn()
        # async def fetch_open_orders(self, symbol: Str = None, since: Int = None, limit: Int = None, params={}) -> List[Order]:
        # markets =await exchange.load_markets()
        # print('markets:', markets) # 打印全部的市场信息，symbol='BTC/USD:BTC-241129'
        open_orders = await exchange.fetch_open_orders()
        # orders1 = await exchange.fetch_my_trades()
        # orders2 = await exchange.fetch_closed_orders()
        positions = await exchange.fetch_positions()
        # orders = await exchange.fetch_orders(symbol='BTC/USD:BTC')
        # print('orders:', [orders1, orders2])
        return jsonify({"status": True, "positions": positions, "open_orders": open_orders})
    except Exception as e:
        return jsonify({"status": False, "message": e.args[0]})
    finally:
        await exchange.close()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=APP_PORT, debug=True)


