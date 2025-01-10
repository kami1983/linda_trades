import React, { useState, useEffect } from "react";
import { getTOptionChain } from "../utils/OptionApis";
import { extractPrice, GetCoinSign, handleShowInferInfo } from "../utils/Utils";
import { usePrices } from '../context/PriceContext';
import { Table, Button, Input, Space, Spin } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

function OptionTables({ onSymbolClick }) {
  const [optionChainList, setOptionChainList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buttonGetBtcOptionSign, setButtonGetBtcOptionSign] = useState('🟩');
  const [buttonGetEthOptionSign, setButtonGetEthOptionSign] = useState('🟩');
  const [optionChainRange, setOptionChainRange] = useState([0.4, 0.6]);

  const coinPrices = usePrices();

  const refreshOptionTable = async (symbol) => {
    setLoading(true);
    const current_price = extractPrice(symbol, coinPrices);
    if(symbol === 'BTC'){
      setButtonGetBtcOptionSign('🔻');
    }else if(symbol === 'ETH'){
      setButtonGetEthOptionSign('🔻')
    };

    try {
      const res = await getTOptionChain(symbol, current_price);
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
      }
    } finally {
      setLoading(false);
      if(symbol === 'BTC'){
        setButtonGetBtcOptionSign('🟩');
      }else if(symbol === 'ETH'){
        setButtonGetEthOptionSign('🟩');
      }
    }
  }

  const columns = [
    {
      title: 'Symbol',
      dataIndex: ['0', 'symbol'],
      key: 'symbol',
      render: (text, record) => (
        <a 
          onClick={() => onSymbolClick(record[0]?.symbol || 'N/A')}
          style={{ cursor: 'pointer' }}
        >
          {text || 'N/A'}
        </a>
      ),
      sorter: (a, b) => a[0].symbol.localeCompare(b[0].symbol),
    },
    {
      title: 'Delta',
      dataIndex: ['1', 'delta'],
      key: 'delta',
      render: (text) => parseFloat(text).toFixed(2),
      sorter: (a, b) => a[1].delta - b[1].delta,
    },
    {
      title: 'Infer Price',
      dataIndex: ['1', 'infer_price'],
      key: 'infer_price',
      render: (text, record) => (
        <>
          {parseFloat(text).toFixed(2)}
          {record[1] && (
            <span style={{ marginLeft: 8 }}>
              [{handleShowInferInfo(record[1], coinPrices)}]
            </span>
          )}
        </>
      ),
      sorter: (a, b) => a[1].infer_price - b[1].infer_price,
    },
    {
      title: 'Days Left',
      dataIndex: ['1', 'day_left'],
      key: 'day_left',
      render: (text) => parseFloat(text).toFixed(2),
      sorter: (a, b) => a[1].day_left - b[1].day_left,
    },
    {
      title: 'Ask Price',
      dataIndex: ['1', 'ask_price'],
      key: 'ask_price',
      render: (text, record) => (
        <span style={{ color: 'red' }}>
          {text} [{record[1]?.ask_usd?.toFixed(2)}$]
        </span>
      ),
      sorter: (a, b) => a[1].ask_price - b[1].ask_price,
    },
    {
      title: 'S IV',
      dataIndex: ['1', 's_iv'],
      key: 's_iv',
      render: (text) => parseFloat(text).toFixed(2),
      sorter: (a, b) => a[1].s_iv - b[1].s_iv,
    },
    {
      title: 'Bid Price',
      dataIndex: ['1', 'bid_price'],
      key: 'bid_price',
      render: (text, record) => (
        <span style={{ color: 'blue' }}>
          {text} [{record[1]?.bid_usd?.toFixed(2)}$]
        </span>
      ),
      sorter: (a, b) => a[1].bid_price - b[1].bid_price,
    },
    {
      title: 'B IV',
      dataIndex: ['1', 'b_iv'],
      key: 'b_iv',
      render: (text) => parseFloat(text).toFixed(2),
      sorter: (a, b) => a[1].b_iv - b[1].b_iv,
    },
    {
      title: 'Intrinsic Value',
      dataIndex: ['1', 'intrinsic_value'],
      key: 'intrinsic_value',
      render: (text) => parseFloat(text).toFixed(4),
      sorter: (a, b) => a[1].intrinsic_value - b[1].intrinsic_value,
    },
    {
      title: 'Time Value',
      dataIndex: ['1', 'time_value'],
      key: 'time_value',
      render: (text) => parseFloat(text).toFixed(4),
      sorter: (a, b) => a[1].time_value - b[1].time_value,
    },
    {
      title: 'Yield Rate',
      key: 'yield_rate',
      render: (_, record) => {
        if (!record[1]) return 'N/A';
        const yieldRate = parseFloat(
          record[1].time_value / 
          extractPrice(GetCoinSign(record[0].symbol), coinPrices) / 
          parseFloat(record[1].day_left) * 365 * 100
        ).toFixed(2);
        return `${yieldRate} %`;
      },
      sorter: (a, b) => {
        const yieldA = a[1].time_value / extractPrice(GetCoinSign(a[0].symbol), coinPrices) / parseFloat(a[1].day_left) * 365 * 100;
        const yieldB = b[1].time_value / extractPrice(GetCoinSign(b[0].symbol), coinPrices) / parseFloat(b[1].day_left) * 365 * 100;
        return yieldA - yieldB;
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <label>Option Chain Range:</label>
        <Input 
          type="number" 
          step={0.1} 
          placeholder="0.4" 
          value={optionChainRange[0]} 
          onChange={(e) => setOptionChainRange([parseFloat(e.target.value), optionChainRange[1]])} 
        />
        <Input 
          type="number" 
          step={0.1} 
          placeholder="0.6" 
          value={optionChainRange[1]} 
          onChange={(e) => setOptionChainRange([optionChainRange[0], parseFloat(e.target.value)])} 
        />
      </Space>

      <Spin spinning={loading}>
        <Table
          dataSource={optionChainList}
          columns={columns}
          rowKey={(record) => record[0]?.symbol || Math.random()}
          pagination={{ pageSize: 10 }}
          bordered
          size="small"
        />
      </Spin>

      {coinPrices && coinPrices[0] && coinPrices[0].status ? (
        <Space style={{ marginTop: 16 }}>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={() => refreshOptionTable('BTC')}
          >
            Refresh BTC Option Table {buttonGetBtcOptionSign}
          </Button>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={() => refreshOptionTable('ETH')}
          >
            Refresh ETH Option Table {buttonGetEthOptionSign}
          </Button>
        </Space>
      ) : (
        <div style={{ marginTop: 16 }}>Waiting for prices...</div>
      )}
    </div>
  );
}

export default OptionTables;
