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
  const legendRef = useRef(null);
  const ma5Ref = useRef(null);
  const ma10Ref = useRef(null);
  const ma20Ref = useRef(null);
  const ma30Ref = useRef(null);
  const ma60Ref = useRef(null);
  const ma90Ref = useRef(null);
  const ohlcvRef = useRef([]);
  const timeIndexMapRef = useRef(new Map());
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
    const series = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderDownColor: '#ef5350',
      borderUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      wickUpColor: '#26a69a',
    });
    // moving average series
    const ma5 = chart.addLineSeries({ color: '#f5a623', lineWidth: 2 });
    const ma10 = chart.addLineSeries({ color: '#7B7FF7', lineWidth: 2 });
    const ma20 = chart.addLineSeries({ color: '#29b6f6', lineWidth: 2 });
    const ma30 = chart.addLineSeries({ color: '#66bb6a', lineWidth: 2 });
    const ma60 = chart.addLineSeries({ color: '#ab47bc', lineWidth: 2 });
    const ma90 = chart.addLineSeries({ color: '#8d6e63', lineWidth: 2 });
    chartRef.current = chart;
    seriesRef.current = series;
    ma5Ref.current = ma5;
    ma10Ref.current = ma10;
    ma20Ref.current = ma20;
    ma30Ref.current = ma30;
    ma60Ref.current = ma60;
    ma90Ref.current = ma90;

    const handleResize = () => {
      chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);
    // crosshair legend
    const legend = document.createElement('div');
    legend.style.cssText = 'position:absolute;left:8px;top:8px;padding:6px 8px;background:rgba(255,255,255,0.95);border:1px solid #e1e1e1;border-radius:4px;font:12px/1.2 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial;z-index:2;pointer-events:none;';
    legendRef.current = legend;
    containerRef.current.style.position = 'relative';
    containerRef.current.appendChild(legend);

    const timeKeyFromParam = (t) => {
      if (!t) return null;
      if (typeof t === 'string') return t; // 'YYYY-MM-DD'
      if (typeof t === 'number') {
        const d = new Date(t * 1000);
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const da = String(d.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${da}`;
      }
      if (typeof t === 'object' && t.year && t.month && t.day) {
        const y = t.year;
        const m = String(t.month).padStart(2, '0');
        const da = String(t.day).padStart(2, '0');
        return `${y}-${m}-${da}`;
      }
      return null;
    };

    chart.subscribeCrosshairMove(param => {
      if (!param || !param.time) return;
      const price = param.seriesData.get(seriesRef.current);
      if (!price) return;
      const bars = ohlcvRef.current || [];
      const key = timeKeyFromParam(param.time);
      const idx = key && timeIndexMapRef.current.has(key) ? timeIndexMapRef.current.get(key) : -1;
      const prevClose = idx > 0 ? bars[idx - 1].close : null;
      // 优先相对昨收，找不到则用当日开盘作为基准
      const base = prevClose != null ? prevClose : (price.open != null ? price.open : null);
      const chgPct = base ? ((price.close - base) / base) * 100 : null;
      const chgAbs = base ? (price.close - base) : null;
      legend.innerHTML = `
        <div><b>${exchange.toUpperCase()} ${symbol}</b></div>
        <div>O: ${fmt(price.open)} H: ${fmt(price.high)} L: ${fmt(price.low)} C: ${fmt(price.close)} ${chgPct !== null ? `| Chg: ${fmt(chgPct)}% (${fmt(chgAbs)})` : ''}</div>
        <div style=\"color:#888\">MA5/10/20/30/60/90 已叠加</div>
      `;
    });
    return () => {
      window.removeEventListener('resize', handleResize);
      if (legendRef.current && containerRef.current && containerRef.current.contains(legendRef.current)) {
        containerRef.current.removeChild(legendRef.current);
      }
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      ma5Ref.current = null;
      ma10Ref.current = null;
      ma20Ref.current = null;
      ma30Ref.current = null;
      ma60Ref.current = null;
      ma90Ref.current = null;
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

  const computeMA = (rows, period) => {
    if (!rows || rows.length === 0) return [];
    const out = [];
    let sum = 0;
    const q = [];
    for (let i = 0; i < rows.length; i++) {
      const c = rows[i].close;
      q.push(c);
      sum += c;
      if (q.length > period) sum -= q.shift();
      out.push({ time: rows[i].time, value: q.length === period ? sum / period : null });
    }
    return out;
  };

  const fmt = (v) => {
    if (v === null || v === undefined) return '-';
    if (Math.abs(v) >= 100) return v.toFixed(2);
    if (Math.abs(v) >= 1) return v.toFixed(3);
    return v.toFixed(6);
  };

  const loadData = async (ex, sym, lim) => {
    const rows = await fetchOhlcv(ex, sym, lim);
    if (seriesRef.current) {
      seriesRef.current.setData(rows);
    }
    ohlcvRef.current = rows;
    // build time->index map for quick lookup
    const map = new Map();
    for (let i = 0; i < rows.length; i++) {
      map.set(rows[i].time, i);
    }
    timeIndexMapRef.current = map;
    // set moving averages
    const ma5 = computeMA(rows, 5).filter(p => p.value !== null && !Number.isNaN(p.value));
    const ma10 = computeMA(rows, 10).filter(p => p.value !== null && !Number.isNaN(p.value));
    const ma20 = computeMA(rows, 20).filter(p => p.value !== null && !Number.isNaN(p.value));
    const ma30 = computeMA(rows, 30).filter(p => p.value !== null && !Number.isNaN(p.value));
    const ma60 = computeMA(rows, 60).filter(p => p.value !== null && !Number.isNaN(p.value));
    const ma90 = computeMA(rows, 90).filter(p => p.value !== null && !Number.isNaN(p.value));
    if (ma5Ref.current) ma5Ref.current.setData(ma5);
    if (ma10Ref.current) ma10Ref.current.setData(ma10);
    if (ma20Ref.current) ma20Ref.current.setData(ma20);
    if (ma30Ref.current) ma30Ref.current.setData(ma30);
    if (ma60Ref.current) ma60Ref.current.setData(ma60);
    if (ma90Ref.current) ma90Ref.current.setData(ma90);
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


