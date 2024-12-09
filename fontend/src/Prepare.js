import React, { useState } from 'react';

function Prepare() {
    const [basePrice, setBasePrice] = useState('');
    const [returnChange, setReturnChange] = useState('');
    const [eventChange, setEventChange] = useState('');
    const [evaluationData, setEvaluationData] = useState([]);

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

    return (
        <div style={{ color: 'red', fontSize: '18px' }}>
            <div>
                <label>基础资产价格</label>
                <input 
                    type="text" 
                    value={basePrice} 
                    onChange={(e) => setBasePrice(e.target.value)} 
                    style={{ margin: '10px' }}
                />
                <label>收益变化</label>
                <input 
                    type="text" 
                    value={returnChange} 
                    onChange={(e) => setReturnChange(e.target.value)} 
                    style={{ margin: '10px' }}
                />
                <label>时间变化</label>
                <input 
                    type="text" 
                    value={eventChange} 
                    onChange={(e) => setEventChange(e.target.value)} 
                    style={{ margin: '10px' }}
                />
            </div>
            <div style={{ marginTop: '20px' }}>
                <h3>资产评估表格：</h3>
                <table border="1" style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th>基础价格</th>
                            <th>到期日</th>
                            <th>DELTA</th>
                            <th>IV</th>
                            <th>总价值</th>
                            <th>时间价值</th>
                        </tr>
                    </thead>
                    <tbody>
                        {evaluationData.map((row, index) => (
                            <tr key={index}>
                                <td>
                                    <input 
                                        type="text" 
                                        value={row.basePrice} 
                                        onChange={(e) => handleInputChange(index, 'basePrice', e.target.value)} 
                                    />
                                </td>
                                <td>
                                    <input 
                                        type="text" 
                                        value={row.expiryDate} 
                                        onChange={(e) => handleInputChange(index, 'expiryDate', e.target.value)} 
                                    />
                                </td>
                                <td>
                                    <input 
                                        type="text" 
                                        value={row.delta} 
                                        onChange={(e) => handleInputChange(index, 'delta', e.target.value)} 
                                    />
                                </td>
                                <td>
                                    <input 
                                        type="text" 
                                        value={row.iv} 
                                        onChange={(e) => handleInputChange(index, 'iv', e.target.value)} 
                                    />
                                </td>
                                <td>
                                    <input 
                                        type="text" 
                                        value={row.totalValue} 
                                        onChange={(e) => handleInputChange(index, 'totalValue', e.target.value)} 
                                    />
                                </td>
                                <td>
                                    <input 
                                        type="text" 
                                        value={row.timeValue} 
                                        onChange={(e) => handleInputChange(index, 'timeValue', e.target.value)} 
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button 
                    onClick={handleAddRow} 
                    style={{ marginTop: '10px', padding: '5px 10px', color: 'white', background: 'red', border: 'none' }}
                >
                    添加行
                </button>
            </div>
        </div>
    );
}

export default Prepare;
