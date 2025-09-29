import React, { useState } from 'react';
import { Button, Typography, Space, Card } from 'antd';
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface JSONItem {
  title: string;
  text: string;
}

interface JSONParamsTabProps {
  items: JSONItem[];
  onCopyText: (text: string) => Promise<void>;
  onSaveFile: (content: string, type: 'json') => void;
}

const JSONParamsTab: React.FC<JSONParamsTabProps> = ({
  items,
  onCopyText,
  onSaveFile
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

  const handleSave = (content: string) => {
    onSaveFile(content, 'json');
  };

  if (items.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Text type="secondary">没有可用的JSON参数</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px' }}>
      {items.map((item, index) => {
        const isCopying = copyingItems.has(item.title);
        
        return (
          <Card 
            key={index} 
            size="small" 
            style={{ 
              marginBottom: '8px',
              border: '1px solid #f0f0f0'
            }}
            bodyStyle={{ padding: '8px' }}
          >
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
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={() => handleSave(item.text)}
                  style={{ fontSize: '10px', height: '20px', padding: '0 8px' }}
                >
                  保存
                </Button>
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
              border: '1px solid #f0f0f0',
              maxHeight: '200px',
              overflow: 'auto'
            }}>
              {item.text}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default JSONParamsTab;