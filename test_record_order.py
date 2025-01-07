

import asyncio

from dataclasses import dataclass

from db_operation import OrderResultToDb
from db_struct import EResultOKXOrder

# 生成变量
# order_data = EResultOKXOrder(
#     api_key='67d0a7b5-3317-4751-84f1-df2c056412a8',
#     inst_type='OPTION',
#     inst_id='BTC-USD-250110-102000-C',
#     tgt_ccy='',
#     ccy='',
#     ord_id='2138314003814158336',
#     cl_ord_id='e847386590ce4dBC19559cc5cbb3fc34',
#     algo_cl_ord_id='',
#     algo_id='',
#     tag='e847386590ce4dBC',
#     px=0.016,
#     sz=1.0,
#     notional_usd=1017.315,
#     ord_type='limit',
#     side='sell',
#     pos_side='net',
#     td_mode='isolated',
#     acc_fill_sz=0.0,
#     fill_notional_usd=0.0,
#     avg_px=0.0,
#     state='live',
#     lever=0.0,
#     pnl=0.0,
#     fee_ccy='BTC',
#     fee=0.0,
#     rebate_ccy='BTC',
#     rebate=0.0,
#     category='normal',
#     u_time=1736229123308,
#     c_time=1736229123307,
#     source='',
#     reduce_only='false',
#     cancel_source='',
#     quick_mgn_type='',
#     stp_id='',
#     stp_mode='cancel_maker',
#     attach_algo_cl_ord_id='',
#     last_px=0.018,
#     is_tp_limit='false',
#     sl_trigger_px=0.0,
#     sl_trigger_px_type='',
#     tp_ord_px=0.0,
#     tp_trigger_px=0.0,
#     tp_trigger_px_type='',
#     sl_ord_px=0.0,
#     fill_px=0.0,
#     trade_id='',
#     fill_sz=0.0,
#     fill_time=0,
#     fill_pnl=0.0,
#     fill_fee=0.0,
#     fill_fee_ccy='',
#     exec_type='',
#     fill_px_vol=0.0,
#     fill_px_usd=0.0,
#     fill_mark_vol=0.0,
#     fill_fwd_px=0.0,
#     fill_mark_px=0.0,
#     amend_source='',
#     req_id='',
#     amend_result='',
#     code='0',
#     msg='',
#     px_type='px',
#     px_usd=1525.97,
#     px_vol=0.336,
#     linked_algo_ord_algo_id='',
#     attach_algo_ords='[]'
# )

order_data = EResultOKXOrder(api_key='67d0a7b5-3317-4751-84f1-df2c056412a8', inst_type='OPTION', inst_id='BTC-USD-250110-102000-C', tgt_ccy='', ccy='', ord_id='2138478027239460864', cl_ord_id='e847386590ce4dBCd6f96b8cdbbc906c', algo_cl_ord_id='', algo_id='', tag='e847386590ce4dBC', px=0.0165, sz=1.0, notional_usd=1019.7360000000001, ord_type='limit', side='buy', pos_side='net', td_mode='isolated', acc_fill_sz=1.0, fill_notional_usd=1019.7360000000001, avg_px=0.0165, state='filled', lever=0.0, pnl=-5e-06, fee_ccy='BTC', fee=-3e-06, rebate_ccy='BTC', rebate=0.0, category='normal', u_time=1736234011590, c_time=1736234011586, source='', reduce_only='false', cancel_source='', quick_mgn_type='', stp_id='', stp_mode='cancel_maker', attach_algo_cl_ord_id='', last_px=0.0165, is_tp_limit='false', sl_trigger_px=0.0, sl_trigger_px_type='', tp_ord_px=0.0, tp_trigger_px=0.0, tp_trigger_px_type='', sl_ord_px=0.0, fill_px=0.0165, trade_id='149', fill_sz=1.0, fill_time=1736234011588, fill_pnl=-5e-06, fill_fee=-3e-06, fill_fee_ccy='BTC', exec_type='T', fill_px_vol=0.3405854907226562, fill_px_usd=1682.5644, fill_mark_vol=0.473641865234375, fill_fwd_px=102777.1, fill_mark_px=0.02118942012139648, amend_source='', req_id='', amend_result='', code='0', msg='', px_type='px', px_usd=1682.56, px_vol=0.341, linked_algo_ord_algo_id='', attach_algo_ords='[]')

async def main():
    await OrderResultToDb(order_data)

asyncio.run(main())
