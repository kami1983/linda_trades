
// REACT_APP_POSTION_STEP_KEYS='BTC','ETH'
// REACT_APP_POSTION_STEP_VALUES=0.01,0.01
const GetPostionSize = (symbol) => {
  const keys = process.env.REACT_APP_POSTION_STEP_KEYS;
  const values = process.env.REACT_APP_POSTION_STEP_VALUES;
  const keyArr = keys.toString().split(',');
  const valueArr = values.toString().split(',');
  const idx = keyArr.indexOf(symbol.toString().toUpperCase());
  if(idx === -1){
    return 0.01;
  }
  return parseFloat(valueArr[idx]);
}

// "BTC/USD:BTC-241129-100000-C"
const GetCoinSign = (symbol) => {
  const symbolArr = symbol.split('/');
  return symbolArr[0].toUpperCase();
}

export { GetPostionSize, GetCoinSign };