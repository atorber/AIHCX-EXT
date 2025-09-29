import React from 'react';
import { Spin, Card, Typography, Space } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

const LoadingIndicator: React.FC = () => {
  return (
    <div style={{ 
      padding: '40px 16px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '300px'
    }}>
      <Card 
        style={{ 
          textAlign: 'center',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: 'none'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        <Space direction="vertical" size="large">
          <Spin 
            indicator={
              <LoadingOutlined 
                style={{ 
                  fontSize: 32, 
                  color: '#1890ff' 
                }} 
                spin 
              />
            } 
          />
          <Text 
            style={{ 
              fontSize: '16px',
              color: '#666'
            }}
          >
            正在加载页面数据...
          </Text>
        </Space>
      </Card>
    </div>
  );
};

export default LoadingIndicator;
