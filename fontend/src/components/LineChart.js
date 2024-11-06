// src/components/LineChart.js
import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// 注册 Chart.js 的模块
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const LineChart = ({ labels, label, bIvList, sIvList }) => {
    // 使用 props 创建图表数据
    const data = {
        labels: labels,
        datasets: [
            {
                label: `${label} - Buy IV`,
                data: bIvList,
                borderColor: 'rgba(75,192,192,1)', // 线条颜色
                backgroundColor: 'rgba(75,192,192,0.2)', // 填充颜色
                fill: true,
            },
            {
                label: `${label} - Sell IV`,
                data: sIvList,
                borderColor: 'rgba(255,99,132,1)', // 第二条线的颜色
                backgroundColor: 'rgba(255,99,132,0.2)', // 第二条线的填充颜色
                fill: true,
            },
        ],
    };

    // 找到数据的最小和最大值
    const minY = Math.min(...bIvList, ...sIvList) - 0.1;
    const maxY = Math.max(...bIvList, ...sIvList) + 0.1;

    // 图表配置选项
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: `${label} Line Chart`,
            },
        },
        scales: {
            x: {
                beginAtZero: true,
            },
            y: {
                min: minY,
                max: maxY,
                ticks: {
                    stepSize: 0.1,  // 调整步长以获得更好的刻度分布
                },
            },
        },
    };

    return <Line data={data} options={options} />;
};

export default LineChart;
