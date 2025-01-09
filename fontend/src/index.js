import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import IVHistory from './Ivhistroy';
import AtmIV from './Atmiv';
import AtmPrice from './Atmprice';
import OptionList from './pages/optionlist/Optionlist';
import OptionExec from './Optionexec';
import PostionList from './Postionlist';
import Prepare from './pages/prepare/Prepare';
import {LoginStatusProvider} from './context/LoginStautsContext';
import Login from './components/Login';
import { PriceProvider } from './context/PriceContext';
import AccountInfo from './AccountInfo';
import { Layout, Card, Typography, Row, Col } from 'antd';
import Header from './components/Header';
const { Content, Footer } = Layout;
const { Title, Text } = Typography;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <LoginStatusProvider>
    <PriceProvider>
    <Layout style={{ minHeight: '100vh' }}>
    
      <Router> 
        <Header />
        <Routes>
          
            <Route path="*" element={<App />} />
            <Route path="/ivhistory" element={<IVHistory />} />
            <Route path="/atmprice" element={<AtmPrice />} />
            <Route path="/atmiv" element={<AtmIV />} />
            <Route path="/optionlist" element={<OptionList />} />
            <Route path='/optionexec' element={<OptionExec />} />
            <Route path="/postionlist" element={<PostionList />} />
            <Route path='/prepare' element={<Prepare />} />
            <Route path='/account' element={<AccountInfo />} />
            <Route path='/login' element={<Login />} />
          </Routes>
          <Footer style={{ textAlign: 'center' }}>
                Linda's Trading System ©2024
              </Footer>
      </Router>
  </Layout>
    </PriceProvider>
  </LoginStatusProvider>
  
);

reportWebVitals();
