from datetime import datetime
import os

# 插入或更新数据库中的 swap price 数据
from typing import List, Optional
from libs.database.db_struct import EResultOKXOrder, EResultOptionChain, EResultSwapPrice
from libs.units.log import recordLog
from libs.units.unitls import timeToStr
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
    

async def getRecordedOrderList() -> List[dict]:
    """
    查询订单信息
    acc_fill_sz	0.0	2.0	累计成交数量从 0.0 变为 2.0。
    fill_notional_usd	0.0	1957.66	成交名义价值从 0.0 变为 1957.66。
    avg_px	0.0	0.0245	平均成交价格从 0.0 变为 0.0245。
    state	'live'	'filled'	订单状态从 live 变为 filled。
    pnl	0.0	-2e-05	盈亏从 0.0 变为 -2e-05。
    fee	0.0	-6e-06	手续费从 0.0 变为 -6e-06。
    fill_px	0.0	0.0245	成交价格从 0.0 变为 0.0245。
    trade_id	''	'3'	成交 ID 从空值变为 '3'。
    fill_sz	0.0	2.0	成交数量从 0.0 变为 2.0。
    fill_time	0	1735965493919	成交时间从 0 变为 1735965493919。
    fill_pnl	0.0	-2e-05	成交盈亏从 0.0 变为 -2e-05。
    fill_fee	0.0	-6e-06	成交手续费从 0.0 变为 -6e-06。
    fill_fee_ccy	''	'BTC'	成交手续费币种从空值变为 'BTC'。
    exec_type	''	'T'	执行类型从空值变为 'T'。
    fill_px_vol	0.0	0.454110654296875	成交价格波动从 0.0 变为 0.454110654296875。
    fill_px_usd	0.0	2398.1335	成交价格（USD）从 0.0 变为 2398.1335。
    fill_mark_vol	0.0	0.4406829467773438	成交标记波动从 0.0 变为 0.4406829467773438。
    fill_fwd_px	0.0	98768.25	成交远期价格从 0.0 变为 98768.25。
    fill_mark_px	0.0	0.024165055314007245	成交标记价格从 0.0 变为 0.024165055314007245。
    u_time	1735965493918	1735965493919	更新时间从 1735965493918 变为 1735965493919。
    last_px	0.0235	0.0245	最新价格从 0.0235 变为 0.0245。
    @return: 订单信息列表
    """
    
    connection = await getDbConn()
    try:
        async with connection.cursor() as cursor:
            await cursor.execute(
                "SELECT acc_fill_sz, fill_notional_usd, avg_px, state, pnl, fee, fill_px, trade_id, fill_sz, fill_time, fill_pnl, fill_fee, fill_fee_ccy, exec_type, fill_px_vol, fill_px_usd, fill_mark_vol, fill_fwd_px, fill_mark_px, u_time, last_px, inst_id, ord_id, side FROM okx_orders Order by id desc"
            )
            result = await cursor.fetchall()
            return [{
                'acc_fill_sz': row[0],
                'fill_notional_usd': row[1],
                'avg_px': row[2],
                'state': row[3],
                'pnl': row[4],
                'fee': row[5],
                'fill_px': row[6],
                'trade_id': row[7],
                'fill_sz': row[8],
                'fill_time': row[9],
                'fill_pnl': row[10],
                'fill_fee': row[11],
                'fill_fee_ccy': row[12],
                'exec_type': row[13],
                'fill_px_vol': row[14],
                'fill_px_usd': row[15],
                'fill_mark_vol': row[16],
                'fill_fwd_px': row[17],
                'fill_mark_px': row[18],
                'u_time': row[19],
                'last_px': row[20],
                'inst_id': row[21],
                'ord_id': row[22],
                'side': row[23]
            } for row in result]
    finally:
        connection.close()

