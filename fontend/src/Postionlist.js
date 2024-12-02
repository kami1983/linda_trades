// src/App.js
import React, { useEffect, useState } from 'react';
import { GetPostionSize, GetCoinSign } from './utils/Utils';
import { usePrices } from './context/PriceContext';
import Login from './components/Login';
import { useLoginStatus } from './context/LoginStautsContext';

function PostionList() {
    
    const [postionList, setPostionList] = useState([]);
    const [openOrders, setOpenOrders] = useState([]);
    const [aimOptionList, setAimOptionList] = useState([]);
    const [aimOptioinIvDataList, setAimOptioinIvDataList] = useState([]);
    const [moveToCreateResult, setMoveToCreateResult] = useState({'status': false, 'data': null});
    const [moveToCloseResult, setMoveToCloseResult] = useState({'status': false, 'data': null});
    const [buttonPostionSign, setButtonPostionSign] = useState('🟩');
    const [buttonOrderSign, setButtonOrderSign] = useState('🟩');

    const coinPrices = usePrices();
    const apiHosts = process.env.REACT_APP_API_HOSTS

    const { isLoggedIn } = useLoginStatus();

    useEffect(() => {

      // const _fetchPostionList = () => {
      //   // callPostionList
      //   // callPostionList().then((res) => {
      //   //   const finalData = [];
      //   //   if(res.status && res.data.length > 0){
      //   //     res.data.forEach((item, idx) => {
      //   //       // console.log('callPostionList Origin: ', item);
      //   //       finalData.push({
      //   //         id: item.id,
      //   //         symbol: item.symbol,
      //   //         side: item.side,
      //   //         contractSize: item.contractSize,
      //   //         realizedPnl: item.realizedPnl,
      //   //         percentage: item.percentage,
      //   //         entryPrice: item.entryPrice,
      //   //         markPrice: item.markPrice,
      //   //         ivData: null
      //   //       });
      //   //     });
      //   //   }
      //   //   // console.log('callPostionList: ', finalData);
      //   //   setPostionList(finalData);
      //   // });
      //   refreshAllData();
      // }
      // _fetchPostionList();
      refreshAllData();
    }, []); // labels 改变时重置定时器

    /**
     * 
     * @param {*} full_symbol ETH/USD:ETH-241108-2650-C
     * @param {*} current_price 2600
     * @returns 
     */
    const extractIVData = (full_symbol, current_price) => {
      return new Promise((resolve, reject) => {
        console.log('extractIVData: call params: ', full_symbol, current_price);
        fetch(`${apiHosts}/api/extract_iv_data?symbol=${full_symbol}&current_price=${current_price}`)
          .then(response => response.json())
          .then((data) => {
            if (data) {
              resolve(data);
            } else {
              reject('error');
            }
          });
      });
    }

    const callPostionList = () => {
      return new Promise((resolve, reject) => {
        fetch(`${apiHosts}/api/postion_orders`)
          .then(response => response.json())
          .then((data) => {
            if (data) {
              resolve(data);
            } else {
              reject('error');
            }
          });
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

    const refreshPostionList = () => {
      callPostionList().then((res) => {
        const finalData = [];
        if(res.status && res.data.length > 0){
          res.data.forEach((item, idx) => {
            finalData.push({
              id: item.id,
              symbol: item.symbol,
              side: item.side,
              contractSize: item.contractSize,
              realizedPnl: item.realizedPnl,
              percentage: item.percentage,
              entryPrice: item.entryPrice,
              markPrice: item.markPrice,
              ivData: null
            });
          });
        }
        setPostionList(finalData);
      });
    }

    const refreshAllData = () => {
      refreshOperOrder();
      refreshPostionList();
    }



    const callOpenOrders = () => {
      return new Promise((resolve, reject) => {
        fetch(`${apiHosts}/api/open_orders`)
          .then(response => response.json())
          .then((data) => {
            if (data) {
              resolve(data);
            } else {
              reject('error');
            }
          });
      });
    }

    

    const extractPrice =(symbol)=>{
      if(coinPrices)
      for(let i=0; i<coinPrices.length; i++){
        if(coinPrices[i].data.symbol === symbol){
          return coinPrices[i].data.price;
        }
      }
      return null;
    }

    const refreshPostionIvData = (symbol, updateIdx) => {
      const current_price = extractPrice(GetCoinSign(symbol));
      console.log('symbol: ', symbol);
      console.log('current_price: ', current_price);
      if(null == current_price){
        alert('current_price is null');
        return;
      }
      // 清除旧数据
      const _oldPostion = [...postionList];
      _oldPostion[updateIdx].ivData = null;
      const _oldAimOptioin = [...aimOptioinIvDataList];
      _oldAimOptioin[updateIdx] = null;
      setPostionList(_oldPostion);
      setAimOptioinIvDataList(_oldAimOptioin);

      setButtonPostionSign('🔻');
      extractIVData(symbol, current_price).then((res) => {
        console.log('extractIVData: ', res, updateIdx);
        if(res.status){
          const newPostionList = [...postionList];
          newPostionList[updateIdx].ivData = res.data;
          setPostionList(newPostionList);
          setButtonPostionSign('🟩');
        }
      });

      const aimOption = aimOptionList[updateIdx];
      if(aimOption){
        extractIVData(aimOption, current_price).then((res) => {
          console.log('aimOptionList: ', res, updateIdx);
          if(res.status){
            const newAimOptioinIvDataList = [...aimOptioinIvDataList];
            newAimOptioinIvDataList[updateIdx] = res.data;
            console.log('newAimOptioinIvDataList: ', newAimOptioinIvDataList);
            setAimOptioinIvDataList(newAimOptioinIvDataList);
            setButtonPostionSign('🟩');
          }
        });
      }
      
    }

    const refreshOrderIvData = (symbol, updateIdx) => {
      const current_price = extractPrice(GetCoinSign(symbol));
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

    // 更新目标期权
    const updateAimOption = (e, idx) => {
      const oldDataList = aimOptionList;
      oldDataList[idx] = e.target.value;
      setAimOptionList(oldDataList);
    }

    // 取消订单
    const operToCancel = (orderid, symbol, backCall) => {
      // eslint-disable-next-line no-restricted-globals
      const beSure = confirm('Are you sure to cancel?');
      if (beSure) {
        // 调用 /api/cancel_order，返回一个 Promise
        return new Promise((resolve, reject) => {
          fetch(`${apiHosts}/api/cancel_order?orderid=${orderid}&symbol=${symbol}`, {
            method: "GET",
            credentials: "include"
          })
            .then(response => {
              if (response.status === 401) {
                // 如果返回401，提示需要登录
                alert('Please login first');
                reject('Unauthorized');
                return;
              }
              return response.json();  // 继续处理其他响应
            })
            .then(data => {
              if (data) {
                backCall(); // 取消订单后回调
                resolve(data); // 处理成功
              } else {
                reject('Error: No data returned');
              }
            })
            .catch(error => {
              // 捕获任何其他错误
              console.error('Error during fetch:', error);
              reject(error);
            });
        });
      }
    };

    /**
     * @param side OrderSide = Literal['buy', 'sell']
     * @param type OrderType = Literal['limit', 'market']
     *             PositionSide = Literal['long', 'short']
     */
    const handlerEditOrder = (orderid, symbol, price, type, side) => {
      return new Promise((resolve, reject) => {
        // /api/change_order_price
        fetch(`${apiHosts}/api/change_order_price?orderid=${orderid}&symbol=${symbol}&price=${price}&type${type}&side=${side}`, {
          method: "GET",
          credentials: "include"
        }).then(response => {
          if (response.status === 401) {
            // 如果返回401，提示需要登录
            alert('Please login first');
            reject('Unauthorized');
            return;
          }
          return response.json();  // 继续处理其他响应
        }).then(data => {
          if (data) {
            resolve(data); // 处理成功
          } else {
            reject('Error: No data returned');
          }
        }).catch(error => {
          // 捕获任何其他错误
          console.error('Error during fetch:', error);
          reject(error);
        });
      });
    }

    // 修改价格为卖出价
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

    /**
     * @param symbol = 'BTC/USD:BTC-241213-98000-C'
     * @param amount = int(1)
     * @param price = 0
     * @param type = 'limit'|'market'
     * @param side = 'buy'|'sell'
     * @returns
     */
    const handlerToCreatePosition = (symbol, amount, price, type, side) => {
      return new Promise((resolve, reject) => {
        // /api/change_order_price
        fetch(`${apiHosts}/api/create_position?symbol=${symbol}&amount=${amount}&price=${price}&type=${type}&side=${side}`, {
          method: "GET",
          credentials: "include"
        }).then(response => {
          if (response.status === 401) {
            // 如果返回401，提示需要登录
            alert('Please login first');
            reject('Unauthorized');
            return;
          }
          return response.json();  // 继续处理其他响应
        }).then(data => {
          if (data) {
            resolve(data); // 处理成功
          } else {
            reject('Error: No data returned');
          }
        }).catch(error => {
          // 捕获任何其他错误
          console.error('Error during fetch:', error);
          reject(error);
        });
      });
    }

    // TODO: 这个方法不可用
    // const handlerToClosePosition = (symbol, orderid, side, backCall) => {
    //   return new Promise((resolve, reject) => {
    //     const operside = side === 'short' ? 'short' : 'long';
    //     // /api/close_position [symbol, orderid, side]
    //     fetch(`${apiHosts}/api/close_position?symbol=${symbol}&orderid=${orderid}&side=${operside}`, {
    //       method: "GET",
    //       credentials: "include"
    //     }).then(response => {
    //       if (response.status === 401) {
    //         // 如果返回401，提示需要登录
    //         alert('Please login first');
    //         reject('Unauthorized');
    //         return;
    //       }
    //       return response.json();  // 继续处理其他响应
    //     }).then(data => {
    //       if (data) {
    //         resolve(data); // 处理成功
    //       } else {
    //         reject('Error: No data returned');
    //       }
    //     }).catch(error => {
    //       // 捕获任何其他错误
    //       console.error('Error during fetch:', error);
    //       reject(error);
    //     });
    //   });
    // }
        
    const handleCopyToClipboard = (text) => {
      navigator.clipboard.writeText(text)
          .then(() => {
              alert(`Copied to clipboard: ${text}`);
          })
          .catch((err) => {
              console.error('Failed to copy: ', err);
          });
    };

    /**
     * 
     * @param {*} closePostionSymbol = 'BTC/USD:BTC-241213-98000-C'
     * @param {*} order_id = '2026438832795287552'
     * @param {*} side = 'short'|'long'
     * @param {*} createPostionSymbol = 'BTC/USD:BTC-241213-100000-C'
     * @param {*} amount = int(1)
     * @param {*} type = 'limit'|'market'
     * @param {*} price = 0
     * @returns 
     */
    const moveToPostion = (movePostion = {
      closePostionSymbol: '', 
      closeSide: 'buy', 
      closeAmount: 0,
      closePrice: 0, 
      closeType: 'buy',

      createPostionSymbol: '',
      createSide: 'sell',
      createAmount: 0,
      createPrice: 0,
      createType: 'sell'
    }, backCall = ()=>{alert('Move postion done!')}) => {

      // eslint-disable-next-line no-restricted-globals
      const beSure = confirm(`Are you sure move the "${movePostion.closePostionSymbol}" to the "${movePostion.createPostionSymbol}"?`);
      if(!beSure){
        return;
      }

      console.log('Move to postion call params: ', {movePostion});

      // handlerToClosePosition
      // handlerToClosePosition(closePostionSymbol, order_id, side, ()=>{alert('Close done.')}).then((res) => {
      //   console.log('handlerToClosePosition: ', res);
      //   setMoveToCloseResult(res);
      // });
        
      const closePostion = handlerToCreatePosition(
        movePostion.closePostionSymbol, 
        movePostion.closeAmount,
        movePostion.closePrice,
        movePostion.closeType,
        movePostion.closeSide
      )

      // closePostion.then((res) => {
      //   console.log('handlerToCreatePosition: ', res);
      //   backCall();
      // });

      const createPostion = handlerToCreatePosition(
        movePostion.createPostionSymbol,
        movePostion.createAmount,
        movePostion.createPrice,
        movePostion.createType,
        movePostion.createSide
      )

      // createPostion.then((res) => {
      //   console.log('handlerToCreatePosition: ', res);
      //   backCall();
      // });

      Promise.all([closePostion, createPostion]).then((res) => {
        console.log('handlerToCreatePosition: ', res);
        backCall();
      });

      

    }

    return (
      <div>
        <h1> 
          【{isLoggedIn ? "✅️" : "❌"}】
          Login 
        </h1>
        <Login/>
      <h1>Prices</h1>
      {coinPrices.map((coinPrice, idx) => (
          <div key={idx}>
              {coinPrice.status ? (
                  <h3>
                      {coinPrice.data.symbol}:{' '}
                      {coinPrice.data.price}
                  </h3>
              ) : null}
          </div>
      ))}

      <h1>Postion List</h1>
      <table border={1}>
        <thead>
          <tr>
            <th>symbol</th>
            <th>side</th>
            <th>realizedPnl</th>
            <th>percentage</th>
            <th>entryPrice</th>
            <th>markPrice</th>
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
          {postionList.map((postion, idx) => (
            <><tr key={`${idx}a`}>
              <td
              onClick={() => handleCopyToClipboard(postion.symbol)}
              style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
              title="Click to copy"
              >{postion.symbol}</td>
              <td>{postion.side}</td>
              <td>{postion.realizedPnl}</td>
              <td>{parseFloat(postion.percentage).toFixed(2)}%</td>
              <td>{postion.entryPrice}</td>
              <td>{parseFloat(postion.markPrice).toFixed(4)}</td>
              <td><button onClick={() => refreshPostionIvData(postion.symbol, idx)}>{buttonPostionSign} &nbsp; {extractPrice(GetCoinSign(postion.symbol))}</button></td>
              <td>{postion.ivData ? parseFloat(postion.ivData.day_left).toFixed(2) : 'N/A'}</td>
              <td>{postion.ivData ? parseFloat(postion.ivData.ask_price).toFixed(4) : 'N/A'}</td>
              <td>{postion.ivData ? parseFloat(postion.ivData.b_iv).toFixed(2) : 'N/A'}</td>
              <td>{postion.ivData ? parseFloat(postion.ivData.bid_price).toFixed(4) : 'N/A'}</td>
              <td>{postion.ivData ? parseFloat(postion.ivData.s_iv).toFixed(2) : 'N/A'}</td>
              <td style={{ "color": "red" }}>{postion.ivData ? parseFloat(postion.ivData.delta).toFixed(4) : 'N/A'}</td>
              <td>{postion.ivData ? parseFloat(postion.ivData.gamma).toFixed(8) : 'N/A'}</td>
              <td>{postion.ivData ? parseFloat(postion.ivData.theta).toFixed(4) : 'N/A'}</td>
              <td sytle={{color: 'green'}}>[{postion.ivData ? parseFloat(postion.ivData.intrinsic_value).toFixed(2) : 'N/A'}]</td>
              <td style={{color: 'blue'}}>{postion.ivData ? parseFloat(postion.ivData.time_value).toFixed(2) : 'N/A'}</td>
              <td>{postion.ivData ? parseFloat(postion.ivData.time_value/extractPrice(GetCoinSign(postion.symbol))/parseFloat(postion.ivData.day_left)*365*100).toFixed(2) : 'N/A'} %</td>
              <td></td>
            </tr><tr key={`${idx}b`}>
                <td colSpan={7}>
                  <input type="text" placeholder="BTC/USD:BTC-241206-100000-C"  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    textAlign: 'right',
                    padding: '8px', // 根据需要调整
                  }} onChange={(e) => updateAimOption(e, idx)} />
                </td>
                <td>{aimOptioinIvDataList[idx]? parseFloat(aimOptioinIvDataList[idx].day_left).toFixed(2): 'N/A' }</td>
                <td>{aimOptioinIvDataList[idx]? parseFloat(aimOptioinIvDataList[idx].ask_price).toFixed(4): 'N/A' }</td>
                <td>{aimOptioinIvDataList[idx]? parseFloat(aimOptioinIvDataList[idx].b_iv).toFixed(2): 'N/A' }</td>
                <td>{aimOptioinIvDataList[idx]? parseFloat(aimOptioinIvDataList[idx].bid_price).toFixed(4): 'N/A' }</td>
                <td>{aimOptioinIvDataList[idx]? parseFloat(aimOptioinIvDataList[idx].s_iv).toFixed(2): 'N/A' }</td>
                <td style={{ "color": "red" }}>{aimOptioinIvDataList[idx]? parseFloat(aimOptioinIvDataList[idx].delta).toFixed(4): 'N/A' }</td>
                <td>{aimOptioinIvDataList[idx]? parseFloat(aimOptioinIvDataList[idx].gamma).toFixed(8): 'N/A' }</td>
                <td>{aimOptioinIvDataList[idx]? parseFloat(aimOptioinIvDataList[idx].theta).toFixed(4): 'N/A' }</td>
                <td sytle={{color: 'green'}}>[{aimOptioinIvDataList[idx]? parseFloat(aimOptioinIvDataList[idx].intrinsic_value).toFixed(2): 'N/A'}]</td>
                <td style={{color: 'blue'}}>{aimOptioinIvDataList[idx]? parseFloat(aimOptioinIvDataList[idx].time_value).toFixed(2): 'N/A'}</td>
                <td>{aimOptioinIvDataList[idx]? parseFloat(aimOptioinIvDataList[idx].time_value/extractPrice(GetCoinSign(postion.symbol))/parseFloat(aimOptioinIvDataList[idx].day_left)*365*100).toFixed(2): 'N/A'} %</td>
                <td
                  onClick={() => moveToPostion({
                    closePostionSymbol: postion.symbol, closeSide: 'buy', closeAmount: postion.contractSize, closePrice: postion.ivData.ask_price, closeType: 'limit',
                    createPostionSymbol: aimOptionList[idx], createSide: 'sell', createAmount: postion.contractSize, createPrice: aimOptioinIvDataList[idx].bid_price , createType: 'limit',
                    refreshAllData
                  })}
                >{aimOptioinIvDataList[idx]?<button>Move to this postion.</button>:'Need refresh'}</td>
              </tr></>
          ))}
        </tbody>
      </table>
      <h1>Open Orders</h1>
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
                onClick={() => handleCopyToClipboard(order.symbol)}
                style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                title="Click to copy"
                >{order.symbol}</td>
                <td>{order.side}</td>
                <td>{order.price}</td>
                <td>{order.amount*GetPostionSize(GetCoinSign(order.symbol))}</td>
                <td>{order.status}</td>
                <td>
                  <button onClick={() => refreshOrderIvData(order.symbol, idx)}>{buttonOrderSign} &nbsp; {extractPrice(GetCoinSign(order.symbol))}</button>
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
                  {order.ivData ? parseFloat(order.ivData.time_value/extractPrice(GetCoinSign(order.symbol))/parseFloat(order.ivData.day_left)*365*100).toFixed(2) : 'N/A'} %
                </td>
                <td>
                  &nbsp;<button onClick={(_e)=>operToCancel(order.id, order.symbol, refreshOperOrder)}>Cancel</button>
                  &nbsp;
                </td>
              </tr>
              
              <tr key={idx}>
                <td colSpan={7}></td>
                <td>
                  {order.ivData ? <>
                    &nbsp;<button onClick={()=>operToModifyPriceToAsk(order.id,  order.symbol, order.ivData.ask_price, order.type, order.side, refreshOperOrder)}>Modify to ask</button>&nbsp;
                  </>: 'N/A'}
                
                </td>
                <td colSpan={1}></td>
                <td>
                  {order.ivData ? <>
                    &nbsp;<button onClick={()=>operToModifyPriceToBid(order.id,  order.symbol, order.ivData.bid_price, order.type, order.side, refreshOperOrder)}>Modify to bid</button>&nbsp;
                  </>: 'N/A'}
                </td>
                <td colSpan={8}></td>
              </tr>
            </>
          ))}
        </tbody>
      </table>
      </div>
    );
}

export default PostionList;
