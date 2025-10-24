import React, { useState } from 'react';
import axios from 'axios';

const ProxyTestComponent = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testProxy = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('Testing proxy with baseURL:', axios.defaults.baseURL);
      const response = await axios.get('/auth/test');
      setResult(`Success: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      console.error('Proxy test error:', error);
      setResult(`Error: ${error.message}\n${error.response ? JSON.stringify(error.response.data, null, 2) : ''}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h2>Proxy Test Component</h2>
      <button onClick={testProxy} disabled={loading}>
        {loading ? 'Testing...' : 'Test Proxy Connection'}
      </button>
      <div style={{ marginTop: '10px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
        {result}
      </div>
    </div>
  );
};

export default ProxyTestComponent;