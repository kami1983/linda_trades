import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import IVHistory from './Ivhistroy';
import AtmIV from './Atmiv';
import AtmPrice from './Atmprice';
import OptionList from './Optionlist';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Router> 
    <Routes>
        <Route path="*" element={<App />} />
        <Route path="/ivhistory" element={<IVHistory />} />
        <Route path="/atmprice" element={<AtmPrice />} />
        <Route path="/atmiv" element={<AtmIV />} />
        <Route path="/optionlist" element={<OptionList />} />
      </Routes>
  </Router>
);

reportWebVitals();
