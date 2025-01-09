import React, { useState, useEffect } from 'react';
import { Menu } from 'antd';
import { useLoginStatus } from '../context/LoginStautsContext';
import { useLocation } from 'react-router-dom';

const Header = () => {
  const { isLoggedIn, currentUsername } = useLoginStatus();
  const location = useLocation();
  const [selectedKeys, setSelectedKeys] = useState(['1']);

  useEffect(() => {
    // 根据当前路径设置选中的菜单项
    const path = location.pathname;
    if (path === '/') {
      setSelectedKeys(['1']);
    } else if (path === '/prepare') {
      setSelectedKeys(['2']);
    } else if (path === '/login') {
      setSelectedKeys(['3']);
    }
  }, [location]);

  return (
      <Menu 
        theme="dark" 
        mode="horizontal" 
        selectedKeys={selectedKeys}
        onSelect={({ key }) => setSelectedKeys([key])}
        style={{ display: 'flex', justifyContent: 'center' }}
      >
        <Menu.Item key="1"><a href="/">HOME</a></Menu.Item>
        <Menu.Item key="2"><a href="/prepare">Option calculator</a></Menu.Item>
        <Menu.Item key="3" style={{ marginLeft: 'auto' }}>
          {isLoggedIn ? (
            <span>Welcome, {currentUsername}</span>
          ) : (
            <a href="/login">Login</a>
          )}
        </Menu.Item>
      </Menu>
  );
};

export default Header;
