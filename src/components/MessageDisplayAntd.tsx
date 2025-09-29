import React from 'react';
import { Alert } from 'antd';
import { Message } from '../types';

interface MessageDisplayProps {
  message: Message;
  onDismiss: () => void;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ message, onDismiss }) => {
  const getAlertType = (type: Message['type']) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      maxWidth: '400px',
      animation: 'slideInRight 0.3s ease-out'
    }}>
      <Alert
        message={message.text}
        type={getAlertType(message.type)}
        showIcon
        closable
        onClose={onDismiss}
        style={{
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: 'none'
        }}
      />
    </div>
  );
};

export default MessageDisplay;
