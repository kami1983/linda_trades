import React, { useState } from 'react';

function Prepare() {
    const [basePrice, setBasePrice] = useState(100000);
    const [baseAmount, setBaseAmount] = useState(1);
    const [returnChange, setReturnChange] = useState('');
    const [postionDelta, setPostionDelta] = useState(0.5);
    const [strikePrice, setStrikePrice] = useState(100000);
    const [postionIv, setPostionIv] = useState(0.6);
    const [optionType, setOptionType] = useState('c');
    const [leftDays, setLeftDays] = useState(10);
    const [eventChange, setEventChange] = useState('');
    const [evaluationData, setEvaluationData] = useState([]);

    const [canToOpenPostion , setCanToOpenPostion] = useState(false);

    const [postionHistoryData, setPostionHistoryData] = useState([]);
    const [closePostionData, setClosePostionData] = useState([]);
    const [previewOptionData, setPreviewOptionData] = useState(
        {
            "ivData": {
                "ask_bid_diff": 0,
                "ask_premium": 0,
                "ask_price": 0,
                "ask_usd": 0,
                "b_iv": 0,
                "bid_premium": 0,
                "bid_price": 0,
                "bid_usd": 0,
                "current_price": 0,
                "current_time": 0,
                "day_left":0,
                "delta": 0,
                "excute_strike": 0,
                "execute_date": "0",
                "execute_flag": "?",
                "execute_time": "0",
                "gamma": 0,
                "infer_price": 0,
                "intrinsic_value": 0,
                "s_iv": 0,
                "symbol": "KAMI/USD:KAMI-241223-100000.0-C",
                "theta": 0,
                "time_value": 0
            },
            "order_price": 0,
            "token_amount": 0
        }
        
    );

    const apiHosts = process.env.REACT_APP_API_HOSTS

    const handleAddRow = () => {
        const newRow = {
            basePrice: '',
            expiryDate: '',
            delta: '',
            iv: '',
            totalValue: '',
            timeValue: ''
        };
        setEvaluationData([...evaluationData, newRow]);
    };

    const handleInputChange = (index, field, value) => {
        const updatedData = [...evaluationData];
        updatedData[index][field] = value;
        setEvaluationData(updatedData);
    };

    const fetchOptionInfos = () => {
        cacluateOptionPrice(basePrice, strikePrice, postionIv, leftDays, optionType).then((data) => {
            if(data.status){
                setPreviewOptionData(data.data);
                setCanToOpenPostion(true);
            }
        });
    }

    // const openPosition = () => {
    //     const _oldPostionList = postionHistoryData;
    //     let _lastData = null;
    //     if(_oldPostionList.length > 0){
    //         _lastData = _oldPostionList[_oldPostionList.length - 1];
    //     }
    //     // 0.2 0       0
    //     // 0.1 0.1     0.1
    //     // 0.3 -0.2    -0.1
    //     const postData = { ...previewOptionData, profitAmount: _lastData ? _lastData.token_amount-previewOptionData.token_amount+_lastData.profitAmount : 0 };
    //     _oldPostionList.push(postData);
    //     console.log(_oldPostionList);
    //     setPostionHistoryData(_oldPostionList)
    // }

    const openPosition = () => {
        let _lastData = null;
        if (postionHistoryData.length > 0) {
            _lastData = postionHistoryData[postionHistoryData.length - 1];
        }

        const _profitAmount = _lastData && _lastData.final === false
                ? _lastData.token_amount - previewOptionData.token_amount + _lastData.profitAmount
                : 0;
    
        console.log(`baseAmount: ${baseAmount}, profitAmount: ${_profitAmount}, basePrice: ${basePrice}`);
        const postData = {
            ...previewOptionData,
            current_price: basePrice,
            final: false,
            profitAmount: _profitAmount,
            balance: ((baseAmount+_profitAmount)*basePrice).toFixed(4),
        };
        setCanToOpenPostion(false);
        setPostionHistoryData([...postionHistoryData, postData]);
    };

    const closePosition = () => {
        let _lastData = null;
        if (postionHistoryData.length > 0) {
            _lastData = postionHistoryData[postionHistoryData.length - 1];
            _lastData.final = !_lastData.final;
            const _baseAmount = baseAmount;
            setBaseAmount(_baseAmount + _lastData.profitAmount);
            const _oldHistoryData = postionHistoryData;
            _oldHistoryData[_oldHistoryData.length - 1] = _lastData;
            setPostionHistoryData([..._oldHistoryData]);
        }
    }

    const revokePosition = () => {
        if (postionHistoryData.length > 0) {
            const _oldHistoryData = postionHistoryData;
            _oldHistoryData.pop();
            setPostionHistoryData([..._oldHistoryData]);
        }
    }
    

    /**
     * 
     * @param {*} full_symbol ETH/USD:ETH-241108-2650-C
     * @param {*} current_price 2600
     * @returns 
     */
    const cacluateOptionPrice = (base_price, strike_price, postion_iv, left_days, option_type) => {
      return new Promise((resolve, reject) => {
        fetch(`${apiHosts}/api/cacluate_options_price?price=${base_price}&strike=${strike_price}&iv=${postion_iv}&day_left=${left_days}&option_type=${option_type}`)
          .then(response => response.json())
          .then((data) => {
            if (data) {
              resolve(data);
            } else {
              reject('error');
            }
          }).catch((error) => {
            console.log(error);
          });
      });
    }

    const updateSetBasePrice = (value) => {
        if(value<=0 || isNaN(value)){
            return;
        }
        setBasePrice(value);
        // fetchOptionInfos();
    }

    const updateSetBaseAmount = (value) => {
        if(value<=0 || isNaN(value)){
            return;
        }
        setBaseAmount(value);
        // fetchOptionInfos();
    }

    const updateSetPostionIv = (value) => {
        if(value<=0 || isNaN(value)){
            return;
        }
        setPostionIv(value);
        // fetchOptionInfos();
    }

    const updateSetLeftDays = (value) => {
        if(value<=0 || isNaN(value)){
            return;
        }
        setLeftDays(value);
        // fetchOptionInfos();
    }

    const updateSetOptionType = (value) => {
        setOptionType(value);
        // fetchOptionInfos();
    }

    const updateSetStrikePrice = (value) => {
        if(value<=0 || isNaN(value)){
            return;
        }
        setStrikePrice(value);
        // fetchOptionInfos();
    }




    return (
        <div style={{ color: 'black', fontSize: '18px' }}>
            <div>
                
                <label>基础资产数量</label>
                <input 
                    type="text" 
                    value={baseAmount} 
                    onChange={(e) => updateSetBaseAmount(e.target.value)} 
                    style={{ margin: '10px' }}
                />
                <label>【{(baseAmount*basePrice).toFixed(2)}$】</label>

                <label>Iv常数</label>
                <input 
                    type="text" 
                    value={postionIv} 
                    onChange={(e) => updateSetPostionIv(e.target.value)} 
                    style={{ margin: '10px' }}
                />
                
                <label>到期日</label>
                <input 
                    type="number"
                    value={leftDays} 
                    onChange={(e) => updateSetLeftDays(e.target.value)} 
                    style={{ margin: '10px' }}
                />
                <label>Option type</label>
                <input 
                    value={optionType} 
                    onChange={(e)=>updateSetOptionType(e.target.value)}
                    style={{ margin: '10px' }}
                />
                
                <select value={optionType} onChange={(e)=>updateSetOptionType(e.target.value)}>
                    <option value="c">Call</option>
                    <option value="p">Put</option>
                </select>
            </div>
            <div>
              
              <label>基础资产价格</label>
                <input 
                    type="text" 
                    value={basePrice} 
                    onChange={(e) => updateSetBasePrice(e.target.value)} 
                    style={{ margin: '10px' }}
                />
              <label>Strike:</label>
              <input type="text" value={strikePrice} style={{ margin: '10px' }} onChange={(e)=>updateSetStrikePrice(e.target.value)} />
              
              
            </div>
            <div>
                <span style={{ margin: '10px' }}>[80000]</span>
                <span style={{ margin: '10px' }}>[82500]</span>
                <span style={{ margin: '10px' }}>[85000]</span>
                <span style={{ margin: '10px' }}>[87500]</span>
                <span style={{ margin: '10px' }}>[90000]</span>
                <span style={{ margin: '10px' }}>[92500]</span>
                <span style={{ margin: '10px' }}>[95000]</span>
                <span style={{ margin: '10px' }}>[97500]</span>
                <span style={{ margin: '10px' }}>[100000]</span>
                <span style={{ margin: '10px' }}>[102500]</span>
                <span style={{ margin: '10px' }}>[105000]</span>
            </div>
            <div>
                <h3>预览期权信息：</h3>
                <ul>
                    <li><b>symbol:</b> {previewOptionData.ivData.symbol}</li>
                    <li><b>bid_price:</b> {parseFloat(previewOptionData.ivData.bid_price).toFixed(4)}</li>
                    <li><b>bid_usd:</b> {parseFloat(previewOptionData.ivData.bid_usd).toFixed(2)}</li>
                    <li><b>ask_price:</b> {parseFloat(previewOptionData.ivData.ask_price).toFixed(4)}</li>
                    <li><b>ask_usd:</b> {parseFloat(previewOptionData.ivData.ask_usd).toFixed(2)}</li>
                    <li><b>delta:</b> {parseFloat(previewOptionData.ivData.delta).toFixed(2)}</li>
                    <li><b>gamma:</b> {parseFloat(previewOptionData.ivData.gamma).toFixed(2)}</li>
                    <li><b>theta:</b> {parseFloat(previewOptionData.ivData.theta).toFixed(2)}</li>
                    <li><b>execute_flag:</b> {previewOptionData.ivData.execute_flag}</li>
                    <li><b>intrinsic_value:</b> {parseFloat(previewOptionData.ivData.intrinsic_value).toFixed(2)}</li>
                    <li><b>time_value:</b> {parseFloat(previewOptionData.ivData.time_value).toFixed(2)}</li>
                </ul>
            </div>
            <div>
                <button onClick={()=>fetchOptionInfos()} style={{ margin: '10px' }}>获取期权信息</button>
                {canToOpenPostion ? <button onClick={()=>openPosition()} style={{ margin: '10px' }}>开仓</button> : ''}
            </div>
            <div>
                <h3>持仓历史：</h3>
                <table border={1}>
                    <tr>
                        <th>price</th>
                        <th>day_left</th>
                        <th>delta</th>
                        <th>strike</th>
                        <th>token_amount</th>
                        <th>intrinsic_value</th>
                        <th>time_value</th>
                        <th>order_price</th>
                        <th>profitAmount</th>
                        <th>is final</th>
                        <th>balance</th>
                        <th>Option</th>
                    </tr>
                    {postionHistoryData.map((item, index) => (
                        <React.Fragment key={index}>
                        <tr key={index}>
                            <td>{item.current_price}</td>
                            <td>{parseFloat(item.ivData.day_left).toFixed(2)}</td>
                            <td>{parseFloat(item.ivData.delta).toFixed(2)}</td>
                            <td>{item.ivData.excute_strike}</td>
                            <td>{parseFloat(item.token_amount).toFixed(4)}</td>
                            <td>{parseFloat(item.ivData.intrinsic_value).toFixed(2)}</td>
                            <td>{parseFloat(item.ivData.time_value).toFixed(2)}</td>
                            <td>{parseFloat(item.order_price).toFixed(2)}</td>
                            <td>{parseFloat(item.profitAmount).toFixed(6)}</td>
                            <td>{item.final ? 'Yes' : 'Not'}</td>
                            <td>{item.balance}</td>
                            <td>
                                <button onClick={()=>closePosition()}>止盈</button>
                                <button onClick={()=>revokePosition()}>撤销</button>
                            </td>
                        </tr>
                        </React.Fragment>
                    ))}
                </table>
            </div>
            <div>
                <button onClick={()=>setPostionHistoryData([])}>清除旧数据</button>
            </div>
        </div>
    );
}

export default Prepare;
