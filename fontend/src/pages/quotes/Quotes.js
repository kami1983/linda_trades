import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { useLoginStatus } from '../../context/LoginStautsContext';
import { Card, Typography, Select, Space, InputNumber } from 'antd';

const { Title } = Typography;

const Quotes = () => {
  const { isLoggedIn, isChecking, updateLoginStatus } = useLoginStatus();
  const containerRef = useRef(null);
  const seriesRef = useRef(null);
  const chartRef = useRef(null);
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [exchange, setExchange] = useState('okx');
  const [limit, setLimit] = useState(800);
  const apiHost = process.env.REACT_APP_API_HOSTS;

  useEffect(() => {
    // ensure we have latest status when directly landing on /quotes
    updateLoginStatus();
  }, [updateLoginStatus]);

  useEffect(() => {
    if (isChecking) return;
    if (!isLoggedIn) {
      window.location.href = '/login';
    }
  }, [isLoggedIn, isChecking]);

  useEffect(() => {
    // read query params
    const params = new URLSearchParams(window.location.search);
    const s = params.get('symbol');
    const ex = params.get('exchange');
    const lim = params.get('limit');
    if (s) setSymbol(decodeURIComponent(s));
    if (ex) setExchange(ex.toLowerCase());
    if (lim && !Number.isNaN(parseInt(lim))) setLimit(parseInt(lim));
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    if (chartRef.current) return; // create once

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 480,
      layout: { background: { color: '#ffffff' }, textColor: '#333' },
      grid: { vertLines: { color: '#eee' }, horzLines: { color: '#eee' } },
      timeScale: { timeVisible: true, secondsVisible: false },
    });
    const series = chart.addCandlestickSeries();
    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  const fetchOhlcv = async (ex, sym, lim) => {
    const _lim = lim && lim > 0 ? lim : 800;
    const resp = await fetch(`${apiHost}/api/ohlcv_daily?exchange=${encodeURIComponent(ex)}&symbol=${encodeURIComponent(sym)}&limit=${_lim}`, {
      credentials: 'include',
    });
    const data = await resp.json();
    if (!data.status) return [];
    return data.data.map((row) => ({
      time: row.datetime, // 'YYYY-MM-DD'
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
    }));
  };

  const loadData = async (ex, sym, lim) => {
    const rows = await fetchOhlcv(ex, sym, lim);
    if (seriesRef.current) {
      seriesRef.current.setData(rows);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    loadData(exchange, symbol, limit);
  }, [isLoggedIn, exchange, symbol, limit]);

  return (
    <Card>
      <Space style={{ marginBottom: 12 }}>
        <Title level={4} style={{ margin: 0 }}>Coin Quotes</Title>
        <Select value={exchange} onChange={setExchange} options={[{value:'okx',label:'OKX'},{value:'binance',label:'Binance'}]} />
        <Select
          showSearch
          value={symbol}
          onChange={setSymbol}
          options={[
            {value:'BTC/USDT',label:'BTC/USDT'},
            {value:'ETH/USDT',label:'ETH/USDT'},
          ]}
          style={{ minWidth: 160 }}
        />
        <span>Limit:</span>
        <InputNumber
          min={50}
          max={5000}
          step={50}
          value={limit}
          onChange={(v) => {
            const n = typeof v === 'number' ? v : parseInt(v || 0);
            if (!Number.isNaN(n)) setLimit(n);
          }}
        />
      </Space>
      <div ref={containerRef} style={{ width: '100%', height: 480 }} />
    </Card>
  );
};

export default Quotes;


