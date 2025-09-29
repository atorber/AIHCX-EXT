import React from 'react';
import { Layout, Typography, Button, Space, Tooltip, Badge, Avatar } from 'antd';
import { 
  SettingOutlined, 
  QuestionCircleOutlined,
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

  const openHelp = () => {
    // 可以打开帮助文档或显示使用提示
    console.log('打开帮助');
  };

  return (
    <AntHeader 
      style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '12px 20px',
        height: 'auto',
        minHeight: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
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
        <Space direction="vertical" size={2}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            <Title 
              level={4} 
              style={{ 
                color: 'white', 
                margin: 0,
                fontWeight: 600,
                fontSize: '16px',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              AIHC助手
            </Title>
            <Badge 
              count="v0.6" 
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold'
              }} 
            />
          </div>
          <Text 
            style={{ 
              color: 'rgba(255,255,255,0.85)', 
              fontSize: '12px',
              lineHeight: 1.2,
              fontWeight: 400,
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            {pageName}
          </Text>
        </Space>
      </div>
      
      {/* 右侧操作按钮 */}
      <Space style={{ position: 'relative', zIndex: 1 }}>
        <Tooltip title="使用帮助" placement="bottomRight">
          <Button
            type="text"
            icon={<QuestionCircleOutlined />}
            onClick={openHelp}
            style={{
              color: 'rgba(255,255,255,0.9)',
              border: 'none',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'scale(1.05) translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </Tooltip>
        
        <Tooltip title="插件设置" placement="bottomRight">
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={openSettings}
            style={{
              color: 'rgba(255,255,255,0.9)',
              border: 'none',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'scale(1.05) translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </Tooltip>
      </Space>
    </AntHeader>
  );
};

export default Header;
