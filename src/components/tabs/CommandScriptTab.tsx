import React, { useState } from 'react';
import { Button, Typography, Space } from 'antd';
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface CommandScriptTabProps {
  commandScript: string;
  onCopyText: (text: string) => Promise<void>;
  onSaveFile: (content: string, type: 'txt') => void;
}

const CommandScriptTab: React.FC<CommandScriptTabProps> = ({
  commandScript,
  onCopyText,
  onSaveFile
}) => {
  const [isCopying, setIsCopying] = useState(false);

  const handleCopy = async () => {
    setIsCopying(true);
    await onCopyText(commandScript);
    
    setTimeout(() => {
      setIsCopying(false);
    }, 1500);
  };

  const handleSave = () => {
    onSaveFile(commandScript, 'txt');
  };

  if (!commandScript) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Text type="secondary">没有可用的启动命令</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px' }}>
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
            启动命令
          </Text>
          <Space size="small">
            <Button
              type="primary"
              size="small"
              icon={<CopyOutlined />}
              loading={isCopying}
              onClick={handleCopy}
              style={{ fontSize: '10px', height: '20px', padding: '0 8px' }}
            >
              {isCopying ? '已复制' : '复制'}
            </Button>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={handleSave}
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
          {commandScript}
        </div>
      </div>
    </div>
  );
};

export default CommandScriptTab;