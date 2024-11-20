
import { Colors } from 'chart.js';
import LineChart from './components/LineChart';
import './Optionlist.css';
// src/App.js
import React, { useEffect, useState } from 'react';

function OptionList() {

    const [paramData, setParamData] = useState({symbol: '', edate: 0, price: 0, dayleft: 0});
    const [tOptionData, setTOptionData] = useState([]);

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


    useEffect(() => {

      const params = new URLSearchParams(window.location.search);
      const param_symbol = params.get('symbol');
      const param_edate = parseFloat(params.get('edate'));
      const param_price = parseFloat(params.get('price'));
      const param_dayleft = parseFloat(params.get('dayleft'));

      setParamData({symbol: param_symbol, edate: param_edate, price: param_price, dayleft: param_dayleft});

      const _fetchAtmIv = () => {
        callFetchTOptionChain(param_symbol, param_edate, param_price).then((res) => {
          // if(data.length > 0){
          //   const mapData = data.map((item, idx) => {
          //     callFetchIvData(item.symbol, param_price).then((ivData) => {
          //       item.ask_price = ivData.ask_price;
          //       item.ask_size = ivData.ask_size;
          //       item.bid_price = ivData.bid_price;
          //       item.bid_size = ivData.bid_size;
          //     });
          //   });
          //   setTOptionData(data);
          // }
          setTOptionData(res.data);
        });
      }
      
      // 定义一个异步函数
      async function fetchData() {
        // 每5秒更新一次数据
        const interval = setInterval(async () => {
          try{
            _fetchAtmIv();
          }catch(err){
            console.log('error: ', err);
          }
        }, 300000);
        return () => clearInterval(interval);
      }

      _fetchAtmIv();
      // 调用异步函数
      fetchData();

    }, []); // labels 改变时重置定时器

    // /api/t_option_chain
    const callFetchTOptionChain = (symbol, edate, current_price) => {
      return new Promise((resolve, reject) => {
        fetch(`${apiHosts}/api/t_option_chain?edate=${edate}&symbol=${symbol}&price=${current_price}`)
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

    // http://localhost:5001/api/extract_iv_data?current_price=3138&symbol=ETH%2FUSD%3AETH-241227-3100-P
    const callFetchIvData = (symbol, current_price) => {
      return new Promise((resolve, reject) => {
        fetch(`${apiHosts}/api/extract_iv_data?symbol=${symbol}&current_price=${current_price}`)
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
    
      
      <table border="1">
        <thead>
          <tr>
            <th>symbol</th>
            <th>ask_price</th>
            <th>ask_size</th>
            <th>bid_price</th>
            <th>bid_size</th>
            <th>涨幅</th>
            <th>纯内在[溢折]</th>
            <th>s_iv</th>
            <th>b_iv</th>
            <th>delta</th>
            <th>gamma</th>
            <th>theta</th>
            <th>内在价值</th>
            <th>时间价值</th>
            <th>时间年华</th>
          </tr>
        </thead>
        <tbody>
          {tOptionData.map((option, idx) => (
            <React.Fragment key={idx}>
              {option[0] ? (
                <>
                {/* 如果是 option[0].option_type = C 显示这行为淡绿色，否则淡红色 */}
                <tr
                  className="table-row"
                  // style={{
                  //   backgroundColor: option[0].option_type === 'C' ? 'lightgreen' : 'lightcoral',
                  // }}
                >
                    <td>{option[0].symbol}</td>
                    <td>[s|{option[0].ask_price}]{(option[0].ask_price*paramData.price).toFixed(2)}</td>
                    <td>{option[0].ask_size}</td>
                    <td>[b|{option[0].bid_price}]{(option[0].bid_price*paramData.price).toFixed(2)}</td>
                    <td>{option[0].bid_size}</td>
                    <td style={{color: 'lightcoral'}}>{((parseFloat(option[0].strike) - parseFloat(paramData.price)) / parseFloat(paramData.price)).toFixed(2)}</td>
                    <td>{(paramData.price-(option[0].strike)).toFixed(2)}[{((option[0].bid_price*paramData.price)-(paramData.price-(option[0].strike))).toFixed(2)}]</td>
                    {option[1] ? (
                      <>
                        <td>{parseFloat(option[1].s_iv).toFixed(2)}</td>
                        <td>{parseFloat(option[1].b_iv).toFixed(2)}</td>
                        <td style={{color: 'red'}}>{parseFloat(option[1].delta).toFixed(2)}</td>
                        <td>{parseFloat(option[1].gamma).toFixed(6)}</td>
                        <td>{parseFloat(option[1].theta).toFixed(2)}</td>
                        <td sytle={{color: 'green'}}>[{parseFloat(option[1].intrinsic_value).toFixed(2)}]</td>
                        <td style={{color: 'blue'}}>{parseFloat(option[1].time_value).toFixed(2)}</td>
                        <td>{parseFloat(option[1].time_value/paramData.price/parseFloat(option[1].day_left)*365*100).toFixed(2)} %</td>
                      </>
                    ) : (
                      <>
                        <td colSpan={8}>No data</td>
                      </>
                    )}  
                  </tr>
                </>
              ) : (
                <tr>
                  <td colSpan="20">No data</td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
    );
}

export default OptionList;
