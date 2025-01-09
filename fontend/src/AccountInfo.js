import React, { useEffect, useState } from 'react';
import { getRecordedOrderList, getAccountBalance } from './utils/OptionApis';
import { Table, Card, Spin, Alert } from 'antd';

const AccountInfo = () => {
  const [balance, setBalance] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

    fetchData();
  }, []);

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
      title: 'Price',
      dataIndex: 'fill_px',
      key: 'fill_px',
    },
    {
      title: 'Size',
      dataIndex: 'fill_sz',
      key: 'fill_sz',
    },
    {
      title: 'Time',
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

      <Card title="Order History">
        <Table
          dataSource={orders}
          columns={orderColumns}
          rowKey="ord_id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default AccountInfo;
