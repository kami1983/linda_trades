
//

import React, { useState, useEffect } from "react";
import { Table, Button, Space, Tag, Modal } from 'antd';
import { 
  extractIVData, 
  operToCancel, 
  handlerEditOrder, 
  callOpenOrders 
} from "../utils/OptionApis";
import { extractPrice, GetCoinSign, GetPostionSize } from "../utils/Utils";
import { usePrices } from '../context/PriceContext';
import { QuestionCircleOutlined } from '@ant-design/icons';



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
    

    const columns = [
      {
        title: 'Symbol',
        dataIndex: 'symbol',
        key: 'symbol',
        render: (text, record) => (
          <a onClick={() => onSymbolClick(record.symbol)}>
            {text}
          </a>
        )
      },
      {
        title: 'Side',
        dataIndex: 'side',
        key: 'side',
        render: (side) => (
          <Tag color={side === 'buy' ? 'green' : 'red'}>
            {side.toUpperCase()}
          </Tag>
        )
      },
      {
        title: 'Price',
        dataIndex: 'price',
        key: 'price',
        render: (price) => parseFloat(price).toFixed(2)
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: (amount, record) => (
          (amount * GetPostionSize(GetCoinSign(record.symbol))).toFixed(2)
        )
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status'
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_, record, idx) => (
          <Space>
            <Button 
              type="primary" 
              onClick={() => refreshOrderIvData(record.symbol, idx)}
              icon={<QuestionCircleOutlined />}
            >
              Refresh IV ({extractPrice(GetCoinSign(record.symbol), coinPrices)})
            </Button>
            <Button 
              danger
              onClick={() => operToCancel(record.id, record.symbol, cancelOrderDone)}
            >
              Cancel
            </Button>
          </Space>
        )
      }
    ];

    const expandedRowRender = (record, idx) => {
      if (!record.ivData) return null;
      
      return (
        
        <div style={{ margin: 0 }}>
          
          <div style={{ margin: 0 }}>
            <p>Day Left: {record.ivData ? parseFloat(record.ivData.day_left).toFixed(2) : 'N/A'}</p>
            <p>Ask Price: {record.ivData ? `${parseFloat(record.ivData.ask_price).toFixed(4)} [${parseFloat(record.ivData.ask_usd).toFixed(2)}$]` : 'N/A'}</p>
            <p>S IV: {record.ivData ? parseFloat(record.ivData.s_iv).toFixed(2) : 'N/A'}</p>
            <p>Bid Price: {record.ivData ? `${parseFloat(record.ivData.bid_price).toFixed(4)} [${parseFloat(record.ivData.bid_usd).toFixed(2)}$]` : 'N/A'}</p>
            <p>B IV: {record.ivData ? parseFloat(record.ivData.b_iv).toFixed(2) : 'N/A'}</p>
            <p>Delta: {record.ivData ? parseFloat(record.ivData.delta).toFixed(4) : 'N/A'}</p>
            <p>Gamma: {record.ivData ? parseFloat(record.ivData.gamma).toFixed(8) : 'N/A'}</p>
            <p>Theta: {record.ivData ? parseFloat(record.ivData.theta).toFixed(4) : 'N/A'}</p>
            <p>Intrinsic Value: {record.ivData ? parseFloat(record.ivData.intrinsic_value).toFixed(2) : 'N/A'}</p>
            <p>Time Value: {record.ivData ? parseFloat(record.ivData.time_value).toFixed(2) : 'N/A'}</p>
            <p>Yield Rate: {record.ivData ? `${(parseFloat(record.ivData.time_value) / extractPrice(GetCoinSign(record.symbol), coinPrices) / parseFloat(record.ivData.day_left) * 365 * 100).toFixed(2)}%` : 'N/A'}</p>
          </div>

          <div style={{ marginTop: 16 }}>
            <Space>
              <Button 
                type="primary"
                onClick={() => operToModifyPriceToAsk(record.id, record.symbol, record.ivData.ask_price, record.type, record.side, modifyOrderDone)}
              >
                Modify to Ask
              </Button>
              <Button 
                type="primary"
                onClick={() => operToModifyPriceToBid(record.id, record.symbol, record.ivData.bid_price, record.type, record.side, modifyOrderDone)}
              >
                Modify to Bid
              </Button>
            </Space>
          </div>
        </div>
      );
    };

    return (
      <Table
        columns={columns}
        dataSource={openOrders}
        rowKey="id"
        expandable={{
          expandedRowRender,
          rowExpandable: record => !!record.ivData
        }}
        bordered
        size="middle"
        scroll={{ x: 'max-content' }}
      />
    );
}

export default OpenOrders;
