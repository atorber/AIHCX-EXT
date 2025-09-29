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
        background: '#ffffff',
        padding: '8px 16px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #e8e8e8',
        boxShadow: 'none'
      }}
    >
      {/* 左侧内容 */}
      <div style={{ flex: 1 }}>
        <Space direction="vertical" size={2}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar 
              size="small" 
              style={{ 
                background: '#1890ff',
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
                color: '#333333', 
                margin: 0,
                fontWeight: 600,
                fontSize: '16px'
              }}
            >
              AIHC助手
            </Title>
            <Badge 
              count="v0.6" 
              style={{ 
                backgroundColor: '#1890ff',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold'
              }} 
            />
          </div>
          <Text 
            style={{ 
              color: '#666666', 
              fontSize: '12px',
              lineHeight: 1.2,
              fontWeight: 400
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
              color: '#666666',
              border: 'none',
              background: 'transparent',
              borderRadius: '4px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        </Tooltip>
        
        <Tooltip title="插件设置" placement="bottomRight">
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={openSettings}
            style={{
              color: '#666666',
              border: 'none',
              background: 'transparent',
              borderRadius: '4px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        </Tooltip>
      </Space>
    </AntHeader>
  );
};

export default Header;