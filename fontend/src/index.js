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
import OptionExec from './Optionexec';
import PostionList from './Postionlist';
import Prepare from './Prepare';
import {LoginStatusProvider} from './context/LoginStautsContext';
import { PriceProvider } from './context/PriceContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <LoginStatusProvider>
    <PriceProvider>
      <Router> 
        <Routes>
            <Route path="*" element={<App />} />
            <Route path="/ivhistory" element={<IVHistory />} />
            <Route path="/atmprice" element={<AtmPrice />} />
            <Route path="/atmiv" element={<AtmIV />} />
            <Route path="/optionlist" element={<OptionList />} />
            <Route path='/optionexec' element={<OptionExec />} />
            <Route path="/postionlist" element={<PostionList />} />
            <Route path='/prepare' element={<Prepare />} />
          </Routes>
      </Router>
    </PriceProvider>
  </LoginStatusProvider>
);

reportWebVitals();
