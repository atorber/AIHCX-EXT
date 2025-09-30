import React, { useState } from 'react';
import { Tabs } from 'antd';
import { DatabaseOutlined, CloudOutlined, RocketOutlined } from '@ant-design/icons';
import DataDumpTab from './DataDumpTab';
import CreateDatasetTab from './SyncToDatasetTab';
import RegisterModelTab from './SyncToModelTab';
import { DataDumpConfig } from '../types';

const { TabPane } = Tabs;

interface DataDownloadTabsProps {
  datasetId: string;
  category: string;
  taskName?: string;
  datasetStoragePath?: string;
  onSubmitDataDump?: (config: DataDumpConfig) => Promise<void>;
  onSubmitCreateDataset?: (config: any) => Promise<void>;
  onSubmitRegisterModel?: (config: any) => Promise<void>;
}

const DataDownloadTabs: React.FC<DataDownloadTabsProps> = ({
  datasetId,
  category,
  taskName,
  datasetStoragePath,
  onSubmitDataDump,
  onSubmitCreateDataset,
  onSubmitRegisterModel
}) => {
  const [activeTab, setActiveTab] = useState('dataDump');
  
  console.log('[DataDownloadTabs] 接收到的参数:', {
    datasetId,
    category,
    taskName,
    datasetStoragePath,
    hasOnSubmitDataDump: !!onSubmitDataDump,
    hasOnSubmitCreateDataset: !!onSubmitCreateDataset,
    hasOnSubmitRegisterModel: !!onSubmitRegisterModel
  });

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  return (
    <div style={{ 
      padding: '8px',
      background: '#ffffff',
      minHeight: '400px'
    }}>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
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
        <TabPane
          key="dataDump"
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
                color: '#52c41a',
                fontSize: '11px'
              }}>
                <DatabaseOutlined />
              </div>
              <span style={{ 
                fontSize: '10px',
                fontWeight: 500,
                color: '#333'
              }}>
                数据转储
              </span>
            </div>
          }
        >
          <DataDumpTab
            datasetId={datasetId}
            category={category}
            onSubmit={onSubmitDataDump}
          />
        </TabPane>

        <TabPane
          key="createDataset"
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
                color: '#1890ff',
                fontSize: '11px'
              }}>
                <CloudOutlined />
              </div>
              <span style={{ 
                fontSize: '10px',
                fontWeight: 500,
                color: '#333'
              }}>
                创建数据集
              </span>
            </div>
          }
        >
          <CreateDatasetTab
            datasetId={datasetId}
            taskName={taskName}
            datasetStoragePath={datasetStoragePath}
            onSubmit={onSubmitCreateDataset}
          />
        </TabPane>

        <TabPane
          key="registerModel"
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
                color: '#722ed1',
                fontSize: '11px'
              }}>
                <RocketOutlined />
              </div>
              <span style={{ 
                fontSize: '10px',
                fontWeight: 500,
                color: '#333'
              }}>
                注册模型
              </span>
            </div>
          }
        >
          <RegisterModelTab
            datasetId={datasetId}
            taskName={taskName}
            datasetStoragePath={datasetStoragePath}
            onSubmit={onSubmitRegisterModel}
          />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default DataDownloadTabs;
