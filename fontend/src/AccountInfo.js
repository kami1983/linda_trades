import React, { useEffect, useState } from 'react';
import { getRecordedOrderList, getAccountBalance, refillOrders } from './utils/OptionApis';
import { Table, Card, Spin, Alert, Button, Modal } from 'antd';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
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
      console.log(balanceRes, ordersRes);
      if (balanceRes.status ) {
        setBalance(balanceRes.data);
      } else {
        console.error('Failed to fetch balance');
      }

      if (ordersRes.status) {
        setOrders(ordersRes.data);
      } else {
        console.error('Failed to fetch orders');
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
      title: 'side',
      dataIndex: 'side',
      key: 'side',
    },
    {
      title: 'PnL',
      dataIndex: 'pnl',
      key: 'pnl',
      render: (pnl) => parseFloat(pnl).toFixed(6)
    },
    {
      title: 'Pnl USD',
      key: 'pnl_usd',
      render: (record) => `${(record.pnl * record.fill_fwd_px).toFixed(2)}$`
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
      render: (price) => {parseFloat(price).toFixed(6)}
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

  const downloadCSV = () => {
    try {
      // 检查 orders 是否存在且不为空
      if (!orders || orders.length === 0) {
        console.error('No orders data available');
        return;
      }

      // 准备 CSV 头部
      const headers = orderColumns.map(col => col.title);
      
      // 准备 CSV 数据，添加错误处理
      const csvData = orders.map(order => {
        if (!order) return null; // 跳过无效的订单数据
        
        return orderColumns.map(col => {
          try {
            if (col.render) {
              // 确保所有必需的属性都存在
              if (col.key === 'pnl_usd' && (!order.pnl || !order.fill_fwd_px)) {
                return 'N/A';
              }
              return col.render(order[col.dataIndex], order) || 'N/A';
            }
            return order[col.dataIndex] || 'N/A';
          } catch (error) {
            console.error(`Error processing column ${col.title}:`, error);
            return 'N/A';
          }
        });
      }).filter(row => row !== null); // 过滤掉无效的行

      // 组合 CSV 内容
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      // 创建 Blob 对象
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // 创建下载链接
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', 'order_history.csv');
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating CSV:', error);
      // 可以添加一个提示，告诉用户下载失败
      alert('Failed to generate CSV file. Please try again.');
    }
  };

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
          <div>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              loading={refillLoading}
              onClick={handleRefillOrders}
              style={{ marginRight: '10px' }}
            >
              Refill Orders
            </Button>
            <Button 
              type="primary"
              icon={<DownloadOutlined />}
              onClick={downloadCSV}
            >
              Download CSV
            </Button>
          </div>
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
