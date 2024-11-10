
import LineChart from './components/LineChart';
// src/App.js
import React, { useEffect, useState } from 'react';

function AtmPrice() {

    const defaultPriceData = [
      {status: false, data: {symbol: 'eth', price: 0}},
      {status: false, data: {symbol: 'btc', price: 0}}
    ]
    const [coinPrices, setCoinPrices] = useState(defaultPriceData);

    // 从 env 文件中获取 OPTION_OFFICE_DAYS
    // const optionOfficeDays = process.env.REACT_APP_OPTION_OFFICE_DAYS
    const apiHosts = process.env.REACT_APP_API_HOSTS
    // console.log('optionOfficeDays: ', optionOfficeDays);


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
      

      
      // 定义一个异步函数
      async function fetchData() {

        // call callFetchPrice

        const _fetchPrice = () => {
          const symbols = ['eth', 'btc'];
          const promises = symbols.map(symbol => callFetchPrice(symbol));
          Promise.all(promises).then((values) => {
            setCoinPrices(values);
          });
        }
        

        // 每5秒更新一次数据
        const interval = setInterval(async () => {
          try{
            _fetchPrice();
          }catch(err){
            setCoinPrices(defaultPriceData);
            console.log('error: ', err);
          }
        }, 5000);
        return () => clearInterval(interval);

      }

      // 调用异步函数
      fetchData();

    }, []); // labels 改变时重置定时器

    // /api/current_price
    const callFetchPrice = (symbol) => {
      return new Promise((resolve, reject) => {
        fetch(`${apiHosts}/api/current_price?symbol=${symbol}`)
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
            <h1>Prices</h1>
            {coinPrices.map((coinPrice, idx) => (
              <div key={idx}>
                {coinPrice.status ? (
                  <h3>{coinPrice.data.symbol}: <a href={`/atmiv?symbol=${coinPrice.data.symbol}&price=${coinPrice.data.price}&rate=0`}>{coinPrice.data.price}</a></h3>
                ) : null}
              </div>
            ))}
        </div>
    );
}

export default AtmPrice;
