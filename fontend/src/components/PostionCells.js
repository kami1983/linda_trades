import React, { useState, useEffect } from "react";
import { handlerToCreatePosition, extractIVData, callPostionList, reduceMargin, addMargin } from "../utils/OptionApis";
import { extractPrice, GetCoinSign, handleShowInferInfo, GetPostionSize } from "../utils/Utils";
import { usePrices } from '../context/PriceContext';



function PostionCells({ onSymbolClick, closePostionDone, movePostionDone, closeAllPostionDone, refreshListKey }) {


    const [countList, setCountList] = useState([]);
    const [aimOptionList, setAimOptionList] = useState([]);
    const [aimOptioinIvDataList, setAimOptioinIvDataList] = useState([]);
    const [countProfitValue, setCountProfitValue] = useState(0);
    const [buttonPostionSign, setButtonPostionSign] = useState('🟩');
    const [postionCheckList, setPostionCheckList] = useState([]);
    const [postionList, setPostionList] = useState([]);

    const coinPrices = usePrices();

  
    const closeAllPostions = (backCall = ()=>{alert('Close all postions done!')}) => {
      // eslint-disable-next-line no-restricted-globals
      const beSure = confirm(`Are you sure to close all postions?`);
      if(!beSure){
        return;
      }
  
      const _closeAwaitList = [];
      for(let i=0; i<postionCheckList.length; i++){
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

    const handlerFetchAllIv = () => {
      for(let i=0; i<postionCheckList.length; i++){
        if(postionCheckList[i]){
          console.log('handlerFetchAllIv: ', i, postionList[i]);
          refreshPostionIvData(postionList[i].symbol, i);
        }
      }
    }

    const refreshPostionIvData = (symbol, updateIdx) => {
      const current_price = extractPrice(GetCoinSign(symbol), coinPrices);
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
    
    const handlerCountProfitValue = () => {
      const _tmpList = [];
      for(let i=0; i<postionCheckList.length; i++){
        // 获取当前的 postionList[i] 的数据
        if(postionCheckList[i] && postionList[i]){
          const _tmpItem = extractCountItem(postionList[i]);
          _tmpList.push({'status': true, 'data': _tmpItem});
        }
      }
  
      setCountList(_tmpList);
      countSumNumber(_tmpList);
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
      const volume = profit * GetPostionSize(GetCoinSign(postion.symbol)) * extractPrice(GetCoinSign(postion.symbol), coinPrices);
  
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

    const countSumNumber = (paramCountList) => {
      const _countList = extractValidCountList(paramCountList);
      let sum = 0;
      for(let i=0; i<_countList.length; i++){
        if(_countList[i].data == null) continue;
        const _currentPrice = extractPrice(GetCoinSign(_countList[i].data.symbol), coinPrices);
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

    const extractValidCountList = (paramCountList) => {
      const _countList = [];
      for(let i=0; i<paramCountList.length; i++){
        if(paramCountList[i] && paramCountList[i].status){
          _countList.push(paramCountList[i]);
        }
      }
      return _countList;
    }

    const updatePostionListCheck = (idx, e) => {
      const _postionCheckList = [...postionCheckList];
      _postionCheckList[idx] = e.target.checked;
      setPostionCheckList(_postionCheckList);
    }

    // Update postionList
    const updateAimOption = (e, idx) => {
      const oldDataList = aimOptionList;
      oldDataList[idx] = e.target.value;
      setAimOptionList(oldDataList);
    }

    const modifyMargin = (symbol, amount, callBack=null) => {
      if(amount < 0){
        // Call reduceMargin
        reduceMargin(symbol, Math.abs(amount)).then((res) => {
          console.log('reduceMargin: ', res);
          alert('Reduce status: ' + res.status);
          if(callBack){
            callBack();
          }
        });
      }else{
        addMargin(symbol, Math.abs(amount)).then((res) => {
          console.log('addMargin: ', res);
          alert('Add status: ' + res.status);
          if(callBack){
            callBack();
          }
        });
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
                  marginRatio: item.marginRatio,
                  collateral: item.collateral,
                  maintenanceMargin: item.maintenanceMargin,
                  to020Margin: item.maintenanceMargin/0.20,
                  to015Margin: item.maintenanceMargin/0.15,
                  ivData: null
                });
              });
            }
            setPostionList(finalData);
        });
    }

    useEffect(() => {
        refreshPostionList();
    }, [refreshListKey]);


    return (
        <>
        <table>
                <tr>
                  <td>
                  <h3>profit: {parseFloat(countProfitValue).toFixed(4)} $</h3>
                  </td>
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
                    <td><button onClick={()=>closeAllPostions(()=>{
                        refreshPostionList();closeAllPostionDone();
                    })}>Close all postions</button></td>
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
                    <th>collateral</th>
                    <th style={{color:'RED'}}>marginRatio</th>
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
                      onClick={() => onSymbolClick(postion.symbol)}
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
                        {postion.collateral}
                        <button onClick={()=>modifyMargin(postion.symbol, postion.to015Margin-postion.collateral, ()=>refreshPostionList())}>To 0.15% {postion.to015Margin-postion.collateral}</button>
                      </td>
                      {postion.marginRatio < 0.20 ? 
                        <td style={{color:'GREEN'}}><b>{postion.marginRatio}% # {(1/postion.marginRatio*100).toFixed(2)}</b></td>:
                        <td style={{color:'RED'}}><b>{postion.marginRatio}% # {(1/postion.marginRatio*100).toFixed(2)} </b></td>
                      }
                      <td>
                        <button onClick={() => refreshPostionIvData(postion.symbol, idx)}>{buttonPostionSign} &nbsp; {extractPrice(GetCoinSign(postion.symbol), coinPrices)}</button>
                        {/* <button onClick={()=>modifyCountList(postion, idx)}>Count[{countList[idx] && countList[idx].status?'Yes':'No'}]</button> */}
                      </td>
                      <td style={{ "color": "red" }}>{postion.ivData ? parseFloat(postion.ivData.delta).toFixed(4) : 'N/A'}</td>
                      <td>
                        {postion.ivData ? parseFloat(postion.ivData.infer_price).toFixed(2) : 'N/A'}
                        {postion.ivData ? <>
                          [
                          {handleShowInferInfo(postion.ivData, coinPrices)}
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
                      <td>{postion.ivData ? parseFloat(postion.ivData.time_value/extractPrice(GetCoinSign(postion.symbol), coinPrices)/parseFloat(postion.ivData.day_left)*365*100).toFixed(2) : 'N/A'} %</td>
                      <td
                          onClick={() => closePostion({
                            closePostionSymbol: postion.symbol, closeSide: postion.side == 'short' ? 'buy': 'sell', closeAmount: postion.contracts, closePrice: postion.side == 'short' ? postion.ivData.ask_price : postion.ivData.bid_price, closeType: 'limit', closeId: postion.id,
                          }, ()=>{refreshPostionList();closePostionDone(); alert('Close postion done!!!')})}
                        >{postion.ivData?<button>Open `{postion.side == 'short' ? 'buy': 'sell'}` to close .</button>:'Close need to refresh'}</td>
                    </tr>
                    <tr key={`${idx}b`}>
                        <td colSpan={11}>
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
                        <td>{aimOptioinIvDataList[idx]? parseFloat(aimOptioinIvDataList[idx].time_value/extractPrice(GetCoinSign(postion.symbol), coinPrices)/parseFloat(aimOptioinIvDataList[idx].day_left)*365*100).toFixed(2): 'N/A'} %</td>
                        <td
                          onClick={() => moveToPostion({
                            closePostionSymbol: postion.symbol, closeSide: 'buy', closeAmount: postion.contracts, closePrice: postion.ivData.ask_price, closeType: 'limit', closeId: postion.id,
                            createPostionSymbol: aimOptionList[idx], createSide: 'sell', createAmount: postion.contracts, createPrice: aimOptioinIvDataList[idx].bid_price , createType: 'limit',
                          }, ()=>{refreshPostionList();movePostionDone(); alert('Move postion done!!!')})}
                        >{aimOptioinIvDataList[idx] && postion.side == 'short'?<button>Move to this postion.</button>:'Move need to refresh'}</td>
                      </tr></>
                  ))}
                </tbody>
              </table>
        </>
    );
}

export default PostionCells;