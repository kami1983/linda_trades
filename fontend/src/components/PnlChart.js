// src/components/PnlChart.js
import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const PnlChart = ({ labels, btcData, ethData, title = 'PnL (USD)', showBTC = true, showETH = true }) => {
  const usedBTC = showBTC ? (btcData || []) : [];
  const usedETH = showETH ? (ethData || []) : [];
  const allValues = [...usedBTC, ...usedETH];
  const minY = allValues.length ? Math.min(...allValues) : 0;
  const maxY = allValues.length ? Math.max(...allValues) : 0;
  const padding = (maxY - minY) * 0.1 || 1;

  const data = {
    labels: labels || [],
    datasets: [
      {
        label: 'BTC PnL (USD)',
        data: btcData || [],
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.15)',
        fill: true,
        tension: 0.2,
        hidden: !showBTC
      },
      {
        label: 'ETH PnL (USD)',
        data: ethData || [],
        borderColor: 'rgba(255, 159, 64, 1)',
        backgroundColor: 'rgba(255, 159, 64, 0.15)',
        fill: true,
        tension: 0.2,
        hidden: !showETH
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: title }
    },
    scales: {
      x: { beginAtZero: false },
      y: {
        min: minY - padding,
        max: maxY + padding,
        ticks: { callback: (v) => `$${v}` }
      }
    }
  };

  return <Line data={data} options={options} />;
};

export default PnlChart;


