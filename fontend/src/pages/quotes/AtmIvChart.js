import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { Card, Space, Typography, Select, InputNumber } from 'antd';
import { useLoginStatus } from '../../context/LoginStautsContext';

const { Title } = Typography;

const AtmIvChart = () => {
  const { isLoggedIn, isChecking, updateLoginStatus } = useLoginStatus();
  const apiHost = process.env.REACT_APP_API_HOSTS;
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const priceSeriesRef = useRef(null);
  const ivSeriesRef = useRef(null);

  const [base, setBase] = useState('ETH');
  const [exchange, setExchange] = useState('okx');
  const [expiry, setExpiry] = useState(250117);
  const [limit, setLimit] = useState(2000);
  const [threshold, setThreshold] = useState(0.01);

  useEffect(() => { updateLoginStatus(); }, [updateLoginStatus]);
  useEffect(() => { if (!isChecking && !isLoggedIn) window.location.href = '/login'; }, [isLoggedIn, isChecking]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qBase = params.get('base');
    const qEx = params.get('exchange');
    const qExp = params.get('expiry');
    const qLim = params.get('limit');
    const qThr = params.get('threshold');
    if (qBase) setBase(qBase.toUpperCase());
    if (qEx) setExchange(qEx.toLowerCase());
    if (qExp) setExpiry(parseInt(qExp));
    if (qLim) setLimit(parseInt(qLim));
    if (qThr) setThreshold(parseFloat(qThr));
  }, []);

  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 480,
      layout: { background: { color: '#ffffff' }, textColor: '#333' },
      grid: { vertLines: { color: '#eee' }, horzLines: { color: '#eee' } },
      rightPriceScale: { visible: true },
      leftPriceScale: { visible: true },
      timeScale: { timeVisible: true, secondsVisible: false },
    });
    const priceSeries = chart.addLineSeries({ color: '#2f6', priceScaleId: 'left' });
    const ivSeries = chart.addLineSeries({ color: '#36f', priceScaleId: 'right' });
    chartRef.current = chart;
    priceSeriesRef.current = priceSeries;
    ivSeriesRef.current = ivSeries;
    const handleResize = () => chart.applyOptions({ width: containerRef.current.clientWidth });
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); chart.remove(); chartRef.current=null; };
  }, []);

  const load = async () => {
    const url = `${apiHost}/api/atm_iv_series?exchange=${encodeURIComponent(exchange)}&base=${encodeURIComponent(base)}&expiry=${expiry}&limit=${limit}&threshold=${threshold}`;
    const resp = await fetch(url, { credentials: 'include' });
    const data = await resp.json();
    if (!data.status) return;
    const rows = data.data || [];
    const price = rows.map(r => ({ time: r.datetime, value: r.underlying }));
    const iv = rows.map(r => ({ time: r.datetime, value: r.atm_iv != null ? r.atm_iv * 100 : null }));
    if (priceSeriesRef.current) priceSeriesRef.current.setData(price);
    if (ivSeriesRef.current) ivSeriesRef.current.setData(iv);
  };

  useEffect(() => { if (!isLoggedIn || isChecking) return; load(); }, [isLoggedIn, isChecking, exchange, base, expiry, limit, threshold]);

  return (
    <Card>
      <Space style={{ marginBottom: 12 }}>
        <Title level={4} style={{ margin: 0 }}>ATM IV vs Underlying</Title>
        <Select value={exchange} onChange={setExchange} options={[{value:'okx',label:'OKX'},{value:'binance',label:'Binance'}]} />
        <Select value={base} onChange={setBase} options={[{value:'BTC',label:'BTC'},{value:'ETH',label:'ETH'}]} />
        <InputNumber min={20000} step={1} value={expiry} onChange={(v)=>setExpiry(parseInt(v))} />
        <span>limit</span>
        <InputNumber min={100} max={5000} step={100} value={limit} onChange={(v)=>setLimit(parseInt(v))} />
        <span>ATM阈值</span>
        <InputNumber min={0.001} max={0.05} step={0.001} value={threshold} onChange={(v)=>setThreshold(parseFloat(v))} />
      </Space>
      <div ref={containerRef} style={{ width: '100%', height: 480 }} />
    </Card>
  );
};

export default AtmIvChart;


