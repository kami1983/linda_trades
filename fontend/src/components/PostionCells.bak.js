import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Input, Checkbox } from "antd";
import { handlerToCreatePosition, extractIVData, callPostionList } from "../utils/OptionApis";
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
    const [infoModalVisible, setInfoModalVisible] = useState(false);
    const [infoModalContent, setInfoModalContent] = useState('');
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [confirmCallback, setConfirmCallback] = useState(() => () => {});

    const coinPrices = usePrices();

    const closeAllPostions = (backCall = () => {
      setInfoModalContent('Close all postions done!');
      setInfoModalVisible(true);
    }) => {
      setConfirmModalVisible(true);
      setConfirmCallback(() => () => {
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
      });
      return;
    }

    const closePostion = (closePostion = {
        closePostionSymbol: '', 
        closeSide: 'buy', 
        closeAmount: 0,
        closePrice: 0, 
        closeType: 'buy',
        closeId: ''
    }, backCall = ()=>{
      setInfoModalContent('Close postion done!');
      setInfoModalVisible(true);
    }) => {
      setConfirmModalVisible(true);
      setConfirmCallback(() => () => {
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
            setInfoModalContent(`Close postion failed! ${res.message}`);
            setInfoModalVisible(true);
          }
        });
      });
      return;
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
    }, backCall = ()=>{
      setInfoModalContent('Move postion done!');
      setInfoModalVisible(true);
    }) => {
      setConfirmModalVisible(true);
      setConfirmCallback(() => () => {
        const closePostion = handlerToCreatePosition(
          movePostion.closePostionSymbol, 
          movePostion.closeAmount,
          movePostion.closePrice,
          movePostion.closeType,
          movePostion.closeSide
        );

        const createPostion = handlerToCreatePosition(
          movePostion.createPostionSymbol,
          movePostion.createAmount,
          movePostion.createPrice,
          movePostion.createType,
          movePostion.createSide
        );

        Promise.all([closePostion, createPostion]).then((res) => {
          console.log('handlerToCreatePosition: ', res);
          if(res[0].status && res[1].status){
            backCall();
          }else{
            setInfoModalContent(`Move postion failed! Close status: ${res[0].status}, Create status: ${res[1].status}`);
            setInfoModalVisible(true);
          }
        });
      });
      return;
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

    useEffect(() => {
        refreshPostionList();
    }, [refreshListKey]);

    const columns = [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        render: (text, record, index) => (
          <Checkbox checked={postionCheckList[index]} onChange={(e) => updatePostionListCheck(index, e)} />
        ),
      },
      {
        title: 'Symbol',
        dataIndex: 'symbol',
        key: 'symbol',
        render: (text) => (
          <span
            onClick={() => onSymbolClick(text)}
            style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
            title="Click to copy"
          >
            {text}
          </span>
        ),
      },
      {
        title: 'Side',
        dataIndex: 'side',
        key: 'side',
      },
      {
        title: 'Contracts',
        dataIndex: 'contracts',
        key: 'contracts',
        render: (text, record) => `${text} [${record.amount}]`,
      },
      {
        title: 'Realized PnL',
        dataIndex: 'realizedPnl',
        key: 'realizedPnl',
      },
      {
        title: 'Percentage',
        dataIndex: 'percentage',
        key: 'percentage',
        render: (text) => `${parseFloat(text).toFixed(2)}%`,
      },
      {
        title: 'Entry Price',
        dataIndex: 'entryPrice',
        key: 'entryPrice',
      },
      {
        title: 'Mark Price',
        dataIndex: 'markPrice',
        key: 'markPrice',
        render: (text) => parseFloat(text).toFixed(4),
      },
      {
        title: 'Refresh IV',
        key: 'refreshIv',
        render: (text, record, index) => (
          <Button onClick={() => refreshPostionIvData(record.symbol, index)}>
            {buttonPostionSign} &nbsp; {extractPrice(GetCoinSign(record.symbol), coinPrices)}
          </Button>
        ),
      },
      {
        title: 'Delta',
        key: 'delta',
        render: (text, record) => (
          <span style={{ color: 'red' }}>
            {record.ivData ? parseFloat(record.ivData.delta).toFixed(4) : 'N/A'}
          </span>
        ),
      },
      {
        title: 'Infer Price',
        key: 'inferPrice',
        render: (text, record) => (
          <>
            {record.ivData ? parseFloat(record.ivData.infer_price).toFixed(2) : 'N/A'}
            {record.ivData ? (
              <>
                [
                {handleShowInferInfo(record.ivData, coinPrices)}
                ]
              </>
            ) : ''}
          </>
        ),
      },
      {
        title: 'Day Left',
        key: 'dayLeft',
        render: (text, record) => (
          record.ivData ? parseFloat(record.ivData.day_left).toFixed(2) : 'N/A'
        ),
      },
      {
        title: 'Ask Price',
        key: 'askPrice',
        render: (text, record) => (
          record.ivData ? parseFloat(record.ivData.ask_price).toFixed(4) : 'N/A'
        ),
      },
      {
        title: 'S IV',
        key: 'sIv',
        render: (text, record) => (
          record.ivData ? parseFloat(record.ivData.s_iv).toFixed(2) : 'N/A'
        ),
      },
      {
        title: 'Bid Price',
        key: 'bidPrice',
        render: (text, record) => (
          record.ivData ? parseFloat(record.ivData.bid_price).toFixed(4) : 'N/A'
        ),
      },
      {
        title: 'B IV',
        key: 'bIv',
        render: (text, record) => (
          record.ivData ? parseFloat(record.ivData.b_iv).toFixed(2) : 'N/A'
        ),
      },
      {
        title: 'Gamma',
        key: 'gamma',
        render: (text, record) => (
          record.ivData ? parseFloat(record.ivData.gamma).toFixed(8) : 'N/A'
        ),
      },
      {
        title: 'Theta',
        key: 'theta',
        render: (text, record) => (
          record.ivData ? parseFloat(record.ivData.theta).toFixed(4) : 'N/A'
        ),
      },
      {
        title: 'Intr Val',
        key: 'intrVal',
        render: (text, record) => (
          <span style={{ color: 'green' }}>
            [{record.ivData ? parseFloat(record.ivData.intrinsic_value).toFixed(2) : 'N/A'}]
          </span>
        ),
      },
      {
        title: 'Time Val',
        key: 'timeVal',
        render: (text, record) => (
          <span style={{ color: 'blue' }}>
            {record.ivData ? parseFloat(record.ivData.time_value).toFixed(2) : 'N/A'}
          </span>
        ),
      },
      {
        title: 'Yield Rate',
        key: 'yieldRate',
        render: (text, record) => (
          record.ivData
            ? parseFloat(
                record.ivData.time_value /
                  extractPrice(GetCoinSign(record.symbol), coinPrices) /
                  parseFloat(record.ivData.day_left) *
                  365 *
                  100
              ).toFixed(2)
            : 'N/A'
        ),
      },
      {
        title: 'Action',
        key: 'action',
        render: (text, record) => (
          <Button
            onClick={() =>
              closePostion(
                {
                  closePostionSymbol: record.symbol,
                  closeSide: record.side == 'short' ? 'buy' : 'sell',
                  closeAmount: record.contracts,
                  closePrice: record.side == 'short' ? record.ivData.ask_price : record.ivData.bid_price,
                  closeType: 'limit',
                  closeId: record.id,
                },
                () => {
                  refreshPostionList();
                  closePostionDone();
                  alert('Close postion done!!!');
                }
              )
            }
          >
            {record.ivData ? `Open ${record.side == 'short' ? 'buy' : 'sell'} to close` : 'Close need to refresh'}
          </Button>
        ),
      },
    ];

    return (
        <>
        <Modal
          title="确认"
          open={confirmModalVisible}
          onOk={() => {
            confirmCallback();
            setConfirmModalVisible(false);
          }}
          onCancel={() => setConfirmModalVisible(false)}
        >
          <p>确定要执行此操作吗？</p>
        </Modal>

        <Modal
          title="信息"
          open={infoModalVisible}
          onOk={() => setInfoModalVisible(false)}
          onCancel={() => setInfoModalVisible(false)}
        >
          <p>{infoModalContent}</p>
        </Modal>

        <h3>Profit: {parseFloat(countProfitValue).toFixed(4)} $</h3>
        <Button onClick={() => closeAllPostions(() => { refreshPostionList(); closeAllPostionDone(); })}>
          Close all positions
        </Button>
        <Button onClick={() => handlerFetchAllIv()}>Fetch All Iv</Button>
        <Button onClick={() => handlerCountProfitValue()}>Count profit</Button>

        <Table
          dataSource={postionList}
          columns={columns}
          rowKey="id"
          pagination={false}
        />
        </>
    );
}

export default PostionCells;
