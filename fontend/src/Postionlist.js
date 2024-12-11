// src/App.js
import React, { useEffect, useState } from 'react';
import { GetPostionSize, GetCoinSign } from './utils/Utils';
import { usePrices } from './context/PriceContext';
import Login from './components/Login';
import { useLoginStatus } from './context/LoginStautsContext';

function PostionList() {
    
    const [postionList, setPostionList] = useState([]);
    const [openOrders, setOpenOrders] = useState([]);
    const [toCreateIvData, setToCreateIvData] = useState(null);
    const [toCreateSymbol, setToCreateSymbol] = useState('');
    const [toCreateAmount, setToCreateAmount] = useState(1);
    const [toCreatePrice, setToCreatePrice] = useState(0);
    const [toCreateType, setToCreateType] = useState('limit');
    const [toCreateSide, setToCreateSide] = useState('sell');

    const [aimOptionList, setAimOptionList] = useState([]);
    const [aimOptioinIvDataList, setAimOptioinIvDataList] = useState([]);
    const [moveToCreateResult, setMoveToCreateResult] = useState({'status': false, 'data': null});
    const [moveToCloseResult, setMoveToCloseResult] = useState({'status': false, 'data': null});
    const [buttonPostionSign, setButtonPostionSign] = useState('🟩');
    const [buttonOrderSign, setButtonOrderSign] = useState('🟩');
    const [buttonCreateSign, setButtonCreateSign] = useState('🟩');
    const [buttonGetBtcOptionSign, setButtonGetBtcOptionSign] = useState('🟩');
    const [buttonGetEthOptionSign, setButtonGetEthOptionSign] = useState('🟩');
    const [buttonSubmitCreateSign, setButtonSubmitCreateSign] = useState('⚡️');

    const [optionChainList, setOptionChainList] = useState([]);

    const coinPrices = usePrices();
    const apiHosts = process.env.REACT_APP_API_HOSTS
     

    const { isLoggedIn } = useLoginStatus();

    useEffect(() => {
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
              contracts: item.contracts,
              amount: item.contracts*GetPostionSize(GetCoinSign(item.symbol)),
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

    const getTOptionChain = (symbol, current_price) => {
      return new Promise((resolve, reject) => {
        fetch(`${apiHosts}/api/t_option_chain?symbol=${symbol}&price=${current_price}`)
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

    const refreshCreateIvData = (symbol) => {
      const current_price = extractPrice(GetCoinSign(symbol));
      console.log('symbol: ', symbol);
      console.log('current_price: ', current_price);
      if(null == current_price){
        alert('current_price is null');
        return;
      }
      setButtonCreateSign('🔻')
      extractIVData(symbol, current_price).then((res) => {
        console.log('extract create IVData: ', res);
        if(res.status){
          setToCreateIvData(res.data);
          setButtonCreateSign('🟩');
        }
      });
    }

    const refreshOptionTable = (symbol) => {
      const current_price = extractPrice(symbol);
      if(symbol === 'BTC'){
        setButtonGetBtcOptionSign('🔻');
      }else if(symbol === 'ETH'){
        setButtonGetEthOptionSign('🔻')
      };
      getTOptionChain(symbol, current_price).then((res) => {
        console.log('getTOptionChain: ', res);
        if(res.status){
          // 过滤，仅仅选择 ATM 上下的期权
          const _optionChainList = res.data;
          const _optionChainListFiltered = [];
          for(let i=0; i<_optionChainList.length; i++){
            if(_optionChainList[i][1] && Math.abs(_optionChainList[i][1].delta) > 0.4 && Math.abs(_optionChainList[i][1].delta) < 0.6){
              _optionChainListFiltered.push(_optionChainList[i]);
            }
          }

          // 按照 day_left 排序
          _optionChainListFiltered.sort((a, b) => {
            return a[1].day_left - b[1].day_left;
          });

          setOptionChainList(_optionChainListFiltered);
          if(symbol === 'BTC'){
            setButtonGetBtcOptionSign('🟩');
          }else if(symbol === 'ETH'){
            setButtonGetEthOptionSign('🟩');
          }
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

    function handleCopyToClipboard(text) {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text)
              .then(() => {
                  alert("Text copied to clipboard successfully!");
              })
              .catch(err => {
                  console.error("Failed to copy text to clipboard:", err);
              });
      } else {
          console.warn("Clipboard API is not supported or unavailable.");
          alert("Your browser does not support clipboard functionality.");
      }
    }
  

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
      closeId: '',
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

      // handlerToClosePosition(
      //   movePostion.closePostionSymbol,
      //   movePostion.closeId,
      //   movePostion.closeSide,
      //   backCall).then((res) => {
      //     console.log('handlerToClosePosition: ', res);
      //   });
        
      const closePostion = handlerToCreatePosition(
        movePostion.closePostionSymbol, 
        movePostion.closeAmount,
        movePostion.closePrice,
        movePostion.closeType,
        movePostion.closeSide
      )

      const createPostion = handlerToCreatePosition(
        movePostion.createPostionSymbol,
        movePostion.createAmount,
        movePostion.createPrice,
        movePostion.createType,
        movePostion.createSide
      )

      Promise.all([closePostion, createPostion]).then((res) => {
        console.log('handlerToCreatePosition: ', res);
        alert('Close status: ' + res[0].status + ' Create status: ' + res[1].status);
        backCall();
      });

    }
    
    const createNewPostion = (callBack) => {
      setButtonSubmitCreateSign('🔥');
      console.log({
        toCreateSymbol,
        toCreateAmount,
        toCreatePrice,
        toCreateType,
        toCreateSide
      })
      handlerToCreatePosition(toCreateSymbol, toCreateAmount, toCreatePrice, toCreateType, toCreateSide).then((res) => {
        console.log('handlerToCreatePosition: ', res);
        if(res.status){
          alert('Create postion success!');
        }else{
          alert('Create postion failed!');
        }
        setButtonSubmitCreateSign('⚡️');
        callBack();
      });
    }

    const handleShowInferInfo = (data) => {
      // console.log('handleShowInferInfo: ', data);
      const current_price = extractPrice(GetCoinSign(data.symbol));
      const infer_diff = (parseFloat(data.infer_price) - current_price ).toFixed(2)
      const infer_sign = infer_diff<0 ? '🔴':'🟢'
      // 计算与当前价格的差值比率
      const infer_diff_rate = (infer_diff/current_price*100).toFixed(2);
      return `${infer_sign} ${infer_diff}[${infer_diff_rate}%]`;
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

      <h1>Option tables</h1>
      <table border={1}>
        <thead>
          <tr>
            <th>symbol</th>
            <th>delta</th>
            <th>infer_price</th>
            <th>leftDays</th>
            <th>ask_price</th>
            <th>S IV</th>
            <th>bid_price</th>
            <th>B IV</th>
            <th>intrinsic_value</th>
            <th>time_value</th>
            <th>Yield rate</th>
          </tr>
        </thead>
        <tbody>
          {optionChainList.map((option, idx) => (
            <React.Fragment key={idx}>
              <tr>
                <td
                onClick={() => handleCopyToClipboard(option[0] ? option[0].symbol : 'N/A')}
                style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                title="Click to copy"
                >{option[0] ? option[0].symbol : 'N/A'}</td>
                <td>{option[1] ? parseFloat(option[1].delta).toFixed(2) : 'N/A'}</td>
                <td>
                  {option[1] ? parseFloat(option[1].infer_price).toFixed(2) : 'N/A'}
                  {option[1] ? <>
                    [
                    {handleShowInferInfo(option[1])}
                    ]
                  </>: ''}
                </td>
                <td>
                  {option[1] ? parseFloat(option[1].day_left).toFixed(2) : 'N/A'}
                </td>
                <td><span style={{color: 'RED'}}>{option[1] ? option[1].ask_price : 'N/A'}</span> [{option[1] ? option[1].ask_usd.toFixed(2): 'N/A'}$]</td>
                <td>{option[1] ? parseFloat(option[1].s_iv).toFixed(2) : 'N/A'}</td>
                <td><span style={{color: 'BLUE'}}>{option[1] ? option[1].bid_price : 'N/A'}</span> [{option[1] ? option[1].bid_usd.toFixed(2): 'N/A'}$]</td>
                <td>{option[1] ? parseFloat(option[1].b_iv).toFixed(2) : 'N/A'}</td>
                <td>{option[1] ? parseFloat(option[1].intrinsic_value).toFixed(4) : 'N/A'}</td>
                <td>{option[1] ? parseFloat(option[1].time_value).toFixed(4) : 'N/A'}</td>
                <td>{option[1] ? parseFloat(option[1].time_value/extractPrice(GetCoinSign(option[0].symbol))/parseFloat(option[1].day_left)*365*100).toFixed(2) : 'N/A'} %</td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
      
      {coinPrices && coinPrices[0] && coinPrices[0].status? <>
        <button onClick={()=>refreshOptionTable('BTC')}>
        Refresh BTC Option Table {buttonGetBtcOptionSign}
        </button>
        <button onClick={()=>refreshOptionTable('ETH')}>
          Refresh ETH Option Table {buttonGetEthOptionSign}
        </button>
      </>:"Waiting for prices..."}
    
    <h1>Create Postion</h1>
    <table border={1}>
      <thead>
        <tr>
          <th>symbol</th>
          <th>side</th>
          <th>amount</th>
          <th>price</th>
          <th>type</th>
          <th>Refresh IV Data</th>
          <th>infer_price</th>
          <th>delta</th>
          <th>ask_price</th>
          <th>S IV</th>
          <th>bid_price</th>
          <th>B IV</th>
          <th>intrinsic_value</th>
          <th>time_value</th>
          <th>action</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <input type="text" placeholder="BTC/USD:BTC-241213-98000-C" style={{
                    width: '300px',
                    boxSizing: 'border-box',
                    textAlign: 'right',
                    padding: '8px', // 根据需要调整
                  }} onChange={(e)=>setToCreateSymbol(e.target.value)} />
          </td>
          <td>
            <select onChange={(e)=>setToCreateSide(e.target.value)}>
              <option value="sell" >sell</option>
              <option value="buy">buy</option>
            </select>
          </td>
          <td>
            <input type="number" placeholder="1" value={toCreateAmount} onChange={(e)=>setToCreateAmount(e.target.value)} />
          </td>
          <td>
            <input type="number" placeholder="0" value={toCreatePrice} onChange={(e)=>setToCreatePrice(e.target.value)} />
          </td>
          <td>
            <select onClick={(e)=>setToCreateType(e.target.value)}>
              <option value="limit">limit</option>
              <option value="market">market</option>
            </select>
          </td>
          <td>
            <button onClick={()=>refreshCreateIvData(toCreateSymbol)}>{buttonCreateSign} &nbsp; Refresh {extractPrice(GetCoinSign(toCreateSymbol))}</button>
          </td>
          <td>
            {toCreateIvData ? parseFloat(toCreateIvData.infer_price).toFixed(2) : 'N/A'}
            {toCreateIvData ? <>
              [
              {handleShowInferInfo(toCreateIvData)}
              ]
            </>: ''}
          </td>
          <td>
            {toCreateIvData ? parseFloat(toCreateIvData.delta).toFixed(4) : 'N/A'}
          </td>
          <td>
            {toCreateIvData ? parseFloat(toCreateIvData.ask_price).toFixed(4) : 'N/A'}
          </td>
          <td>
            {toCreateIvData ? parseFloat(toCreateIvData.s_iv).toFixed(2) : 'N/A'}
          </td>
          <td>
            {toCreateIvData ? parseFloat(toCreateIvData.bid_price).toFixed(4) : 'N/A'}
          </td>
          <td>
            {toCreateIvData ? parseFloat(toCreateIvData.b_iv).toFixed(2) : 'N/A'}
          </td>
          <td>
            {toCreateIvData ? parseFloat(toCreateIvData.intrinsic_value).toFixed(2) : 'N/A'}
          </td>
          <td>
            {toCreateIvData ? parseFloat(toCreateIvData.time_value).toFixed(2) : 'N/A'}
          </td>
          <td>
          <button onClick={()=>createNewPostion(refreshAllData)} >{buttonSubmitCreateSign} Submit : [{toCreateSymbol}]</button>
          </td>
        </tr>
      </tbody>
    </table>
   


      <h1>Postion List</h1>
      <table border={1}>
        <thead>
          <tr>
            <th>symbol</th>
            <th>side</th>
            <th>contracts</th>
            <th>realizedPnl</th>
            <th>percentage</th>
            <th>entryPrice</th>
            <th>markPrice</th>
            <th>Refresh IV</th>
            <th>delta</th>
            <th>infer_price</th>
            <th>dayLeft</th>
            <th>ask_price</th>
            <th>S IV</th>
            <th>bid_price</th>
            <th>B IV</th>
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
              <td>{postion.contracts} [{postion.amount}]</td>
              <td>{postion.realizedPnl}</td>
              <td>{parseFloat(postion.percentage).toFixed(2)}%</td>
              <td>{postion.entryPrice}</td>
              <td>{parseFloat(postion.markPrice).toFixed(4)}</td>
              <td><button onClick={() => refreshPostionIvData(postion.symbol, idx)}>{buttonPostionSign} &nbsp; {extractPrice(GetCoinSign(postion.symbol))}</button></td>
              <td style={{ "color": "red" }}>{postion.ivData ? parseFloat(postion.ivData.delta).toFixed(4) : 'N/A'}</td>
              <td>
                {postion.ivData ? parseFloat(postion.ivData.infer_price).toFixed(2) : 'N/A'}
                {postion.ivData ? <>
                  [
                  {handleShowInferInfo(postion.ivData)}
                  ]
                </>: ''}
              </td>
              <td>{postion.ivData ? parseFloat(postion.ivData.day_left).toFixed(2) : 'N/A'}</td>
              <td>{postion.ivData ? parseFloat(postion.ivData.ask_price).toFixed(4) : 'N/A'}</td>
              <td>{postion.ivData ? parseFloat(postion.ivData.b_iv).toFixed(2) : 'N/A'}</td>
              <td>{postion.ivData ? parseFloat(postion.ivData.bid_price).toFixed(4) : 'N/A'}</td>
              <td>{postion.ivData ? parseFloat(postion.ivData.s_iv).toFixed(2) : 'N/A'}</td>
              
              <td>{postion.ivData ? parseFloat(postion.ivData.gamma).toFixed(8) : 'N/A'}</td>
              <td>{postion.ivData ? parseFloat(postion.ivData.theta).toFixed(4) : 'N/A'}</td>
              <td sytle={{color: 'green'}}>[{postion.ivData ? parseFloat(postion.ivData.intrinsic_value).toFixed(2) : 'N/A'}]</td>
              <td style={{color: 'blue'}}>{postion.ivData ? parseFloat(postion.ivData.time_value).toFixed(2) : 'N/A'}</td>
              <td>{postion.ivData ? parseFloat(postion.ivData.time_value/extractPrice(GetCoinSign(postion.symbol))/parseFloat(postion.ivData.day_left)*365*100).toFixed(2) : 'N/A'} %</td>
              <td></td>
            </tr>
            <tr key={`${idx}b`}>
                <td colSpan={8}>
                  <input type="text" placeholder="BTC/USD:BTC-241206-100000-C"  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    textAlign: 'right',
                    padding: '8px', // 根据需要调整
                  }} onChange={(e) => updateAimOption(e, idx)} />
                </td>
                <td style={{ "color": "red" }}>{aimOptioinIvDataList[idx]? parseFloat(aimOptioinIvDataList[idx].delta).toFixed(4): 'N/A' }</td>
                <td>
                  {aimOptioinIvDataList[idx] ? parseFloat(aimOptioinIvDataList[idx].infer_price).toFixed(2) : 'N/A'}
                  {aimOptioinIvDataList[idx] ? <>
                    [
                    {handleShowInferInfo(aimOptioinIvDataList[idx])}
                    ]
                  </>: ''}
                </td>
                <td>{aimOptioinIvDataList[idx]? parseFloat(aimOptioinIvDataList[idx].day_left).toFixed(2): 'N/A' }</td>
                <td>{aimOptioinIvDataList[idx]? parseFloat(aimOptioinIvDataList[idx].ask_price).toFixed(4): 'N/A' }</td>
                <td>{aimOptioinIvDataList[idx]? parseFloat(aimOptioinIvDataList[idx].b_iv).toFixed(2): 'N/A' }</td>
                <td>{aimOptioinIvDataList[idx]? parseFloat(aimOptioinIvDataList[idx].bid_price).toFixed(4): 'N/A' }</td>
                <td>{aimOptioinIvDataList[idx]? parseFloat(aimOptioinIvDataList[idx].s_iv).toFixed(2): 'N/A' }</td>
                
                <td>{aimOptioinIvDataList[idx]? parseFloat(aimOptioinIvDataList[idx].gamma).toFixed(8): 'N/A' }</td>
                <td>{aimOptioinIvDataList[idx]? parseFloat(aimOptioinIvDataList[idx].theta).toFixed(4): 'N/A' }</td>
                <td sytle={{color: 'green'}}>[{aimOptioinIvDataList[idx]? parseFloat(aimOptioinIvDataList[idx].intrinsic_value).toFixed(2): 'N/A'}]</td>
                <td style={{color: 'blue'}}>{aimOptioinIvDataList[idx]? parseFloat(aimOptioinIvDataList[idx].time_value).toFixed(2): 'N/A'}</td>
                <td>{aimOptioinIvDataList[idx]? parseFloat(aimOptioinIvDataList[idx].time_value/extractPrice(GetCoinSign(postion.symbol))/parseFloat(aimOptioinIvDataList[idx].day_left)*365*100).toFixed(2): 'N/A'} %</td>
                <td
                  onClick={() => moveToPostion({
                    closePostionSymbol: postion.symbol, closeSide: 'buy', closeAmount: postion.contracts, closePrice: postion.ivData.ask_price, closeType: 'limit', closeId: postion.id,
                    createPostionSymbol: aimOptionList[idx], createSide: 'sell', createAmount: postion.contracts, createPrice: aimOptioinIvDataList[idx].bid_price , createType: 'limit',
                  }, ()=>{refreshAllData(); alert('Move postion done!!!')})}
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
                    &nbsp;<button onClick={()=>operToModifyPriceToAsk(order.id,  order.symbol, order.ivData.ask_price, order.type, order.side, refreshAllData)}>Modify to ask</button>&nbsp;
                  </>: 'N/A'}
                
                </td>
                <td colSpan={1}></td>
                <td>
                  {order.ivData ? <>
                    &nbsp;<button onClick={()=>operToModifyPriceToBid(order.id,  order.symbol, order.ivData.bid_price, order.type, order.side, refreshAllData)}>Modify to bid</button>&nbsp;
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
