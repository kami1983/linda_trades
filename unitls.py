from datetime import datetime
from typing import List, Optional

from db_struct import EResultOptionChain

def timeToStr(timestamp):
    return datetime.fromtimestamp(timestamp / 1000).strftime('%Y-%m-%d %H:%M:%S')

def findAtmOptions(option_chains: List[EResultOptionChain], atm_price: float, option_type: str) -> Optional[EResultOptionChain]:
    """
    从期权链数据中，找到距离标的资产最近的 ATM 期权
    @param option_chains: 期权链数据
    @param spot: 标的资产价格
    @return: ATM 期权
    """
    # 计算距离标的资产最近的 ATM 期权，即距离标的资产价格最近的行权价，主要option_type 是 P 和 C
    atm_option = None
    min_diff = None
    for option in option_chains:
        if option.option_type != option_type:
            continue
        diff = abs(option.strike - atm_price)
        if min_diff is None or diff < min_diff:
            min_diff = diff
            atm_option = option
    return atm_option