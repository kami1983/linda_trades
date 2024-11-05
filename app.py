from urllib import request
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/data')
def get_data():
    return jsonify({"message": "Hello from Flask!"})

@app.route('/api/iv_data')
def get_iv_data():
    # 获取URL参数
    symbol = request.args.get('symbol')
    flag= request.args.get('flag')
    index= int(request.args.get('index'))
    print(f"symbol: {symbol}")
    # timestamp, current_price, buy_iv, sell_iv
    res_data = [
        [1730786255, 2500, 0.82, 0.92],
      [1730886255, 2400, 0.62, 0.42],
      [1730986255, 2544, 0.72, 0.82],
      [1731086255, 2422, 0.52, 0.42],
      [1731186255, 2231, 0.52, 0.72],
      [1731286255, 1233, 0.82, 0.102],
    ]
    if -1 == index:
        return jsonify(res_data)
    else:
        if len(res_data) <= int(index):
            return jsonify([])
        return jsonify([res_data[index]])

if __name__ == "__main__":
    app.run(debug=True)
