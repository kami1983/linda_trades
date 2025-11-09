import sys
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Ensure project root on sys.path for direct execution
ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from apps.schedulers.daily_ohlcv_scheduler import scheduler_loop as ohlcv_scheduler_loop
from apps.schedulers.options_chain_scheduler import scheduler_loop as options_scheduler_loop


async def main_async():
    load_dotenv()
    print("[all-schedulers] starting both schedulers in one process")
    await asyncio.gather(
        ohlcv_scheduler_loop(),
        options_scheduler_loop(),
    )


def main():
    asyncio.run(main_async())


if __name__ == "__main__":
    main()


