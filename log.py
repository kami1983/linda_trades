
import os
import datetime

from db_struct import EResultIvData


def recordLog(log):

    # 创建日志目录（如果不存在）
    log_dir = 'log'
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    # 记录日志放到log目录中，文件名是日期
    with open(f'{log_dir}/{datetime.datetime.now().strftime("%Y-%m-%d")}.log', 'a') as f:
        f.write(f'{datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")} # {log}\n')
        f.close()
    print(log)


def toRecordIvData(current_time: int, result: EResultIvData):
    """
    记录隐含波动率数据
    @param current_time: 当前时间戳
    @param result: 隐含波动率数据
    """
    log_dir = 'trace_data/iv_data'
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # ETH/USD:ETH-241108-2650-C
    symbol = result.symbol
    # 用:分割，取第后面的元素作为文件名
    option_name_arr = symbol.split(":")[1].split("-")
    file_name = f'{option_name_arr[0]}-{option_name_arr[1]}-{option_name_arr[3]}'
    # 生成要追加的数据
    data = f'{current_time},{result.excute_strike},{result.current_price},{round(result.b_iv,3)},{round(result.s_iv,3)}\n'
    with open(f'{log_dir}/{file_name}.csv', 'a') as f:
        f.write(data)
        f.close()



