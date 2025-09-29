import React from 'react';
import { Tabs, Badge } from 'antd';
import { 
  ThunderboltOutlined, 
  RocketOutlined, 
  FileTextOutlined, 
  UnorderedListOutlined, 
  BookOutlined, 
  MessageOutlined 
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
      label: 'CLI命令', 
      icon: <ThunderboltOutlined />,
      condition: taskParams.cliItems.length > 0,
      count: taskParams.cliItems.length
    },
    { 
      key: 'commandScript' as TabType, 
      label: '启动命令', 
      icon: <RocketOutlined />,
      condition: !!taskParams.commandScript,
      count: taskParams.commandScript ? 1 : 0
    },
    { 
      key: 'json' as TabType, 
      label: 'JSON参数', 
      icon: <FileTextOutlined />,
      condition: taskParams.jsonItems.length > 0,
      count: taskParams.jsonItems.length
    },
    { 
      key: 'yaml' as TabType, 
      label: 'YAML参数', 
      icon: <UnorderedListOutlined />,
      condition: taskParams.yamlItems.length > 0,
      count: taskParams.yamlItems.length
    },
    { 
      key: 'apiDocs' as TabType, 
      label: 'API文档', 
      icon: <BookOutlined />,
      condition: taskParams.apiDocs.length > 0,
      count: taskParams.apiDocs.length
    },
    { 
      key: 'chat' as TabType, 
      label: 'AI聊天', 
      icon: <MessageOutlined />,
      condition: pageName === '在线服务部署详情' && !!taskParams.chatConfig,
      count: taskParams.chatConfig ? 1 : 0
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
      padding: '0 16px'
    }}>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => onTabChange(key as TabType)}
        size="small"
        type="card"
        style={{
          margin: 0
        }}
      >
        {visibleTabs.map(tab => (
          <TabPane
            key={tab.key}
            tab={
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <Badge 
                    count={tab.count} 
                    size="small" 
                    style={{ 
                      backgroundColor: '#1890ff',
                      fontSize: '10px',
                      minWidth: '16px',
                      height: '16px',
                      lineHeight: '16px'
                    }} 
                  />
                )}
              </span>
            }
          />
        ))}
      </Tabs>
    </div>
  );
};

export default TabNavigation;
