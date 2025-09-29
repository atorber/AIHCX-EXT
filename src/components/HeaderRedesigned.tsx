import React from 'react';
import { Layout, Typography, Button, Space, Tooltip, Avatar } from 'antd';
import { 
  SettingOutlined, 
  ThunderboltOutlined
} from '@ant-design/icons';

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
        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
        padding: '6px 12px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(24, 144, 255, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* 背景装饰 */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-20%',
        width: '200px',
        height: '200px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '50%',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        left: '-10%',
        width: '150px',
        height: '150px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '50%',
        zIndex: 0
      }} />

      {/* 左侧内容 */}
      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <Space align="center" size={8}>
          <Avatar 
            size="small" 
            style={{ 
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            <ThunderboltOutlined />
          </Avatar>
          <div>
            <Title 
              level={5} 
              style={{ 
                color: 'white', 
                margin: 0,
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: 1.2
              }}
            >
              AIHC助手
            </Title>
            <Text 
              style={{ 
                color: 'rgba(255,255,255,0.8)', 
                fontSize: '11px',
                lineHeight: 1.2,
                display: 'block'
              }}
            >
              {pageName}
            </Text>
          </div>
        </Space>
      </div>
      
      {/* 右侧操作按钮 */}
      <Space style={{ position: 'relative', zIndex: 1 }} size={4}>
        
        <Tooltip title="插件设置" placement="bottomRight">
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={openSettings}
            style={{
              color: 'rgba(255,255,255,0.9)',
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
          />
        </Tooltip>
      </Space>
    </AntHeader>
  );
};

export default Header;