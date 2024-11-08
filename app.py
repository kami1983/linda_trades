import os
from urllib import request
from db_operation import getRecentOptionChainByTimestamp
# from flask import Flask, jsonify, request
from quart import Quart, jsonify, request
# from flask_cors import CORS
from quart_cors import cors

from unitls import getCrrrentTime

APP_PORT = os.getenv('APP_PORT', 5000)

# app = Flask(__name__)
app = Quart(__name__)
# CORS(app)
app = cors(app, allow_origin="*")

@app.route('/api/data')
def get_data():
    return jsonify({"message": "Hello from Flask!"})

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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=APP_PORT, debug=True)
