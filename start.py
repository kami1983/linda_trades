from datetime import datetime
import ccxt.async_support as ccxt


# 读取 .env 文件 的 key 和 secret
import ccxt.async_support as ccxt
import os
import aiomysql

from db_operation import updateDbSwapPrice
from dotenv import load_dotenv
from fetch_ticker import *
from unitls import timeToStr
load_dotenv()

key = os.getenv('OKEX_API_KEY')
secret = os.getenv('OKEX_API_SECRET')
password = os.getenv('OKEX_API_PASSWORD')

mysql_user = os.getenv('MYSQL_USER')
mysql_password = os.getenv('MYSQL_PASSWORD')
mysql_host = os.getenv('MYSQL_HOST')
mysql_port = int(os.getenv('MYSQL_PORT', 3306))



exchange = ccxt.okx({
    'apiKey': key,
    'secret': secret,
    'password': password,
})


# 获取账户余额
import asyncio



async def main():
    # 创建数据库连接
    connection = await aiomysql.connect(
        host=mysql_host,   
        port=mysql_port,
        user=mysql_user,
        password=mysql_password,
        db='linda_trades',   
    )


    print('aiomysql - A', connection)
    
    # 获取账户余额，并记录到数据库
    await recordTokenPrice(connection, exchange)
    
    print('aiomysql - B', connection)

    connection.close()
    await exchange.close()

asyncio.run(main())

