import React, { useState, useEffect } from "react";
import { getTOptionChain } from "../utils/OptionApis";
import { extractPrice, GetCoinSign, handleShowInferInfo } from "../utils/Utils";
import { usePrices } from '../context/PriceContext';



function OptionTables({ onSymbolClick }) {
    
    const [optionChainList, setOptionChainList] = useState([]);
    const [buttonGetBtcOptionSign, setButtonGetBtcOptionSign] = useState('🟩');
    const [buttonGetEthOptionSign, setButtonGetEthOptionSign] = useState('🟩');
    const [optionChainRange, setOptionChainRange] = useState([0.4, 0.6]);

    const coinPrices = usePrices();

    const refreshOptionTable = (symbol) => {
        const current_price = extractPrice(symbol, coinPrices);
        if(symbol === 'BTC'){
          setButtonGetBtcOptionSign('🔻');
        }else if(symbol === 'ETH'){
          setButtonGetEthOptionSign('🔻')
        };
        getTOptionChain(symbol, current_price).then((res) => {
          if(res.status){
            // 过滤，仅仅选择 ATM 上下的期权
            const _optionChainList = res.data;
            const _optionChainListFiltered = [];
            for(let i=0; i<_optionChainList.length; i++){
              if(_optionChainList[i][1] && Math.abs(_optionChainList[i][1].delta) > optionChainRange[0] && Math.abs(_optionChainList[i][1].delta) < optionChainRange[1]){
                _optionChainListFiltered.push(_optionChainList[i]);
              }
            }
  
            // 按照 day_left 排序
            _optionChainListFiltered.sort((a, b) => {
              return a[1].day_left - b[1].day_left;
            });
  
            setOptionChainList(_optionChainListFiltered);
            if(symbol === 'BTC'){
              setButtonGetBtcOptionSign('🟩');
            }else if(symbol === 'ETH'){
              setButtonGetEthOptionSign('🟩');
            }
          }
        });
      }
    

    useEffect(() => {
    }, []);


    return (
        <>
        <div>
            <label>Option Chain Range:</label>
            <input type="number" step={0.1} placeholder="0.4" value={optionChainRange[0]} onChange={(e)=>setOptionChainRange([parseFloat(e.target.value), optionChainRange[1]])} />
            <input type="number" step={0.1} placeholder="0.6" value={optionChainRange[1]} onChange={(e)=>setOptionChainRange([optionChainRange[0], parseFloat(e.target.value)])} />
        </div>
        <table border={1}>
        <thead>
          <tr>
            <th>symbol</th>
            <th>delta</th>
            <th>infer_price</th>
            <th>leftDays</th>
            <th>ask_price</th>
            <th>S IV</th>
            <th>bid_price</th>
            <th>B IV</th>
            <th>intrinsic_value</th>
            <th>time_value</th>
            <th>Yield rate</th>
          </tr>
        </thead>
        <tbody>
          {optionChainList.map((option, idx) => (
            <React.Fragment key={idx}>
              <tr>
                <td
                onClick={() => onSymbolClick(option[0] ? option[0].symbol : 'N/A')} 
                style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                title="Click to copy"
                >{option[0] ? option[0].symbol : 'N/A'}</td>
                <td>{option[1] ? parseFloat(option[1].delta).toFixed(2) : 'N/A'}</td>
                <td>
                  {option[1] ? parseFloat(option[1].infer_price).toFixed(2) : 'N/A'}
                  {option[1] ? <>
                    [
                    {handleShowInferInfo(option[1], coinPrices)}
                    ]
                  </>: ''}
                </td>
                <td>
                  {option[1] ? parseFloat(option[1].day_left).toFixed(2) : 'N/A'}
                </td>
                <td><span style={{color: 'RED'}}>{option[1] ? option[1].ask_price : 'N/A'}</span> [{option[1] ? option[1].ask_usd.toFixed(2): 'N/A'}$]</td>
                <td>{option[1] ? parseFloat(option[1].s_iv).toFixed(2) : 'N/A'}</td>
                <td><span style={{color: 'BLUE'}}>{option[1] ? option[1].bid_price : 'N/A'}</span> [{option[1] ? option[1].bid_usd.toFixed(2): 'N/A'}$]</td>
                <td>{option[1] ? parseFloat(option[1].b_iv).toFixed(2) : 'N/A'}</td>
                <td>{option[1] ? parseFloat(option[1].intrinsic_value).toFixed(4) : 'N/A'}</td>
                <td>{option[1] ? parseFloat(option[1].time_value).toFixed(4) : 'N/A'}</td>
                <td>{option[1] ? parseFloat(option[1].time_value/extractPrice(GetCoinSign(option[0].symbol), coinPrices)/parseFloat(option[1].day_left)*365*100).toFixed(2) : 'N/A'} %</td>
              </tr>
            </React.Fragment>
          ))}
            </tbody>
        </table>
      
        {coinPrices && coinPrices[0] && coinPrices[0].status? <>
            <div>
            <button onClick={()=>refreshOptionTable('BTC')}>
            Refresh BTC Option Table {buttonGetBtcOptionSign}
            </button>
            </div>
            <div>
            <button onClick={()=>refreshOptionTable('ETH')}>
            Refresh ETH Option Table {buttonGetEthOptionSign}
            </button>
            </div>
            </>:"Waiting for prices..."}
        </>
    );
}

export default OptionTables;
