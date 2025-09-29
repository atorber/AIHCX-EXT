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
          background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
          borderColor: '#b7eb8f'
        };
      case 'error':
        return {
          type: 'error' as const,
          icon: <ExclamationCircleOutlined />,
          color: '#ff4d4f',
          background: 'linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%)',
          borderColor: '#ffa39e'
        };
      case 'warning':
        return {
          type: 'warning' as const,
          icon: <ExclamationCircleOutlined />,
          color: '#faad14',
          background: 'linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)',
          borderColor: '#ffe58f'
        };
      case 'info':
      default:
        return {
          type: 'info' as const,
          icon: <InfoCircleOutlined />,
          color: '#1890ff',
          background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
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
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: `${alertConfig.color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: alertConfig.color,
              fontSize: '16px'
            }}>
              {alertConfig.icon}
            </div>
            <div style={{ flex: 1 }}>
              <Text strong style={{ fontSize: '14px', color: '#333' }}>
                {message.text}
              </Text>
            </div>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={handleDismiss}
              style={{
                color: '#999',
                width: '24px',
                height: '24px',
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
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          border: `1px solid ${alertConfig.borderColor}`,
          background: alertConfig.background,
          backdropFilter: 'blur(20px)',
          padding: '16px',
          position: 'relative',
          overflow: 'hidden'
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
          
          @keyframes progressBar {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}
      </style>
    </div>
  );
};

export default MessageDisplay;
