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
    const [dataBivPoints, setDataBivPoints] = useState([]);
    const [dataSivPoints, setDataSivPoints] = useState([]);
    // 从 env 文件中获取 OPTION_OFFICE_DAYS
    const optionOfficeDays = process.env.REACT_APP_OPTION_OFFICE_DAYS
    console.log('optionOfficeDays: ', optionOfficeDays);

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

    const timeToStr = (time) => {
      const date = new Date(time*1000);
      return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    }

    const extractChartData = (data) => {
      const _labels = data.map(item => timeToStr(item[0]));
      const _dataBivPoints = data.map(item => item[3]);
      const _dataSivPoints = data.map(item => item[4]);
      return [_labels, _dataBivPoints, _dataSivPoints];
    }

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

        const optionChains = await callGetOptionChains(symbol, optionOfficeDays);
        console.log('optionChains: ', optionChains);
        if(optionChains.length === 0) {
          return;
        }
        const fetchCallIvData = await callFetchIvData(symbol, flag, optionChains[0]);
        const [_labels, _dataBivPoints, _dataSivPoints] = extractChartData(fetchCallIvData);
        setLabels(_labels);
        setDataBivPoints(_dataBivPoints);
        setDataSivPoints(_dataSivPoints);
        
        let idx = _dataBivPoints.length
        // 每5秒更新一次数据
        const interval = setInterval(async () => {
          const newFetchCallIvData = await callFetchIvData(symbol, flag, optionChains[0], idx);
          console.log('newFetchCallIvData: ', newFetchCallIvData);
          if(newFetchCallIvData.length > 0) {
            const [_newLabels, _newDataBivPoints, _newDataSivPoints] = extractChartData(newFetchCallIvData);
            setLabels(prevLabels => [...prevLabels, ..._newLabels]);
            setDataBivPoints(prevDataPoints => [...prevDataPoints, ..._newDataBivPoints]);
            setDataSivPoints(prevDataPoints => [...prevDataPoints, ..._newDataSivPoints]);
          }
          idx += newFetchCallIvData.length;
        }, 1000);
        return () => clearInterval(interval);

      }

      // 调用异步函数
      fetchData();
      console.log('fetchData: ', 'fetchData');
      
  }, []); // labels 改变时重置定时器

  const callFetchIvData = (symbol, flag, eday, sidx=-1) => {
    return new Promise((resolve, reject) => {
      fetch(`http://127.0.0.1:5000/api/iv_data?symbol=${symbol}&flag=${flag}&edate=${eday}&sidx=${sidx}`)
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


  const callGetOptionChains = (symbol, offset) =>{
    return new Promise((resolve, reject) => {
      fetch(`http://127.0.0.1:5000/api/option_chain?symbol=${symbol}&offset=${offset}`)
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
            <div style={{ width: '2000px', height: '400px' }}>
            <LineChart labels={labels} bIvList={dataBivPoints} sIvList={dataSivPoints} label={label} />
            </div>
            
        </div>
    );
}

export default App;
