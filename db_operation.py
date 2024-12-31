from datetime import datetime
import os

# 插入或更新数据库中的 swap price 数据
from typing import List, Optional
from db_struct import EResultOKXOrder, EResultOptionChain, EResultSwapPrice
from log import recordLog
from unitls import timeToStr
import aiomysql

from dotenv import load_dotenv
load_dotenv()

mysql_user = os.getenv('MYSQL_USER')
mysql_password = os.getenv('MYSQL_PASSWORD')
mysql_host = os.getenv('MYSQL_HOST')
mysql_port = int(os.getenv('MYSQL_PORT', 3306))
mysql_dbname = os.getenv('MYSQL_DBNAME')


async def getDbConn():
    connection = await aiomysql.connect(
        host=mysql_host,   
        port=mysql_port,
        user=mysql_user,
        password=mysql_password,
        db=mysql_dbname,   
    )
    return connection


async def getDbSwapPrice(symbol: str) -> Optional[EResultSwapPrice]:

    connection = await getDbConn()
    '''
    从数据库中获取 swap price 数据
    @param connection: 数据库连接
    @param symbol: 交易对 BTC/USD:BTC | ETH/USD:ETH
    @return: EResultSwapPrice
    '''
    async with connection.cursor() as cursor:
        # symbol=1, last='BTC/USD:BTC', bid=67115.2, ask=67115.1, high=67115.2, low=67360.5, timestamp=66666.0, datetime=1729999842614, type='2024-10-27 11:30:42', status=
        await cursor.execute("SELECT symbol, last, bid, ask, high, low, timestamp, datetime, type, status FROM swap_price WHERE symbol = %s", (symbol,))
        result = await cursor.fetchone()
        if result:
            return EResultSwapPrice(
                symbol=result[0],
                last=result[1],
                bid=result[2],
                ask=result[3],
                high=result[4],
                low=result[5],
                timestamp=int(result[6])/1000,
                datetime=result[7],
                type=result[8],
                status=result[9]
            )
        connection.close()
        return None


async def updateDbSwapPrice(data: EResultSwapPrice):
    connection = await getDbConn()
    '''
    更新数据库中的 swap price 数据
    @param data: EResultSwapPrice
    '''
    async with connection.cursor() as cursor:
        insert_query = """
        INSERT INTO swap_price (symbol, last, bid, ask, high, low, timestamp, datetime, type, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) AS new_values
        ON DUPLICATE KEY UPDATE 
            last = new_values.last,
            bid = new_values.bid,
            ask = new_values.ask,
            high = new_values.high,
            low = new_values.low,
            timestamp = new_values.timestamp,
            datetime = new_values.datetime,
            type = new_values.type,
            status = new_values.status
        """
        await cursor.execute(insert_query, (
            data.symbol,
            data.last,
            data.bid,
            data.ask,
            data.high,
            data.low,
            data.timestamp,
            timeToStr(data.timestamp),
            data.type or 1,
            data.status or 1
        ))
    await connection.commit()
    connection.close()



async def updateDbBatchOptionChain(datalist: List[EResultOptionChain], batch_size: int = 50):
    """
    批量更新数据库中的 option chain 数据
    @param datalist: EResultOptionChain[]
    @param batch_size: 每批次插入的记录数量，默认为 200
    """

    # 获取数据库连接
    connection = await getDbConn()
    
    # 分批插入数据
    for i in range(0, len(datalist), batch_size):
        batch = datalist[i:i + batch_size]
        # print(f"Inserting/Updating batch {batch[0].symbol}, {i // batch_size + 1} of {len(datalist) // batch_size + 1}")
        recordLog(f"Inserting/Updating batch {batch[0].symbol}, {i // batch_size + 1} of {len(datalist) // batch_size + 1}")
 
        async with connection.cursor() as cursor:
            # 构建批量插入或更新的 SQL 查询
            insert_query = """
            INSERT INTO option_chain (
                symbol, timestamp, year, month, day, expiration_date, strike, option_type, bid_price, 
                bid_size, ask_price, ask_size, last_price, last_size, type, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            AS new_values
            ON DUPLICATE KEY UPDATE
                timestamp = new_values.timestamp,
                year = new_values.year,
                month = new_values.month,
                day = new_values.day,
                expiration_date = new_values.expiration_date,
                strike = new_values.strike,
                option_type = new_values.option_type,
                bid_price = new_values.bid_price,
                bid_size = new_values.bid_size,
                ask_price = new_values.ask_price,
                ask_size = new_values.ask_size,
                last_price = new_values.last_price,
                last_size = new_values.last_size,
                type = new_values.type,
                status = new_values.status
            """
        
            # 将每个批次的数据转换为元组格式
            values = [
                (
                    item.symbol, item.timestamp, item.year, item.month, item.day,
                    item.expiration_date, item.strike, item.option_type, item.bid_price, item.bid_size,
                    item.ask_price, item.ask_size, item.last_price, item.last_size,
                    item.type, item.status
                ) for item in batch
            ]
            
            # 执行批量插入或更新
            await cursor.executemany(insert_query, values)
            
            # 提交更改
            await connection.commit()

    connection.close()


