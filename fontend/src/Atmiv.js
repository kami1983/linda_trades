
import LineChart from './components/LineChart';
// src/App.js
import React, { useEffect, useState } from 'react';

function AtmIV() {
    
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
      <h1>Iv infos</h1>
      <h3>symbol: {paramData.symbol}, price: {paramData.price}, rate: {paramData.rate} <a href="/atmprice">Back to atm price</a></h3>
      
      <div>
        <a href={`/atmiv?symbol=${paramData.symbol}&price=${paramData.price}&rate=0`}>Rate - 0</a> |
        <a href={`/atmiv?symbol=${paramData.symbol}&price=${paramData.price}&rate=5`}>Rate - 5%</a> |
        <a href={`/atmiv?symbol=${paramData.symbol}&price=${paramData.price}&rate=10`}>Rate - 10%</a> |
        <a href={`/atmiv?symbol=${paramData.symbol}&price=${paramData.price}&rate=15`}>Rate - 15%</a> |
      </div>
      <div>
        <ul>
        <li>正 Delta：看涨期权价格与标的资产价格同方向变化。</li>
        <li>负 Delta：看跌期权价格与标的资产价格反方向变化。</li>
        </ul>
      </div>
      
      <table border="1">
        <thead>
          <tr>
            <th>symbol</th>
            <th>strike</th>
            <th>day_left</th>
            <th>delta</th>
            <th>intrinsic_value</th>
            <th>time_value</th>
            <th>gamma</th>
            <th>theta</th>
            <th>s_iv</th>
            <th>b_iv</th>
            <th>ask_bid_diff</th>
            
            <th>ask_price</th>
            <th>ask_yield</th>
            <th>bid_price</th>
            <th>bid_yield</th>
            <th>ask_premium</th>
            <th>bid_premium</th>
            <th>execute_time</th>
          </tr>
        </thead>
        <tbody>
          {atmIvList.map((atmIv, idx) => (
            <React.Fragment key={idx}>
              {atmIv.status ? (
                <>
                  <tr>
                    <td><a href={`/optionlist?edate=${atmIv.data.call_iv.execute_date}&symbol=${paramData.symbol}&price=${paramData.price}&dayleft=${atmIv.data.call_iv.day_left}`}>{atmIv.data.call_iv.symbol}</a></td>
                    <td>{atmIv.data.call_iv.excute_strike}</td>
                    <td>{parseFloat(atmIv.data.call_iv.day_left).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.call_iv.delta).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.call_iv.intrinsic_value).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.call_iv.time_value).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.call_iv.gamma).toFixed(6)}</td>
                    <td>{parseFloat(atmIv.data.call_iv.theta).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.call_iv.s_iv).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.call_iv.b_iv).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.call_iv.ask_bid_diff).toFixed(2)}</td>
                    
                    <td>{parseFloat(atmIv.data.call_iv.ask_price).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.call_iv.ask_price/paramData.price/parseFloat(atmIv.data.call_iv.day_left)*365*100).toFixed(2)} %</td>
                    <td>{parseFloat(atmIv.data.call_iv.bid_price).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.call_iv.bid_price/paramData.price/parseFloat(atmIv.data.call_iv.day_left)*365*100).toFixed(2)} %</td>
                    <td>{parseFloat(atmIv.data.call_iv.ask_premium).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.call_iv.bid_premium).toFixed(2)}</td>
                    <td>{atmIv.data.call_iv.execute_time}</td>
                  </tr>
                  <tr>
                    <td>{atmIv.data.put_iv.symbol}</td>
                    <td>{parseFloat(atmIv.data.put_iv.excute_strike).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.put_iv.day_left).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.put_iv.delta).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.put_iv.intrinsic_value).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.put_iv.time_value).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.put_iv.gamma).toFixed(6)}</td>
                    <td>{parseFloat(atmIv.data.put_iv.theta).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.put_iv.s_iv).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.put_iv.b_iv).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.put_iv.ask_bid_diff).toFixed(2)}</td>
                    
                    <td>{parseFloat(atmIv.data.put_iv.ask_price).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.put_iv.ask_price/paramData.price/parseFloat(atmIv.data.put_iv.day_left)*365*100).toFixed(2)} %</td>
                    <td>{parseFloat(atmIv.data.put_iv.bid_price).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.put_iv.bid_price/paramData.price/parseFloat(atmIv.data.put_iv.day_left)*365*100).toFixed(2)} %</td>
                    <td>{parseFloat(atmIv.data.put_iv.ask_premium).toFixed(2)}</td>
                    <td>{parseFloat(atmIv.data.put_iv.bid_premium).toFixed(2)}</td>
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
