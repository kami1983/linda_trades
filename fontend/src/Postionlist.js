import React, { useEffect, useState } from 'react';
import { Layout, Card, Typography, Space, Row, Col } from 'antd';
import { GetPostionSize, GetCoinSign } from './utils/Utils';
import { usePrices } from './context/PriceContext';
import { useLoginStatus } from './context/LoginStautsContext';
import OptionTables from './components/OptionTables';
import CreatePostions from './components/CreatePostions';
import PostionCells from './components/PostionCells';
import OpenOrders from './components/OpenOrders';
import {handlerToCreatePosition} from '../src/utils/OptionApis';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

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
      <Layout style={{ padding: '24px' }}>
        <Content>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title="Market Prices">
                <Space direction="vertical">
                  {coinPrices.map((coinPrice, idx) => (
                    coinPrice.status && (
                      <Text key={idx}>
                        {coinPrice.data.symbol}:{' '}
                        <Text strong>{coinPrice.data.price}</Text>
                      </Text>
                    )
                  ))}
                </Space>
              </Card>
            </Col>

            <Col span={24}>
              <Card title="Market Indicators">
                <Space>
                  <a href="https://www.binance.com/zh-CN/square/fear-and-greed-index" target="_blank" rel="noreferrer">
                    Coin Fear and Greed Index
                  </a>
                  <a href="https://edition.cnn.com/markets/fear-and-greed?utm_source=hp" target="_blank" rel="noreferrer">
                    CNN Fear and Greed Index
                  </a>
                </Space>
                {clipboardText && (
                  <Text style={{ display: 'block', marginTop: 16 }}>
                    Clipboard: {clipboardText}
                  </Text>
                )}
              </Card>
            </Col>

            <Col span={24}>
              <Card title="Option Tables">
                <OptionTables onSymbolClick={handleCopyToClipboard} />
              </Card>
            </Col>

            <Col span={24}>
              <Card title="Create Position">
                <CreatePostions 
                  createNewPostionCallBack={refreshAllData} 
                  createAllNewPostionCallBack={refreshAllData} 
                />
              </Card>
            </Col>

            <Col span={24}>
              <Card title="Position List">
                <PostionCells 
                  closePostionDone={refreshAllData} 
                  movePostionDone={refreshAllData} 
                  closeAllPostionDone={refreshAllData} 
                  refreshListKey={refreshPostionListKey} 
                  onSymbolClick={handleCopyToClipboard} 
                />
              </Card>
            </Col>

            <Col span={24}>
              <Card title="Open Orders">
                <OpenOrders 
                  onSymbolClick={handleCopyToClipboard} 
                  modifyOrderDone={refreshAllData} 
                  cancelOrderDone={refreshAllData} 
                  refreshListKey={refreshOrderListKey} 
                />
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    );
}

export default PostionList;
