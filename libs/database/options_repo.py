from typing import List, Tuple, Optional
import math

from libs.database.db_operation import getDbConn


async def upsert_option_contract_meta(items: List[dict]) -> None:
    if not items:
        return
    connection = await getDbConn()
    try:
        async with connection.cursor() as cursor:
            sql = (
                """
                INSERT INTO market_option_contract_meta (
                    exchange, symbol, base, quote, expiration_date, strike, option_type, underlying, first_seen_ts, last_seen_ts, is_active
                ) VALUES (
                    %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
                ) AS new_values
                ON DUPLICATE KEY UPDATE
                    base = new_values.base,
                    quote = new_values.quote,
                    expiration_date = new_values.expiration_date,
                    strike = new_values.strike,
                    option_type = new_values.option_type,
                    underlying = new_values.underlying,
                    first_seen_ts = LEAST(COALESCE(market_option_contract_meta.first_seen_ts, new_values.first_seen_ts), new_values.first_seen_ts),
                    last_seen_ts = GREATEST(COALESCE(market_option_contract_meta.last_seen_ts, new_values.last_seen_ts), new_values.last_seen_ts),
                    is_active = new_values.is_active
                """
            )
            values: List[Tuple] = [
                (
                    x.get('exchange'), x.get('symbol'), x.get('base'), x.get('quote'),
                    int(x.get('expiration_date')), float(x.get('strike')), x.get('option_type'),
                    x.get('underlying'), x.get('first_seen_ts'), x.get('last_seen_ts'), int(x.get('is_active', 1))
                ) for x in items
            ]
            await cursor.executemany(sql, values)
        await connection.commit()
    finally:
        connection.close()


async def upsert_option_quotes(rows: List[dict]) -> None:
    if not rows:
        return
    connection = await getDbConn()
    try:
        async with connection.cursor() as cursor:
            sql = (
                """
                INSERT INTO market_option_quote_ts (
                    exchange, symbol, expiration_date, strike, option_type, timestamp, datetime,
                    bid_price, bid_size, ask_price, ask_size, last_price, last_size,
                    underlying_price, moneyness_pct, moneyness_type, s_iv, b_iv, delta, gamma, theta, vega
                ) VALUES (
                    %s,%s,%s,%s,%s,%s,%s,
                    %s,%s,%s,%s,%s,%s,
                    %s,%s,%s,%s,%s,%s,%s,%s,%s
                ) AS new_values
                ON DUPLICATE KEY UPDATE
                    bid_price = new_values.bid_price,
                    bid_size = new_values.bid_size,
                    ask_price = new_values.ask_price,
                    ask_size = new_values.ask_size,
                    last_price = new_values.last_price,
                    last_size = new_values.last_size,
                    underlying_price = new_values.underlying_price,
                    moneyness_pct = new_values.moneyness_pct,
                    moneyness_type = new_values.moneyness_type,
                    s_iv = new_values.s_iv,
                    b_iv = new_values.b_iv,
                    delta = new_values.delta,
                    gamma = new_values.gamma,
                    theta = new_values.theta,
                    vega = new_values.vega
                """
            )
            def san(x):
                if x is None:
                    return None
                try:
                    f = float(x)
                except Exception:
                    return None
                if math.isnan(f) or math.isinf(f):
                    return None
                return f

            values: List[Tuple] = [
                (
                    r.get('exchange'), r.get('symbol'), int(r.get('expiration_date')), san(r.get('strike')),
                    r.get('option_type'), int(r.get('timestamp')), r.get('datetime'),
                    san(r.get('bid_price')), san(r.get('bid_size')), san(r.get('ask_price')), san(r.get('ask_size')),
                    san(r.get('last_price')), san(r.get('last_size')),
                    san(r.get('underlying_price')), san(r.get('moneyness_pct')), r.get('moneyness_type'),
                    san(r.get('s_iv')), san(r.get('b_iv')), san(r.get('delta')), san(r.get('gamma')), san(r.get('theta')), san(r.get('vega'))
                ) for r in rows
            ]
            await cursor.executemany(sql, values)
        await connection.commit()
    finally:
        connection.close()


