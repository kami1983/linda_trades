import logo from './logo.svg';
import './App.css';
import LineChart from './components/LineChart';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { usePrices } from './context/PriceContext';
import { useLoginStatus } from './context/LoginStautsContext';
import Login from './components/Login';

// src/App.js
import React, { useEffect, useState } from 'react';


function App() {

    const coinPrices = usePrices();
    
    return (
      <>
      <div>
        <h1>Login user</h1>
        <Login/>
      </div>
      <div>
            <h1>Prices</h1>
            {coinPrices.map((coinPrice, idx) => (
                <div key={idx}>
                    {coinPrice.status ? (
                        <h3>
                            {coinPrice.data.symbol}:{' '}
                            <a
                                href={`/atmiv?symbol=${coinPrice.data.symbol}&price=${coinPrice.data.price}&rate=0`}
                            >
                                {coinPrice.data.price}
                            </a>
                        </h3>
                    ) : null}
                </div>
            ))}
        </div>
      <div>
        <h2>IV History</h2>
        <h3><a href='/ivhistory?symbol=eth&flag=c&offset=2'>IV History | symbol=eth&flag=c&offset=2</a></h3>
        <h3><a href='/ivhistory?symbol=eth&flag=p&offset=2'>IV History | symbol=eth&flag=p&offset=2</a></h3>
        <h3><a href='/ivhistory?symbol=eth&flag=c&offset=14'>IV History | symbol=eth&flag=c&offset=14</a></h3>
        <h3><a href='/ivhistory?symbol=eth&flag=p&offset=14'>IV History | symbol=eth&flag=p&offset=14</a></h3>
      </div>
      {/* <div>
        <h2>Atm IV</h2>
        <h3><a href='/atmPrice'>Atm Price</a></h3>
        <h3><a href='/atmiv'>Atm IV</a></h3>
      </div> */}
      <div>
        <h2>Options execute</h2>
        <h3><a href='/postionlist'>Postion List</a></h3>
        <h3><a href='/prepare'>Prepare</a></h3>
      </div>

      </>
    )
}

export default App;
