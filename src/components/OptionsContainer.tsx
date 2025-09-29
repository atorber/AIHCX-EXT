import React, { useState } from 'react';
import ConfigForm from './ConfigForm';
import MultiConfigManagerComponent from './MultiConfigManager';
import { PluginConfig, ConfigProfile } from '../utils/config';

const OptionsContainer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'single' | 'multi'>('multi');

  const handleConfigChange = (config: PluginConfig) => {
    // 配置变更回调，可以在这里处理配置更新后的逻辑
    console.log('配置已更新:', config);
  };

  const handleProfileChange = (profile: ConfigProfile | null) => {
    // 配置档案变更回调
    console.log('激活的配置档案已更新:', profile);
  };

  return (
    <div className="options-container">
      <div className="options-header">
        <h1>AIHC助手 - 设置</h1>
        <p>配置您的百度云API凭证以使用AIHC服务</p>
      </div>

      {/* 配置模式切换 */}
      <div className="config-mode-switcher">
        <div className="mode-tabs">
          <button
            className={`mode-tab ${activeTab === 'multi' ? 'active' : ''}`}
            onClick={() => setActiveTab('multi')}
          >
            📋 多配置管理
          </button>
          <button
            className={`mode-tab ${activeTab === 'single' ? 'active' : ''}`}
            onClick={() => setActiveTab('single')}
          >
            ⚙️ 单配置模式
          </button>
        </div>
        <div className="mode-description">
          {activeTab === 'multi' ? (
            <p>支持管理多个配置档案，可以快速切换不同的环境配置</p>
          ) : (
            <p>传统的单配置模式，适合只需要一个配置的用户</p>
          )}
        </div>
      </div>

      {/* 根据选择的模式显示不同的配置组件 */}
      {activeTab === 'multi' ? (
        <MultiConfigManagerComponent onConfigChange={handleProfileChange} />
      ) : (
        <ConfigForm onConfigChange={handleConfigChange} />
      )}

      <div className="help-section">
        <h3>使用说明</h3>
        <ol>
          <li>登录百度云控制台，进入"安全认证"页面</li>
          <li>创建或查看您的Access Key和Secret Key</li>
          <li>选择配置模式：多配置管理或单配置模式</li>
          <li>填写配置信息并保存</li>
          <li>点击"验证配置"按钮测试连接</li>
          <li>在AIHC控制台页面使用插件功能</li>
        </ol>
        
        <h3>配置模式说明</h3>
        <ul>
          <li><strong>多配置管理</strong>: 支持创建多个配置档案，每个档案可以有不同的名称、AK、SK和Host，适合需要在不同环境间切换的用户</li>
          <li><strong>单配置模式</strong>: 传统的配置方式，只支持一个配置，适合只需要一个配置的用户</li>
        </ul>
        
        <h3>支持的页面</h3>
        <ul>
          <li>资源池列表和详情页面</li>
          <li>队列列表页面</li>
          <li>任务列表和详情页面</li>
          <li>数据下载和转储页面</li>
        </ul>
      </div>
    </div>
  );
};

export default OptionsContainer;