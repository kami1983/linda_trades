import React, { useEffect, useState } from 'react';
import { getRecordedOrderList, getAccountBalance, refillOrders } from './utils/OptionApis';
import { Table, Card, Spin, Alert, Button, Modal } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useLoginStatus } from './context/LoginStautsContext';
import Login from './components/Login';

const AccountInfo = () => {
  const [balance, setBalance] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refillLoading, setRefillLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const { isLoggedIn } = useLoginStatus();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 并行获取账户余额和订单列表
      const [balanceRes, ordersRes] = await Promise.all([
        getAccountBalance(),
        getRecordedOrderList()
      ]);

      if (balanceRes.status && ordersRes.status) {
        setBalance(balanceRes.data);
        setOrders(ordersRes.data);
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefillOrders = async () => {
    if (!isLoggedIn) {
      setLoginModalVisible(true);
      return;
    }

    try {
      setRefillLoading(true);
      await refillOrders();
      setSuccessModalVisible(true);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setRefillLoading(false);
    }
  };

  const balanceColumns = [
    {
      title: 'Currency',
      dataIndex: 'currency',
      key: 'currency',
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
    },
    {
      title: 'Free',
      dataIndex: 'free',
      key: 'free',
    },
    {
      title: 'Used',
      dataIndex: 'used',
      key: 'used',
    }
  ];

  const orderColumns = [
    {
      title: 'Instrument',
      dataIndex: 'inst_id',
      key: 'inst_id',
    },
    {
      title: 'PnL',
      dataIndex: 'pnl',
      key: 'pnl',
      render: (pnl) => parseFloat(pnl).toFixed(6)
    },
    {
      title: 'Filled Size',
      dataIndex: 'fill_sz',
      key: 'fill_sz',
      render: (size) => parseInt(size)
    },
    {
      title: 'Filled Price',
      dataIndex: 'fill_px',
      key: 'fill_px',
      render: (price) => parseFloat(price).toFixed(6)
    },
    {
      title: 'Filled Price USD',
      dataIndex: 'fill_px_usd',
      key: 'fill_px_usd',
      render: (price) => parseFloat(price).toFixed(6)
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
    },
    {
      title: 'Size',
      dataIndex: 'fill_sz',
      key: 'fill_sz',
      render: (size) => parseInt(size)
    },
    {
      title: 'Fill Time',
      dataIndex: 'fill_time',
      key: 'fill_time',
      render: (time) => new Date(time).toLocaleString()
    }
  ];

  if (loading) {
    return <Spin size="large" />;
  }

  if (error) {
    return <Alert message={error} type="error" showIcon />;
  }

  return (
    <div style={{ padding: '20px' }}>
      <Card title="Account Balance" style={{ marginBottom: '20px' }}>
        <Table
          dataSource={Object.keys(balance.total).map(key => ({
            currency: key,
            total: balance.total[key],
            free: balance.free[key],
            used: balance.used[key]
          }))}
          columns={balanceColumns}
          rowKey="currency"
          pagination={false}
        />
      </Card>

      <Card 
        title="Order History"
        extra={
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={refillLoading}
            onClick={handleRefillOrders}
          >
            Refill Orders
          </Button>
        }
      >
        <Table
          dataSource={orders}
          columns={orderColumns}
          rowKey="ord_id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Login Required"
        open={loginModalVisible}
        onOk={() => setLoginModalVisible(false)}
        onCancel={() => setLoginModalVisible(false)}
      >
        <Login />
      </Modal>

      <Modal
        title="Success"
        open={successModalVisible}
        onOk={() => setSuccessModalVisible(false)}
        onCancel={() => setSuccessModalVisible(false)}
      >
        <p>Refill orders successfully!</p>
      </Modal>
    </div>
  );
};

export default AccountInfo;