async def OrderResultToDb(data: EResultOKXOrder):
    '''
    更新时候会变化的字段：
    acc_fill_sz	0.0	2.0	累计成交数量从 0.0 变为 2.0。
    fill_notional_usd	0.0	1957.66	成交名义价值从 0.0 变为 1957.66。
    avg_px	0.0	0.0245	平均成交价格从 0.0 变为 0.0245。
    state	'live'	'filled'	订单状态从 live 变为 filled。
    pnl	0.0	-2e-05	盈亏从 0.0 变为 -2e-05。
    fee	0.0	-6e-06	手续费从 0.0 变为 -6e-06。
    fill_px	0.0	0.0245	成交价格从 0.0 变为 0.0245。
    trade_id	''	'3'	成交 ID 从空值变为 '3'。
    fill_sz	0.0	2.0	成交数量从 0.0 变为 2.0。
    fill_time	0	1735965493919	成交时间从 0 变为 1735965493919。
    fill_pnl	0.0	-2e-05	成交盈亏从 0.0 变为 -2e-05。
    fill_fee	0.0	-6e-06	成交手续费从 0.0 变为 -6e-06。
    fill_fee_ccy	''	'BTC'	成交手续费币种从空值变为 'BTC'。
    exec_type	''	'T'	执行类型从空值变为 'T'。
    fill_px_vol	0.0	0.454110654296875	成交价格波动从 0.0 变为 0.454110654296875。
    fill_px_usd	0.0	2398.1335	成交价格（USD）从 0.0 变为 2398.1335。
    fill_mark_vol	0.0	0.4406829467773438	成交标记波动从 0.0 变为 0.4406829467773438。
    fill_fwd_px	0.0	98768.25	成交远期价格从 0.0 变为 98768.25。
    fill_mark_px	0.0	0.024165055314007245	成交标记价格从 0.0 变为 0.024165055314007245。
    u_time	1735965493918	1735965493919	更新时间从 1735965493918 变为 1735965493919。
    last_px	0.0235	0.0245	最新价格从 0.0235 变为 0.0245。
    '''
    connection = await getDbConn()
    try:
        async with connection.cursor() as cursor:
            # 检查订单是否已存在，并且新的 u_time 大于数据库中的 u_time
            check_query = "SELECT ord_id, u_time FROM okx_orders WHERE ord_id = %s"
            await cursor.execute(check_query, (data.ord_id,))  # 注意这里的逗号
            existing_order = await cursor.fetchone()

            if existing_order:
                existing_u_time = existing_order[1]  # 获取数据库中的 u_time
                if data.u_time > existing_u_time:
                    # 如果新的 u_time 大于数据库中的 u_time，执行更新操作
                    update_query = """
                    UPDATE okx_orders SET
                        api_key = %s,
                        inst_type = %s,
                        inst_id = %s,
                        tgt_ccy = %s,
                        ccy = %s,
                        cl_ord_id = %s,
                        algo_cl_ord_id = %s,
                        algo_id = %s,
                        tag = %s,
                        px = %s,
                        sz = %s,
                        notional_usd = %s,
                        ord_type = %s,
                        side = %s,
                        pos_side = %s,
                        td_mode = %s,
                        acc_fill_sz = %s,
                        fill_notional_usd = %s,
                        avg_px = %s,
                        state = %s,
                        lever = %s,
                        pnl = %s,
                        fee_ccy = %s,
                        fee = %s,
                        rebate_ccy = %s,
                        rebate = %s,
                        category = %s,
                        u_time = %s,
                        c_time = %s,
                        source = %s,
                        reduce_only = %s,
                        cancel_source = %s,
                        quick_mgn_type = %s,
                        stp_id = %s,
                        stp_mode = %s,
                        attach_algo_cl_ord_id = %s,
                        last_px = %s,
                        is_tp_limit = %s,
                        sl_trigger_px = %s,
                        sl_trigger_px_type = %s,
                        tp_ord_px = %s,
                        tp_trigger_px = %s,
                        tp_trigger_px_type = %s,
                        sl_ord_px = %s,
                        fill_px = %s,
                        trade_id = %s,
                        fill_sz = %s,
                        fill_time = %s,
                        fill_pnl = %s,
                        fill_fee = %s,
                        fill_fee_ccy = %s,
                        exec_type = %s,
                        fill_px_vol = %s,
                        fill_px_usd = %s,
                        fill_mark_vol = %s,
                        fill_fwd_px = %s,
                        fill_mark_px = %s,
                        amend_source = %s,
                        req_id = %s,
                        amend_result = %s,
                        code = %s,
                        msg = %s,
                        px_type = %s,
                        px_usd = %s,
                        px_vol = %s,
                        linked_algo_ord_algo_id = %s,
                        attach_algo_ords = %s
                    WHERE ord_id = %s
                    """
                    await cursor.execute(update_query, (
                        data.api_key,
                        data.inst_type,
                        data.inst_id,
                        data.tgt_ccy,
                        data.ccy,
                        data.cl_ord_id,
                        data.algo_cl_ord_id,
                        data.algo_id,
                        data.tag,
                        data.px,
                        data.sz,
                        data.notional_usd,
                        data.ord_type,
                        data.side,
                        data.pos_side,
                        data.td_mode,
                        data.acc_fill_sz,
                        data.fill_notional_usd,
                        data.avg_px,
                        data.state,
                        data.lever,
                        data.pnl,
                        data.fee_ccy,
                        data.fee,
                        data.rebate_ccy,
                        data.rebate,
                        data.category,
                        data.u_time,
                        data.c_time,
                        data.source,
                        data.reduce_only,
                        data.cancel_source,
                        data.quick_mgn_type,
                        data.stp_id,
                        data.stp_mode,
                        data.attach_algo_cl_ord_id,
                        data.last_px,
                        data.is_tp_limit,
                        data.sl_trigger_px,
                        data.sl_trigger_px_type,
                        data.tp_ord_px,
                        data.tp_trigger_px,
                        data.tp_trigger_px_type,
                        data.sl_ord_px,
                        data.fill_px,
                        data.trade_id,
                        data.fill_sz,
                        data.fill_time,
                        data.fill_pnl,
                        data.fill_fee,
                        data.fill_fee_ccy,
                        data.exec_type,
                        data.fill_px_vol,
                        data.fill_px_usd,
                        data.fill_mark_vol,
                        data.fill_fwd_px,
                        data.fill_mark_px,
                        data.amend_source,
                        data.req_id,
                        data.amend_result,
                        data.code,
                        data.msg,
                        data.px_type,
                        data.px_usd,
                        data.px_vol,
                        data.linked_algo_ord_algo_id,
                        data.attach_algo_ords,
                        data.ord_id  # WHERE 条件
                    ))
                else:
                    # 如果新的 u_time 小于或等于数据库中的 u_time，不执行更新
                    print(f"Order {data.ord_id} has an older u_time, skipping update.")
            else:

                # Insert list 
                insert_list = [
                    "api_key", "inst_type", "inst_id", "tgt_ccy", "ccy", "ord_id", "cl_ord_id", "algo_cl_ord_id", "algo_id", "tag", 
                    "px", "sz", "notional_usd", "ord_type", "side", "pos_side", "td_mode", "acc_fill_sz", "fill_notional_usd", "avg_px", 
                    "state", "lever", "pnl", "fee_ccy", "fee", "rebate_ccy", "rebate", "category", "u_time", "c_time", 
                    "source", "reduce_only", "cancel_source", "quick_mgn_type", "stp_id", "stp_mode", "attach_algo_cl_ord_id", "last_px", "is_tp_limit", "sl_trigger_px", 
                    "sl_trigger_px_type", "tp_ord_px", "tp_trigger_px", "tp_trigger_px_type", "sl_ord_px", "fill_px", "trade_id", "fill_sz", "fill_time", "fill_pnl", 
                    "fill_fee", "fill_fee_ccy", "exec_type", "fill_px_vol", "fill_px_usd", "fill_mark_vol", "fill_fwd_px", "fill_mark_px", "amend_source", "req_id", 
                    "amend_result", "code", "msg", "px_type", "px_usd", "px_vol", "linked_algo_ord_algo_id", "attach_algo_ords"
                ]

                # 通过 insert_list 构建插入的字段列表
                insert_fields = ', '.join(insert_list)
                insert_values = ', '.join(['%s' for _ in insert_list])
                real_value = [getattr(data, field) for field in insert_list]
                
                # print(f"insert_fields: {insert_fields}")
                # print(f"insert_values: {insert_values}")
                # print(f"insert_value: {real_value}")

                # 如果订单不存在，执行插入操作
                insert_query = """
                INSERT INTO okx_orders (
                    {insert_fields}
                ) VALUES (
                    {insert_values}
                )
                """
                # formatted_query = insert_query.format(insert_fields=insert_fields, insert_values=insert_values)
                # query_to_debug = cursor.mogrify(formatted_query, real_value)
                # print(f"Query to execute: {query_to_debug}")
                await cursor.execute(insert_query.format(insert_fields=insert_fields, insert_values=insert_values), real_value)
            await connection.commit()
    except Exception as e:
        print(f"Error during database operation: {e}")
    finally:
        connection.close()
