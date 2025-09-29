import React from 'react';
import MultiConfigManagerComponent from './MultiConfigManager';
import { ConfigProfile } from '../utils/config';

const OptionsContainer: React.FC = () => {
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

      {/* 多配置管理器 */}
      <MultiConfigManagerComponent onConfigChange={handleProfileChange} />

      <div className="help-section">
        <h3>使用说明</h3>
        <ol>
          <li>登录百度云控制台，进入"安全认证"页面</li>
          <li>创建或查看您的Access Key和Secret Key</li>
          <li>创建配置档案并填写配置信息</li>
          <li>点击"验证配置"按钮测试连接</li>
          <li>在AIHC控制台页面使用插件功能</li>
        </ol>
        
        <h3>配置管理说明</h3>
        <ul>
          <li><strong>多配置管理</strong>: 支持创建多个配置档案，每个档案可以有不同的名称、AK、SK和Host，适合需要在不同环境间切换的用户</li>
          <li><strong>单配置兼容</strong>: 如果您只需要一个配置，可以只创建一个配置档案，系统会自动兼容单配置模式的使用方式</li>
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