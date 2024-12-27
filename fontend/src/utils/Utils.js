

/**
 * @param symbol 'BTC'
 * @returns 0.01
 * // REACT_APP_POSTION_STEP_KEYS='BTC','ETH'
 * // REACT_APP_POSTION_STEP_VALUES=0.01,0.01
 */
const GetPostionSize = (symbol) => {
  const keys = process.env.REACT_APP_POSTION_STEP_KEYS;
  const values = process.env.REACT_APP_POSTION_STEP_VALUES;
  const keyArr = keys.toString().split(',');
  const valueArr = values.toString().split(',');
  const idx = keyArr.indexOf(symbol.toString().toUpperCase());
  console.log(`symbol: ${symbol} idx: ${idx} keys: ${keys} values: ${values}`);
  if(idx === -1){
    return 0.01;
  }
  return parseFloat(valueArr[idx]);
}

/**
 * @param symbol 'BTC/USD:BTC-241129-100000-C'
 * @returns 'BTC'
 */
const GetCoinSign = (symbol) => {
  if(symbol){
    const symbolArr = symbol.split('/');
    return symbolArr[0].toUpperCase();
  }
  return ''
}

/**
 * @param data {symbol: 'BTC/USD:BTC-241129-100000-C', infer_price: 10000}
 */
const handleShowInferInfo = (data, coinPrices) => {
  const current_price = extractPrice(GetCoinSign(data.symbol), coinPrices);
  const infer_diff = (parseFloat(data.infer_price) - current_price ).toFixed(2)
  const infer_sign = infer_diff<0 ? '🔴':'🟢'
  const infer_diff_rate = (infer_diff/current_price*100).toFixed(2);
  return `${infer_sign} ${infer_diff}[${infer_diff_rate}%]`;
}


/**
 * @param symbol 'BTC/USD:BTC-241129-100000-C'
 * @param coinPrices [{symbol: 'BTC', price: 90000}, {symbol: 'ETH', price: 3000}]
 * @returns 10000
 */
const extractPrice =(symbol, coinPrices)=>{
  if(coinPrices)
  for(let i=0; i<coinPrices.length; i++){
    if(coinPrices[i].data.symbol === symbol){
      return coinPrices[i].data.price;
    }
  }
  return null;
}

export { GetPostionSize, GetCoinSign, extractPrice, handleShowInferInfo};