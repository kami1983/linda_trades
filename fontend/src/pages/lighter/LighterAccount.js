import React, { useState } from 'react';
import { Card, Input, Button, Typography, Space, Spin, Alert, Row, Col, Table } from 'antd';
import { lighterAccountByL1, lighterAccountByIndex, lighterAccountInactiveOrders, lighterSignerCancelOrder, lighterSignerCancelAllOrders } from '../../utils/OptionApis';

const { Text } = Typography;

const LighterAccount = () => {
	const [address, setAddress] = useState('');
	const [loading, setLoading] = useState(false);
	const [index, setIndex] = useState('');
	const [error, setError] = useState(null);
	const [data, setData] = useState(null);
	const [orders, setOrders] = useState([]);
	const [acting, setActing] = useState(false);

	const onFetchByL1 = async () => {
		if (!address) {
			setError('Please input L1 address');
			return;
		}
		setError(null);
		setLoading(true);
		try {
			const res = await lighterAccountByL1(address);
			if (res && res.status) {
				setData(res.data);
				// try to derive account index from response and fetch orders
				try {
					const first =
						(res.data && res.data.accounts && res.data.accounts[0]) ? res.data.accounts[0] :
						(res.data && res.data.account) ? res.data.account : null;
					const accIndex = first?.account_index ?? first?.index ?? res.data?.account_index ?? res.data?.index;
					if (accIndex !== undefined && accIndex !== null) {
						const idxStr = String(accIndex);
						setIndex(idxStr);
						const ordersRes = await lighterAccountInactiveOrders(parseInt(idxStr, 10), 0, 50);
						if (ordersRes && ordersRes.status) {
							const list = Array.isArray(ordersRes.data?.orders) ? ordersRes.data.orders : (ordersRes.data || []);
							setOrders(list);
						} else {
							setOrders([]);
						}
					}
				} catch {
					setOrders([]);
				}
			} else {
				setError(res?.message || 'Fetch failed');
			}
		} catch (e) {
			setError(e.message || 'Fetch error');
		} finally {
			setLoading(false);
		}
	};

	const onFetchByIndex = async () => {
		if (!index) {
			setError('Please input account index');
			return;
		}
		setError(null);
		setLoading(true);
		try {
			const idx = parseInt(index, 10);
			if (Number.isNaN(idx)) {
				setError('Index must be a number');
				setLoading(false);
				return;
			}
			const res = await lighterAccountByIndex(idx);
			if (res && res.status) {
				setData(res.data);
				// Also fetch orders for this account index
				try {
					const ordersRes = await lighterAccountInactiveOrders(idx, 0, 50);
					if (ordersRes && ordersRes.status) {
						// Normalize to array
						const list = Array.isArray(ordersRes.data?.orders) ? ordersRes.data.orders : (ordersRes.data || []);
						setOrders(list);
					} else {
						setOrders([]);
					}
				} catch {
					setOrders([]);
				}
			} else {
				setError(res?.message || 'Fetch failed');
			}
		} catch (e) {
			setError(e.message || 'Fetch error');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={{ padding: 24 }}>
			<Card title="Lighter Account Info" style={{ marginBottom: 16 }}>
				<Space direction="vertical" size="middle" style={{ width: '100%' }}>
					<Row gutter={[12, 12]}>
						<Col xs={24} md={16}>
							<Input
								placeholder="Enter L1 Address (0x...)"
								value={address}
								onChange={(e) => setAddress(e.target.value)}
							/>
						</Col>
						<Col xs={24} md={8}>
							<Button block type="primary" onClick={onFetchByL1} loading={loading}>
								Fetch by L1 Address
							</Button>
						</Col>
					</Row>
					<Row gutter={[12, 12]}>
						<Col xs={24} md={16}>
							<Input
								placeholder="Enter Account Index (e.g. 65)"
								value={index}
								onChange={(e) => setIndex(e.target.value)}
							/>
						</Col>
						<Col xs={24} md={8}>
							<Button block onClick={onFetchByIndex} loading={loading}>
								Fetch by Index
							</Button>
						</Col>
					</Row>
					<Text type="secondary">
						The endpoint requires login. Please login first if you receive Unauthorized.
					</Text>
				</Space>
			</Card>
			{loading && <Spin size="large" />}
			{error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
			{data && (
				<Card title="Account Summary" style={{ marginBottom: 16 }}>
					<div>
						<Text strong>Account Index: </Text>
						<Text>
							{(() => {
								const acc =
									(data && data.accounts && data.accounts[0]) ? data.accounts[0] :
									(data && data.account) ? data.account : null;
								return acc?.account_index ?? acc?.index ?? data?.account_index ?? data?.index ?? '-';
							})()}
						</Text>
					</div>
					<div>
						<Text strong>L1 Address: </Text>
						<Text>
							{(() => {
								const acc =
									(data && data.accounts && data.accounts[0]) ? data.accounts[0] :
									(data && data.account) ? data.account : null;
								return acc?.l1_address ?? data?.l1_address ?? '-';
							})()}
						</Text>
					</div>
				</Card>
			)}
			{data && (
				<Card title="Response Data">
					<pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
{JSON.stringify(data, null, 2)}
					</pre>
				</Card>
			)}
			{(index && String(index).length > 0) && (
				<Card title="Inactive Orders" style={{ marginTop: 16 }}>
					<div style={{ marginBottom: 12 }}>
						<Space>
							<Button
								danger
								onClick={async () => {
									try {
										setActing(true);
										// default IOC for cancel all
										await lighterSignerCancelAllOrders(undefined);
										// refresh orders after action
										if (index) {
											const idx = parseInt(index, 10);
											const ordersRes = await lighterAccountInactiveOrders(idx, 0, 50);
											if (ordersRes && ordersRes.status) {
												const list = Array.isArray(ordersRes.data?.orders) ? ordersRes.data.orders : (ordersRes.data || []);
												setOrders(list);
											}
										}
									} catch (e) {
										// ignore UI error handling here
									} finally {
										setActing(false);
									}
								}}
								loading={acting}
							>
								Cancel All Orders
							</Button>
						</Space>
					</div>
					<Table
						dataSource={orders || []}
						rowKey={(row, idx) => row?.id || row?.order_id || row?.client_order_index || idx}
						pagination={{ pageSize: 10 }}
						columns={[
							{ title: 'Market', dataIndex: 'market_id', key: 'market_id', render: (v, r) => v ?? r?.marketId ?? '-' },
							{ title: 'ClientOrderIdx', dataIndex: 'client_order_index', key: 'client_order_index', render: (v, r) => v ?? r?.clientOrderIndex ?? '-' },
							{ title: 'Side', dataIndex: 'is_ask', key: 'is_ask', render: (v, r) => (v ?? r?.isAsk) ? 'sell' : 'buy' },
							{ title: 'Price', dataIndex: 'price', key: 'price', render: (v, r) => (v ?? r?.price) ?? '-' },
							{ title: 'Base Amount', dataIndex: 'base_amount', key: 'base_amount', render: (v, r) => (v ?? r?.baseAmount) ?? '-' },
							{ title: 'Status', dataIndex: 'status', key: 'status', render: (v) => v ?? '-' },
							{ title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp', render: (v, r) => {
								const ts = (v ?? r?.created_at ?? r?.createdAt);
								if (!ts) return '-';
								const num = typeof ts === 'string' ? parseInt(ts, 10) : ts;
								if (Number.isNaN(num)) return String(ts);
								return new Date(num * (num > 1e12 ? 1 : 1000)).toLocaleString();
							}},
							{ title: 'Action', key: 'action', render: (_, r) => (
								<Button
									size="small"
									danger
									onClick={async () => {
										try {
											setActing(true);
											const marketIndex = r?.market_id ?? r?.marketId;
											const orderIndex = r?.client_order_index ?? r?.clientOrderIndex;
											await lighterSignerCancelOrder(marketIndex, orderIndex);
											// Refresh list
											if (index) {
												const idx = parseInt(index, 10);
												const ordersRes = await lighterAccountInactiveOrders(idx, 0, 50);
												if (ordersRes && ordersRes.status) {
													const list = Array.isArray(ordersRes.data?.orders) ? ordersRes.data.orders : (ordersRes.data || []);
													setOrders(list);
												}
											}
										} catch (e) {
											// ignore UI error handling here
										} finally {
											setActing(false);
										}
									}}
									loading={acting}
								>
									Cancel
								</Button>
							) },
						]}
					/>
				</Card>
			)}
		</div>
	);
};

export default LighterAccount;


