
import os

import ccxt.async_support as ccxt
from dotenv import load_dotenv
load_dotenv()

key = os.getenv('OKEX_API_KEY')
secret = os.getenv('OKEX_API_SECRET')
password = os.getenv('OKEX_API_PASSWORD')

def createExchangeConn():

    exchange = ccxt.okx({
        'apiKey': key,
        'secret': secret,
        'password': password
    })
    return exchange