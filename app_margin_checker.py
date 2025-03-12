import time
import logging
import asyncio
from libs.exchange.exchange import account_balance, createExchangeConn, fetch_orders
# from fetch_options import fetchPostions
from send_emails import send_email


# 提取 margin 相关信息
def extract_margin_info(positions):
    margin_data = []
    for pos in positions:
        if pos.side == 'short' :
            margin_data.append({
                "symbol": pos.symbol,
                "side": pos.side,
                "collateral": pos.collateral,
                "maintenanceMargin": pos.maintenanceMargin,
                "marginMode": pos.marginMode,
                "marginRatio": pos.marginRatio,
                "initialMargin": pos.initialMargin,
            })
    return margin_data

async def add_margin(symbol, amount):
    '''
    @param: symbol: 期权的symbol
    @param: amount: 增加或减少的保证金数量
    '''
    try:
        exchange = createExchangeConn()
        result = await exchange.add_margin(symbol=symbol, amount=amount, params={})
        return {"status": True, "data": result}
    except Exception as e:
        print(e.__traceback__.tb_frame.f_globals["__file__"])   # 发生异常所在的文件
        print(e.__traceback__.tb_lineno)
        return {"status": False, "message": e.args[0]}
    finally:
        await exchange.close()

# reduce_margin
async def reduce_margin(symbol, amount):
    '''
    @param: symbol: 期权的symbol
    @param: amount: 增加或减少的保证金数量
    '''
    try:
        exchange = createExchangeConn()
        result = await exchange.reduce_margin(symbol=symbol, amount=amount, params={})
        return {"status": True, "data": result}
    except Exception as e:
        return {"status": False, "message": e.args[0]}
    finally:
        await exchange.close()


# 记录最近发送邮件的时间 {ccy: timestamp}
last_email_sent = {}

def should_send_email(ccy, cooldown=1800):
    """
    检查是否应该发送余额不足的邮件 (默认冷却时间 30 分钟)
    """
    last_sent_time = last_email_sent.get(ccy, 0)
    current_time = time.time()

    if current_time - last_sent_time > cooldown:
        return True
    return False


def extract_order_info(orders):
    """
    提取订单信息，包括 symbol, contracts, percentage
    return [{'symbol': 'BTC/USD:BTC-250530-80000-C', 'contracts': 2.0, 'percentage': -12.4405394319383}, {'symbol': 'BTC/USD:BTC-250530-80000-P', 'contracts': 3.0, 'percentage': 9.64614439591147}, {'symbol': 'ETH/USD:ETH-250530-2100-C', 'contracts': 16.0, 'percentage': 28.28646975908004}, {'symbol': 'BTC/USD:BTC-250530-90000-C', 'contracts': 6.0, 'percentage': 31.65614656407597}]
    """
    order_info = []
    for order in orders:
        order_info.append({
            "symbol": order.symbol,
            "contracts": order.contracts,
            "percentage": order.percentage
        })
    return order_info

