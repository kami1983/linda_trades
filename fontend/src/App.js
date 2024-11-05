import logo from './logo.svg';
import './App.css';
import LineChart from './components/LineChart';

// src/App.js
import React, { useEffect, useState } from 'react';

function App() {
    const [data, setData] = useState(null);

    // useEffect(() => {
    //     fetch("http://127.0.0.1:5000/api/data")
    //         .then(response => response.json())
    //         .then(data => setData(data));
    // }, []);

    const [labels, setLabels] = useState([]);
    const [dataPoints, setDataPoints] = useState([]);
    const label = 'ETH IV History';

    // const fetchCallIvData = [
    //   // time, price, buy_iv, sell_iv
    //   [1730786255, 2500, 0.82, 0.92],
    //   [1730886255, 2400, 0.62, 0.42],
    //   [1730986255, 2544, 0.72, 0.82],
    //   [1731086255, 2422, 0.52, 0.42],
    //   [1731186255, 2231, 0.52, 0.72],
    //   [1731286255, 1233, 0.82, 0.102],
    // ]

    useEffect(() => {

      // 模拟从服务器获取数据，获取的数据存储到 fetchCallIvData
      // const _labels = fetchCallIvData.map(item => item[0]);
      // const _dataPoints = fetchCallIvData.map(item => item[1]);
      // setLabels(_labels);
      // setDataPoints(_dataPoints);

      
      const symbol = 'ETH';
      const flag = 'c';
      // 定义一个异步函数
      async function fetchData() {
        
        const fetchCallIvData = await callFetchCallIvData(symbol, flag, -1);
        // console.log('fetch_data: ', fetch_data);

        const _labels = fetchCallIvData.map(item => item[0]);
        const _dataPoints = fetchCallIvData.map(item => item[2]);
        setLabels(_labels);
        setDataPoints(_dataPoints);

        // 每5秒更新一次数据
        const interval = setInterval(async () => {
          const newFetchCallIvData = await callFetchCallIvData(symbol, flag, _dataPoints.length-2);
          console.log('newFetchCallIvData: ', newFetchCallIvData);
          if(newFetchCallIvData.length > 0) {
            const _newLabels = newFetchCallIvData.map(item => item[0]);
            const _newDataPoints = newFetchCallIvData.map(item => item[2]);
            setLabels(prevLabels => [...prevLabels, _newLabels]);
            setDataPoints(prevDataPoints => [...prevDataPoints, _newDataPoints]);
          }
        }, 1000);
        return () => clearInterval(interval);
      }

      // 调用异步函数
      fetchData();
      console.log('fetchData: ', 'fetchData');
      
  }, []); // labels 改变时重置定时器

  const callFetchCallIvData = (symbol, flag, index=-1) => {
    return new Promise((resolve, reject) => {
      fetch(`http://127.0.0.1:5000/api/iv_data?symbol=${symbol}&flag=${flag}&index=${index}`)
        .then(response => response.json())
        .then((data) => {
          if (data) {
            resolve(data);
          } else {
            reject('error');
          }
        });
    });

  }

    return (
        <div>
            <h1>Flask + React</h1>
            {data ? <p>{data.message}</p> : <p>Loading...</p>}
            <h1>My Line Chart</h1>
            <div style={{ width: '1000px', height: '400px' }}>
            <LineChart labels={labels} dataPoints={dataPoints} label={label} />
            </div>
            
        </div>
    );
}

export default App;
