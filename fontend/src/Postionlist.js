// src/App.js
import React, { useEffect, useState } from 'react';
import { GetPostionSize, GetCoinSign } from './utils/Utils';
import { usePrices } from './context/PriceContext';
import Login from './components/Login';
import { useLoginStatus } from './context/LoginStautsContext';

function PostionList() {
    
    const [postionList, setPostionList] = useState([]);
    const [openOrders, setOpenOrders] = useState([]);
    const [toCreateIvData, setToCreateIvData] = useState([null]);
    
    const [toCreateSymbol, setToCreateSymbol] = useState(['']);
    const [toCreateAmount, setToCreateAmount] = useState([1]);
    const [toCreatePrice, setToCreatePrice] = useState([0]);
    const [toCreateType, setToCreateType] = useState(['limit']);
    const [toCreateSide, setToCreateSide] = useState(['sell']);
    const [toCreateSlots, setToCreateSlots] = useState([true]);
    
    const [optionChainRange, setOptionChainRange] = useState([0.4, 0.6]);

    const [countList, setCountList] = useState([]);

    const [aimOptionList, setAimOptionList] = useState([]);
    const [aimOptioinIvDataList, setAimOptioinIvDataList] = useState([]);
    const [countProfitValue, setCountProfitValue] = useState(0);
    const [countCostValue, setCountCostValue] = useState(0);
    const [moveToCreateResult, setMoveToCreateResult] = useState({'status': false, 'data': null});
    const [moveToCloseResult, setMoveToCloseResult] = useState({'status': false, 'data': null});
    const [buttonPostionSign, setButtonPostionSign] = useState('🟩');
    const [buttonOrderSign, setButtonOrderSign] = useState('🟩');
    const [buttonCreateSign, setButtonCreateSign] = useState(['🟩']);
    const [buttonGetBtcOptionSign, setButtonGetBtcOptionSign] = useState('🟩');
    const [buttonGetEthOptionSign, setButtonGetEthOptionSign] = useState('🟩');
    const [buttonSubmitCreateSign, setButtonSubmitCreateSign] = useState(['⚡️']);

    const [postionCheckList, setPostionCheckList] = useState([]);

    const [clipboardText, setClipboardText] = useState('');

    const [createFormLength, setCreateFormLength] = useState(1);

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
              amount: (item.contracts*GetPostionSize(GetCoinSign(item.symbol))).toFixed(2),
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

    const refreshCreateIvData = (symbol, idx) => {
      const current_price = extractPrice(GetCoinSign(symbol));
      console.log('symbol: ', symbol);
      console.log('current_price: ', current_price);
      if(null == current_price){
        alert('current_price is null');
        return;
      }
      handlerSetButtonCreateSign(idx, '🔻')
      extractIVData(symbol, current_price).then((res) => {
        console.log('extract create IVData: ', res);
        if(res.status){
          const newIvData = toCreateIvData;
          newIvData[idx] = res.data;
          setToCreateIvData(newIvData);

          // 查找当前对应的 toCreateSide 如果是 sell 则使用 res.data.bid_price  则使用 res.data.ask_price
          const _toCreateSide = toCreateSide[idx];
          const _toCreatePrice = _toCreateSide === 'sell' ? res.data.bid_price : res.data.ask_price;

          const _toCreatePriceList = toCreatePrice;
          _toCreatePriceList[idx] = _toCreatePrice;
          setToCreatePrice(_toCreatePriceList);

          handlerSetButtonCreateSign(idx, '🟩');
        }
      });
    }

    const refreshAllCreateIvData = () => {
      for(let i=0; i<toCreateSlots.length; i++){
        if(toCreateSymbol[i]){
          refreshCreateIvData(toCreateSymbol[i], i);
          setCountCostValue(0);
        }
      }
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
            if(_optionChainList[i][1] && Math.abs(_optionChainList[i][1].delta) > optionChainRange[0] && Math.abs(_optionChainList[i][1].delta) < optionChainRange[1]){
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
      const beSure = confirm(`Are you sure to cancel? ${symbol} ${orderid}`);
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
                  setClipboardText(text);
              })
              .catch(err => {
                  setClipboardText(`Failed to copy text to clipboard: [${text}]`);
              });
      } else {
          setClipboardText(`Clipboard API is not supported or unavailable: [${text}]`);
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

    const closePostion = (closePostion = {
      closePostionSymbol: '', 
      closeSide: 'buy', 
      closeAmount: 0,
      closePrice: 0, 
      closeType: 'buy',
      closeId: ''
    }, backCall = ()=>{alert('Close postion done!')}) => {
      // eslint-disable-next-line no-restricted-globals
      const beSure = confirm(`Are you sure to close the "${closePostion.closePostionSymbol}"?`);
      if(!beSure){
        return;
      }

      console.log('Close postion call params: ', {closePostion});

      handlerToCreatePosition(
        closePostion.closePostionSymbol, 
        closePostion.closeAmount,
        closePostion.closePrice,
        closePostion.closeType,
        closePostion.closeSide
      ).then((res) => {
        console.log('handlerToCreatePosition: ', res);
        if(res.status){
          backCall();
        }else{
          alert(`Close postion failed! ${res.message}`);
        }
      });
    }

    const closeAllPostions = (backCall = ()=>{alert('Close all postions done!')}) => {
      // eslint-disable-next-line no-restricted-globals
      const beSure = confirm(`Are you sure to close all postions?`);
      if(!beSure){
        return;
      }

      const _closeAwaitList = [];
      for(let i=0; i<postionCheckList.length; i++){
        // console.log('handlerCountProfitValue: ', i, postionCheckList[i]);
        // 获取当前的 postionList[i] 的数据
        if(postionCheckList[i] && postionList[i].ivData){
          const _closeParam = {
            closePostionSymbol: postionList[i].symbol,
            closeAmount: postionList[i].contracts,
            closePrice: postionList[i].side === 'short' ? postionList[i].ivData.ask_price : postionList[i].ivData.bid_price,
            closeType: 'limit',
            closeSide: postionList[i].side === 'short' ? 'buy' : 'sell'
          };

          console.log('_closeParam - ', _closeParam)
          _closeAwaitList.push(closePostion(_closeParam, ()=>{}));
        }
      }

      if(_closeAwaitList.length > 0){
        Promise.all(_closeAwaitList).then((res) => {
          console.log('closeAllPostions: ', res);
          backCall();
        });
      }

    }

    const handlerSetButtonSubmitCreateSign = (idx, sign) => {
      const _buttonSubmitCreateSign = [...buttonSubmitCreateSign];
      _buttonSubmitCreateSign[idx] = sign;
      setButtonSubmitCreateSign(_buttonSubmitCreateSign);
    }
    
    const createNewPostion = (idx, callBack) => {
      console.log('DEBUG::', toCreateIvData[idx], idx);
      if(toCreateIvData[idx] == null){
        alert('Need to set postion first!');
        return;
      }

      const _toCreateSymbol = toCreateSymbol[idx];
      const _toCreateAmount = toCreateAmount[idx]??1;
      const _toCreatePrice = toCreatePrice[idx];
      const _toCreateType = toCreateType[idx];
      const _toCreateSide = toCreateSide[idx];
      

      handlerSetButtonSubmitCreateSign(idx, '🔥');
      
      console.log({
        _toCreateSymbol,
        _toCreateAmount,
        _toCreatePrice,
        _toCreateType,
        _toCreateSide
      })
      handlerToCreatePosition(_toCreateSymbol, _toCreateAmount, _toCreatePrice, _toCreateType, _toCreateSide).then((res) => {
        console.log('handlerToCreatePosition: ', res);
        if(res.status){
          alert(`${_toCreateSymbol}, Create postion success!`);
        }else{
          alert(`${_toCreateSymbol}, Create postion failed! ${res.message}`);
        }
        handlerSetButtonSubmitCreateSign(idx, '⚡️');
        callBack();
      });
    }

    const createAllNewPostion = (callBack) => {
      for(let i=0; i<toCreateSlots.length; i++){
        if(toCreateSymbol[i] && toCreateIvData[i]){
          createNewPostion(i, callBack);
        }
      }
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

    const extractCountItem = (postion) => {
      console.log('extractCountItem: ', postion);
      if(postion.ivData == null){
        return null;
      }

      const side = postion.side;
      const entryPrice = postion.entryPrice;
      const closePrice = postion.side === 'short' ? postion.ivData.ask_price : postion.ivData.bid_price;
      const contracts = postion.contracts;
      const symbol = postion.symbol;
      const profit = side === 'short' ? (entryPrice - closePrice) * contracts : (closePrice - entryPrice) * contracts;
      const volume = profit * GetPostionSize(GetCoinSign(postion.symbol)) * extractPrice(GetCoinSign(postion.symbol));

      return {
        side,
        entryPrice,
        closePrice,
        symbol,
        contracts,
        profit,
        volume
      };
    }

    const modifyCountList = (postion, idx) => {

      const _currentItem = extractCountItem(postion);
      if(_currentItem == null){
        alert('Need to refresh IV data first!');
        return;
      }

      let _countList = [...countList];
      if(_countList[idx] && _countList[idx].status){
        _countList[idx].status = false;
        _countList[idx].data = null;
      }else{
        _countList[idx] = {'status': true, 'data': _currentItem};
      }
      // console.log('will set _countList', _countList);

      setCountList(_countList);
      countSumNumber(_countList);
    }

    const handlerFetchAllIv = () => {
      for(let i=0; i<postionCheckList.length; i++){
        if(postionCheckList[i]){
          console.log('handlerFetchAllIv: ', i, postionList[i]);
          refreshPostionIvData(postionList[i].symbol, i);
        }
      }
    }


    const handlerCountProfitValue = () => {
      const _tmpList = [];
      for(let i=0; i<postionCheckList.length; i++){
        // console.log('handlerCountProfitValue: ', i, postionCheckList[i]);
        // 获取当前的 postionList[i] 的数据
        if(postionCheckList[i]){
          const _tmpItem = extractCountItem(postionList[i]);
          _tmpList.push({'status': true, 'data': _tmpItem});
        }
      }

      console.log('handlerCountProfitValue _tmpList: ', _tmpList);

      setCountList(_tmpList);
      countSumNumber(_tmpList);
    }


    const extractValidCountList = (paramCountList) => {
      const _countList = [];
      for(let i=0; i<paramCountList.length; i++){
        if(paramCountList[i] && paramCountList[i].status){
          _countList.push(paramCountList[i]);
        }
      }
      return _countList;
    }

    const countSumNumber = (paramCountList) => {
      const _countList = extractValidCountList(paramCountList);
      let sum = 0;
      for(let i=0; i<_countList.length; i++){
        if(_countList[i].data == null) continue;
        const _currentPrice = extractPrice(GetCoinSign(_countList[i].data.symbol));
        const _positionSize = GetPostionSize(GetCoinSign(_countList[i].data.symbol));
        const _closePrice = _countList[i].data.closePrice;
        const _entryPrice = _countList[i].data.entryPrice;
        const _contracts = _countList[i].data.contracts;
        console.log('debug infos: ', {
          _currentPrice,
          _positionSize,
          _closePrice,
          _entryPrice,
          _contracts
        });
        let _profit = (_closePrice - _entryPrice) * _currentPrice * _contracts * _positionSize;
        console.log('_profit =', _profit)
        if(_countList[i].data.side === 'short'){
          _profit = -_profit;
        }
        sum += _profit;
      }
      setCountProfitValue(sum);
    }

    const handleSetToCreateSymbol = (idx, symbol) => {
      const _toCreateSymbol = [...toCreateSymbol];
      _toCreateSymbol[idx] = symbol;
      setToCreateSymbol(_toCreateSymbol);
    }

    const handleSetToCreateAmount = (idx, amount) => {
      const _toCreateAmount = [...toCreateAmount];
      _toCreateAmount[idx] = amount;
      setToCreateAmount(_toCreateAmount);
    }

    const handleSetToCreatePrice = (idx, price) => {
      const _toCreatePrice = [...toCreatePrice];
      _toCreatePrice[idx] = price;
      setToCreatePrice(_toCreatePrice);
    }

    const handleSetToCreateType = (idx, type) => {
      const _toCreateType = [...toCreateType];
      _toCreateType[idx] = type;
      setToCreateType(_toCreateType);
    }

    const handleSetToCreateSide = (idx, side) => {
      const _toCreateSide = [...toCreateSide];
      _toCreateSide[idx] = side;
      setToCreateSide(_toCreateSide);
    }

    const handleSetToCreateSlots = (is_add) => {
      const _toCreateSlots = toCreateSlots;
      if(is_add){
        _toCreateSlots.push(true);
        setToCreateSlots(_toCreateSlots);
        setCreateFormLength(_toCreateSlots.length);

        const _toCreateSymbol = [...toCreateSymbol];
        _toCreateSymbol.push('');
        setToCreateSymbol(_toCreateSymbol);

        const _toCreateAmount = [...toCreateAmount];
        _toCreateAmount.push(1);
        setToCreateAmount(_toCreateAmount);

        const _toCreatePrice = [...toCreatePrice];
        _toCreatePrice.push(0);
        setToCreatePrice(_toCreatePrice);

        const _toCreateType = [...toCreateType];
        _toCreateType.push('limit');
        setToCreateType(_toCreateType);

        const _toCreateSide = [...toCreateSide];
        _toCreateSide.push('sell');
        setToCreateSide(_toCreateSide);

        const _toCreateIvData = [...toCreateIvData];
        _toCreateIvData.push(null);
        setToCreateIvData(_toCreateIvData);
        
      }else{
        _toCreateSlots.pop();
        setToCreateSlots(_toCreateSlots);
        setCreateFormLength(_toCreateSlots.length);

        const _toCreateSymbol = [...toCreateSymbol];
        _toCreateSymbol.pop();
        setToCreateSymbol(_toCreateSymbol);

        const _toCreateAmount = [...toCreateAmount];
        _toCreateAmount.pop();
        setToCreateAmount(_toCreateAmount);

        const _toCreatePrice = [...toCreatePrice];
        _toCreatePrice.pop();
        setToCreatePrice(_toCreatePrice);

        const _toCreateType = [...toCreateType];
        _toCreateType.pop();
        setToCreateType(_toCreateType);

        const _toCreateSide = [...toCreateSide];
        _toCreateSide.pop();
        setToCreateSide(_toCreateSide);

        const _toCreateIvData = [...toCreateIvData];
        _toCreateIvData.pop();
        setToCreateIvData(_toCreateIvData);
      }
    }

    const getButtonCreateSign = (idx) => {
      if(buttonCreateSign[idx]){
        return buttonCreateSign[idx];
      }
      return '🟩';
    }

    const handlerSetButtonCreateSign = (idx, sign) => {
      const _buttonCreateSign = [...buttonCreateSign];
      _buttonCreateSign[idx] = sign;
      setButtonCreateSign(_buttonCreateSign);
    }

    const createPostionAllReady = () => {
      for(let i=0; i<toCreateSlots.length; i++){
        if(toCreateSymbol[i] && toCreateIvData[i]){
          continue;
        }
        return false;
      }
      return true;
    }

    const accountCostValue = () => {
      let sum = 0;
      for(let i=0; i<toCreateSlots.length; i++){
        const _toCreatePrice = toCreatePrice[i];
        const _toCreateAmount = toCreateAmount[i]??1;
        const _toCreateSymbol = toCreateSymbol[i];
        const _toCreateSide = toCreateSide[i];
        const _currentPrice = extractPrice(GetCoinSign(_toCreateSymbol));

        console.log('accountCostValue: ', {
          _toCreatePrice,
          _toCreateAmount,
          _toCreateSymbol,
          _toCreateSide,
          _currentPrice
        });

        const _const = (_toCreatePrice * _toCreateAmount * GetPostionSize(GetCoinSign(_toCreateSymbol)) * _currentPrice) * (_toCreateSide === 'sell' ? 1 : -1);
        sum += _const;
        console.log('sum = ', sum, _const);
      }
      setCountCostValue(sum);
    }

    const updatePostionListCheck = (idx, e) => {
      // console.log('updatePostionListCheck: ', idx, e.target.checked);

      const _postionCheckList = [...postionCheckList];
      _postionCheckList[idx] = e.target.checked;

      // console.log('updatePostionListCheck: ', _postionCheckList);
      setPostionCheckList(_postionCheckList);
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

      <h1>Clipboard Text</h1>
      <div>
        <a href="https://www.binance.com/zh-CN/square/fear-and-greed-index" target="_blank" rel="noreferrer">Coin Fear and Greed Index</a>
        <a href="https://edition.cnn.com/markets/fear-and-greed?utm_source=hp" target="_blank" rel="noreferrer">CNN Fear and Greed Index</a>

      </div>
      <div>
        {clipboardText}
      </div>

      <h1>Option tables</h1>
      <div>
        <label>Option Chain Range:</label>
        <input type="number" step={0.1} placeholder="0.4" value={optionChainRange[0]} onChange={(e)=>setOptionChainRange([parseFloat(e.target.value), optionChainRange[1]])} />
        <input type="number" step={0.1} placeholder="0.6" value={optionChainRange[1]} onChange={(e)=>setOptionChainRange([optionChainRange[0], parseFloat(e.target.value)])} />
      </div>
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
        <div>
        <button onClick={()=>refreshOptionTable('BTC')}>
        Refresh BTC Option Table {buttonGetBtcOptionSign}
        </button>
        </div>
        <div>
        <button onClick={()=>refreshOptionTable('ETH')}>
          Refresh ETH Option Table {buttonGetEthOptionSign}
        </button>
        </div>
      </>:"Waiting for prices..."}
    
    <h1>Create Postion</h1>
    <table>
      <tr>
        [{createFormLength}]<td><button onClick={()=>handleSetToCreateSlots(true)}>+</button></td>
        <td><button onClick={()=>handleSetToCreateSlots(false)}>-</button></td>
        <td><button onClick={()=>refreshAllCreateIvData()}>Fetch All IvData</button></td>
        <td>
        {createPostionAllReady() ? <button onClick={()=>createAllNewPostion(refreshAllData)}>⚡️ Create all new postions ⚡️</button> : 'Need to set all postions first!'}
        </td>
        <td>
        <button onClick={()=>accountCostValue()}>All Cost:</button> {countCostValue}
        </td>
      </tr>
    </table>
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
        {toCreateSlots.map((_item, idx) => (
          <React.Fragment key={idx}>
            <tr>
              <td>
                <input type="text" placeholder="BTC/USD:BTC-241213-98000-C" style={{
                        width: '300px',
                        boxSizing: 'border-box',
                        textAlign: 'right',
                        padding: '8px', // 根据需要调整
                      }} onChange={(e)=>handleSetToCreateSymbol(idx, e.target.value)} />
              </td>
              <td>
                <select onChange={(e)=>handleSetToCreateSide(idx, e.target.value)}>
                  <option value="sell" >sell</option>
                  <option value="buy">buy</option>
                </select>
              </td>
              <td>
                <input type="number" placeholder="1" value={toCreateAmount[idx]??1} onChange={(e)=>handleSetToCreateAmount(idx, e.target.value)} />
              </td>
              <td>
                <input type="number" placeholder="0" value={toCreatePrice[idx]} onChange={(e)=>handleSetToCreatePrice(idx, e.target.value)} />
              </td>
              <td>
                <select onClick={(e)=>handleSetToCreateType(idx, e.target.value)}>
                  <option value="limit" >limit</option>
                  <option value="market" >market</option>
                </select>
              </td>
              <td>
                <button onClick={()=>refreshCreateIvData(toCreateSymbol[idx], idx)}>{getButtonCreateSign(idx)} &nbsp; Refresh {toCreateSymbol[idx]??extractPrice(GetCoinSign(toCreateSymbol[idx]))}</button>
              </td>
              <td>
                {toCreateIvData[idx] ? parseFloat(toCreateIvData[idx].infer_price).toFixed(2) : 'N/A'}
                {toCreateIvData[idx] ? <>
                  [
                  {handleShowInferInfo(toCreateIvData[idx])}
                  ]
                </>: ''}
              </td>
              <td>
                {toCreateIvData[idx] ? parseFloat(toCreateIvData[idx].delta).toFixed(4) : 'N/A'}
              </td>
              <td>
                {toCreateIvData[idx] ? parseFloat(toCreateIvData[idx].ask_price).toFixed(4) : 'N/A'}
              </td>
              <td>
                {toCreateIvData[idx] ? parseFloat(toCreateIvData[idx].s_iv).toFixed(2) : 'N/A'}
              </td>
              <td>
                {toCreateIvData[idx] ? parseFloat(toCreateIvData[idx].bid_price).toFixed(4) : 'N/A'}
              </td>
              <td>
                {toCreateIvData[idx] ? parseFloat(toCreateIvData[idx].b_iv).toFixed(2) : 'N/A'}
              </td>
              <td>
                {toCreateIvData[idx] ? parseFloat(toCreateIvData[idx].intrinsic_value).toFixed(2) : 'N/A'}
              </td>
              <td>
                {toCreateIvData[idx] ? parseFloat(toCreateIvData[idx].time_value).toFixed(2) : 'N/A'}
              </td>
              <td>
              <button onClick={()=>createNewPostion(idx, refreshAllData)} >{buttonSubmitCreateSign[idx]??'⚡️'} Submit : [{toCreateSymbol[idx]}]</button>
              </td>
            </tr>
          </React.Fragment>
        ))}
      </tbody>
    </table>
    {/* <div>
      
      <button onClick={()=>createAllNewPostion(refreshAllData)}>Create all new postions</button>
    </div> */}
   

      <h1>Postion List</h1>
      <table>
        <tr>
          <td>
          <h3>profit: {parseFloat(countProfitValue).toFixed(4)} $</h3>
          </td>
          {/* <td>
            <button onClick={()=>{
              setCountList([]);
              setCountProfitValue(0);
            }}>Clean count</button>
          </td> */}
        </tr>
      </table>
      <div>
        <table border={1}>
          <tr>
            <td>symbol</td>
            <td>side</td>
            <td>entryPrice</td>
            <td>closePrice</td>
            <td>contracts</td>
            <td>profit</td>
            <td>volume</td>
          </tr>
          {countList.map((count, idx) => (
            <tr key={idx}>
              <td>{count.data?count.data.symbol:'Error'}</td>
              <td>{count.data?count.data.side:'Error'}</td>
              <td>{count.data?count.data.entryPrice:'Error'}</td>
              <td>{count.data?count.data.closePrice:'Error'}</td>
              <td>{count.data?count.data.contracts:'Error'}</td>
              <td>{count.data?parseFloat(count.data.profit).toFixed(4):'Error'} $</td>
              <td>{count.data?parseFloat(count.data.volume).toFixed(2):'Error'} $</td>
            </tr>
          ))}
          <tr>
            <td colSpan={6} style={{textAlign: 'right'}}>Total: </td>
            <td>{parseFloat(countProfitValue).toFixed(4)} $</td>
          </tr>
          <tr>
            <td colSpan={6} style={{textAlign: 'right'}}>Action: </td>
            <td><button onClick={()=>closeAllPostions()}>Close all postions</button></td>
          </tr>
        </table>
      </div>
      <table>
      <tr>
        <td>
          <button onClick={()=>handlerFetchAllIv()}>Fetch All Iv</button>
          </td>
          <td>
          <button onClick={()=>handlerCountProfitValue()}>Count profit</button>
          </td>
        </tr>
      </table>
      
      <table border={1}>
        <thead>
          <tr>
            <th>id</th>
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
              <td>
                <input type="checkbox" value={idx} onChange={(e)=>updatePostionListCheck(idx, e)} />
              </td>
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
              <td>
                <button onClick={() => refreshPostionIvData(postion.symbol, idx)}>{buttonPostionSign} &nbsp; {extractPrice(GetCoinSign(postion.symbol))}</button>
                {/* <button onClick={()=>modifyCountList(postion, idx)}>Count[{countList[idx] && countList[idx].status?'Yes':'No'}]</button> */}
              </td>
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
              <td
                  onClick={() => closePostion({
                    closePostionSymbol: postion.symbol, closeSide: postion.side == 'short' ? 'buy': 'sell', closeAmount: postion.contracts, closePrice: postion.side == 'short' ? postion.ivData.ask_price : postion.ivData.bid_price, closeType: 'limit', closeId: postion.id,
                  }, ()=>{refreshAllData(); alert('Close postion done!!!')})}
                >{postion.ivData?<button>Open `{postion.side == 'short' ? 'buy': 'sell'}` to close .</button>:'Close need to refresh'}</td>
            </tr>
            <tr key={`${idx}b`}>
                <td colSpan={8}>
                  <input type="text" placeholder="BTC/USD:BTC-241206-100000-C"  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    textAlign: 'right',
                    padding: '8px', 
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
                >{aimOptioinIvDataList[idx] && postion.side == 'short'?<button>Move to this postion.</button>:'Move need to refresh'}</td>
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
