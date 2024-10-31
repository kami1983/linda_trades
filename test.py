

import asyncio
import time
from db_operation import getRecentOptionChainByTimestamp
from unitls import findAtmOptions


async def main():

    # 获取当前的时间戳
    # timestamp = int(time.time())
    # 2024-10-29 16:00:00
    # 将字符串转换为时间戳
    timeArray = time.strptime("2024-10-31 16:00:00", "%Y-%m-%d %H:%M:%S")
    timestamp = int(time.mktime(timeArray))
    print('timestamp :', timestamp)
    option_chains = await getRecentOptionChainByTimestamp(timestamp)
    # print(option_chains)
    # 假设我是一个期权卖方，那么我就要留出一个安全区间，这个安全区间是标的资产价格的 10% 左右
    atmOptionC = findAtmOptions(option_chains, 71988 * 1.1, 'C')
    print('atmOptionC:', atmOptionC)
    atmOptionP = findAtmOptions(option_chains, 71988 * 0.9, 'P')
    print('atmOptionP:', atmOptionP)

asyncio.run(main())
