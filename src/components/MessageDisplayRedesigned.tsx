import React, { useEffect, useState } from 'react';
import { Alert, Space, Typography, Button } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  InfoCircleOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { Message } from '../types';

const { Text } = Typography;

interface MessageDisplayProps {
  message: Message;
  onDismiss: () => void;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ message, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 延迟显示动画
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const getAlertConfig = (type: Message['type']) => {
    switch (type) {
      case 'success':
        return {
          type: 'success' as const,
          icon: <CheckCircleOutlined />,
          color: '#52c41a',
          background: '#f6ffed',
          borderColor: '#b7eb8f'
        };
      case 'error':
        return {
          type: 'error' as const,
          icon: <ExclamationCircleOutlined />,
          color: '#ff4d4f',
          background: '#fff2f0',
          borderColor: '#ffa39e'
        };
      case 'warning':
        return {
          type: 'warning' as const,
          icon: <ExclamationCircleOutlined />,
          color: '#faad14',
          background: '#fffbe6',
          borderColor: '#ffe58f'
        };
      case 'info':
      default:
        return {
          type: 'info' as const,
          icon: <InfoCircleOutlined />,
          color: '#1890ff',
          background: '#e6f7ff',
          borderColor: '#91d5ff'
        };
    }
  };

  const alertConfig = getAlertConfig(message.type);

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      maxWidth: '400px',
      transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      animation: isExiting ? 'slideOutRight 0.3s ease-in-out forwards' : 'slideInRight 0.3s ease-out'
    }}>
      <Alert
        message={
          <Space align="center" style={{ width: '100%' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              background: `${alertConfig.color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: alertConfig.color,
              fontSize: '14px'
            }}>
              {alertConfig.icon}
            </div>
            <div style={{ flex: 1 }}>
              <Text strong style={{ fontSize: '13px', color: '#333333' }}>
                {message.text}
              </Text>
            </div>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={handleDismiss}
              style={{
                color: '#999999',
                width: '20px',
                height: '20px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          </Space>
        }
        type={alertConfig.type}
        showIcon={false}
        style={{
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: `1px solid ${alertConfig.borderColor}`,
          background: alertConfig.background,
          padding: '12px',
          position: 'relative'
        }}
        // 移除默认的关闭按钮
        closable={false}
      />

      {/* CSS动画 */}
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes slideOutRight {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
};

export default MessageDisplay;
