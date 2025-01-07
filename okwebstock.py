import os

import asyncio
from db_operation import OrderResultToDb
from db_struct import CreateOrderResult
import websockets
import json
import hmac
import base64
import time

from dotenv import load_dotenv
load_dotenv()

key = os.getenv('OKEX_API_KEY')
secret = os.getenv('OKEX_API_SECRET')
password = os.getenv('OKEX_API_PASSWORD')
is_sandbox = os.getenv('OKEX_IS_SANDBOX')
ok_web_socket_url = os.getenv('OK_WEB_SOCKET_URL')

print(key, is_sandbox)

# 配置 OKX API 密钥
API_KEY = key
API_SECRET = secret
PASSPHRASE = password
OK_WEB_SOCKET_URL = ok_web_socket_url

# OKX WebSocket 地址
# URL = "wss://ws.okx.com:8443/ws/v5/private"
# URL = "wss://wspap.okx.com:8443/ws/v5/private"

# 创建签名方法
def create_okx_signature(api_key, api_secret, passphrase):
    timestamp = str(time.time())
    message = timestamp + 'GET' + '/users/self/verify'
    hmac_key = hmac.new(api_secret.encode(), message.encode(), 'sha256').digest()
    signature = base64.b64encode(hmac_key).decode()
    return timestamp, signature

# 监听订单状态
async def listen_orders():
    async with websockets.connect(URL) as websocket:
        # 创建签名
        timestamp, signature = create_okx_signature(API_KEY, API_SECRET, PASSPHRASE)

        # 登录消息
        login_msg = {
            "op": "login",
            "args": [
                {
                    "apiKey": API_KEY,
                    "passphrase": PASSPHRASE,
                    "timestamp": timestamp,
                    "sign": signature,
                }
            ],
        }
        await websocket.send(json.dumps(login_msg))
        login_response = await websocket.recv()
        print("Login Response:", login_response)

        # 订阅订单通道
        subscribe_msg = {
            "op": "subscribe",
            "args": [
                {
                    "channel": "orders",
                    "instType": "OPTION",  # 可选值：SPOT（现货）、SWAP（永续）、FUTURES（期货）、OPTION（期权）
                }
            ],
        }
        await websocket.send(json.dumps(subscribe_msg))
        subscribe_response = await websocket.recv()
        print("Subscribe Response:", subscribe_response)

        # 实时监听订单状态
        while True:
            try:
                message = await websocket.recv()
                data = json.loads(message)

                # 根据订单状态处理
                if "data" in data:
                    for order in data["data"]:
                        state = order.get("state")
                        if state == "live":
                            print("==============================")
                            # print("Order Created:", order)
                            # 将 order 字典中的数据映射到 EResultOKXOrder 实例
                            data =CreateOrderResult(API_KEY, order)
                            print("DbStruct:", data)
                            await OrderResultToDb(data)
                        elif state == "canceled":
                            print("==============================")
                            # print("Order Canceled:", order)
                            data =CreateOrderResult(API_KEY, order)
                            print("DbStruct:", data)
                            await OrderResultToDb(data)
                        elif state == "filled":
                            print("==============================")
                            # print("Order Filled:", order)
                            data =CreateOrderResult(API_KEY, order)
                            print("DbStruct:", data)
                            await OrderResultToDb(data)
            except Exception as e:
                print("Error:", e)
                break

# 运行 WebSocket 监听
asyncio.run(listen_orders())
