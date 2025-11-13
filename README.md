# Development manual
* Server use aws ec2

## Install conda on ubuntu
* https://docs.anaconda.com/miniconda/
```
mkdir -p ~/miniconda3
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda3/miniconda.sh
bash ~/miniconda3/miniconda.sh -b -u -p ~/miniconda3
rm ~/miniconda3/miniconda.sh
conda --version

```
* After installing, close and reopen your terminal application or refresh it by running the following command:
```
source ~/miniconda3/bin/activate
To initialize conda on all available shells, run the following command:

conda init --all
python --version
```

## Install python 3.9
* conda env list
* conda create --name linda-trades python=3.9
* conda activate linda-trades

## Ubuntu need open  port
* sudo ufw allow 3000/tcp
* sudo ufw allow 5000/tcp

## Framework mutual
* https://docs.ccxt.com/

## Create project 
* pip install python-dotenv
* pip install ccxt、

## Create a online database
* https://console.cloud.google.com/welcome?project=focal-pager-418008
* cteate project “linda-trades”

## Make requirements.txt
* pip freeze > requirements.txt

## To do list
* 实时记录期权市场当前市场价格、BTC、ETH 【DONE】
* 需要编写一个运算函数，找出符合时间条件，价格条件的期权 【DONE】
* 获取期权的保证金 【DONE】
* 自动调整期权的保证金防止爆仓，首先要获取当前交易账号的余额：
    - 获取每个仓位现在的 marginRatio 保证金维持比例 0～1，越小越安全，如果大于0.30，就增加保证金让这个维持比例变小，如果小于0.15就减少保证金让这个值变大，主要维持的比例在0.15～0.30之间，按照 0.20 的中间方向进行调整。

## 新增一个Web 交互
* pip install jupyterlab
* jupyter lab

## OKEx API 模拟交易
* https://www.okx.com/zh-hans/demo-trading-explorer/v5/zh

## 通过 WebSockets 获取实时数据
* https://www.okx.com/docs-v5/en/#overview-production-trading-services
* The Production Trading URL:
```
REST: https://www.okx.com
Public WebSocket: wss://ws.okx.com:8443/ws/v5/public
Private WebSocket: wss://ws.okx.com:8443/ws/v5/private
Business WebSocket: wss://ws.okx.com:8443/ws/v5/business
```

* Demo Trading Services
```
REST: https://www.okx.com
Public WebSocket: wss://wspap.okx.com:8443/ws/v5/public
Private WebSocket: wss://wspap.okx.com:8443/ws/v5/private
Business WebSocket: wss://wspap.okx.com:8443/ws/v5/business
```

## How to start 

### Start service
* /usr/bin/python3 /datadisk/git-files/linda_trades/app_apis.py 启动前端API伺服器
* /usr/bin/python3 /datadisk/git-files/linda_trades/app_order_monitor.py 启动订单监视器需要数据库配合（非必须）
* /usr/bin/python3 /datadisk/git-files/linda_trades/app_margin_checker.py 启动杠杆资金调整程序，这个程序会自动平衡不同仓位的杠杆，建议开启否则很容易爆仓


### Start web server
* cd frontend && yarn build
* sudo npm install -g serve
* serve -s build -l 3000 这里为什么必须是 3000 ？这是因为 CORS_ORIGIN 指定的路径是 http://localhost:3000，如果换成其他的 .env 后段也需要修改

### supervisorctl
* 安装 Supervisor（如果尚未安装）
```
sudo apt update 
sudo apt install supervisor -y
sudo vi /etc/supervisor/conf.d/manager.conf 
````
* 尝试重新加载配置文件并且启动
```
sudo supervisorctl reread 
sudo supervisorctl update 
```
* 启动之前需要确定在 root 环境下执行了 pip install -r requirements.txt
```
sudo supervisorctl start all [这个命令如果不好用使用systemctl进行管理]

sudo systemctl stop supervisor
sudo systemctl restart supervisor
```
* 查看当前运行的进程
```
sudo supervisorctl
status
```

* 查看当前运行的进程
```
sudo supervisorctl
status
```

* 开启WEB端的服务查看工具
```
sudo vi /etc/supervisor/supervisord.conf
[inet_http_server] 
port=0.0.0.0:9001 ; 允许外部访问，改为 127.0.0.1:9001 只允许本机访问 
username=admin ; 访问时的用户名 
password=yourpassword ; 访问时的密码
```

* 重启服务
```
sudo supervisorctl reread
sudo supervisorctl update
sudo systemctl restart supervisor
浏览器访问：
http://服务器IP:9001
```

* 停止服务
```
sudo supervisorctl stop all
```

## 交易模拟机器
* 如何推断出某个期权合理的标记价格

## Lighter Python SDK 支持
* 推荐方式（PyPI）：`pip install lighter-sdk==0.1.4`
* 或安装源码（GitHub）：`pip install "git+https://github.com/elliottech/lighter-python.git#egg=lighter-sdk"`
* 若出现 urllib3 相关冲突提示，可将项目 `requirements.txt` 中的 `urllib3` 固定为 `>=2.0.7,<2.1.0`

