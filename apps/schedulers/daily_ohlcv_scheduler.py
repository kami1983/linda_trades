import os
import sys
import asyncio
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Ensure project root on sys.path for direct execution
ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from apps.data_ingest.ohlcv_daily_ingestor import ingest_for_exchange_symbols


def parse_hhmm(hhmm: str) -> tuple[int, int]:
    parts = (hhmm or "00:10").split(":")
    h = int(parts[0]) if parts and parts[0] else 0
    m = int(parts[1]) if len(parts) > 1 and parts[1] else 0
    return h, m


def next_run_time_utc(run_at_hhmm: str) -> datetime:
    now = datetime.now(timezone.utc)
    h, m = parse_hhmm(run_at_hhmm)
    candidate = now.replace(hour=h, minute=m, second=0, microsecond=0)
    if candidate <= now:
        candidate = candidate + timedelta(days=1)
    return candidate


async def run_once_from_env():
    exchange_id = os.getenv("DAILY_OHLCV_EXCHANGE", "okx")
    market_type = os.getenv("DAILY_OHLCV_MARKET_TYPE", "spot")
    symbols = [s.strip() for s in os.getenv("DAILY_OHLCV_SYMBOLS", "BTC/USDT,ETH/USDT").split(",") if s.strip()]
    lookback_days = int(os.getenv("DAILY_OHLCV_LOOKBACK_DAYS", "365"))
    discover = os.getenv("DAILY_OHLCV_DISCOVER", "0") == "1"
    bases_filter = [s.strip() for s in os.getenv("DAILY_OHLCV_BASES", "").split(",") if s.strip()]
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


async def scheduler_loop():
    run_at = os.getenv("SCHED_OHLCV_RUN_AT_UTC", "00:10")
    jitter_sec = int(os.getenv("SCHED_OHLCV_JITTER_SEC", "120"))
    run_on_start = os.getenv("SCHED_OHLCV_RUN_ON_START", "0") == "1"

    if run_on_start:
        try:
            print("[scheduler] run_on_start = 1, running ingestion once...")
            await run_once_from_env()
        except Exception as e:
            print(f"[scheduler] run_on_start failed: {e}")

    while True:
        target = next_run_time_utc(run_at)
        now = datetime.now(timezone.utc)
        sleep_sec = (target - now).total_seconds()
        if sleep_sec < 0:
            sleep_sec = 0
        extra = random.randint(0, max(jitter_sec, 0))
        total_sleep = sleep_sec + extra
        print(f"[scheduler] next run at {target.isoformat()}, sleep {int(total_sleep)}s (jitter {extra}s)")
        await asyncio.sleep(total_sleep)

        try:
            print("[scheduler] starting ingestion run...")
            await run_once_from_env()
            print("[scheduler] ingestion run finished")
        except Exception as e:
            print(f"[scheduler] ingestion run failed: {e}")
            # 不中断循环，继续下一次


def main():
    asyncio.run(scheduler_loop())


if __name__ == "__main__":
    main()


