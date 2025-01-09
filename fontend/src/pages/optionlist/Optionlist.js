
import { Colors } from 'chart.js';
import LineChart from '../../components/LineChart';
import './Optionlist.css';
// src/App.js
import React, { useEffect, useState } from 'react';

function OptionList() {

    const [paramData, setParamData] = useState({symbol: '', edate: 0, price: 0, dayleft: 0});
    const [tOptionData, setTOptionData] = useState([]);
    const [chooseData, setChooseData] = useState([]);
    const [chooseLabel, setChooseLabel] = useState('all');

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

    // 单选按钮点击后出发的事件
    const handleChooseLabel = (e) => {
      setChooseLabel(e.target.value);
      refreshChooseData(e.target.value, tOptionData);
    }

    const refreshChooseData = (label, optionData) => {
      if(label === 'call'){
        const data = optionData.filter(item => item[0].option_type === 'C');
        setChooseData(data);
      }else if(label === 'put'){
        const data = optionData.filter(item => item[0].option_type === 'P');
        setChooseData(data);
      }else {
        setChooseData(optionData);
      }
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
          setTOptionData(res.data);
          refreshChooseData(chooseLabel, res.data);
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

    return (
      <div>
      <h1>Iv infos</h1>
      <h3>symbol: {paramData.symbol}, price: {paramData.price}, dayleft: {parseFloat(paramData.dayleft).toFixed(2)} <a href="/atmprice">Back to atm price</a></h3>
      <div>
        {/* 建立一组单选按钮（radio），选项是 all、call、put 用于提供筛选数据列表的选项，点击后触发 handleChooseLabel */}
        <input type="radio" id="all" name="flag" value="all" defaultChecked onClick={handleChooseLabel} />
        <label htmlFor="all">All</label>
        <input type="radio" id="call" name="flag" value="call" onClick={handleChooseLabel} />
        <label htmlFor="call">Call</label>
        <input type="radio" id="put" name="flag" value="put" onClick={handleChooseLabel} />
        <label htmlFor="put">Put</label>
        
      </div>
      
      <table border="1">
        <thead>
          <tr>
            <th>symbol</th>
            <th>ask_price</th>
            {/* <th>ask_size</th> */}
            <th>bid_price</th>
            {/* <th>bid_size</th> */}
            <th>涨幅</th>
            <th>纯内在[溢折]</th>
            <th>s_iv</th>
            <th>b_iv</th>
            <th>delta</th>
            <th>gamma</th>
            <th>theta</th>
            <th>内在价值</th>
            <th>时间价值</th>
            <th>时间年化</th>
          </tr>
        </thead>
        <tbody>
          {chooseData.map((option, idx) => (
            <React.Fragment key={idx}>
              {option[0] ? (
                <>
                {/* 如果是 option[0].option_type = C 显示这行为淡绿色，否则淡红色 */}
                <tr className="table-row" >
                    <td>{option[0].symbol}</td>
                    <td>[s|{option[0].ask_price}]{(option[0].ask_price*paramData.price).toFixed(2)}</td>
                    {/* <td>{option[0].ask_size}</td> */}
                    <td>[b|{option[0].bid_price}]{(option[0].bid_price*paramData.price).toFixed(2)}</td>
                    {/* <td>{option[0].bid_size}</td> */}
                    <td style={{color: 'lightcoral'}}>{((parseFloat(option[0].strike) - parseFloat(paramData.price)) / parseFloat(paramData.price)).toFixed(2)}</td>
                    <td>{(paramData.price-(option[0].strike)).toFixed(2)}[{((option[0].bid_price*paramData.price)-(paramData.price-(option[0].strike))).toFixed(2)}]</td>
                    {option[1] ? (
                      <>
                        <td>{parseFloat(option[1].s_iv).toFixed(2)}</td>
                        <td>{parseFloat(option[1].b_iv).toFixed(2)}</td>
                        <td style={{color: 'red'}}>{parseFloat(option[1].delta).toFixed(4)}</td>
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
                  <td colSpan="13">No data</td>
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
