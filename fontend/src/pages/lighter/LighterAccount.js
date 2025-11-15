import React, { useEffect, useState } from 'react';
import { Card, Button, Typography, Space, Spin, Alert, Row, Col, Table, Descriptions, Collapse } from 'antd';
import { lighterAccountByL1, lighterAccountByIndex, lighterAccountInactiveOrders, lighterSignerCancelOrder, lighterSignerCancelAllOrders } from '../../utils/OptionApis';

const { Text } = Typography;

const LighterAccount = () => {
	const apiHost = process.env.REACT_APP_API_HOSTS;
	const [address, setAddress] = useState('');
	const [loading, setLoading] = useState(false);
	const [index, setIndex] = useState('');
	const [error, setError] = useState(null);
	const [data, setData] = useState(null);
	const [config, setConfig] = useState(null);
	const [orders, setOrders] = useState([]);
	const [acting, setActing] = useState(false);
	const getAccountObject = (payload) => {
		if (!payload) return null;
		if (payload.accounts && Array.isArray(payload.accounts) && payload.accounts.length > 0) return payload.accounts[0];
		if (payload.account) return payload.account;
		return payload;
	};
	const getSubAccounts = (payload) => {
		if (payload && Array.isArray(payload.sub_accounts)) return payload.sub_accounts;
		return [];
	};
	const toNumber = (v) => {
		if (v === null || v === undefined) return '-';
		const n = typeof v === 'string' ? parseFloat(v) : v;
		if (Number.isNaN(n)) return v;
		return n;
	};
	const fmtNum = (v) => {
		const n = toNumber(v);
		return typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 6 }) : n;
	};

	const onFetchByL1 = async (addrParam) => {
		const addr = addrParam || address;
		if (!addr) {
			setError('Please input L1 address');
			return;
		}
		setError(null);
		setLoading(true);
		try {
			const res = await lighterAccountByL1(addr);
			if (res && res.status) {
				setData(res.data);
				// try to derive account index from response and fetch orders
				try {
					let first =
						(res.data && res.data.accounts && res.data.accounts[0]) ? res.data.accounts[0] :
						(res.data && res.data.account) ? res.data.account :
						(res.data && Array.isArray(res.data.sub_accounts) && res.data.sub_accounts.length > 0) ? res.data.sub_accounts[0] : null;
					const accIndex = first?.account_index ?? first?.index ?? res.data?.account_index ?? res.data?.index;
					if (accIndex !== undefined && accIndex !== null) {
						const idxStr = String(accIndex);
						setIndex(idxStr);
						const ordersRes = await lighterAccountInactiveOrders(parseInt(idxStr, 10), undefined, 50);
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

	useEffect(() => {
		(async () => {
			// Always fetch server-side configured L1 address; frontend does not control account
			try {
				setLoading(true);
				const res = await fetch(`${apiHost}/api/lighter/config`, { credentials: 'include' });
				const json = await res.json();
				setConfig(json?.data || null);
				const serverL1 = json?.data?.l1_address;
				if (serverL1) {
					setAddress(serverL1);
					await onFetchByL1(serverL1);
				}
			} catch (e) {
				// ignore
			} finally {
				setLoading(false);
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div style={{ padding: 24 }}>
			<Card title="Lighter Account Info" style={{ marginBottom: 16 }}>
				<Space direction="vertical" size="middle" style={{ width: '100%' }}>
					<Text type="secondary">
						The endpoint requires login. Please login first if you receive Unauthorized.
					</Text>
				</Space>
			</Card>
			{loading && <Spin size="large" />}
			{error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
			{data && (() => {
				const subs = getSubAccounts(data);
				return (
					<Card title="Account Overview" style={{ marginBottom: 16 }}>
						<Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
							<Descriptions.Item label="L1 Address">{data?.l1_address ?? '-'}</Descriptions.Item>
							<Descriptions.Item label="Sub Accounts">{subs.length}</Descriptions.Item>
							<Descriptions.Item label="API Key Index">{config?.api_key_index ?? '-'}</Descriptions.Item>
							<Descriptions.Item label="API Key Public Key" span={3}>{config?.api_key_public_key ?? '-'}</Descriptions.Item>
						</Descriptions>
						{subs.length > 0 && (
							<div style={{ marginTop: 12 }}>
								<Table
									size="small"
									dataSource={subs}
									rowKey={(row, idx) => row?.index ?? idx}
									pagination={false}
									columns={[
										{ title: 'Type', dataIndex: 'account_type', key: 'account_type' },
										{ title: 'Index', dataIndex: 'index', key: 'index' },
										{ title: 'Collateral', dataIndex: 'collateral', key: 'collateral', render: (v) => fmtNum(v) },
										{ title: 'Available', dataIndex: 'available_balance', key: 'available_balance', render: (v) => fmtNum(v) },
										{ title: 'Action', key: 'action', render: (_, r) => (
											<Button
												size="small"
												onClick={async () => {
													try {
														setIndex(String(r.index));
														setLoading(true);
														const ordersRes = await lighterAccountInactiveOrders(Number(r.index), 0, 50);
														if (ordersRes && ordersRes.status) {
															const list = Array.isArray(ordersRes.data?.orders) ? ordersRes.data.orders : (ordersRes.data || []);
															setOrders(list);
														} else {
															setOrders([]);
														}
													} finally {
														setLoading(false);
													}
												}}
											>
												View Orders
											</Button>
										) },
									]}
								/>
							</div>
						)}
						<div style={{ marginTop: 12 }}>
							<Collapse>
								<Collapse.Panel header="Raw JSON (debug)" key="raw">
									<pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
{JSON.stringify(data, null, 2)}
									</pre>
								</Collapse.Panel>
							</Collapse>
						</div>
					</Card>
				);
			})()}
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
												const ordersRes = await lighterAccountInactiveOrders(idx, undefined, 50);
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


