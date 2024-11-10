
import LineChart from './components/LineChart';
// src/App.js
import React, { useEffect, useState } from 'react';

function IVHistory() {
    const [data, setData] = useState(null);

    const [labels, setLabels] = useState([]);
    const [dataBivPoints, setDataBivPoints] = useState([]);
    const [dataSivPoints, setDataSivPoints] = useState([]);
    const [optionSymbol, setOptionSymbol] = useState('');
    // 从 env 文件中获取 OPTION_OFFICE_DAYS
    // const optionOfficeDays = process.env.REACT_APP_OPTION_OFFICE_DAYS
    const apiHosts = process.env.REACT_APP_API_HOSTS
    // console.log('optionOfficeDays: ', optionOfficeDays);

    const label = 'IV History';

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
      const year = date.getFullYear().toString().slice(-2);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const formattedDate = `${year}/${month}/${day} ${hours}:${minutes}`;
      return formattedDate;
    }

    const extractChartData = (data) => {
      const _labels = data.map(item => `${timeToStr(item[0])}#${item[1]}`);
      const _dataBivPoints = data.map(item => item[3]);
      const _dataSivPoints = data.map(item => item[4]);
      return [_labels, _dataBivPoints, _dataSivPoints];
    }

    useEffect(() => {

      const params = new URLSearchParams(window.location.search);
      const param_symbol = params.get('symbol'); 
      const param_flag = params.get('flag');  
      const param_offset = parseInt(params.get('offset'));

      console.log('param_symbol: ', param_symbol);
      console.log('param_flag: ', param_flag);
      console.log('param_offset: ', param_offset);

      const symbol = param_symbol.toUpperCase()
      const flag = param_flag.toLowerCase()

      // 定义一个异步函数
      async function fetchData() {

        const optionChains = await callGetOptionChains(symbol, param_offset);
        console.log('optionChains: ', optionChains);
        if(optionChains.length === 0) {
          setOptionSymbol('No option chain data');
          return;
        }
        setOptionSymbol(`${symbol}-${optionChains[0]}-${flag.toUpperCase()}`);

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
        }, 5000);
        return () => clearInterval(interval);

      }

      // 调用异步函数
      fetchData();
      console.log('fetchData: ', 'fetchData');
      
  }, []); // labels 改变时重置定时器

  const callFetchIvData = (symbol, flag, eday, sidx=-1) => {
    return new Promise((resolve, reject) => {
      fetch(`${apiHosts}/api/iv_data?symbol=${symbol}&flag=${flag}&edate=${eday}&sidx=${sidx}`)
        .then(response => response.json())
        .then((data) => {
          if (data) {
            console.log('callFetchIvData: ', data);
            resolve(data);
          } else {
            reject('error');
          }
        });
    });
  }


  const callGetOptionChains = (symbol, offset) =>{
    return new Promise((resolve, reject) => {
      fetch(`${apiHosts}/api/option_chain?symbol=${symbol}&offset=${offset}`)
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
            <h1>{optionSymbol}</h1>
            <h3>Example link <a href='/?symbol=eth&flag=c&offset=2'>Example link</a></h3>
            <div style={{ width: '2000px', height: '400px' }}>
            <LineChart labels={labels} bIvList={dataBivPoints} sIvList={dataSivPoints} label={label} />
            </div>
        </div>
    );
}

export default IVHistory;
