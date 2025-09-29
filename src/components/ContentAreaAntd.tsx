import React from 'react';
import { Card, Space, Typography } from 'antd';
import { TabType, TaskParams, DataDumpConfig } from '../types';
import CLICommandTab from './tabs/CLICommandTab';
import CommandScriptTab from './tabs/CommandScriptTab';
import JSONParamsTab from './tabs/JSONParamsTab';
import YAMLParamsTab from './tabs/YAMLParamsTab';
import APIDocsTab from './tabs/APIDocsTab';
import ChatTab from './tabs/ChatTab';
import DataDownloadInput from './DataDownloadInput';
import DataDumpFormAntd from './DataDumpFormAntd';

const { Text } = Typography;

interface ContentAreaProps {
  activeTab: TabType;
  taskParams: TaskParams;
  onCopyText: (text: string) => Promise<void>;
  onSaveFile: (content: string, type: 'json' | 'yaml' | 'txt') => void;
  onOpenUrl: (url: string) => void;
  onLoadChatConfig?: (serviceId: string) => Promise<void>;
  onSubmitDataDump?: (config: DataDumpConfig) => Promise<void>;
}

const ContentArea: React.FC<ContentAreaProps> = ({
  activeTab,
  taskParams,
  onCopyText,
  onSaveFile,
  onOpenUrl,
  onLoadChatConfig,
  onSubmitDataDump: _onSubmitDataDump
}) => {
  // 如果是数据下载页面，直接显示输入框
  if (taskParams.isDataDownloadPage) {
    return (
      <div style={{ padding: '16px' }}>
        <Card 
          title="数据下载" 
          style={{ 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <DataDownloadInput />
        </Card>
      </div>
    );
  }

  // 如果是数据转储页面，直接显示转储表单
  if (taskParams.isDataDumpPage) {
    console.log('[ContentArea] 🟢 渲染数据转储页面');
    console.log('[ContentArea] taskParams 完整状态:', taskParams);
    console.log('[ContentArea] onSubmitDataDump 函数情况:', {
      exists: !!_onSubmitDataDump,
      type: typeof _onSubmitDataDump,
      name: _onSubmitDataDump?.name,
      length: _onSubmitDataDump?.length
    });
    
    return (
      <div style={{ 
        padding: '16px',
        background: '#f5f5f5',
        minHeight: '400px'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <DataDumpFormAntd
            datasetId={taskParams.datasetId || ''}
            category={taskParams.category || ''}
            onSubmit={_onSubmitDataDump}
          />
        </div>
      </div>
    );
  }

  // 渲染对应的Tab内容
  const renderTabContent = () => {
    switch (activeTab) {
      case 'cli':
        return (
          <CLICommandTab
            items={taskParams.cliItems}
            onCopyText={onCopyText}
            onOpenUrl={onOpenUrl}
          />
        );
      case 'commandScript':
        return (
          <CommandScriptTab
            commandScript={taskParams.commandScript}
            onCopyText={onCopyText}
            onSaveFile={onSaveFile}
          />
        );
      case 'json':
        return (
          <JSONParamsTab
            items={taskParams.jsonItems}
            onCopyText={onCopyText}
            onSaveFile={onSaveFile}
          />
        );
      case 'yaml':
        return (
          <YAMLParamsTab
            items={taskParams.yamlItems}
            onCopyText={onCopyText}
            onSaveFile={onSaveFile}
          />
        );
      case 'apiDocs':
        return (
          <APIDocsTab
            items={taskParams.apiDocs}
            onCopyText={onCopyText}
            onOpenUrl={onOpenUrl}
          />
        );
      case 'chat':
        return (
          <ChatTab
            chatConfig={taskParams.chatConfig}
            isLoading={taskParams.chatLoading}
            error={taskParams.chatError}
            onLoadConfig={onLoadChatConfig}
          />
        );
      default:
        return (
          <Card style={{ textAlign: 'center', padding: '40px' }}>
            <Space direction="vertical" size="large">
              <Text type="secondary" style={{ fontSize: '16px' }}>
                请选择一个Tab查看内容
              </Text>
            </Space>
          </Card>
        );
    }
  };

  return (
    <div style={{ 
      padding: '16px',
      background: '#f5f5f5',
      minHeight: '400px'
    }}>
      <Card 
        style={{ 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          minHeight: '350px'
        }}
        bodyStyle={{ padding: '20px' }}
      >
        {renderTabContent()}
      </Card>
    </div>
  );
};

export default ContentArea;
