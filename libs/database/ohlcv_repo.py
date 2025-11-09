import asyncio
from typing import Iterable, List, Optional, Tuple

from libs.database.db_operation import getDbConn


async def upsert_market_symbol_meta(items: List[dict]) -> None:
    """
    批量写入/更新 market_symbol_meta
    需要字段：exchange, symbol, base, quote, market_type, first_seen_ts, last_seen_ts, is_active
    唯一键：(exchange, symbol)
    """
    if not items:
        return

    connection = await getDbConn()
    try:
        async with connection.cursor() as cursor:
            insert_sql = (
                """
                INSERT INTO market_symbol_meta (
                    exchange, symbol, base, quote, market_type, first_seen_ts, last_seen_ts, is_active
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s) AS new_values
                ON DUPLICATE KEY UPDATE
                    base = new_values.base,
                    quote = new_values.quote,
                    market_type = new_values.market_type,
                    first_seen_ts = LEAST(COALESCE(market_symbol_meta.first_seen_ts, new_values.first_seen_ts), new_values.first_seen_ts),
                    last_seen_ts = GREATEST(COALESCE(market_symbol_meta.last_seen_ts, new_values.last_seen_ts), new_values.last_seen_ts),
                    is_active = new_values.is_active
                """
            )

            values: List[Tuple] = [
                (
                    item.get("exchange"),
                    item.get("symbol"),
                    item.get("base"),
                    item.get("quote"),
                    item.get("market_type", "spot"),
                    item.get("first_seen_ts"),
                    item.get("last_seen_ts"),
                    int(item.get("is_active", 1)),
                )
                for item in items
            ]

            await cursor.executemany(insert_sql, values)
        await connection.commit()
    finally:
        connection.close()


async def upsert_market_daily_ohlcv(rows: List[dict]) -> None:
    """
    批量写入/更新 market_daily_ohlcv
    需要字段：exchange, symbol, base, quote, market_type, timeframe, open, high, low, close, volume, turnover, trades, timestamp(ms), datetime, status
    唯一键：(exchange, symbol, timeframe, timestamp)
    """
    if not rows:
        return

    connection = await getDbConn()
    try:
        async with connection.cursor() as cursor:
            insert_sql = (
                """
                INSERT INTO market_daily_ohlcv (
                    exchange, symbol, base, quote, market_type, timeframe,
                    open, high, low, close, volume, turnover, trades,
                    timestamp, datetime, status
                ) VALUES (
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s
                ) AS new_values
                ON DUPLICATE KEY UPDATE
                    open = new_values.open,
                    high = new_values.high,
                    low = new_values.low,
                    close = new_values.close,
                    volume = new_values.volume,
                    turnover = new_values.turnover,
                    trades = new_values.trades,
                    datetime = new_values.datetime,
                    status = new_values.status
                """
            )

            values: List[Tuple] = [
                (
                    r.get("exchange"),
                    r.get("symbol"),
                    r.get("base"),
                    r.get("quote"),
                    r.get("market_type", "spot"),
                    r.get("timeframe", "1d"),
                    float(r.get("open")),
                    float(r.get("high")),
                    float(r.get("low")),
                    float(r.get("close")),
                    None if r.get("volume") is None else float(r.get("volume")),
                    None if r.get("turnover") is None else float(r.get("turnover")),
                    None if r.get("trades") is None else int(r.get("trades")),
                    int(r.get("timestamp")),
                    r.get("datetime"),
                    int(r.get("status", 1)),
                )
                for r in rows
            ]

            await cursor.executemany(insert_sql, values)
        await connection.commit()
    finally:
        connection.close()


async def get_last_daily_ts(exchange: str, symbol: str, timeframe: str = "1d") -> Optional[int]:
    """
    获取指定交易所/品种/时间粒度在 market_daily_ohlcv 的最新一条 timestamp（ms）
    用于断点续跑。
    """
    connection = await getDbConn()
    try:
        async with connection.cursor() as cursor:
            await cursor.execute(
                """
                SELECT MAX(timestamp) FROM market_daily_ohlcv
                WHERE exchange = %s AND symbol = %s AND timeframe = %s
                """,
                (exchange, symbol, timeframe),
            )
            row = await cursor.fetchone()
            if not row:
                return None
            return row[0]
    finally:
        connection.close()


async def query_market_daily_ohlcv(
    exchange: str,
    symbol: str,
    timeframe: str = "1d",
    limit: int = 500,
    since_ts: Optional[int] = None,
):
    """
    查询日线 OHLCV，按时间升序。
    返回：[{timestamp, datetime, open, high, low, close, volume}]
    """
    connection = await getDbConn()
    try:
        async with connection.cursor() as cursor:
            if since_ts is not None:
                await cursor.execute(
                    """
                    SELECT timestamp, datetime, open, high, low, close, volume
                    FROM market_daily_ohlcv
                    WHERE exchange = %s AND symbol = %s AND timeframe = %s AND timestamp >= %s
                    ORDER BY timestamp ASC
                    LIMIT %s
                    """,
                    (exchange, symbol, timeframe, since_ts, int(limit)),
                )
            else:
                await cursor.execute(
                    """
                    SELECT timestamp, datetime, open, high, low, close, volume
                    FROM market_daily_ohlcv
                    WHERE exchange = %s AND symbol = %s AND timeframe = %s
                    ORDER BY timestamp DESC
                    LIMIT %s
                    """,
                    (exchange, symbol, timeframe, int(limit)),
                )
            rows = await cursor.fetchall()
            # 如果是倒序取的，翻转为升序
            if since_ts is None:
                rows = list(rows)[::-1]
            return [
                {
                    "timestamp": r[0],
                    "datetime": r[1],
                    "open": float(r[2]),
                    "high": float(r[3]),
                    "low": float(r[4]),
                    "close": float(r[5]),
                    "volume": None if r[6] is None else float(r[6]),
                }
                for r in rows
            ]
    finally:
        connection.close()


