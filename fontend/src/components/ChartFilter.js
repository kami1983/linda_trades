// src/components/ChartFilter.js
import React from 'react';
import { Checkbox, Space } from 'antd';

const ChartFilter = ({ showBTC, showETH, onChangeBTC, onChangeETH }) => {
  return (
    <Space>
      <Checkbox checked={showBTC} onChange={(e) => onChangeBTC(e.target.checked)}>BTC</Checkbox>
      <Checkbox checked={showETH} onChange={(e) => onChangeETH(e.target.checked)}>ETH</Checkbox>
    </Space>
  );
};

export default ChartFilter;


