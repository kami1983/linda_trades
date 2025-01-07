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
* 需要编写一个运算函数，找出符合时间条件，价格条件的期权 
* 获取某个给定日期，比如 2022-10-30，某个价格，就会返回与之最相关Call、Put期权信息

## 新增一个Web 交互
* pip install jupyterlab
* jupyter lab

## OKEx API 模拟交易
* https://www.okx.com/zh-hans/demo-trading-explorer/v5/zh

## OKEx 调试开发的时候如何切换到模拟盘
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
* python app.py 启动API服务
* python websocket.py 启动websocket服务，用于记录订单数据
* cd frontend && yarn start 启动前端服务

# To Do List

## 交易模拟机器
* 如何推断出某个期权合理的标记价格

