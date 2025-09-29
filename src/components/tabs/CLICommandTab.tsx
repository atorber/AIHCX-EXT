import React, { useState } from 'react';
import { Button, Typography, Space, Alert } from 'antd';
import { CopyOutlined, BookOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface CLIItem {
  title: string;
  text: string;
  doc?: string;
}

interface CLICommandTabProps {
  items: CLIItem[];
  onCopyText: (text: string) => Promise<void>;
  onOpenUrl: (url: string) => void;
}

const CLICommandTab: React.FC<CLICommandTabProps> = ({
  items,
  onCopyText,
  onOpenUrl
}) => {
  const [copyingItems, setCopyingItems] = useState<Set<string>>(new Set());

  const handleCopy = async (text: string, itemTitle: string) => {
    setCopyingItems(prev => new Set(prev).add(itemTitle));
    await onCopyText(text);
    
    setTimeout(() => {
      setCopyingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemTitle);
        return newSet;
      });
    }, 1500);
  };

  if (items.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Text type="secondary">没有可用的CLI命令</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px' }}>
      {items.map((item, index) => {
        const isWarning = item.title.includes('⚠️');
        const isCopying = copyingItems.has(item.title);
        
        return (
          <div key={index} style={{ marginBottom: '8px' }}>
            {isWarning ? (
              <Alert
                message={item.title}
                description={item.text}
                type="warning"
                showIcon
                style={{ marginBottom: '6px', fontSize: '12px' }}
              />
            ) : (
              <div style={{
                background: '#fff',
                border: '1px solid #f0f0f0',
                borderRadius: '4px',
                padding: '8px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '6px'
                }}>
                  <Text strong style={{ fontSize: '12px' }}>
                    {item.title}
                  </Text>
                  <Space size="small">
                    <Button
                      type="primary"
                      size="small"
                      icon={<CopyOutlined />}
                      loading={isCopying}
                      onClick={() => handleCopy(item.text, item.title)}
                      style={{ fontSize: '10px', height: '20px', padding: '0 8px' }}
                    >
                      {isCopying ? '已复制' : '复制'}
                    </Button>
                    {item.doc && (
                      <Button
                        size="small"
                        icon={<BookOutlined />}
                        onClick={() => onOpenUrl(item.doc!)}
                        style={{ fontSize: '10px', height: '20px', padding: '0 8px' }}
                      >
                        手册
                      </Button>
                    )}
                  </Space>
                </div>
                <div style={{
                  background: '#fafafa',
                  padding: '6px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  whiteSpace: 'pre-wrap',
                  border: '1px solid #f0f0f0'
                }}>
                  {item.text}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CLICommandTab;