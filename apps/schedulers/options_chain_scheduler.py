import os
import sys
import asyncio
import random
from datetime import datetime, timezone, timedelta
from pathlib import Path
from dotenv import load_dotenv

# Ensure project root on sys.path for direct execution
ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from apps.data_ingest.options_chain_ingestor import ingest_once


async def scheduler_loop():
    # load .env so interval can be configured there
    load_dotenv()
    exchange_id = os.getenv('OPTIONS_EXCHANGE', 'okx')
    bases = [s.strip().upper() for s in os.getenv('OPTIONS_BASES', 'BTC,ETH').split(',') if s.strip()]
    interval_sec = int(os.getenv('SCHED_OPTIONS_INTERVAL_SEC', '3600'))  # 默认1小时
    jitter_sec = int(os.getenv('SCHED_OPTIONS_JITTER_SEC', '30'))
    run_on_start = os.getenv('SCHED_OPTIONS_RUN_ON_START', '1') == '1'

    # Print configured env for visibility
    print(f"[opt-scheduler] config: exchange={exchange_id}, bases={','.join(bases)}, interval={interval_sec}s, jitter={jitter_sec}s, run_on_start={run_on_start}")

    if run_on_start:
        try:
            print(f"[opt-scheduler] run on start: exchange={exchange_id}, bases={','.join(bases)}")
            await ingest_once(exchange_id, bases)
        except Exception as e:
            print('[opt-scheduler] run on start failed:', e)

    while True:
        extra = random.randint(0, max(jitter_sec, 0))
        sleep_sec = interval_sec + extra
        next_time = datetime.now(timezone.utc) + timedelta(seconds=sleep_sec)
        print(f'[opt-scheduler] next run at {next_time.isoformat()} (sleep {sleep_sec}s)')
        await asyncio.sleep(sleep_sec)
        try:
            print(f"[opt-scheduler] starting ingestion run: exchange={exchange_id}, bases={','.join(bases)}")
            await ingest_once(exchange_id, bases)
            print(f"[opt-scheduler] ingestion run finished: exchange={exchange_id}")
        except Exception as e:
            print('[opt-scheduler] run failed:', e)


def main():
    asyncio.run(scheduler_loop())


if __name__ == '__main__':
    main()


