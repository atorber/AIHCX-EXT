import React from 'react';
import { Card, Space, Typography, Empty, Row, Col, Tag } from 'antd';
import { 
  FileTextOutlined, 
  RocketOutlined, 
  DatabaseOutlined,
  InfoCircleOutlined,
  CopyOutlined,
  DownloadOutlined
} from '@ant-design/icons';
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
      <div style={{ 
        padding: '20px',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '400px'
      }}>
        <Card 
          title={
            <Space>
              <DatabaseOutlined style={{ color: '#1890ff' }} />
              <span>数据下载助手</span>
            </Space>
          }
          style={{ 
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: 'none',
            overflow: 'hidden'
          }}
          headStyle={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderBottom: 'none'
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
        padding: '20px',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '400px'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          border: 'none'
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

  // 获取当前Tab的信息
  const getTabInfo = () => {
    const tabInfoMap = {
      cli: { 
        icon: <FileTextOutlined />, 
        title: 'CLI命令', 
        description: '命令行工具和脚本',
        color: '#52c41a',
        count: taskParams.cliItems.length
      },
      commandScript: { 
        icon: <RocketOutlined />, 
        title: '启动命令', 
        description: '任务启动脚本',
        color: '#1890ff',
        count: taskParams.commandScript ? 1 : 0
      },
      json: { 
        icon: <FileTextOutlined />, 
        title: 'JSON参数', 
        description: 'JSON格式配置',
        color: '#faad14',
        count: taskParams.jsonItems.length
      },
      yaml: { 
        icon: <FileTextOutlined />, 
        title: 'YAML参数', 
        description: 'YAML格式配置',
        color: '#722ed1',
        count: taskParams.yamlItems.length
      },
      apiDocs: { 
        icon: <FileTextOutlined />, 
        title: 'API文档', 
        description: '接口文档',
        color: '#13c2c2',
        count: taskParams.apiDocs.length
      },
      chat: { 
        icon: <DatabaseOutlined />, 
        title: 'AI聊天', 
        description: '智能对话',
        color: '#eb2f96',
        count: taskParams.chatConfig ? 1 : 0
      }
    };
    return tabInfoMap[activeTab] || { icon: null, title: '未知', description: '', color: '#666', count: 0 };
  };

  const tabInfo = getTabInfo();

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
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" size="small">
                <Text type="secondary">请选择一个功能模块</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  切换上方的标签页查看不同内容
                </Text>
              </Space>
            }
            style={{ padding: '40px 20px' }}
          />
        );
    }
  };

  return (
    <div style={{ 
      padding: '20px',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '400px'
    }}>
      {/* 页面头部信息 */}
      <Card 
        style={{ 
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          marginBottom: '16px',
          border: 'none',
          overflow: 'hidden'
        }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Space align="center">
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${tabInfo.color}20, ${tabInfo.color}40)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                color: tabInfo.color
              }}>
                {tabInfo.icon}
              </div>
              <div>
                <Text strong style={{ fontSize: '16px', color: '#333' }}>
                  {tabInfo.title}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {tabInfo.description}
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Tag color={tabInfo.color} style={{ borderRadius: '6px' }}>
                共 {tabInfo.count} 项
              </Tag>
              <InfoCircleOutlined style={{ color: '#999', fontSize: '14px' }} />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 主要内容区域 */}
      <Card 
        style={{ 
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: 'none',
          overflow: 'hidden',
          minHeight: '300px'
        }}
        bodyStyle={{ padding: '0' }}
      >
        {renderTabContent()}
      </Card>

      {/* 底部操作提示 */}
      <div style={{
        marginTop: '16px',
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.8)',
        borderRadius: '8px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space>
              <CopyOutlined style={{ color: '#1890ff', fontSize: '12px' }} />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                点击复制按钮快速复制内容
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <DownloadOutlined style={{ color: '#52c41a', fontSize: '12px' }} />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                支持导出为文件
              </Text>
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ContentArea;
