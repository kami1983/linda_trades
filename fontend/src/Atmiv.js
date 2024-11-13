
import LineChart from './components/LineChart';
// src/App.js
import React, { useEffect, useState } from 'react';

function AtmIV() {
    const [data, setData] = useState(null);

    const [labels, setLabels] = useState([]);
    const [dataBivPoints, setDataBivPoints] = useState([]);
    const [dataSivPoints, setDataSivPoints] = useState([]);
    const [optionSymbol, setOptionSymbol] = useState('');
    const [paramData, setParamData] = useState({symbol: '', price: 0, rate: 0});
    const [atmIvList, setAtmIvList] = useState([]);

    const defaultPriceData = [
      {status: false, data: {symbol: 'eth', price: 0}},
      {status: false, data: {symbol: 'btc', price: 0}}
    ]
    const [coinPrices, setCoinPrices] = useState(defaultPriceData);

    const apiHosts = process.env.REACT_APP_API_HOSTS

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
      const param_price = params.get('price');
      const param_rate = parseInt(params.get('rate'));
      const days = [2, 7, 14, 30, 60, 90];

      setParamData({symbol: param_symbol, price: param_price, rate: param_rate});

      
      // 定义一个异步函数
      async function fetchData() {

        const _fetchAtmIv = () => {
          console.log('_fetchPrice: ', days);
          const promises = days.map(day => callFetchIv(param_symbol, param_price, day, param_rate));
            Promise.all(promises).then((values) => {
              console.log('values: ', values);
              setAtmIvList(values);
            });
        }
        
        // 每5秒更新一次数据
        const interval = setInterval(async () => {
          try{
            console.log('call interval: ', days);
            _fetchAtmIv();
          }catch(err){
            setCoinPrices(defaultPriceData);
            console.log('error: ', err);
          }
        }, 30000);
        return () => clearInterval(interval);

      }

      _fetchAtmIv();
      // 调用异步函数
      fetchData();

    }, []); // labels 改变时重置定时器

    // /api/atm_iv
    const callFetchIv = (symbol, price, day, rate=0) => {
      return new Promise((resolve, reject) => {
        fetch(`${apiHosts}/api/atm_iv?symbol=${symbol}&price=${price}&day=${day}&rate=${rate}`)
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
      <h1>Iv infos</h1>
      <h3>symbol: {paramData.symbol}, price: {paramData.price}, rate: {paramData.rate} <a href="/atmprice">Back to atm price</a></h3>
      <div>
        <div><a href={`/atmiv?symbol=${paramData.symbol}&price=${paramData.price}&rate=0`}>Rate - 0</a></div>
        <div><a href={`/atmiv?symbol=${paramData.symbol}&price=${paramData.price}&rate=5`}>Rate - 0.05</a></div>
        <div><a href={`/atmiv?symbol=${paramData.symbol}&price=${paramData.price}&rate=10`}>Rate - 0.10</a></div>
        <div><a href={`/atmiv?symbol=${paramData.symbol}&price=${paramData.price}&rate=15`}>Rate - 0.15</a></div>
      </div>
      <table border="1">
        <thead>
          <tr>
            <th>symbol</th>
            <th>strike</th>
            <th>day_left</th>
            <th>delta</th>
            <th>ask_bid_diff</th>
            <th>ask_premium</th>
            <th>bid_premium</th>
            <th>ask_price</th>
            <th>bid_price</th>
            <th>s_iv</th>
            <th>b_iv</th>
            <th>execute_flag</th>
            <th>execute_time</th>
          </tr>
        </thead>
        <tbody>
          {atmIvList.map((atmIv, idx) => (
            <React.Fragment key={idx}>
              {atmIv.status ? (
                <>
                  <tr>
                    <td>{atmIv.data.call_iv.symbol}</td>
                    <td>{atmIv.data.call_iv.strike}</td>
                    <td>{parseFloat(atmIv.data.call_iv.day_left).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.call_iv.delta).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.call_iv.ask_bid_diff).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.call_iv.ask_premium).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.call_iv.bid_premium).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.call_iv.ask_price).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.call_iv.bid_price).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.call_iv.s_iv).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.call_iv.b_iv).toFixed(2)}</td>
                    <td>{atmIv.data.call_iv.execute_flag}</td>
                    <td>{atmIv.data.call_iv.execute_time}</td>
                  </tr>
                  <tr>
                    <td>{atmIv.data.put_iv.symbol}</td>
                    <td>{parseFloat(atmIv.data.put_iv.strike).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.put_iv.day_left).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.call_iv.delta).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.put_iv.ask_bid_diff).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.put_iv.ask_premium).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.put_iv.bid_premium).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.put_iv.ask_price).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.put_iv.bid_price).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.put_iv.s_iv).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.put_iv.b_iv).toFixed(2)}</td>
                    <td>{atmIv.data.put_iv.execute_flag}</td>
                    <td>{atmIv.data.put_iv.execute_time}</td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td colSpan="13">Error...</td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
    );
}

export default AtmIV;
