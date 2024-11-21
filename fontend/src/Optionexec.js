
import LineChart from './components/LineChart';
// src/App.js
import React, { useEffect, useState } from 'react';

function OptionExec() {
    
    const [paramData, setParamData] = useState({symbol: '', price: 0, rate: 0});
    const [atmIvList, setAtmIvList] = useState([]);

    const defaultPriceData = [
      {status: false, data: {symbol: 'eth', price: 0}},
      {status: false, data: {symbol: 'btc', price: 0}}
    ]
    const [coinPrices, setCoinPrices] = useState(defaultPriceData);

    const apiHosts = process.env.REACT_APP_API_HOSTS


    useEffect(() => {

      const params = new URLSearchParams(window.location.search);
      const param_symbol = params.get('symbol');
      const param_price = parseFloat(params.get('price'));
      const param_rate = parseInt(params.get('rate'));
      const days = [2, 7, 14, 30, 60, 90];

      setParamData({symbol: param_symbol, price: param_price, rate: param_rate});

      const _fetchAtmIv = () => {
        console.log('_fetchPrice: ', days);
        const promises = days.map(day => callFetchIv(param_symbol, param_price, day, param_rate));
          Promise.all(promises).then((values) => {
            console.log('values: ', values);
            setAtmIvList(values);
          });
      }
      
      // 定义一个异步函数
      async function fetchData() {

        // 每5秒更新一次数据
        const interval = setInterval(async () => {
          try{
            console.log('call interval: ', days);
            _fetchAtmIv();
          }catch(err){
            setCoinPrices(defaultPriceData);
            console.log('error: ', err);
          }
        }, 100000);
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
      <h1>Option executer</h1>
      <h3>最大的作用就是滚仓工具</h3>
      <div>
        获取当前已经存在的仓位，然后动态显示报价切片对应的，时间价值，隐含波动率，delta，gamma，theta等信息。
        同时设定义一个要跟踪换仓的仓位，也同步显示对应的信息。
        提供一个刷新信息的按钮，和一个执行换仓的按钮。
      </div>
      </div>
    );
}

export default OptionExec;
