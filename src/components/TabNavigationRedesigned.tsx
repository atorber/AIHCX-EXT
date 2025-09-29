import React from 'react';
import { Tabs, Badge, Tooltip } from 'antd';
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
      count: taskParams.cliItems.length,
      color: '#52c41a',
      description: '命令行工具'
    },
    { 
      key: 'commandScript' as TabType, 
      label: '启动命令', 
      icon: <RocketOutlined />,
      condition: !!taskParams.commandScript,
      count: taskParams.commandScript ? 1 : 0,
      color: '#1890ff',
      description: '任务启动脚本'
    },
    { 
      key: 'json' as TabType, 
      label: 'JSON参数', 
      icon: <FileTextOutlined />,
      condition: taskParams.jsonItems.length > 0,
      count: taskParams.jsonItems.length,
      color: '#faad14',
      description: 'JSON格式配置'
    },
    { 
      key: 'yaml' as TabType, 
      label: 'YAML参数', 
      icon: <UnorderedListOutlined />,
      condition: taskParams.yamlItems.length > 0,
      count: taskParams.yamlItems.length,
      color: '#722ed1',
      description: 'YAML格式配置'
    },
    { 
      key: 'apiDocs' as TabType, 
      label: 'API文档', 
      icon: <BookOutlined />,
      condition: taskParams.apiDocs.length > 0,
      count: taskParams.apiDocs.length,
      color: '#13c2c2',
      description: '接口文档'
    },
    { 
      key: 'chat' as TabType, 
      label: 'AI聊天', 
      icon: <MessageOutlined />,
      condition: pageName === '在线服务部署详情' && !!taskParams.chatConfig,
      count: taskParams.chatConfig ? 1 : 0,
      color: '#eb2f96',
      description: '智能对话'
    }
  ];

  const visibleTabs = tabs.filter(tab => tab.condition);
  
  // 调试信息
  console.log('[AIHC助手] TabNavigation - pageName:', pageName);
  console.log('[AIHC助手] TabNavigation - taskParams.chatConfig:', taskParams.chatConfig);
  console.log('[AIHC助手] TabNavigation - visibleTabs:', visibleTabs.map(t => t.key));

  return (
    <div style={{ 
      background: '#ffffff', 
      borderBottom: '1px solid #f0f0f0',
      padding: '0 16px'
    }}>
      {/* 简化底部装饰线 */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '1px',
        background: '#f0f0f0'
      }} />
      
      <Tabs
        activeKey={activeTab}
        onChange={(key) => onTabChange(key as TabType)}
        size="small"
        type="line"
        style={{
          margin: 0,
          paddingTop: '8px'
        }}
        tabBarStyle={{
          margin: 0,
          borderBottom: 'none'
        }}
      >
        {visibleTabs.map(tab => (
          <TabPane
            key={tab.key}
            tab={
              <Tooltip title={tab.description} placement="bottom">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  padding: '6px 12px',
                  transition: 'all 0.2s ease',
                  minWidth: '80px',
                  justifyContent: 'center'
                }}>
                  <div style={{ 
                    color: tab.color,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {tab.icon}
                  </div>
                  <span style={{ 
                    fontSize: '12px',
                    fontWeight: 400,
                    color: '#666666'
                  }}>
                    {tab.label}
                  </span>
                  {tab.count > 0 && (
                    <Badge 
                      count={tab.count} 
                      size="small" 
                      style={{ 
                        backgroundColor: tab.color,
                        fontSize: '10px',
                        minWidth: '16px',
                        height: '16px',
                        lineHeight: '16px',
                        fontWeight: 'normal'
                      }} 
                    />
                  )}
                </div>
              </Tooltip>
            }
          />
        ))}
      </Tabs>
      
      {/* 简化底部状态指示器 */}
      <div style={{
        display: 'none'
      }} />
    </div>
    </div>
  );
};

export default TabNavigation;
