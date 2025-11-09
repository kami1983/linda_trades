import os
import sys
import asyncio
import math
from datetime import datetime, timezone
from typing import List, Tuple
from pathlib import Path

import ccxt.async_support as ccxt

# Ensure project root on sys.path for direct execution
ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from libs.database.ohlcv_repo import (
    upsert_market_daily_ohlcv,
    upsert_market_symbol_meta,
    get_last_daily_ts,
)


TIMEFRAME = "1d"


def get_env_list(name: str, default: str) -> List[str]:
    raw = os.getenv(name, default)
    return [s.strip() for s in raw.split(",") if s.strip()]


def ts_to_date_str(ts_ms: int) -> str:
    return datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d")


async def create_exchange(exchange_id: str) -> ccxt.Exchange:
    exchange_id = exchange_id.lower()
    if exchange_id == "okx":
        ex = ccxt.okx({})
        ex.enableRateLimit = True
        return ex
    if exchange_id == "binance":
        ex = ccxt.binance({})
        ex.enableRateLimit = True
        return ex
    raise ValueError(f"Unsupported exchange: {exchange_id}")


async def fetch_ohlcv_all(
    exchange: ccxt.Exchange,
    symbol: str,
    timeframe: str,
    since_ms: int,
    limit: int = 200,
) -> List[Tuple[int, float, float, float, float, float]]:
    """
    拉取从 since_ms 开始的全部 OHLCV（含当天）
    返回列表元素: [ts, open, high, low, close, volume]
    """
    tf_ms = exchange.parse_timeframe(timeframe) * 1000
    all_rows: List[Tuple[int, float, float, float, float, float]] = []
    next_since = since_ms
    while True:
        batch = await exchange.fetch_ohlcv(symbol, timeframe=timeframe, since=next_since, limit=limit)
        if not batch:
            break
        all_rows.extend(batch)
        last_ts = batch[-1][0]
        # 前进一个时间框，避免重复
        next_since = last_ts + tf_ms
        # 安全阈值：若返回不足 limit，基本可以认为到头了
        if len(batch) < limit:
            break
    return all_rows


async def discover_symbols(exchange: ccxt.Exchange, exchange_id: str, market_type: str, bases_filter: List[str]) -> List[dict]:
    markets = await exchange.load_markets()
    bases_set = set([b.upper() for b in bases_filter]) if bases_filter else None
    items = []
    for m in markets.values():
        mtype = m.get("type") or ("swap" if m.get("swap") else "spot" if m.get("spot") else None)
        if mtype != market_type:
            continue
        base = (m.get("base") or "").upper()
        quote = (m.get("quote") or "").upper()
        if bases_set and base not in bases_set:
            continue
        items.append({
            "exchange": exchange_id,
            "symbol": m.get("symbol"),
            "base": base or None,
            "quote": quote or None,
            "market_type": market_type,
            "first_seen_ts": None,
            "last_seen_ts": None,
            "is_active": 1,
        })
    return items


async def ingest_for_exchange_symbols(
    exchange_id: str,
    symbols: List[str],
    market_type: str = "spot",
    lookback_days: int = 365,
    discover: bool = False,
    bases_filter: List[str] = None,
    max_symbols: int = 0,
):
    exchange = await create_exchange(exchange_id)
    try:
        now_ms = int(datetime.now(tz=timezone.utc).timestamp() * 1000)
        default_since_ms = now_ms - lookback_days * 24 * 60 * 60 * 1000

        # 发现并合并 symbol 列表（可选）
        discovered_meta: List[dict] = []
        if discover:
            discovered_meta = await discover_symbols(exchange, exchange_id, market_type, bases_filter or [])
        # 组合最终 symbol 列表，优先显式传入
        final_symbols = symbols[:] if symbols else [m["symbol"] for m in discovered_meta]
        if not final_symbols:
            return
        if max_symbols and max_symbols > 0:
            final_symbols = final_symbols[:max_symbols]

        # 写入/更新 symbol meta（带 base/quote）
        meta_rows = []
        now_ts = now_ms
        # 建立一个 symbol->(base,quote) 映射（优先 discovered）
        bq_map = {m["symbol"]: (m.get("base"), m.get("quote")) for m in discovered_meta}
        for sym in final_symbols:
            base, quote = bq_map.get(sym, (None, None))
            meta_rows.append({
                "exchange": exchange_id,
                "symbol": sym,
                "base": base,
                "quote": quote,
                "market_type": market_type,
                "first_seen_ts": default_since_ms,
                "last_seen_ts": now_ts,
                "is_active": 1,
            })
        await upsert_market_symbol_meta(meta_rows)

        for sym in final_symbols:
            # 断点续跑：从 DB 获取最后一条日线时间戳
            last_ts = await get_last_daily_ts(exchange_id, sym, TIMEFRAME)
            since_ms = (last_ts + 1) if last_ts else default_since_ms
            rows = await fetch_ohlcv_all(exchange, sym, TIMEFRAME, since_ms)
            if not rows:
                continue

            # 分批 upsert，降低内存占用
            BATCH = 1000
            batch = []
            for ts, o, h, l, c, v in rows:
                batch.append({
                    "exchange": exchange_id,
                    "symbol": sym,
                    "base": bq_map.get(sym, (None, None))[0],
                    "quote": bq_map.get(sym, (None, None))[1],
                    "market_type": market_type,
                    "timeframe": TIMEFRAME,
                    "open": o,
                    "high": h,
                    "low": l,
                    "close": c,
                    "volume": v,
                    "turnover": None,
                    "trades": None,
                    "timestamp": ts,
                    "datetime": ts_to_date_str(ts),
                    "status": 1,
                })
                if len(batch) >= BATCH:
                    await upsert_market_daily_ohlcv(batch)
                    batch = []
            if batch:
                await upsert_market_daily_ohlcv(batch)
    finally:
        await exchange.close()


async def main():
    exchange_id = os.getenv("DAILY_OHLCV_EXCHANGE", "okx")
    market_type = os.getenv("DAILY_OHLCV_MARKET_TYPE", "spot")
    symbols = get_env_list("DAILY_OHLCV_SYMBOLS", "BTC/USDT,ETH/USDT")
    lookback_days = int(os.getenv("DAILY_OHLCV_LOOKBACK_DAYS", "365"))
    discover = os.getenv("DAILY_OHLCV_DISCOVER", "0") == "1"
    bases_filter = get_env_list("DAILY_OHLCV_BASES", "")
    max_symbols = int(os.getenv("DAILY_OHLCV_MAX_SYMBOLS", "0"))

    await ingest_for_exchange_symbols(
        exchange_id=exchange_id,
        symbols=symbols,
        market_type=market_type,
        lookback_days=lookback_days,
        discover=discover,
        bases_filter=bases_filter,
        max_symbols=max_symbols,
    )


if __name__ == "__main__":
    asyncio.run(main())


