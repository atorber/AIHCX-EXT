import React from 'react';
import { Space, Typography, Empty, Row, Col, Tag } from 'antd';
import { 
  FileTextOutlined, 
  RocketOutlined, 
  DatabaseOutlined,
  CopyOutlined,
  DownloadOutlined,
  CloudDownloadOutlined
} from '@ant-design/icons';
import { TabType, TaskParams, DataDumpConfig, DataImportConfig, ModelDeploymentConfig } from '../types';
import CLICommandTab from './tabs/CLICommandTab';
import CommandScriptTab from './tabs/CommandScriptTab';
import JSONParamsTab from './tabs/JSONParamsTab';
import YAMLParamsTab from './tabs/YAMLParamsTab';
import APIDocsTab from './tabs/APIDocsTab';
import ChatTab from './tabs/ChatTab';
import DataDownloadInput from './DataDownloadInput';
import DataImportForm from './DataImportForm';
import ModelDeploymentForm from './ModelDeploymentForm';
import DataDownloadTabs from './DataDownloadTabs';
import DatasetRegisterModelForm from './DatasetRegisterModelForm';
import { BceAihc } from '../utils/sdk/aihc';
import { getActiveConfigProfile, getPluginConfig } from '../utils/config';

const { Text } = Typography;

interface ContentAreaProps {
  activeTab: TabType;
  taskParams: TaskParams;
  onCopyText: (text: string) => Promise<void>;
  onSaveFile: (content: string, type: 'json' | 'yaml' | 'txt') => void;
  onOpenUrl: (url: string) => void;
  onLoadChatConfig?: (serviceId: string) => Promise<void>;
  onSubmitDataDump?: (config: DataDumpConfig) => Promise<void>;
  onSubmitDataImport?: (config: DataImportConfig) => Promise<void>;
  onSubmitModelDeployment?: (config: ModelDeploymentConfig) => Promise<void>;
}

