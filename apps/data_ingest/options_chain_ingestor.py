import os
import sys
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from typing import List

import ccxt.async_support as ccxt

# Ensure project root on sys.path for direct execution
ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from libs.exchange.fetch_options import fetchOptionChain
from libs.database.options_repo import upsert_option_contract_meta, upsert_option_quotes
from libs.units.iv import handlerCalculateIv


def ts_ms_to_date(ts_ms: int) -> str:
    return datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).strftime('%Y-%m-%d')


async def create_exchange(exchange_id: str) -> ccxt.Exchange:
    exchange_id = exchange_id.lower()
    if exchange_id == 'okx':
        ex = ccxt.okx({})
        ex.enableRateLimit = True
        return ex
    if exchange_id == 'binance':
        ex = ccxt.binance({})
        ex.enableRateLimit = True
        return ex
    raise ValueError(f'Unsupported exchange: {exchange_id}')


async def fetch_underlying_price(exchange: ccxt.Exchange, base: str) -> float:
    # 使用 SWAP 近似标的价格
    sym = f'{base}-USD-SWAP'
    t = await exchange.fetch_ticker(sym)
    return float(t['last'])


async def ingest_once(exchange_id: str, bases: List[str]):
    exchange = await create_exchange(exchange_id)
    try:
        now_ms = int(datetime.now(tz=timezone.utc).timestamp() * 1000)
        # 合约元数据收集
        meta_rows = []
        quote_rows = []
        for base in bases:
            chain = await fetchOptionChain(exchange, base)
            if not chain:
                continue
            underlying_price = await fetch_underlying_price(exchange, base)
            for item in chain:
                # item: EResultOptionChain
                symbol = item.symbol
                expiration = int(symbol.split('-')[1])
                strike = float(symbol.split('-')[2])
                opt_type = symbol.split('-')[3]
                meta_rows.append({
                    'exchange': exchange_id,
                    'symbol': symbol,
                    'base': base,
                    'quote': 'USD',
                    'expiration_date': expiration,
                    'strike': strike,
                    'option_type': opt_type,
                    'underlying': f'{base}-USD',
                    'first_seen_ts': now_ms,
                    'last_seen_ts': now_ms,
                    'is_active': 1,
                })

                # 计算 IV 与 Greeks（可能失败则置空）
                s_iv = None
                b_iv = None
                delta = None
                gamma = None
                theta = None
                vega = None
                try:
                    ivd = handlerCalculateIv(symbol=symbol, current_price=underlying_price, bid=item.bid_price, ask=item.ask_price)
                    s_iv = ivd.s_iv
                    b_iv = ivd.b_iv
                    delta = ivd.delta
                    gamma = ivd.gamma
                    theta = ivd.theta
                    vega = ivd.vega
                except Exception:
                    pass

                quote_rows.append({
                    'exchange': exchange_id,
                    'symbol': symbol,
                    'expiration_date': expiration,
                    'strike': strike,
                    'option_type': opt_type,
                    'timestamp': int(item.timestamp),
                    'datetime': ts_ms_to_date(int(item.timestamp)),
                    'bid_price': item.bid_price,
                    'bid_size': item.bid_size,
                    'ask_price': item.ask_price,
                    'ask_size': item.ask_size,
                    'last_price': item.last_price if hasattr(item, 'last_price') else None,
                    'last_size': item.last_size if hasattr(item, 'last_size') else None,
                    'underlying_price': underlying_price,
                    's_iv': s_iv,
                    'b_iv': b_iv,
                    'delta': delta,
                    'gamma': gamma,
                    'theta': theta,
                    'vega': vega,
                })

        if meta_rows:
            await upsert_option_contract_meta(meta_rows)
        if quote_rows:
            # 批量切片执行，避免太大
            B = 1000
            for i in range(0, len(quote_rows), B):
                await upsert_option_quotes(quote_rows[i:i+B])
    finally:
        await exchange.close()


async def main():
    exchange_id = os.getenv('OPTIONS_EXCHANGE', 'okx')
    bases = [s.strip().upper() for s in os.getenv('OPTIONS_BASES', 'BTC,ETH').split(',') if s.strip()]
    await ingest_once(exchange_id, bases)


if __name__ == '__main__':
    asyncio.run(main())


