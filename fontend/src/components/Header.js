import React from 'react';
import { Menu } from 'antd';
import { useLoginStatus } from '../context/LoginStautsContext';

const Header = () => {
  const { isLoggedIn, currentUsername } = useLoginStatus();

  return (
    <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']}>
      <Menu.Item key="1"><a href="/">HOME</a></Menu.Item>
      <Menu.Item key="2"><a href="/prepare">Option calculator</a></Menu.Item>
      {isLoggedIn ? (
        <Menu.Item key="3" style={{ float: 'right' }}>
          <a href="/login">Welcome, {currentUsername}</a>
        </Menu.Item>
      ) : (
        <Menu.Item key="3" style={{ float: 'right' }}>
          <a href="/login">Login</a>
        </Menu.Item>
      )}
    </Menu>
  );
};

export default Header;
