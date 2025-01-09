import React, { useState, useEffect } from "react";
import { useLoginStatus } from "../context/LoginStautsContext";
import { Form, Input, Button, Card, message } from "antd";
import { UserOutlined, LockOutlined } from '@ant-design/icons';

function Login() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    
    const apiHost = process.env.REACT_APP_API_HOSTS;
    const {updateLoginStatus, isLoggedIn, currentUsername} = useLoginStatus();

    const handleLogin = async (values) => {
        setLoading(true);
        try {
            const response = await fetch(`${apiHost}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(values),
                credentials: "include"
            });

            if (response.ok) {
                updateLoginStatus();
                message.success('登录成功');
            } else {
                message.error('用户名或密码错误');
            }
        } catch (error) {
            message.error('登录失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch(`${apiHost}/logout`, {
                method: "POST",
                credentials: "include"
            });
            updateLoginStatus();
            message.success('登出成功');
        } catch (error) {
            message.error('登出失败');
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '0 auto', paddingTop: 100 }}>
            {isLoggedIn ? (
                <Card title={`欢迎回来，${currentUsername}`}>
                    <Button 
                        type="primary" 
                        block
                        onClick={handleLogout}
                    >
                        登出
                    </Button>
                </Card>
            ) : (
                <Card title="用户登录">
                    <Form
                        form={form}
                        onFinish={handleLogin}
                        initialValues={{ remember: true }}
                    >
                        <Form.Item
                            name="username"
                            rules={[{ required: true, message: '请输入用户名' }]}
                        >
                            <Input 
                                prefix={<UserOutlined />}
                                placeholder="用户名"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: '请输入密码' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder="密码"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                block
                                loading={loading}
                            >
                                登录
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            )}
        </div>
    );
}

export default Login;