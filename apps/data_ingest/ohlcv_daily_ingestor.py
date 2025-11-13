import os
import sys
import asyncio
import math
from datetime import datetime, timezone
from typing import List, Tuple
from pathlib import Path

import ccxt.async_support as ccxt
from dotenv import load_dotenv

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
    max_pages: int = 10000,
) -> List[Tuple[int, float, float, float, float, float]]:
    """
    拉取从 since_ms 开始的全部 OHLCV（含当天）
    返回列表元素: [ts, open, high, low, close, volume]
    """
    tf_ms = exchange.parse_timeframe(timeframe) * 1000
    now_ms = int(datetime.now(tz=timezone.utc).timestamp() * 1000)
    all_rows: List[Tuple[int, float, float, float, float, float]] = []
    next_since = since_ms
    pages = 0
    debug = os.getenv("DAILY_OHLCV_DEBUG", "0") == "1"
    while True:
        prev_since = next_since
        batch = await exchange.fetch_ohlcv(symbol, timeframe=timeframe, since=next_since, limit=limit)
        if not batch:
            break
        all_rows.extend(batch)
        oldest_ts, newest_ts = batch[0][0], batch[-1][0]
        # 前进一个时间框，避免重复
        next_since = newest_ts + tf_ms
        pages += 1
        if debug:
            print(f"[ohlcv] page={pages} got={len(batch)} oldest={oldest_ts} newest={newest_ts} next_since={next_since}")
        if pages >= max_pages:
            break
        # 若已到当前（或接近当前一根K线的末端），停止
        if newest_ts >= now_ms - tf_ms:
            break
        # 若交易所忽略 since 导致无前进，避免死循环
        if next_since <= prev_since:
            if debug:
                print("[ohlcv] since not progressing, try backward paging")
            # backward paging: 从当前位置向过去抓，直到 since_ms
            # 清理已收集，改为向后抓取
            all_rows = []
            pages = 0
            end_cursor = int(datetime.now(tz=timezone.utc).timestamp() * 1000)
            while True:
                prev_end = end_cursor
                b2 = await exchange.fetch_ohlcv(symbol, timeframe=timeframe, since=end_cursor, limit=limit)
                if not b2:
                    break
                o2, n2 = b2[0][0], b2[-1][0]
                all_rows.extend(b2)
                end_cursor = o2 - tf_ms
                pages += 1
                if debug:
                    print(f"[ohlcv] backward page={pages} got={len(b2)} oldest={o2} newest={n2} next_end={end_cursor}")
                if o2 <= since_ms or pages >= max_pages or end_cursor >= prev_end:
                    break
            # 排序并裁剪到 since_ms
            all_rows = sorted(all_rows, key=lambda x: x[0])
            all_rows = [r for r in all_rows if r[0] >= since_ms]
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
        limit_per_call = int(os.getenv("DAILY_OHLCV_LIMIT_PER_CALL", "200"))
        max_pages = int(os.getenv("DAILY_OHLCV_MAX_PAGES", "10000"))
        force_full = os.getenv("DAILY_OHLCV_FORCE_FULL", "0") == "1"

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
            # 断点续跑：从 DB 获取最后一条日线时间戳（可被 FORCE_FULL 覆盖）
            last_ts = await get_last_daily_ts(exchange_id, sym, TIMEFRAME) if not force_full else None
            since_ms = (last_ts + 1) if last_ts else default_since_ms
            rows = await fetch_ohlcv_all(exchange, sym, TIMEFRAME, since_ms, limit=limit_per_call, max_pages=max_pages)
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
    # load .env so that DAILY_* variables in file take effect without export
    load_dotenv()
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


