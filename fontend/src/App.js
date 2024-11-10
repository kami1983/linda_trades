import logo from './logo.svg';
import './App.css';
import LineChart from './components/LineChart';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';


// src/App.js
import React, { useEffect, useState } from 'react';


function App() {
    return (
      <>
      <div>
        <h2>IV History</h2>
        <h3><a href='/ivhistory?symbol=eth&flag=c&offset=2'>IV History | symbol=eth&flag=c&offset=2</a></h3>
        <h3><a href='/ivhistory?symbol=eth&flag=p&offset=2'>IV History | symbol=eth&flag=p&offset=2</a></h3>
        <h3><a href='/ivhistory?symbol=eth&flag=c&offset=14'>IV History | symbol=eth&flag=c&offset=14</a></h3>
        <h3><a href='/ivhistory?symbol=eth&flag=p&offset=14'>IV History | symbol=eth&flag=p&offset=14</a></h3>
      </div>
      <div>
        <h2>Atm IV</h2>
        <h3><a href='/atmPrice'>Atm Price</a></h3>
        <h3><a href='/atmiv'>Atm IV</a></h3>
      </div>

      </>
    )
}

export default App;
