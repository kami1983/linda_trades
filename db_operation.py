

# 插入或更新数据库中的 swap price 数据
from db_struct import EResultSwapPrice
from unitls import timeToStr


async def updateDbSwapPrice(connection, data: EResultSwapPrice):
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