async def check_margin(positions, balance):
    """
    检查保证金是否合理，并通过变动值更新 free 余额
    """
    margin_data = extract_margin_info(positions)
    print(f"Checking margin for {len(margin_data)} positions...")

    balance_changes = {}  # 记录各币种的保证金变动量

    for pos in margin_data:
        ccy = pos["symbol"].split(":")[0].split("/")[0]

        # **避免 KeyError**
        current_balance = balance['free'].get(ccy, 0) + balance['used'].get(ccy, 0)

        to_020_margin = pos["maintenanceMargin"] / 0.20

        if pos["marginRatio"] < 0.15:
            print(f"Margin ratio too low for {pos['symbol']}: {pos['marginRatio']}")
            to_reduce_margin = abs(pos["collateral"] - to_020_margin)
            print(f"Need to reduce margin: {to_reduce_margin}")

            res = await reduce_margin(pos["symbol"], to_reduce_margin)  # **直接 await**
            if res["status"]:
               balance_changes[ccy] = balance_changes.get(ccy, 0) + to_reduce_margin
               print(f"Reduced margin for {pos['symbol']}: {to_reduce_margin}")
               send_email("🚨 降低保证金", f"降低 {ccy} 的保证金成功：{to_reduce_margin}")
            else:
                print(f"Error reducing margin: {res['message']}")
                if should_send_email(ccy):
                    send_email("🚨 Reduce margin error", f"减少 {ccy} 的保证金出现错误：{res['message']}")
                    last_email_sent[ccy] = time.time()

        elif pos["marginRatio"] > 0.30:
            print(f"Margin ratio too high for {pos['symbol']}: {pos['marginRatio']}")
            to_increase_margin = abs(to_020_margin - pos["collateral"])

            if to_increase_margin > current_balance:
                to_increase_margin = current_balance

            if to_increase_margin > 0:
                print(f"Need to increase margin: {to_increase_margin}")

                res = await add_margin(pos["symbol"], to_increase_margin)  # **直接 await**
                if res["status"]:
                    balance_changes[ccy] = balance_changes.get(ccy, 0) - to_increase_margin
                    print(f"Increased margin for {pos['symbol']}: {to_increase_margin}")
                    send_email("🚨 增加保证金", f"增加 {ccy} 的保证金成功：{to_increase_margin}")
                else:
                    print(f"Error increasing margin: {res['message']}")
                    if should_send_email(ccy):
                        send_email("🚨 Add margin error", f"新增 {ccy} 的保证金出现错误：{res['message']}")
                        last_email_sent[ccy] = time.time()  # 记录当前时间
            else:
                print(f"Balance is not enough to increase margin: {to_increase_margin}")
                # check if cooldown time has passed
                if should_send_email(ccy):
                    send_email("🚨 余额不足", f"余额不足以增加 {ccy} 的保证金")
                    last_email_sent[ccy] = time.time()  # 记录当前时间

        else:
            print(f"Margin ratio is within limits for {pos['symbol']}: {pos['marginRatio']}")


# 运行主循环
async def main():
    first_run = True  # 标记是否为首次运行
    while True:
        try:
            fetch_balance = await account_balance()
            if not fetch_balance["status"]:
                print(f"Error fetching balance: {fetch_balance['message']}")
                print("Sleeping for some minutes...")
                await asyncio.sleep(60)
                continue

            balance = fetch_balance["data"]
            fetch_res = await fetch_orders()
            if not fetch_res["status"]:
                print(f"Error fetching orders: {fetch_res['message']}")
                print("Sleeping for some minutes...")
                await asyncio.sleep(60)
                continue

            orders = fetch_res["data"]

            if orders:
                await check_margin(orders, balance)

            print(time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
            print("Margin check completed. Sleeping for some minutes...")

            if first_run and orders:
                # 提取订单信息并发送邮件
                order_info = extract_order_info(orders)
                # print("--------------------------------A")
                # print(order_info)
                # print("--------------------------------B")
                email_content = "\n".join([f"Symbol: {info['symbol']}, Contracts: {info['contracts']}, Percentage: {info['percentage']}%" for info in order_info])
                print("--------------------------------C")
                print(email_content)
                print("--------------------------------D")
                send_email("🚀 系统订单信息", f"当前系统的订单信息:\n{email_content}")
                first_run = False  # 更新首次运行标记

            await asyncio.sleep(60)
        except Exception as e:
            logging.error(f"Main loop encountered an error: {e}")
            print("Restarting the loop after some seconds...")
            await asyncio.sleep(60)

if __name__ == "__main__":
    send_email("🚀 OKX 期权保证金检查器已启动", "OKX 期权保证金检查器已启动")
    while True:
        try:
            asyncio.run(main())
        except Exception as e:
            logging.critical(f"Fatal error in asyncio loop: {e}")
            print("Restarting entire script after 120 seconds...")
            time.sleep(60)