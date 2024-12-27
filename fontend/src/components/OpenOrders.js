
//

import React, { useState, useEffect } from "react";
import { extractIVData, operToCancel, handlerEditOrder, callOpenOrders } from "../utils/OptionApis";
import { extractPrice, GetCoinSign, GetPostionSize } from "../utils/Utils";
import { usePrices } from '../context/PriceContext';



function OpenOrders({onSymbolClick, modifyOrderDone, cancelOrderDone, refreshListKey}) {
    

     const [postionList, setPostionList] = useState([]);
     const [openOrders, setOpenOrders] = useState([]);
     const [refreshPostionListKey, setRefreshPostionListKey] = useState(0);
     const [buttonOrderSign, setButtonOrderSign] = useState('🟩');

     const coinPrices = usePrices();
  
    useEffect(() => {
        refreshOperOrder();
    }, [refreshListKey]);


    const refreshOrderIvData = (symbol, updateIdx) => {
      const current_price = extractPrice(GetCoinSign(symbol), coinPrices);
      console.log('symbol: ', symbol);
      console.log('current_price: ', current_price);
      if(null == current_price){
        alert('current_price is null');
        return;
      }
      // 清除旧数据
      const _oldOrder = [...openOrders];
      _oldOrder[updateIdx].ivData = null;
      setOpenOrders(_oldOrder);
      setButtonOrderSign('🔻')
      extractIVData(symbol, current_price).then((res) => {
        console.log('extractIVData: ', res, updateIdx);
        if(res.status){
          // console.log('DEBUG refreshOrderIvData res.data: ', res.data);
          const newOrderList = [...openOrders];
          newOrderList[updateIdx].ivData = res.data;
          console.log('DEBUG refreshOrderIvData newOrderList: ', newOrderList);
          setOpenOrders(newOrderList);
          setButtonOrderSign('🟩');
        }
      });
    }

    const operToModifyPriceToAsk = (orderid, symbol, price, type, side, backCall) => {
      // eslint-disable-next-line no-restricted-globals
      const beSure = confirm(`Are you sure to modify [${symbol}|${type}|${side}] to ask? [${price}]`);
      if(!beSure){
        return;
      }
      handlerEditOrder(orderid, symbol, price, type, side).then((res) => {
        console.log('handlerEditOrder: ', res);
        backCall();
      });
    }
  
    // 修改订单价格为买价
    const operToModifyPriceToBid = (orderid, symbol, price, type, side, backCall) => {
      // eslint-disable-next-line no-restricted-globals
      const beSure = confirm(`Are you sure to modify [${symbol}|${type}|${side}] to bid? [${price}]`);
      if(!beSure){
        return 
      }
      handlerEditOrder(orderid, symbol, price, type, side).then((res) => {
        console.log('handlerEditOrder: ', res);
        backCall();
      });
    }

    const refreshOperOrder = () => {
      callOpenOrders().then((res) => {
        console.log('callOpenOrders: ', res);
        const finalData = [];
        if(res.status && res.data.length > 0){
          res.data.forEach((item, idx) => {
            finalData.push({
              id: item.id,
              symbol: item.symbol,
              side: item.side,
              price: item.price,
              amount: item.amount,
              status: item.status,
              ivData: null
            });
          });
        }
        setOpenOrders(res.data);
      });
    }
    

    return (
        <>
        <table border={1}>
        <thead>
          <tr>
            <th>symbol</th>
            <th>side</th>
            <th>price</th>
            <th>amount</th>
            <th>status</th>
            <th>Refresh IV</th>
            <th>dayLeft</th>
            <th>ask_price</th>
            <th>S IV</th>
            <th>bid_price</th>
            <th>B IV</th>
            <th>delta</th>
            <th>gamma</th>
            <th>theta</th>
            <th>Intr Val</th>
            <th>Time Val</th>
            <th>Yield rate</th>
            <th>action</th>
          </tr>
        </thead>
        <tbody>
          {openOrders.map((order, idx) => (
            <>
              <tr key={order.id}>
                <td
                onClick={() => onSymbolClick(order.symbol)}
                style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                title="Click to copy"
                >{order.symbol}</td>
                <td>{order.side}</td>
                <td>{order.price}</td>
                <td>{order.amount*GetPostionSize(GetCoinSign(order.symbol))}</td>
                <td>{order.status}</td>
                <td>
                  <button onClick={() => refreshOrderIvData(order.symbol, idx)}>{buttonOrderSign} &nbsp; {extractPrice(GetCoinSign(order.symbol), coinPrices)}</button>
                </td>
         
                <td>
                  {order.ivData ? parseFloat(order.ivData.day_left).toFixed(2) : 'N/A'}
                </td>
                <td>
                  {order.ivData ? `${parseFloat(order.ivData.ask_price).toFixed(4)} [${parseFloat(order.ivData.ask_usd).toFixed(2)}$]`  : 'N/A'}
                </td>
                <td>
                  {order.ivData ? parseFloat(order.ivData.s_iv).toFixed(2) : 'N/A'}
                </td>
                <td>
                  {order.ivData ? `${parseFloat(order.ivData.bid_price).toFixed(4)} [${parseFloat(order.ivData.bid_usd).toFixed(2)}$]` : 'N/A'}
                </td>
                <td>
                  {order.ivData ? parseFloat(order.ivData.b_iv).toFixed(2) : 'N/A'}
                </td>
                <td>
                  {order.ivData ? parseFloat(order.ivData.delta).toFixed(4) : 'N/A'}
                </td>
                <td>
                  {order.ivData ? parseFloat(order.ivData.gamma).toFixed(8) : 'N/A'}
                </td>
                <td>
                  {order.ivData ? parseFloat(order.ivData.theta).toFixed(4) : 'N/A'}
                </td>
                <td>
                  {order.ivData ? parseFloat(order.ivData.intrinsic_value).toFixed(2) : 'N/A'}
                </td>
                <td>
                  {order.ivData ? parseFloat(order.ivData.time_value).toFixed(2) : 'N/A'}
                </td>
                <td>
                  {order.ivData ? parseFloat(order.ivData.time_value/extractPrice(GetCoinSign(order.symbol), coinPrices)/parseFloat(order.ivData.day_left)*365*100).toFixed(2) : 'N/A'} %
                </td>
                <td>
                  &nbsp;<button onClick={(_e)=>operToCancel(order.id, order.symbol, cancelOrderDone)}>Cancel</button>
                  &nbsp;
                </td>
              </tr>
              
              <tr key={idx}>
                <td colSpan={7}></td>
                <td>
                  {order.ivData ? <>
                    &nbsp;<button onClick={()=>operToModifyPriceToAsk(order.id,  order.symbol, order.ivData.ask_price, order.type, order.side, modifyOrderDone)}>Modify to ask</button>&nbsp;
                  </>: 'N/A'}
                
                </td>
                <td colSpan={1}></td>
                <td>
                  {order.ivData ? <>
                    &nbsp;<button onClick={()=>operToModifyPriceToBid(order.id,  order.symbol, order.ivData.bid_price, order.type, order.side, modifyOrderDone)}>Modify to bid</button>&nbsp;
                  </>: 'N/A'}
                </td>
                <td colSpan={8}></td>
              </tr>
            </>
          ))}
        </tbody>
      </table>
        </>
    );
}

export default OpenOrders;
