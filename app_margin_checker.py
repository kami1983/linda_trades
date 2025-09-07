import time
import logging
import asyncio
from datetime import datetime
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
    提取订单信息，包括 symbol, contracts, percentage, realizedPnl, entryPrice, markPrice
    return [{'symbol': 'BTC/USD:BTC-250530-80000-C', 'contracts': 2.0, 'percentage': -12.4405394319383, 'realizedPnl': -0.000003, 'entryPrice': 0.039, 'markPrice': 0.0517050219330564}, ...]
    """
    order_info = []
    for order in orders:
        order_info.append({
            "symbol": order.symbol,
            "contracts": order.contracts,
            "percentage": order.percentage,
            "marginRatio": order.marginRatio,
            "realizedPnl": order.realizedPnl,
            "entryPrice": order.entryPrice,
            "markPrice": order.markPrice
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
        current_balance = balance['free'].get(ccy, 0)  # 只使用可用余额，不包括已占用的余额

        to_020_margin = pos["maintenanceMargin"] / 0.20

        if pos["marginRatio"] < 0.15:
            print(f"Margin ratio too low for {pos['symbol']}: {pos['marginRatio']}")
            to_reduce_margin = abs(pos["collateral"] - to_020_margin)
            print(f"Need to reduce margin: {to_reduce_margin}")

            res = await reduce_margin(pos["symbol"], to_reduce_margin)  # **直接 await**
            if res["status"]:
               balance_changes[ccy] = balance_changes.get(ccy, 0) + to_reduce_margin
               print(f"Reduced margin for {pos['symbol']}: {to_reduce_margin}")
               send_email(
                   "🚨 降低保证金",
                   f"""
                   <div>
                     <p>降低 {ccy} 的保证金成功：{to_reduce_margin}</p>
                     <p>合约: {pos['symbol']}</p>
                     <p>当前保证金比例: {pos['marginRatio']:.4f}</p>
                     <p>当前保证金: {pos['collateral']}</p>
                     <p>维持保证金: {pos['maintenanceMargin']}</p>
                   </div>
                   """,
                   html=True,
               )
            else:
                print(f"Error reducing margin: {res['message']}")
                if should_send_email(ccy):
                    error_details = (
                        f"币种: {ccy}\n"
                        f"合约: {pos['symbol']}\n"
                        f"当前保证金比例: {pos['marginRatio']:.4f}\n"
                        f"目标保证金比例: 0.20\n"
                        f"当前保证金: {pos['collateral']}\n"
                        f"维持保证金: {pos['maintenanceMargin']}\n"
                        f"尝试减少金额: {to_reduce_margin}\n"
                        f"错误信息: {res['message']}"
                    )
                    send_email("🚨 Reduce margin error", error_details.replace("\n", "<br/>") , html=True)
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
                    send_email(
                        "🚨 增加保证金",
                        f"""
                        <div>
                          <p>增加 {ccy} 的保证金成功：{to_increase_margin}</p>
                          <p>合约: {pos['symbol']}</p>
                          <p>当前保证金比例: {pos['marginRatio']:.4f}</p>
                          <p>当前保证金: {pos['collateral']}</p>
                          <p>维持保证金: {pos['maintenanceMargin']}</p>
                          <p>可用余额: {current_balance}</p>
                        </div>
                        """,
                        html=True,
                    )
                else:
                    print(f"Error increasing margin: {res['message']}")
                    if should_send_email(ccy):
                        error_details = (
                            f"币种: {ccy}\n"
                            f"合约: {pos['symbol']}\n"
                            f"当前保证金比例: {pos['marginRatio']:.4f}\n"
                            f"目标保证金比例: 0.20\n"
                            f"当前保证金: {pos['collateral']}\n"
                            f"维持保证金: {pos['maintenanceMargin']}\n"
                            f"当前可用余额: {current_balance}\n"
                            f"尝试增加金额: {to_increase_margin}\n"
                            f"错误信息: {res['message']}"
                        )
                        send_email("🚨 Add margin error", error_details.replace("\n", "<br/>") , html=True)
                        last_email_sent[ccy] = time.time()  # 记录当前时间
            else:
                print(f"Balance is not enough to increase margin: {to_increase_margin}")
                # check if cooldown time has passed
                if should_send_email(ccy):
                    error_details = (
                        f"币种: {ccy}\n"
                        f"合约: {pos['symbol']}\n"
                        f"当前保证金比例: {pos['marginRatio']:.4f}\n"
                        f"目标保证金比例: 0.20\n"
                        f"当前保证金: {pos['collateral']}\n"
                        f"维持保证金: {pos['maintenanceMargin']}\n"
                        f"当前可用余额: {current_balance}\n"
                        f"需要增加金额: {to_increase_margin}"
                    )
                    send_email("🚨 余额不足", error_details.replace("\n", "<br/>") , html=True)
                    last_email_sent[ccy] = time.time()  # 记录当前时间

        else:
            print(f"Margin ratio is within limits for {pos['symbol']}: {pos['marginRatio']}")


# 运行主循环
async def main():
    first_run = True  # 标记是否为首次运行
    last_sent_hour = None  # 记录上次发送邮件的小时
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

            current_hour = datetime.now().hour
            if first_run or (current_hour in [6, 22] and current_hour != last_sent_hour):
                # 提取订单信息并发送 HTML 邮件
                order_info = extract_order_info(orders)

                # 余额摘要
                total = balance.get('total', {})
                free = balance.get('free', {})
                used = balance.get('used', {})

                def render_balance_rows(kind_dict):
                    rows = []
                    for ccy, amount in kind_dict.items():
                        rows.append(f"<tr><td style='padding:6px 10px;'>{ccy}</td><td style='padding:6px 10px;text-align:right;'>{amount}</td></tr>")
                    return "".join(rows) or "<tr><td colspan='2' style='padding:6px 10px;'>-</td></tr>"

                orders_rows = []
                for info in order_info:
                    orders_rows.append(
                        "".join([
                            "<tr>",
                            f"<td style='padding:6px 10px;white-space:nowrap'>{info['symbol']}</td>",
                            f"<td style='padding:6px 10px;text-align:right'>{info['contracts']}</td>",
                            f"<td style='padding:6px 10px;text-align:right'>{round(info['percentage'], 4) if isinstance(info['percentage'], (int, float)) else info['percentage']}</td>",
                            f"<td style='padding:6px 10px;text-align:right'>{round(info['marginRatio'], 4) if isinstance(info['marginRatio'], (int, float)) else info['marginRatio']}</td>",
                            f"<td style='padding:6px 10px;text-align:right'>{round(info['realizedPnl'], 6) if isinstance(info['realizedPnl'], (int, float)) else info['realizedPnl']}</td>",
                            f"<td style='padding:6px 10px;text-align:right'>{round(info['entryPrice'], 6) if isinstance(info['entryPrice'], (int, float)) else info['entryPrice']}</td>",
                            f"<td style='padding:6px 10px;text-align:right'>{round(info['markPrice'], 6) if isinstance(info['markPrice'], (int, float)) else info['markPrice']}</td>",
                            "</tr>",
                        ])
                    )

                html_body = f"""
                <div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#111; line-height:1.6;'>
                  <h2 style='margin:0 0 12px;'>系统订单与账户摘要</h2>
                  <p style='margin: 0 0 14px;'>生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>

                  <h3 style='margin: 20px 0 8px;'>账户余额</h3>
                  <table cellpadding='0' cellspacing='0' style='border-collapse:collapse;border:1px solid #eee;'>
                    <thead>
                      <tr style='background:#fafafa;'>
                        <th style='padding:6px 10px;text-align:left'>币种</th>
                        <th style='padding:6px 10px;text-align:right'>总额</th>
                      </tr>
                    </thead>
                    <tbody>
                      {render_balance_rows(total)}
                    </tbody>
                  </table>

                  <table cellpadding='0' cellspacing='0' style='border-collapse:collapse;border:1px solid #eee;margin-top:8px;'>
                    <thead>
                      <tr style='background:#fafafa;'>
                        <th style='padding:6px 10px;text-align:left'>币种</th>
                        <th style='padding:6px 10px;text-align:right'>可用</th>
                      </tr>
                    </thead>
                    <tbody>
                      {render_balance_rows(free)}
                    </tbody>
                  </table>

                  <table cellpadding='0' cellspacing='0' style='border-collapse:collapse;border:1px solid #eee;margin-top:8px;'>
                    <thead>
                      <tr style='background:#fafafa;'>
                        <th style='padding:6px 10px;text-align:left'>币种</th>
                        <th style='padding:6px 10px;text-align:right'>占用</th>
                      </tr>
                    </thead>
                    <tbody>
                      {render_balance_rows(used)}
                    </tbody>
                  </table>

                  <h3 style='margin: 20px 0 8px;'>当前订单</h3>
                  <table cellpadding='0' cellspacing='0' style='border-collapse:collapse;border:1px solid #eee;'>
                    <thead>
                      <tr style='background:#fafafa;'>
                        <th style='padding:6px 10px;text-align:left'>Symbol</th>
                        <th style='padding:6px 10px;text-align:right'>Contracts</th>
                        <th style='padding:6px 10px;text-align:right'>Percentage</th>
                        <th style='padding:6px 10px;text-align:right'>Margin Ratio</th>
                        <th style='padding:6px 10px;text-align:right'>Realized PnL</th>
                        <th style='padding:6px 10px;text-align:right'>Entry Price</th>
                        <th style='padding:6px 10px;text-align:right'>Mark Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {''.join(orders_rows) or "<tr><td colspan='7' style='padding:6px 10px;'>暂无</td></tr>"}
                    </tbody>
                  </table>
                </div>
                """

                send_email(
                    "🚀 系统订单信息",
                    html_body,
                    html=True,
                )
                first_run = False  # 更新首次运行标记
                last_sent_hour = current_hour  # 更新上次发送邮件的小时

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