# 给定某个时间戳，通过这个时间戳获取，符合日期的一组期权链数据，数据从数据表 option_chain 中获取
async def getRecentOptionChainByTimestamp(timestamp: int, code: str, offset_day=0) -> dict['expairation_date': str, 'data': List[EResultOptionChain]]: 
    """
    给定某个时间戳，通过这个时间戳获取最近的一个期权链数据
    @param timestamp: 时间戳
    @return: EResultOptionChain
    """

    # 时间戳加上偏移时间
    timestamp = timestamp + offset_day * 86400

    expiration_date = datetime.fromtimestamp(timestamp).strftime('%Y%m%d')[2:]
    type = 1 if code == 'BTC' else 2 if code == 'ETH' else 0
    if type == 0:
        raise Exception('Invalid code, code must be BTC or ETH')
        
    
    connection = await getDbConn()
    # 查询距离给定时间戳最近的期权链数据，大致等于这个SQL语句：SELECT expiration_date FROM option_chain where expiration_date>241103 group by expiration_date order by expiration_date asc limit 0,1
    async with connection.cursor() as cursor:
        await cursor.execute(
            "SELECT expiration_date FROM option_chain WHERE expiration_date >= %s AND type = %s GROUP BY expiration_date ORDER BY expiration_date ASC", (expiration_date, type)
        )
        result = await cursor.fetchone()
        if result:
            expiration_date = result[0]
        else:
            return {'expiration_date': expiration_date, 'data': []}
        
    # 查询符合日期的期权链数据
    # print("New from expiration_date:", expiration_date)

    async with connection.cursor() as cursor:
        await cursor.execute(
            "SELECT symbol, timestamp, year, month, day, expiration_date, strike, option_type, bid_price, bid_size, ask_price, ask_size, last_price, last_size, type, status FROM option_chain WHERE expiration_date = %s AND type = %s", (expiration_date, type)
        )
        result = await cursor.fetchall()
        connection.close()
        res_list= [
            EResultOptionChain(
                symbol=item[0],
                timestamp=item[1],
                year=item[2],
                month=item[3],
                day=item[4],
                expiration_date=item[5],
                strike=item[6],
                option_type=item[7],
                bid_price=item[8],
                bid_size=item[9],
                ask_price=item[10],
                ask_size=item[11],
                last_price=item[12],
                last_size=item[13],
                type=item[14],
                status=item[15]
            ) for item in result
        ]
    
    return {'expiration_date': expiration_date, 'data': res_list}

# 给定某个期权的行权日比如 241129 返回其T型数据
async def getOptionChainByExpirationDate(expiration_date: str, code: str) -> List[EResultOptionChain]:
    """
    给定某个期权的行权日比如 241129 返回其T型数据
    @param expiration_date: 期权的行权日
    @return: EResultOptionChain[]
    """
    type = 1 if code == 'BTC' else 2 if code == 'ETH' else 0
    if type == 0:
        raise Exception('Invalid code, code must be BTC or ETH')
    
    connection = await getDbConn()
    async with connection.cursor() as cursor:
        # 注意需要按照行权价格进行排序 strike
        await cursor.execute(
            "SELECT symbol, timestamp, year, month, day, expiration_date, strike, option_type, bid_price, bid_size, ask_price, ask_size, last_price, last_size, type, status FROM option_chain WHERE expiration_date = %s AND type = %s ORDER BY strike ASC", (expiration_date, type)
        )
        result = await cursor.fetchall()
        connection.close()
        return [
            EResultOptionChain(
                symbol=item[0],
                timestamp=item[1],
                year=item[2],
                month=item[3],
                day=item[4],
                expiration_date=item[5],
                strike=item[6],
                option_type=item[7],
                bid_price=item[8],
                bid_size=item[9],
                ask_price=item[10],
                ask_size=item[11],
                last_price=item[12],
                last_size=item[13],
                type=item[14],
                status=item[15]
            ) for item in result
        ]
    
