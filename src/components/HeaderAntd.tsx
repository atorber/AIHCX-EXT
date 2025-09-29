import React from 'react';
import { Layout, Typography, Button, Space, Tooltip } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

const { Header: AntHeader } = Layout;
const { Title, Text } = Typography;

interface HeaderProps {
  pageName: string;
}

const Header: React.FC<HeaderProps> = ({ pageName }) => {
  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <AntHeader 
      style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '0 16px',
        height: 'auto',
        minHeight: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      <div style={{ flex: 1 }}>
        <Space direction="vertical" size={0}>
          <Title 
            level={4} 
            style={{ 
              color: 'white', 
              margin: 0,
              fontWeight: 600,
              fontSize: '16px'
            }}
          >
            {pageName}
          </Title>
          <Text 
            style={{ 
              color: 'rgba(255,255,255,0.8)', 
              fontSize: '12px',
              lineHeight: 1.2
            }}
          >
            切换Tab按钮可以查看对应内容
          </Text>
        </Space>
      </div>
      
      <Space>
        <Tooltip title="打开插件设置" placement="bottomRight">
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={openSettings}
            style={{
              color: 'white',
              border: 'none',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '6px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          />
        </Tooltip>
      </Space>
    </AntHeader>
  );
};

export default Header;
