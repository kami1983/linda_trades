import React, { useState, useEffect } from "react";
import { getTOptionChain } from "../utils/OptionApis";
import { extractPrice, GetCoinSign, handleShowInferInfo } from "../utils/Utils";
import { usePrices } from '../context/PriceContext';
import { Table, Button, Input, Space, Spin, Checkbox } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

function OptionTables({ onSymbolClick }) {
  const [optionChainList, setOptionChainList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buttonGetBtcOptionSign, setButtonGetBtcOptionSign] = useState('🟩');
  const [buttonGetEthOptionSign, setButtonGetEthOptionSign] = useState('🟩');
  const [optionChainRange, setOptionChainRange] = useState([0.4, 0.6]);
  const [showNoIv, setShowNoIv] = useState(false);

  const coinPrices = usePrices();

  const getDaysLeftFromSymbol = (symbol) => {
    try {
      const m = symbol.match(/-(\d{6})-/);
      if (!m) return null;
      const yy = parseInt(m[1].slice(0, 2), 10);
      const mm = parseInt(m[1].slice(2, 4), 10);
      const dd = parseInt(m[1].slice(4, 6), 10);
      const fullYear = 2000 + yy;
      const expiry = Date.UTC(fullYear, mm - 1, dd, 0, 0, 0);
      const now = Date.now();
      return (expiry - now) / (24 * 60 * 60 * 1000);
    } catch (e) {
      return null;
    }
  }

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
          const iv = _optionChainList[i][1];
          const inRange = iv && Math.abs(iv.delta) > optionChainRange[0] && Math.abs(iv.delta) < optionChainRange[1];
          const noIv = !iv && showNoIv;
          if (inRange || noIv) _optionChainListFiltered.push(_optionChainList[i]);
        }

        // 按照 day_left 排序
        _optionChainListFiltered.sort((a, b) => {
          const da = a[1] ? a[1].day_left : Number.POSITIVE_INFINITY;
          const db = b[1] ? b[1].day_left : Number.POSITIVE_INFINITY;
          return da - db;
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
      render: (text, record) => record[1] ? parseFloat(text).toFixed(2) : 'N/A',
      sorter: (a, b) => {
        const va = a[1] ? a[1].delta : Number.POSITIVE_INFINITY;
        const vb = b[1] ? b[1].delta : Number.POSITIVE_INFINITY;
        return va - vb;
      },
    },
    {
      title: 'Infer Price',
      dataIndex: ['1', 'infer_price'],
      key: 'infer_price',
      render: (text, record) => (
        <>
          {record[1] ? parseFloat(text).toFixed(2) : 'N/A'}
          {record[1] && (
            <span style={{ marginLeft: 8 }}>
              [{handleShowInferInfo(record[1], coinPrices)}]
            </span>
          )}
        </>
      ),
      sorter: (a, b) => {
        const va = a[1] ? a[1].infer_price : Number.POSITIVE_INFINITY;
        const vb = b[1] ? b[1].infer_price : Number.POSITIVE_INFINITY;
        return va - vb;
      },
    },
    {
      title: 'Days Left',
      dataIndex: ['1', 'day_left'],
      key: 'day_left',
      render: (text, record) => {
        if (record[1]) return parseFloat(text).toFixed(2);
        const fallback = getDaysLeftFromSymbol(record[0]?.symbol || '');
        return fallback != null ? parseFloat(fallback).toFixed(2) : 'N/A';
      },
      sorter: (a, b) => {
        const fa = a[1] ? a[1].day_left : getDaysLeftFromSymbol(a[0]?.symbol || '') ?? Number.POSITIVE_INFINITY;
        const fb = b[1] ? b[1].day_left : getDaysLeftFromSymbol(b[0]?.symbol || '') ?? Number.POSITIVE_INFINITY;
        const va = fa == null ? Number.POSITIVE_INFINITY : fa;
        const vb = fb == null ? Number.POSITIVE_INFINITY : fb;
        return va - vb;
      },
    },
    {
      title: 'Ask Price',
      dataIndex: ['1', 'ask_price'],
      key: 'ask_price',
      render: (text, record) => (
        <span style={{ color: 'red' }}>
          {record[1] ? text : (record[0]?.ask_price ?? 'N/A')} {(() => {
            if (record[1]) return `[${record[1]?.ask_usd?.toFixed(2)}$]`;
            const ap = record[0]?.ask_price;
            if (ap == null) return '';
            const cp = extractPrice(GetCoinSign(record[0]?.symbol), coinPrices);
            return cp ? `[${(ap * cp).toFixed(2)}$]` : '';
          })()}
        </span>
      ),
      sorter: (a, b) => {
        const va = a[1] ? a[1].ask_price : (a[0]?.ask_price ?? Number.POSITIVE_INFINITY);
        const vb = b[1] ? b[1].ask_price : (b[0]?.ask_price ?? Number.POSITIVE_INFINITY);
        return va - vb;
      },
    },
    {
      title: 'S IV',
      dataIndex: ['1', 's_iv'],
      key: 's_iv',
      render: (text, record) => record[1] ? parseFloat(text).toFixed(2) : 'N/A',
      sorter: (a, b) => {
        const va = a[1] ? a[1].s_iv : Number.POSITIVE_INFINITY;
        const vb = b[1] ? b[1].s_iv : Number.POSITIVE_INFINITY;
        return va - vb;
      },
    },
    {
      title: 'Bid Price',
      dataIndex: ['1', 'bid_price'],
      key: 'bid_price',
      render: (text, record) => (
        <span style={{ color: 'blue' }}>
          {record[1] ? text : (record[0]?.bid_price ?? 'N/A')} {(() => {
            if (record[1]) return `[${record[1]?.bid_usd?.toFixed(2)}$]`;
            const bp = record[0]?.bid_price;
            if (bp == null) return '';
            const cp = extractPrice(GetCoinSign(record[0]?.symbol), coinPrices);
            return cp ? `[${(bp * cp).toFixed(2)}$]` : '';
          })()}
        </span>
      ),
      sorter: (a, b) => {
        const va = a[1] ? a[1].bid_price : (a[0]?.bid_price ?? Number.POSITIVE_INFINITY);
        const vb = b[1] ? b[1].bid_price : (b[0]?.bid_price ?? Number.POSITIVE_INFINITY);
        return va - vb;
      },
    },
    {
      title: 'B IV',
      dataIndex: ['1', 'b_iv'],
      key: 'b_iv',
      render: (text, record) => record[1] ? parseFloat(text).toFixed(2) : 'N/A',
      sorter: (a, b) => {
        const va = a[1] ? a[1].b_iv : Number.POSITIVE_INFINITY;
        const vb = b[1] ? b[1].b_iv : Number.POSITIVE_INFINITY;
        return va - vb;
      },
    },
    {
      title: 'Intrinsic Value',
      dataIndex: ['1', 'intrinsic_value'],
      key: 'intrinsic_value',
      render: (text, record) => record[1] ? parseFloat(text).toFixed(4) : 'N/A',
      sorter: (a, b) => {
        const va = a[1] ? a[1].intrinsic_value : Number.POSITIVE_INFINITY;
        const vb = b[1] ? b[1].intrinsic_value : Number.POSITIVE_INFINITY;
        return va - vb;
      },
    },
    {
      title: 'Time Value',
      dataIndex: ['1', 'time_value'],
      key: 'time_value',
      render: (text, record) => record[1] ? parseFloat(text).toFixed(4) : 'N/A',
      sorter: (a, b) => {
        const va = a[1] ? a[1].time_value : Number.POSITIVE_INFINITY;
        const vb = b[1] ? b[1].time_value : Number.POSITIVE_INFINITY;
        return va - vb;
      },
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
        const ya = a[1] ? (a[1].time_value / extractPrice(GetCoinSign(a[0].symbol), coinPrices) / parseFloat(a[1].day_left) * 365 * 100) : Number.NEGATIVE_INFINITY;
        const yb = b[1] ? (b[1].time_value / extractPrice(GetCoinSign(b[0].symbol), coinPrices) / parseFloat(b[1].day_left) * 365 * 100) : Number.NEGATIVE_INFINITY;
        return ya - yb;
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
        <Checkbox checked={showNoIv} onChange={(e) => setShowNoIv(e.target.checked)}>Show without IV</Checkbox>
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
