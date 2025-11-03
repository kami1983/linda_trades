// src/components/PnlBarChart.js
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PnlBarChart = ({ labels, btcData, ethData, title = 'Per-trade PnL (USD)', showBTC = true, showETH = true }) => {
  const data = {
    labels: labels || [],
    datasets: [
      {
        label: 'BTC trade PnL (USD)',
        data: btcData || [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        hidden: !showBTC
      },
      {
        label: 'ETH trade PnL (USD)',
        data: ethData || [],
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
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
      x: { stacked: false },
      y: {
        stacked: false,
        ticks: { callback: (v) => `$${v}` }
      }
    }
  };

  return <Bar data={data} options={options} />;
};

export default PnlBarChart;


