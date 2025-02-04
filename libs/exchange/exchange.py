
import os

import ccxt.async_support as ccxt
from dotenv import load_dotenv
from libs.exchange.fetch_options import fetchPostions
load_dotenv()

key = os.getenv('OKEX_API_KEY')
secret = os.getenv('OKEX_API_SECRET')
password = os.getenv('OKEX_API_PASSWORD')
is_sandbox = os.getenv('OKEX_IS_SANDBOX')

def createExchangeConn():

    exchange = ccxt.okx({
        'apiKey': key,
        'secret': secret,
        'password': password,
        # 'verbose': True 
    })

    
    # exchange.private_get_trade_orders_history()

    if is_sandbox == '1':
        exchange.set_sandbox_mode(True)
    return exchange


# 获取 OKX 订单数据
async def fetch_orders():
    """
    获取我的期权订单
    """
    try:
        exchange = createExchangeConn()
        positions = await fetchPostions(exchange)  
        return {"status": True, "data": positions}  
    except Exception as e:
        return {"status": False, "message": e.args[0]}
    finally:
        await exchange.close()

async def account_balance():
    """
    获取账户余额
    """
    try:
        exchange = createExchangeConn()
        balance = await exchange.fetch_balance()
        res = {
            "status": True,
            "data": {
                "total": balance['total'],
                "free": balance['free'],
                "used": balance['used'],
                "timestamp": balance['timestamp']
            }
        }
        return res
    except Exception as e:
        return {"status": False, "message": str(e)}  
    finally:
        await exchange.close()