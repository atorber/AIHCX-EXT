import React from 'react';
import ConfigForm from './ConfigForm';
import { PluginConfig } from '../utils/config';

const OptionsContainer: React.FC = () => {
  const handleConfigChange = (config: PluginConfig) => {
    // 配置变更回调，可以在这里处理配置更新后的逻辑
    console.log('配置已更新:', config);
  };

  return (
    <div className="options-container">
      <div className="options-header">
        <h1>AIHC助手 - 设置</h1>
        <p>配置您的百度云API凭证以使用AIHC服务</p>
      </div>

      <ConfigForm onConfigChange={handleConfigChange} />

      <div className="help-section">
        <h3>使用说明</h3>
        <ol>
          <li>登录百度云控制台，进入"安全认证"页面</li>
          <li>创建或查看您的Access Key和Secret Key</li>
          <li>将凭证填写到上方表单并保存</li>
          <li>点击"验证配置"按钮测试连接</li>
          <li>在AIHC控制台页面使用插件功能</li>
        </ol>
        
        <h3>支持的页面</h3>
        <ul>
          <li>资源池列表和详情页面</li>
          <li>队列列表页面</li>
          <li>任务列表和详情页面</li>
        </ul>
      </div>
    </div>
  );
};

export default OptionsContainer;