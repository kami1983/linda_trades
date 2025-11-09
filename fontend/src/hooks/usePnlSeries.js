// src/hooks/usePnlSeries.js
import { useMemo } from 'react';

// Build BTC/ETH cumulative and per-trade USD PnL time series
export default function usePnlSeries(orders) {
  return useMemo(() => {
    if (!orders || orders.length === 0) {
      return { labels: [], btcCum: [], ethCum: [], btcDelta: [], ethDelta: [] };
    }

    const sorted = [...orders].sort((a, b) => (a.fill_time || 0) - (b.fill_time || 0));
    const labels = [];
    const btcCum = [];
    const ethCum = [];
    const btcDelta = [];
    const ethDelta = [];
    let btcSum = 0;
    let ethSum = 0;

    for (const o of sorted) {
      const inst = String(o.inst_id || '');
      const pnl = parseFloat(o.pnl || 0);
      const fwd = parseFloat(o.fill_fwd_px || 0);
      const usd = (isNaN(pnl) || isNaN(fwd)) ? 0 : (pnl * fwd);
      const isBTC = inst.startsWith('BTC');
      const isETH = inst.startsWith('ETH');

      const btcThis = isBTC ? usd : 0;
      const ethThis = isETH ? usd : 0;

      if (isBTC) btcSum += usd;
      if (isETH) ethSum += usd;

      labels.push(new Date(o.fill_time || 0).toLocaleString());
      btcCum.push(btcSum);
      ethCum.push(ethSum);
      btcDelta.push(btcThis);
      ethDelta.push(ethThis);
    }

    return { labels, btcCum, ethCum, btcDelta, ethDelta };
  }, [orders]);
}