'''
inst_type: str
    inst_id: str
    tgt_ccy: str
    ccy: str
    ord_id: str
    cl_ord_id: str
    algo_cl_ord_id: str
    algo_id: str
    tag: str
    px: float
    sz: float
    notional_usd: float
    ord_type: str
    side: str
    pos_side: str
    td_mode: str
    acc_fill_sz: float
    fill_notional_usd: float
    avg_px: float
    state: str
    lever: float
    pnl: float
    fee_ccy: str
    fee: float
    rebate_ccy: str
    rebate: float
    category: str
    u_time: int
    c_time: int
    source: str
    reduce_only: str
    cancel_source: str
    quick_mgn_type: str
    stp_id: str
    stp_mode: str
    attach_algo_cl_ord_id: str
    last_px: float
    is_tp_limit: str
    sl_trigger_px: float
    sl_trigger_px_type: str
    tp_ord_px: float
    tp_trigger_px: float
    tp_trigger_px_type: str
    sl_ord_px: float
    fill_px: float
    trade_id: str
    fill_sz: float
    fill_time: int
    fill_pnl: float
    fill_fee: float
    fill_fee_ccy: str
    exec_type: str
    fill_px_vol: float
    fill_px_usd: float
    fill_mark_vol: float
    fill_fwd_px: float
    fill_mark_px: float
    amend_source: str
    req_id: str
    amend_result: str
    code: str
    msg: str
    px_type: str
    px_usd: float
    px_vol: float
    linked_algo_ord_algo_id: str
    attach_algo_ords: str
'''
async def updateDbOKXOrder(data: EResultOKXOrder):
    """
    更新数据库中的 OKX 订单数据
    @param data: EResultOKXOrder
    """
    connection = await getDbConn()
    async with connection.cursor() as cursor:
        insert_query = """
        INSERT INTO okx_order (
            inst_type, inst_id, tgt_ccy, ccy, ord_id, cl_ord_id, algo_cl_ord_id, algo_id, tag, px, sz, notional_usd, ord_type, side, pos_side, td_mode, acc_fill_sz, fill_notional_usd, avg_px, state, lever, pnl, fee_ccy, fee, rebate_ccy, rebate, category, u_time, c_time, source, reduce_only, cancel_source, quick_mgn_type, stp_id, stp_mode, attach_algo_cl_ord_id, last_px, is_tp_limit, sl_trigger_px, sl_trigger_px_type, tp_ord_px, tp_trigger_px, tp_trigger_px_type, sl_ord_px, fill_px, trade_id, fill_sz, fill_time, fill_pnl, fill_fee, fill_fee_ccy, exec_type, fill_px_vol, fill_px_usd, fill_mark_vol, fill_fwd_px, fill_mark_px, amend_source, req_id, amend_result, code, msg, px_type, px_usd, px_vol, linked_algo_ord_algo_id, attach_algo_ords
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
        """
        await cursor.execute(insert_query, (
            data.inst_type, data.inst_id, data.tgt_ccy, data.ccy, data.ord_id, data.cl_ord_id, data.algo_cl_ord_id, data.algo_id, data.tag, data.px, data.sz, data.notional_usd, data.ord_type, data.side, data.pos_side, data.td_mode, data.acc_fill_sz, data.fill_notional_usd, data.avg_px, data.state, data.lever, data.pnl, data.fee_ccy, data.fee, data.rebate_ccy, data.rebate, data.category, data.u_time, data.c_time, data.source, data.reduce_only, data.cancel_source, data.quick_mgn_type, data.stp_id, data.stp_mode, data.attach_algo_cl_ord_id, data.last_px, data.is_tp_limit, data.sl_trigger_px, data.sl_trigger_px_type, data.tp_ord_px, data.tp_trigger_px, data.tp_trigger_px_type, data.sl_ord_px, data.fill_px, data.trade_id, data.fill_sz, data.fill_time, data.fill_pnl, data.fill_fee, data.fill_fee_ccy, data.exec_type, data.fill_px_vol, data.fill_px_usd, data.fill_mark_vol, data.fill_fwd_px, data.fill_mark_px, data.amend_source, data.req_id, data.amend_result, data.code, data.msg, data.px_type, data.px_usd, data.px_vol, data.linked_algo_ord_algo_id, data.attach_algo_ords
        ))
        await connection.commit()
    connection.close()

