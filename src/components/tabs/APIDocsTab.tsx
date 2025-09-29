import React, { useState } from 'react';
import { Button, Typography, Space, Card } from 'antd';
import { CopyOutlined, LinkOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface APIDocItem {
  title: string;
  text: string;
  requestExample?: string;
}

interface APIDocsTabProps {
  items: APIDocItem[];
  onOpenUrl: (url: string) => void;
  onCopyText?: (text: string) => Promise<void>;
}

const APIDocsTab: React.FC<APIDocsTabProps> = ({
  items,
  onOpenUrl,
  onCopyText
}) => {
  const [copyingItems, setCopyingItems] = useState<Set<string>>(new Set());

  const handleCopy = async (text: string, itemTitle: string) => {
    if (!onCopyText) return;
    
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
        <Text type="secondary">没有可用的API文档</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px' }}>
      {items.map((item, index) => {
        const isWarning = item.title.includes('⚠️');
        const isCopying = copyingItems.has(item.title);
        
        return (
          <Card 
            key={index} 
            size="small" 
            style={{ 
              marginBottom: '8px',
              border: isWarning ? '1px solid #ffc107' : '1px solid #f0f0f0'
            }}
            bodyStyle={{ padding: '8px' }}
          >
            <div style={{ marginBottom: '8px' }}>
              <Text strong style={{ fontSize: '12px', color: isWarning ? '#faad14' : '#333' }}>
                {item.title}
              </Text>
            </div>
            
            {isWarning ? (
              <div style={{
                background: '#fffbe6',
                border: '1px solid #ffc107',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '11px',
                color: '#ad6800'
              }}>
                {item.requestExample}
              </div>
            ) : (
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{
                  background: '#fafafa',
                  border: '1px solid #f0f0f0',
                  borderRadius: '4px',
                  padding: '6px 8px',
                  fontSize: '10px'
                }}>
                  <Space align="center" size="small">
                    <LinkOutlined style={{ color: '#1890ff', fontSize: '10px' }} />
                    <Text style={{ fontSize: '10px', fontWeight: 500 }}>接口文档：</Text>
                    <Text 
                      style={{ 
                        fontSize: '10px', 
                        color: '#1890ff',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                      onClick={() => onOpenUrl(item.text)}
                    >
                      {item.text}
                    </Text>
                  </Space>
                </div>
                
                {item.requestExample && (
                  <div>
                    <div style={{ marginBottom: '4px' }}>
                      <Text style={{ fontSize: '10px', fontWeight: 500 }}>请求示例：</Text>
                    </div>
                    <div style={{
                      background: '#2d3748',
                      border: '1px solid #4a5568',
                      borderRadius: '4px',
                      padding: '6px',
                      position: 'relative'
                    }}>
                      <pre style={{
                        color: '#e2e8f0',
                        fontFamily: 'monospace',
                        fontSize: '9px',
                        lineHeight: 1.4,
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                      }}>
                        {item.requestExample}
                      </pre>
                      {onCopyText && (
                        <Button
                          size="small"
                          type="primary"
                          icon={<CopyOutlined />}
                          loading={isCopying}
                          onClick={() => handleCopy(item.requestExample!, item.title)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            fontSize: '9px',
                            height: '18px',
                            padding: '0 6px'
                          }}
                        >
                          {isCopying ? '已复制' : '复制'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Space>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default APIDocsTab;