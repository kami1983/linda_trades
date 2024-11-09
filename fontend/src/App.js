import logo from './logo.svg';
import './App.css';
import LineChart from './components/LineChart';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';


// src/App.js
import React, { useEffect, useState } from 'react';


function App() {
    
    return (
      <div>
        <h3><a href='/ivhistory?symbol=eth&flag=c&offset=2'>IV History | symbol=eth&flag=c&offset=2</a></h3>
        <h3><a href='/ivhistory?symbol=eth&flag=c&offset=2'>IV History | symbol=eth&flag=p&offset=2</a></h3>
        <h3><a href='/ivhistory?symbol=eth&flag=c&offset=2'>IV History | symbol=eth&flag=c&offset=14</a></h3>
        <h3><a href='/ivhistory?symbol=eth&flag=c&offset=2'>IV History | symbol=eth&flag=p&offset=14</a></h3>
      </div>
    )
    // return (
    //     <div>
    //         <h1>Hello, Welcome to Linda's trade.</h1>
    //         <h3>Example link <a href='/?symbol=eth&flag=c&offset=2'>Example link</a></h3>
            
    //     </div>
    // );
}

export default App;
