import './App.css';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { usePrices } from './context/PriceContext';
import Login from './components/Login';
import React from 'react';
import { Layout, Menu, Card, Typography, Row, Col } from 'antd';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

function App() {
    const coinPrices = usePrices();
    
    return (
        
        <Content style={{ padding: '24px' }}>
          <Row gutter={[16, 16]}>
            
            <Col span={24}>
              <Card title="Prices">
                {coinPrices.map((coinPrice, idx) => (
                  coinPrice.status && (
                    <Text key={idx} style={{ display: 'block', margin: '8px 0' }}>
                      {coinPrice.data.symbol}:{' '}
                      <Link to={`/atmiv?symbol=${coinPrice.data.symbol}&price=${coinPrice.data.price}&rate=0`}>
                        {coinPrice.data.price}
                      </Link>
                    </Text>
                  )
                ))}
              </Card>
            </Col>
            
            <Col span={24}>
              <Card title="IV History">
                <Row gutter={[16, 16]}>
                  <Col>
                    <Link to='/ivhistory?symbol=eth&flag=c&offset=2'>ETH Call 2D</Link>
                  </Col>
                  <Col>
                    <Link to='/ivhistory?symbol=eth&flag=p&offset=2'>ETH Put 2D</Link>
                  </Col>
                  <Col>
                    <Link to='/ivhistory?symbol=eth&flag=c&offset=14'>ETH Call 14D</Link>
                  </Col>
                  <Col>
                    <Link to='/ivhistory?symbol=eth&flag=p&offset=14'>ETH Put 14D</Link>
                  </Col>
                </Row>
              </Card>
            </Col>
            
            <Col span={24}>
              <Card title="Options Execute">
                <Row gutter={[16, 16]}>
                  <Col>
                    <Link to='/postionlist'>Position List</Link>
                  </Col>
                  <Col>
                    <Link to='/prepare'>Prepare</Link>
                  </Col>
                  <Col>
                    <Link to='/account'>Account Info</Link>
                  </Col>
                  <Col>
                    <Link to='/lighter/account'>Lighter Account</Link>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Content>
    )
}

export default App;
