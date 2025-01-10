const apiHost = process.env.REACT_APP_API_HOSTS;

const getTOptionChain = (symbol, current_price) => {
  return new Promise((resolve, reject) => {
    fetch(`${apiHost}/api/t_option_chain?symbol=${symbol}&price=${current_price}`)
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

/**
  * 
  * @param {*} full_symbol ETH/USD:ETH-241108-2650-C
  * @param {*} current_price 2600
  * @returns 
  */
const extractIVData = (full_symbol, current_price) => {
  return new Promise((resolve, reject) => {
    console.log('extractIVData: call params: ', full_symbol, current_price);
    fetch(`${apiHost}/api/extract_iv_data?symbol=${full_symbol}&current_price=${current_price}`)
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

/**
 * @param symbol = 'BTC/USD:BTC-241213-98000-C'
 * @param amount = int(1)
 * @param price = 0
 * @param type = 'limit'|'market'
 * @param side = 'buy'|'sell'
 * @returns
 */
const handlerToCreatePosition = (symbol, amount, price, type, side) => {
  return new Promise((resolve, reject) => {
    // /api/change_order_price
    fetch(`${apiHost}/api/create_position?symbol=${symbol}&amount=${amount}&price=${price}&type=${type}&side=${side}`, {
      method: "GET",
      credentials: "include"
    }).then(response => {
      if (response.status === 401) {
        alert('Please login first');
        reject('Unauthorized');
        return;
      }
      return response.json();  // 继续处理其他响应
    }).then(data => {
      if (data) {
        resolve(data); // 处理成功
      } else {
        reject('Error: No data returned');
      }
    }).catch(error => {
      console.error('Error during fetch:', error);
      reject(error);
    });
  });
}

  
const callPostionList = () => {
  return new Promise((resolve, reject) => {
    fetch(`${apiHost}/api/postion_orders`)
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

// 取消订单
const operToCancel = (orderid, symbol, backCall) => {
  // eslint-disable-next-line no-restricted-globals
  const beSure = confirm(`Are you sure to cancel? ${symbol} ${orderid}`);
  if (beSure) {
    // 调用 /api/cancel_order，返回一个 Promise
    return new Promise((resolve, reject) => {
      fetch(`${apiHost}/api/cancel_order?orderid=${orderid}&symbol=${symbol}`, {
        method: "GET",
        credentials: "include"
      })
        .then(response => {
          if (response.status === 401) {
            // 如果返回401，提示需要登录
            alert('Please login first');
            reject('Unauthorized');
            return;
          }
          return response.json();  // 继续处理其他响应
        })
        .then(data => {
          if (data) {
            backCall(); // 取消订单后回调
            resolve(data); // 处理成功
          } else {
            reject('Error: No data returned');
          }
        })
        .catch(error => {
          // 捕获任何其他错误
          console.error('Error during fetch:', error);
          reject(error);
        });
    });
  }
};

/**
     * @param side OrderSide = Literal['buy', 'sell']
     * @param type OrderType = Literal['limit', 'market']
     *             PositionSide = Literal['long', 'short']
     */
const handlerEditOrder = (orderid, symbol, price, type, side) => {
  return new Promise((resolve, reject) => {
    // /api/change_order_price
    fetch(`${apiHost}/api/change_order_price?orderid=${orderid}&symbol=${symbol}&price=${price}&type${type}&side=${side}`, {
      method: "GET",
      credentials: "include"
    }).then(response => {
      if (response.status === 401) {
        // 如果返回401，提示需要登录
        alert('Please login first');
        reject('Unauthorized');
        return;
      }
      return response.json();  // 继续处理其他响应
    }).then(data => {
      if (data) {
        resolve(data); // 处理成功
      } else {
        reject('Error: No data returned');
      }
    }).catch(error => {
      // 捕获任何其他错误
      console.error('Error during fetch:', error);
      reject(error);
    });
  });
}

const callOpenOrders = () => {
  return new Promise((resolve, reject) => {
    fetch(`${apiHost}/api/open_orders`)
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

const getRecordedOrderList = () => {
  return new Promise((resolve, reject) => {
    fetch(`${apiHost}/api/get_recorded_order_list`, {
      method: "GET",
      credentials: "include"
    })
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

const getAccountBalance = () => {
  return new Promise((resolve, reject) => {
    fetch(`${apiHost}/api/account_balance`, {
      method: "GET", 
      credentials: "include"
    })
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

const refillOrders = () => {
  // // Call /api/get_trade_orders_history to refill orders
  // const res = await fetch('/api/get_trade_orders_history');
  // const data = await res.json();

  return new Promise((resolve, reject) => {
    fetch(`${apiHost}/api/sync_order_to_db`, {
      method: "GET",
      credentials: "include"
    })
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

export { 
  getTOptionChain, 
  extractIVData, 
  handlerToCreatePosition, 
  callPostionList, 
  operToCancel, 
  handlerEditOrder, 
  callOpenOrders,
  getRecordedOrderList,
  getAccountBalance,
  refillOrders
};
