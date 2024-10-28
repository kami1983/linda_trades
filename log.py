
import os
import datetime


def recordLog(log):

    # 创建日志目录（如果不存在）
    log_dir = 'log'
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    # 记录日志放到log目录中，文件名是日期
    with open(f'log/{datetime.datetime.now().strftime("%Y-%m-%d")}.log', 'a') as f:
        f.write(f'{datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")} # {log}\n')
        f.close()
    print(log)