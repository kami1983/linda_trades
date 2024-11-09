import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import IVHistory from './Ivhistroy';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Router> 
    <Routes>
        <Route path="/ivhistory" element={<IVHistory />} />
      </Routes>
    <App />
  </Router>
);

reportWebVitals();
