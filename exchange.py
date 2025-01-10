
import os

import ccxt.async_support as ccxt
from dotenv import load_dotenv
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