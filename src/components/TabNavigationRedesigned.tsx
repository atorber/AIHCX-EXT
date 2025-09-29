import React from 'react';
import { Tabs, Badge } from 'antd';
import { 
  ThunderboltOutlined, 
  RocketOutlined, 
  FileTextOutlined, 
  UnorderedListOutlined, 
  BookOutlined, 
  MessageOutlined,
  CloudDownloadOutlined
} from '@ant-design/icons';
import { TabType, TaskParams } from '../types';

const { TabPane } = Tabs;

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  taskParams: TaskParams;
  pageName: string;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  taskParams,
  pageName
}) => {
  // 如果是数据下载页面，不显示Tab导航
  if (taskParams.isDataDownloadPage) {
    return null;
  }

  const tabs = [
    { 
      key: 'cli' as TabType, 
      label: 'CLI', 
      icon: <ThunderboltOutlined />,
      condition: taskParams.cliItems.length > 0,
      count: taskParams.cliItems.length,
      color: '#52c41a'
    },
    { 
      key: 'commandScript' as TabType, 
      label: '启动', 
      icon: <RocketOutlined />,
      condition: !!taskParams.commandScript,
      count: taskParams.commandScript ? 1 : 0,
      color: '#1890ff'
    },
    { 
      key: 'json' as TabType, 
      label: 'JSON', 
      icon: <FileTextOutlined />,
      condition: taskParams.jsonItems.length > 0,
      count: taskParams.jsonItems.length,
      color: '#faad14'
    },
    { 
      key: 'yaml' as TabType, 
      label: 'YAML', 
      icon: <UnorderedListOutlined />,
      condition: taskParams.yamlItems.length > 0,
      count: taskParams.yamlItems.length,
      color: '#722ed1'
    },
    { 
      key: 'apiDocs' as TabType, 
      label: 'API', 
      icon: <BookOutlined />,
      condition: taskParams.apiDocs.length > 0,
      count: taskParams.apiDocs.length,
      color: '#13c2c2'
    },
    { 
      key: 'chat' as TabType, 
      label: '聊天', 
      icon: <MessageOutlined />,
      condition: pageName === '在线服务部署详情' && !!taskParams.chatConfig,
      count: taskParams.chatConfig ? 1 : 0,
      color: '#eb2f96'
    },
    { 
      key: 'dataImport' as TabType, 
      label: '导入数据', 
      icon: <CloudDownloadOutlined />,
      condition: pageName === '数据集详情' && !!taskParams.datasetId,
      count: taskParams.datasetId ? 1 : 0,
      color: '#52c41a'
    },
    { 
      key: 'modelDeployment' as TabType, 
      label: '部署在线服务', 
      icon: <RocketOutlined />,
      condition: pageName === '模型详情' && !!taskParams.modelId,
      count: taskParams.modelId ? 1 : 0,
      color: '#1890ff'
    }
  ];

  const visibleTabs = tabs.filter(tab => tab.condition);
  
  // 调试信息
  console.log('[AIHC助手] TabNavigation - pageName:', pageName);
  console.log('[AIHC助手] TabNavigation - taskParams.chatConfig:', taskParams.chatConfig);
  console.log('[AIHC助手] TabNavigation - visibleTabs:', visibleTabs.map(t => t.key));

  return (
    <div style={{ 
      background: '#fff', 
      borderBottom: '1px solid #f0f0f0',
      padding: '0 6px'
    }}>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => onTabChange(key as TabType)}
        size="small"
        type="card"
        style={{
          margin: 0
        }}
        tabBarStyle={{
          margin: 0,
          borderBottom: 'none',
          padding: '4px 0'
        }}
      >
        {visibleTabs.map(tab => (
          <TabPane
            key={tab.key}
            tab={
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '3px',
                padding: '1px 4px',
                borderRadius: '3px',
                minWidth: '50px',
                justifyContent: 'center'
              }}>
                <div style={{ 
                  color: tab.color,
                  fontSize: '11px'
                }}>
                  {tab.icon}
                </div>
                <span style={{ 
                  fontSize: '10px',
                  fontWeight: 500,
                  color: '#333'
                }}>
                  {tab.label}
                </span>
                {tab.count > 0 && (
                  <Badge 
                    count={tab.count} 
                    size="small" 
                    style={{ 
                      backgroundColor: tab.color,
                      fontSize: '8px',
                      minWidth: '12px',
                      height: '12px',
                      lineHeight: '12px'
                    }} 
                  />
                )}
              </div>
            }
          />
        ))}
      </Tabs>
    </div>
  );
};

export default TabNavigation;
