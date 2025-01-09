import React, { useState } from 'react';
import { 
  Layout, 
  Form, 
  Input, 
  Select, 
  Button, 
  Table, 
  Card, 
  Typography,
  Space,
  Row,
  Col
} from 'antd';
import './Prepare.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

function Prepare() {
    const [basePrice, setBasePrice] = useState(100000);
    const [baseAmount, setBaseAmount] = useState(1);
    const [returnChange, setReturnChange] = useState('');
    const [postionDelta, setPostionDelta] = useState(0.5);
    const [strikePrice, setStrikePrice] = useState(100000);
    const [postionIv, setPostionIv] = useState(0.6);
    const [optionType, setOptionType] = useState('c');
    const [leftDays, setLeftDays] = useState(10);
    const [eventChange, setEventChange] = useState('');
    const [evaluationData, setEvaluationData] = useState([]);

    const [canToOpenPostion , setCanToOpenPostion] = useState(false);

    const [postionHistoryData, setPostionHistoryData] = useState([]);
    const [closePostionData, setClosePostionData] = useState([]);
    const [previewOptionData, setPreviewOptionData] = useState(
        {
            "ivData": {
                "ask_bid_diff": 0,
                "ask_premium": 0,
                "ask_price": 0,
                "ask_usd": 0,
                "b_iv": 0,
                "bid_premium": 0,
                "bid_price": 0,
                "bid_usd": 0,
                "current_price": 0,
                "current_time": 0,
                "day_left":0,
                "delta": 0,
                "excute_strike": 0,
                "execute_date": "0",
                "execute_flag": "?",
                "execute_time": "0",
                "gamma": 0,
                "infer_price": 0,
                "intrinsic_value": 0,
                "s_iv": 0,
                "symbol": "KAMI/USD:KAMI-241223-100000.0-C",
                "theta": 0,
                "time_value": 0
            },
            "order_price": 0,
            "token_amount": 0
        }
        
    );

    const apiHosts = process.env.REACT_APP_API_HOSTS

    const handleAddRow = () => {
        const newRow = {
            basePrice: '',
            expiryDate: '',
            delta: '',
            iv: '',
            totalValue: '',
            timeValue: ''
        };
        setEvaluationData([...evaluationData, newRow]);
    };

    const handleInputChange = (index, field, value) => {
        const updatedData = [...evaluationData];
        updatedData[index][field] = value;
        setEvaluationData(updatedData);
    };

    const fetchOptionInfos = () => {
        cacluateOptionPrice(basePrice, strikePrice, postionIv, leftDays, optionType).then((data) => {
            if(data.status){
                setPreviewOptionData(data.data);
                setCanToOpenPostion(true);
            }
        });
    }

    // const openPosition = () => {
    //     const _oldPostionList = postionHistoryData;
    //     let _lastData = null;
    //     if(_oldPostionList.length > 0){
    //         _lastData = _oldPostionList[_oldPostionList.length - 1];
    //     }
    //     // 0.2 0       0
    //     // 0.1 0.1     0.1
    //     // 0.3 -0.2    -0.1
    //     const postData = { ...previewOptionData, profitAmount: _lastData ? _lastData.token_amount-previewOptionData.token_amount+_lastData.profitAmount : 0 };
    //     _oldPostionList.push(postData);
    //     console.log(_oldPostionList);
    //     setPostionHistoryData(_oldPostionList)
    // }

    const openPosition = () => {
        let _lastData = null;
        if (postionHistoryData.length > 0) {
            _lastData = postionHistoryData[postionHistoryData.length - 1];
        }

        const _profitAmount = _lastData && _lastData.final === false
                ? _lastData.token_amount - previewOptionData.token_amount + _lastData.profitAmount
                : 0;
    
        console.log(`baseAmount: ${baseAmount}, profitAmount: ${_profitAmount}, basePrice: ${basePrice}`);
        const postData = {
            ...previewOptionData,
            current_price: basePrice,
            final: false,
            profitAmount: _profitAmount,
            balance: ((baseAmount+_profitAmount)*basePrice).toFixed(4),
        };
        setCanToOpenPostion(false);
        setPostionHistoryData([...postionHistoryData, postData]);
    };

    const closePosition = () => {
        let _lastData = null;
        if (postionHistoryData.length > 0) {
            _lastData = postionHistoryData[postionHistoryData.length - 1];
            _lastData.final = !_lastData.final;
            const _baseAmount = baseAmount;
            setBaseAmount(_baseAmount + _lastData.profitAmount);
            const _oldHistoryData = postionHistoryData;
            _oldHistoryData[_oldHistoryData.length - 1] = _lastData;
            setPostionHistoryData([..._oldHistoryData]);
        }
    }

    const revokePosition = () => {
        if (postionHistoryData.length > 0) {
            const _oldHistoryData = postionHistoryData;
            _oldHistoryData.pop();
            setPostionHistoryData([..._oldHistoryData]);
        }
    }
    

    /**
     * 
     * @param {*} full_symbol ETH/USD:ETH-241108-2650-C
     * @param {*} current_price 2600
     * @returns 
     */
    const cacluateOptionPrice = (base_price, strike_price, postion_iv, left_days, option_type) => {
      return new Promise((resolve, reject) => {
        fetch(`${apiHosts}/api/cacluate_options_price?price=${base_price}&strike=${strike_price}&iv=${postion_iv}&day_left=${left_days}&option_type=${option_type}`)
          .then(response => response.json())
          .then((data) => {
            if (data) {
              resolve(data);
            } else {
              reject('error');
            }
          }).catch((error) => {
            console.log(error);
          });
      });
    }

    const updateSetBasePrice = (value) => {
        if(value<=0 || isNaN(value)){
            return;
        }
        setBasePrice(value);
        // fetchOptionInfos();
    }

    const updateSetBaseAmount = (value) => {
        if(value<=0 || isNaN(value)){
            return;
        }
        setBaseAmount(value);
        // fetchOptionInfos();
    }

    const updateSetPostionIv = (value) => {
        if(value<=0 || isNaN(value)){
            return;
        }
        setPostionIv(value);
        // fetchOptionInfos();
    }

    const updateSetLeftDays = (value) => {
        if(value<=0 || isNaN(value)){
            return;
        }
        setLeftDays(value);
        // fetchOptionInfos();
    }

    const updateSetOptionType = (value) => {
        setOptionType(value);
        // fetchOptionInfos();
    }

    const updateSetStrikePrice = (value) => {
        if(value<=0 || isNaN(value)){
            return;
        }
        setStrikePrice(value);
        // fetchOptionInfos();
    }




    return (
        <Layout className="prepare-container">
            <Header style={{ background: '#fff', padding: 0 }}>
                <Title level={3}>期权计算器</Title>
            </Header>
            <Content style={{ padding: '24px' }}>
                <Row gutter={[16, 16]}>
                    <Col span={12}>
                        <Card title="基础信息">
                            <Form layout="vertical">
                                <Form.Item label="基础资产数量">
                                    <Input 
                                        value={baseAmount}
                                        onChange={(e) => updateSetBaseAmount(e.target.value)}
                                        addonAfter={`【${(baseAmount*basePrice).toFixed(2)}$】`}
                                    />
                                </Form.Item>
                                <Form.Item label="Iv常数">
                                    <Input 
                                        value={postionIv}
                                        onChange={(e) => updateSetPostionIv(e.target.value)}
                                    />
                                </Form.Item>
                                <Form.Item label="到期日">
                                    <Input 
                                        type="number"
                                        value={leftDays}
                                        onChange={(e) => updateSetLeftDays(e.target.value)}
                                    />
                                </Form.Item>
                                <Form.Item label="Option type">
                                    <Select 
                                        value={optionType}
                                        onChange={updateSetOptionType}
                                    >
                                        <Select.Option value="c">Call</Select.Option>
                                        <Select.Option value="p">Put</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Form>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card title="价格信息">
                            <Form layout="vertical">
                                <Form.Item label="基础资产价格">
                                    <Input 
                                        value={basePrice}
                                        onChange={(e) => updateSetBasePrice(e.target.value)}
                                    />
                                </Form.Item>
                                <Form.Item label="Strike Price">
                                    <Input 
                                        value={strikePrice}
                                        onChange={(e) => updateSetStrikePrice(e.target.value)}
                                    />
                                </Form.Item>
                            </Form>
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col span={24}>
                        <Card title="到期日 建议">
                            <Space>
                                {[10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100].map(price => (
                                    <Button
                                        key={price}
                                        type={leftDays === price ? 'primary' : 'default'}
                                        onClick={() => setLeftDays(price)}
                                    >
                                        {price}
                                    </Button>
                                ))}
                            </Space>
                        </Card>
                    </Col>
                </Row>
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col span={24}>
                        <Card title="资产价格 建议">
                            <Space>
                                {[80000, 82500, 85000, 87500, 90000, 92500, 95000, 97500, 100000, 102500, 105000].map(price => (
                                    <Button
                                        key={price}
                                        type={basePrice === price ? 'primary' : 'default'}
                                        onClick={() => setBasePrice(price)}
                                    >
                                        {price}
                                    </Button>
                                ))}
                            </Space>
                        </Card>
                    </Col>
                </Row>
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col span={24}>
                        <Card title="Strike Price 建议">
                            <Space>
                                {[80000, 82500, 85000, 87500, 90000, 92500, 95000, 97500, 100000, 102500, 105000].map(price => (
                                    <Button
                                        key={price}
                                        type={strikePrice === price ? 'primary' : 'default'}
                                        onClick={() => setStrikePrice(price)}
                                    >
                                        {price}
                                    </Button>
                                ))}
                            </Space>
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col span={24}>
                        <Card title="期权信息预览">
                            <Row gutter={[16, 16]}>
                                <Col span={8}>
                                    <Text strong>Symbol:</Text> {previewOptionData.ivData.symbol}
                                </Col>
                                <Col span={8}>
                                    <Text strong>Bid Price:</Text> {parseFloat(previewOptionData.ivData.bid_usd).toFixed(4)}
                                </Col>
                                <Col span={8}>
                                    <Text strong>Ask Price:</Text> {parseFloat(previewOptionData.ivData.ask_usd).toFixed(4)}
                                </Col>
                                <Col span={8}>
                                    <Text strong>Delta:</Text> {parseFloat(previewOptionData.ivData.delta).toFixed(2)}
                                </Col>
                                <Col span={8}>
                                    <Text strong>Gamma:</Text> {parseFloat(previewOptionData.ivData.gamma).toFixed(2)}
                                </Col>
                                <Col span={8}>
                                    <Text strong>Theta:</Text> {parseFloat(previewOptionData.ivData.theta).toFixed(2)}
                                </Col>
                                <Col span={8}>
                                    <Text strong>Time Value:</Text> {parseFloat(previewOptionData.ivData.time_value).toFixed(2)}
                                </Col>
                                <Col span={8}>
                                    <Text strong>Intrinsic Value:</Text> {parseFloat(previewOptionData.ivData.intrinsic_value).toFixed(2)}
                                </Col>
                                <Col span={8}>
                                    <Text strong>Token Amount:</Text> {parseFloat(previewOptionData.token_amount).toFixed(4)}
                                </Col>
                                
                            </Row>
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col span={24}>
                        <Space>
                            <Button type="primary" onClick={()=>fetchOptionInfos()}>①获取期权信息</Button>
                            {canToOpenPostion && <Button type="primary" onClick={()=>openPosition()}>②插入观察点</Button>}
                        </Space>
                    </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col span={24}>
                        <Card title="持仓历史">
                            <Table 
                                dataSource={postionHistoryData}
                                rowKey={(record, index) => index}
                                pagination={false}
                                scroll={{ x: true }}
                            >
                                <Table.Column title="Price" dataIndex="current_price" />
                                <Table.Column title="Days Left" render={(_, record) => parseFloat(record.ivData.day_left).toFixed(2)} />
                                <Table.Column title="Delta" render={(_, record) => parseFloat(record.ivData.delta).toFixed(2)} />
                                <Table.Column title="Strike" dataIndex={['ivData', 'excute_strike']} />
                                <Table.Column title="Token Amount" render={(_, record) => parseFloat(record.token_amount).toFixed(4)} />
                                <Table.Column title="Intrinsic Value" render={(_, record) => parseFloat(record.ivData.intrinsic_value).toFixed(2)} />
                                <Table.Column title="Time Value" render={(_, record) => parseFloat(record.ivData.time_value).toFixed(2)} />
                                <Table.Column title="Order Price" render={(_, record) => parseFloat(record.order_price).toFixed(2)} />
                                <Table.Column title="Profit Amount" render={(_, record) => parseFloat(record.profitAmount).toFixed(6)} />
                                <Table.Column title="Is Final" render={(_, record) => record.final ? 'Yes' : 'No'} />
                                <Table.Column title="Balance" dataIndex="balance" />
                                <Table.Column 
                                    title="操作"
                                    render={(_, record, index) => (
                                        <Space>
                                            <Button onClick={()=>closePosition()}>止盈</Button>
                                            <Button onClick={()=>revokePosition()}>撤销</Button>
                                        </Space>
                                    )}
                                />
                            </Table>
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col span={24}>
                        <Button danger onClick={()=>setPostionHistoryData([])}>清除旧数据</Button>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
}

export default Prepare;
