// src/App.js
import React, { useEffect, useState } from 'react';
import { GetPostionSize, GetCoinSign } from './utils/Utils';
import { usePrices } from './context/PriceContext';
import Login from './components/Login';
import { useLoginStatus } from './context/LoginStautsContext';
import OptionTables from './components/OptionTables';
import CreatePostions from './components/CreatePostions';
import PostionCells from './components/PostionCells';
import OpenOrders from './components/OpenOrders';
import {handlerToCreatePosition} from '../src/utils/OptionApis';

function PostionList() {
    const [refreshPostionListKey, setRefreshPostionListKey] = useState(0);
    const [refreshOrderListKey, setRefreshOrderListKey] = useState(0);
    const [clipboardText, setClipboardText] = useState('');
    const coinPrices = usePrices();
    const isSandBox = process.env.OKEX_IS_SANDBOX == 1 ? false : true;
     
    const { isLoggedIn } = useLoginStatus();

    useEffect(() => {
      refreshAllData();
    }, []); 

    const refreshAllData = () => {
      setRefreshPostionListKey(refreshPostionListKey + 1);
      setRefreshOrderListKey(refreshOrderListKey + 1);
    }

    function handleCopyToClipboard(text) {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text)
              .then(() => {
                  setClipboardText(text);
              })
              .catch(err => {
                  setClipboardText(`Failed to copy text to clipboard: [${text}]`);
              });
      } else {
          setClipboardText(`Clipboard API is not supported or unavailable: [${text}]`);
      }
    }

    return (
      <div>
        <h1> 
          【{isLoggedIn ? "✅️" : "❌"}】
          Login {isSandBox ? 'Sandbox' : 'Real'} Account
        </h1>
        <Login/>
      <h1>Prices</h1>
      {coinPrices.map((coinPrice, idx) => (
          <div key={idx}>
              {coinPrice.status ? (
                  <h3>
                      {coinPrice.data.symbol}:{' '}
                      {coinPrice.data.price}
                  </h3>
              ) : null}
          </div>
      ))}

      <h1>Clipboard Text</h1>
      <div>
        <a href="https://www.binance.com/zh-CN/square/fear-and-greed-index" target="_blank" rel="noreferrer">Coin Fear and Greed Index</a>
        <a href="https://edition.cnn.com/markets/fear-and-greed?utm_source=hp" target="_blank" rel="noreferrer">CNN Fear and Greed Index</a>
      </div>
      <div>
        {clipboardText}
      </div>

      <h1>Option tables</h1>
      <OptionTables  onSymbolClick={handleCopyToClipboard}  />
    
      <h1>Create Postion</h1>
      <CreatePostions createNewPostionCallBack={refreshAllData} createAllNewPostionCallBack={refreshAllData} />

      <h1>Postion List</h1>
      <PostionCells closePostionDone={refreshAllData} movePostionDone={refreshAllData} closeAllPostionDone={refreshAllData} refreshListKey={refreshPostionListKey} onSymbolClick={handleCopyToClipboard} />
      
      <h1>Open Orders</h1>
      <OpenOrders onSymbolClick={handleCopyToClipboard} modifyOrderDone={refreshAllData} cancelOrderDone={refreshAllData} refreshListKey={refreshOrderListKey} />
      </div>
    );
}

export default PostionList;