const ContentArea: React.FC<ContentAreaProps> = ({
  activeTab,
  taskParams,
  onCopyText,
  onSaveFile,
  onOpenUrl,
  onLoadChatConfig,
  onSubmitDataDump: _onSubmitDataDump,
  onSubmitDataImport: _onSubmitDataImport,
  onSubmitModelDeployment: _onSubmitModelDeployment
}) => {
  // 获取配置信息
  const getConfig = async () => {
    try {
      // 首先尝试获取多配置管理器中的活跃配置
      const activeProfile = await getActiveConfigProfile();
      if (activeProfile) {
        return {
          ak: activeProfile.ak,
          sk: activeProfile.sk,
          host: activeProfile.host
        };
      }
      
      // 如果没有活跃配置，回退到单配置模式
      const pluginConfig = await getPluginConfig();
      return {
        ak: pluginConfig.ak,
        sk: pluginConfig.sk,
        host: pluginConfig.host
      };
    } catch (error) {
      console.error('获取配置失败:', error);
      return {
        ak: '',
        sk: '',
        host: 'aihc.bj.baidubce.com'
      };
    }
  };

  // 处理创建数据集
  const handleCreateDataset = async (config: any) => {
    try {
      const { ak, sk, host } = await getConfig();
      if (!ak || !sk) {
        throw new Error('请先配置AK/SK');
      }

      const bceAihc = new BceAihc(ak, sk, host);
      
      // 构建创建数据集的参数
      const createDatasetParams = {
        name: config.datasetName,
        description: config.datasetDescription || '',
        storageType: config.storageType as 'PFS' | 'BOS',
        storageInstance: config.storageInstance,
        importFormat: config.importFormat as 'FILE' | 'FOLDER',
        visibilityScope: 'ONLY_OWNER' as 'ALL_PEOPLE' | 'ONLY_OWNER' | 'USER_GROUP',
        initVersionEntry: {
          description: config.versionDescription || config.datasetDescription || '',
          storagePath: config.storagePath,
          mountPath: config.mountPath
        }
      };

      console.log('🚀 调用创建数据集API:', createDatasetParams);
      const result = await bceAihc.CreateDataset(createDatasetParams);
      
      if (result.error) {
        throw new Error(result.message || '创建数据集失败');
      }

      console.log('✅ 创建数据集成功:', result);
      // 这里可以显示成功消息或跳转
      
    } catch (error) {
      console.error('❌ 创建数据集失败:', error);
      throw error;
    }
  };

  // 处理注册模型
  const handleRegisterModel = async (config: any) => {
    try {
      const { ak, sk, host } = await getConfig();
      if (!ak || !sk) {
        throw new Error('请先配置AK/SK');
      }

      const bceAihc = new BceAihc(ak, sk, host);
      
      // 构建创建模型的参数
      const createModelParams = {
        name: config.modelName,
        description: config.modelDescription || '',
        modelFormat: config.modelFormat,
        visibilityScope: 'ONLY_OWNER' as 'ONLY_OWNER',
        initVersionEntry: {
          source: 'UserUpload',
          storageBucket: config.storageBucket,
          storagePath: config.storagePath,
          modelMetrics: config.modelMetrics || undefined,
          description: config.versionDescription || config.modelDescription || ''
        }
      };

      console.log('🚀 调用创建模型API:', createModelParams);
      const result = await bceAihc.CreateModel(createModelParams);
      
      if (result.error) {
        throw new Error(result.message || '注册模型失败');
      }

      console.log('✅ 注册模型成功:', result);
      // 这里可以显示成功消息或跳转
      
    } catch (error) {
      console.error('❌ 注册模型失败:', error);
      throw error;
    }
  };
  // 如果是数据下载页面，直接显示输入框
  if (taskParams.isDataDownloadPage) {
    return (
      <div style={{ 
        padding: '12px',
        background: '#f8f9fa',
        minHeight: '400px'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid #e8e8e8'
        }}>
          <Space style={{ marginBottom: '16px' }}>
            <DatabaseOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
            <Text strong style={{ fontSize: '14px' }}>数据下载助手</Text>
          </Space>
          <DataDownloadInput />
        </div>
      </div>
    );
  }

  // 如果是数据转储页面，显示数据下载tabs
  if (taskParams.isDataDumpPage) {
    console.log('[ContentArea] 🟢 渲染数据下载tabs页面');
    console.log('[ContentArea] taskParams 完整状态:', taskParams);
    console.log('[ContentArea] taskParams.name:', taskParams.name);
    console.log('[ContentArea] onSubmitDataDump 函数情况:', {
      exists: !!_onSubmitDataDump,
      type: typeof _onSubmitDataDump,
      name: _onSubmitDataDump?.name,
      length: _onSubmitDataDump?.length
    });
    
    return (
      <div style={{ 
        padding: '12px',
        background: '#f8f9fa',
        minHeight: '400px'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid #e8e8e8'
        }}>
          <DataDownloadTabs
            datasetId={taskParams.datasetId || ''}
            category={taskParams.category || ''}
            taskName={taskParams.name}
            datasetStoragePath={taskParams.datasetStoragePath}
            onSubmitDataDump={_onSubmitDataDump}
            onSubmitCreateDataset={async (config) => {
              console.log('创建数据集:', config);
              await handleCreateDataset(config);
            }}
            onSubmitRegisterModel={async (config) => {
              console.log('注册模型:', config);
              await handleRegisterModel(config);
            }}
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
        title: 'CLI', 
        description: '命令行工具和脚本',
        color: '#52c41a',
        count: taskParams.cliItems.length
      },
      commandScript: { 
        icon: <RocketOutlined />, 
        title: '启动', 
        description: '任务启动脚本',
        color: '#1890ff',
        count: taskParams.commandScript ? 1 : 0
      },
      json: { 
        icon: <FileTextOutlined />, 
        title: 'JSON', 
        description: 'JSON格式配置',
        color: '#faad14',
        count: taskParams.jsonItems.length
      },
      yaml: { 
        icon: <FileTextOutlined />, 
        title: 'YAML', 
        description: 'YAML格式配置',
        color: '#722ed1',
        count: taskParams.yamlItems.length
      },
      apiDocs: { 
        icon: <FileTextOutlined />, 
        title: 'API', 
        description: '接口文档',
        color: '#13c2c2',
        count: taskParams.apiDocs.length
      },
      chat: { 
        icon: <DatabaseOutlined />, 
        title: '聊天', 
        description: '智能对话',
        color: '#eb2f96',
        count: taskParams.chatConfig ? 1 : 0
      },
      dataImport: { 
        icon: <CloudDownloadOutlined />, 
        title: '导入数据', 
        description: '数据导入任务',
        color: '#52c41a',
        count: taskParams.datasetId ? 1 : 0
      },
      modelDeployment: { 
        icon: <RocketOutlined />, 
        title: '部署在线服务', 
        description: '模型服务部署',
        color: '#1890ff',
        count: taskParams.modelId ? 1 : 0
      },
      registerModel: { 
        icon: <RocketOutlined />, 
        title: '注册模型', 
        description: '将数据集版本注册为模型',
        color: '#722ed1',
        count: (taskParams.datasetId && taskParams.datasetType === 'BOS') ? 1 : 0
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
      case 'dataImport':
        return (
          <div style={{ 
            padding: '12px',
            background: '#f8f9fa',
            minHeight: '400px'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '6px',
              border: '1px solid #e8e8e8',
              overflow: 'hidden'
            }}>
              <DataImportForm
                datasetId={taskParams.datasetId}
                onSubmit={_onSubmitDataImport}
              />
            </div>
          </div>
        );
      case 'modelDeployment':
        return (
          <div style={{ 
            padding: '12px',
            background: '#f8f9fa',
            minHeight: '400px'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '6px',
              border: '1px solid #e8e8e8',
              overflow: 'hidden'
            }}>
              <ModelDeploymentForm
                modelId={taskParams.modelId}
                onSubmit={_onSubmitModelDeployment}
              />
            </div>
          </div>
        );
      case 'registerModel':
        return (
          <div style={{ 
            padding: '12px',
            background: '#f8f9fa',
            minHeight: '400px'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '6px',
              border: '1px solid #e8e8e8',
              overflow: 'hidden'
            }}>
              <DatasetRegisterModelForm
                datasetId={taskParams.datasetId || ''}
                datasetType={taskParams.datasetType}
                onSubmit={async (config) => {
                  console.log('注册模型:', config);
                  // 这里可以调用实际的注册模型API
                }}
              />
            </div>
          </div>
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
      padding: '8px',
      background: '#ffffff',
      minHeight: '400px'
    }}>
      {/* 页面头部信息 - 表单类型页面不显示 */}
      {!['dataImport', 'modelDeployment'].includes(activeTab) && (
        <div style={{
          background: '#fafafa',
          borderRadius: '6px',
          padding: '8px 12px',
          marginBottom: '8px',
          border: '1px solid #f0f0f0'
        }}>
          <Row align="middle" justify="space-between">
            <Col>
              <Space align="center" size={6}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  background: `${tabInfo.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: tabInfo.color
                }}>
                  {tabInfo.icon}
                </div>
                <div>
                  <Text strong style={{ fontSize: '13px', color: '#333' }}>
                    {tabInfo.title}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '10px' }}>
                    {tabInfo.description}
                  </Text>
                </div>
              </Space>
            </Col>
            <Col>
              <Tag color={tabInfo.color} style={{ borderRadius: '3px', fontSize: '10px', padding: '1px 6px' }}>
                {tabInfo.count} 项
              </Tag>
            </Col>
          </Row>
        </div>
      )}

      {/* 主要内容区域 - 移除卡片嵌套 */}
      <div style={{
        background: '#ffffff',
        borderRadius: '6px',
        border: '1px solid #f0f0f0',
        minHeight: '300px'
      }}>
        {renderTabContent()}
      </div>

      {/* 底部操作提示 - 简化样式 */}
      <div style={{
        marginTop: '8px',
        padding: '6px 10px',
        background: '#fafafa',
        borderRadius: '4px',
        fontSize: '10px',
        color: '#666',
        border: '1px solid #f0f0f0'
      }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space size="small">
              <CopyOutlined style={{ color: '#1890ff', fontSize: '10px' }} />
              <Text type="secondary" style={{ fontSize: '10px' }}>
                点击复制按钮快速复制
              </Text>
            </Space>
          </Col>
          <Col>
            <Space size="small">
              <DownloadOutlined style={{ color: '#52c41a', fontSize: '10px' }} />
              <Text type="secondary" style={{ fontSize: '10px' }}>
                支持导出文件
              </Text>
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ContentArea;
