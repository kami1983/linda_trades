import React, { useState, useEffect } from "react";
import { Table, Form, Input, Select, Button, Modal } from "antd";
import { extractIVData } from "../utils/OptionApis";
import { extractPrice, GetCoinSign, handleShowInferInfo, GetPostionSize} from "../utils/Utils";
import { usePrices } from '../context/PriceContext';



function CreatePostions({ createNewPostionCallBack, createAllNewPostionCallBack}) {
    
    const [countCostValue, setCountCostValue] = useState(0);
    const [createFormLength, setCreateFormLength] = useState(1);
    const [buttonCreateSign, setButtonCreateSign] = useState(['🟩']);
    const [buttonSubmitCreateSign, setButtonSubmitCreateSign] = useState(['⚡️']);


    const [toCreateIvData, setToCreateIvData] = useState([null]);
        
    const [toCreateSymbol, setToCreateSymbol] = useState(['']);
    const [toCreateAmount, setToCreateAmount] = useState([1]);
    const [toCreatePrice, setToCreatePrice] = useState([0]);
    const [toCreateType, setToCreateType] = useState(['limit']);
    const [toCreateSide, setToCreateSide] = useState(['sell']);
    const [toCreateSlots, setToCreateSlots] = useState([true]);


    const coinPrices = usePrices();
    const apiHost = process.env.REACT_APP_API_HOSTS;
  
    useEffect(() => {
    }, []);


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

    const refreshAllCreateIvData = () => {
        for(let i=0; i<toCreateSlots.length; i++){
          if(toCreateSymbol[i]){
            refreshCreateIvData(toCreateSymbol[i], i);
            setCountCostValue(0);
          }
        }
    }

    const refreshCreateIvData = (symbol, idx) => {
        const current_price = extractPrice(GetCoinSign(symbol), coinPrices);
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

    const handlerSetButtonCreateSign = (idx, sign) => {
      const _buttonCreateSign = [...buttonCreateSign];
      _buttonCreateSign[idx] = sign;
      setButtonCreateSign(_buttonCreateSign);
    }

    const createAllNewPostion = (callBack) => {
        // eslint-disable-next-line no-restricted-globals
        if(!confirm('Are you sure to create all new postions?')){
            return;
        }

      for(let i=0; i<toCreateSlots.length; i++){
        if(toCreateSymbol[i] && toCreateIvData[i]){
          createNewPostion(i, callBack);
        }
      }
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

    const handlerSetButtonSubmitCreateSign = (idx, sign) => {
      const _buttonSubmitCreateSign = [...buttonSubmitCreateSign];
      _buttonSubmitCreateSign[idx] = sign;
      setButtonSubmitCreateSign(_buttonSubmitCreateSign);
    }

    const accountCostValue = () => {
      let sum = 0;
      for(let i=0; i<toCreateSlots.length; i++){
        const _toCreatePrice = toCreatePrice[i];
        const _toCreateAmount = toCreateAmount[i]??1;
        const _toCreateSymbol = toCreateSymbol[i];
        const _toCreateSide = toCreateSide[i];
        const _currentPrice = extractPrice(GetCoinSign(_toCreateSymbol), coinPrices);
  
        console.log('accountCostValue: ', {
          _toCreatePrice,
          _toCreateAmount,
          _toCreateSymbol,
          _toCreateSide,
          _currentPrice
        });
  
        const _const = (_toCreatePrice * _toCreateAmount * GetPostionSize(GetCoinSign(_toCreateSymbol)) * _currentPrice) * (_toCreateSide === 'sell' ? 1 : -1);
        console.log('Debug _const: ', {_const, _toCreatePrice, _toCreateAmount, postion_size: GetPostionSize(GetCoinSign(_toCreateSymbol)), _currentPrice});
        sum += _const;
        console.log('sum = ', sum, _const);
      }
      setCountCostValue(sum);
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
  
    const getButtonCreateSign = (idx) => {
      if(buttonCreateSign[idx]){
        return buttonCreateSign[idx];
      }
      return '🟩';
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
        fetch(`${apiHost}/api/create_position?symbol=${symbol}&amount=${amount}&price=${price}&type=${type}&side=${side}`, {
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

    const createPostionAllReady = () => {
      for(let i=0; i<toCreateSlots.length; i++){
        if(toCreateSymbol[i] && toCreateIvData[i]){
          continue;
        }
        return false;
      }
      return true;
    }

    const columns = [
      {
        title: 'Symbol',
        dataIndex: 'symbol',
        render: (_, record, idx) => (
          <Input
            placeholder="BTC/USD:BTC-241213-98000-C"
            value={toCreateSymbol[idx]}
            onChange={(e) => handleSetToCreateSymbol(idx, e.target.value)}
          />
        ),
      },
      {
        title: 'Side',
        dataIndex: 'side',
        render: (_, record, idx) => (
          <Select
            value={toCreateSide[idx]}
            onChange={(value) => handleSetToCreateSide(idx, value)}
            style={{ width: '100%' }}
          >
            <Select.Option value="sell">Sell</Select.Option>
            <Select.Option value="buy">Buy</Select.Option>
          </Select>
        ),
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        render: (_, record, idx) => (
          <Input
            type="number"
            value={toCreateAmount[idx] ?? 1}
            onChange={(e) => handleSetToCreateAmount(idx, e.target.value)}
          />
        ),
      },
      {
        title: 'Price',
        dataIndex: 'price',
        render: (_, record, idx) => (
          <Input
            type="number"
            value={toCreatePrice[idx]}
            onChange={(e) => handleSetToCreatePrice(idx, e.target.value)}
          />
        ),
      },
      {
        title: 'Type',
        dataIndex: 'type',
        render: (_, record, idx) => (
          <Select
            value={toCreateType[idx]}
            onChange={(value) => handleSetToCreateType(idx, value)}
            style={{ width: '100%' }}
          >
            <Select.Option value="limit">Limit</Select.Option>
            <Select.Option value="market">Market</Select.Option>
          </Select>
        ),
      },
      {
        title: 'Actions',
        dataIndex: 'actions',
        render: (_, record, idx) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button 
              type="primary"
              onClick={() => refreshCreateIvData(toCreateSymbol[idx], idx)}
            >
              {getButtonCreateSign(idx)} Refresh
            </Button>
            <Button
              type="primary"
              danger
              onClick={() => createNewPostion(idx, createNewPostionCallBack)}
            >
              {buttonSubmitCreateSign[idx] ?? '⚡️'} Submit
            </Button>
          </div>
        ),
      },
    ];

    const dataSource = toCreateSlots.map((_, idx) => ({
      key: idx,
      symbol: toCreateSymbol[idx],
      side: toCreateSide[idx],
      amount: toCreateAmount[idx],
      price: toCreatePrice[idx],
      type: toCreateType[idx],
      ivData: toCreateIvData[idx],
    }));

    return (
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <Button type="primary" onClick={() => handleSetToCreateSlots(true)}>
            Add Position
          </Button>
          <Button danger onClick={() => handleSetToCreateSlots(false)}>
            Remove Position
          </Button>
          <Button onClick={() => refreshAllCreateIvData()}>
            Refresh All IV Data
          </Button>
          {createPostionAllReady() && (
            <Button 
              type="primary" 
              onClick={() => createAllNewPostion(createAllNewPostionCallBack)}
            >
              ⚡️ Create All Positions
            </Button>
          )}
          <Button onClick={() => accountCostValue()}>
            All Cost: {countCostValue}
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          scroll={{ x: true }}
          expandable={{
            expandedRowRender: (record, idx) => (
              <div style={{ margin: 0 }}>
                <p>Infer Price: {record.ivData ? parseFloat(record.ivData.infer_price).toFixed(2) : 'N/A'}</p>
                <p>Delta: {record.ivData ? parseFloat(record.ivData.delta).toFixed(4) : 'N/A'}</p>
                <p>Ask Price: {record.ivData ? parseFloat(record.ivData.ask_price).toFixed(4) : 'N/A'}</p>
                <p>S IV: {record.ivData ? parseFloat(record.ivData.s_iv).toFixed(2) : 'N/A'}</p>
                <p>Bid Price: {record.ivData ? parseFloat(record.ivData.bid_price).toFixed(4) : 'N/A'}</p>
                <p>B IV: {record.ivData ? parseFloat(record.ivData.b_iv).toFixed(2) : 'N/A'}</p>
                <p>Intrinsic Value: {record.ivData ? parseFloat(record.ivData.intrinsic_value).toFixed(2) : 'N/A'}</p>
                <p>Time Value: {record.ivData ? parseFloat(record.ivData.time_value).toFixed(2) : 'N/A'}</p>
              </div>
            ),
          }}
        />
      </div>
    );
}

export default CreatePostions;
