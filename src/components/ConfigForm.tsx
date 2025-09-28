import React, { useState, useEffect } from 'react';
import { PluginConfig, getPluginConfig, savePluginConfig, resetPluginConfig, getConfigStatus } from '../utils/config';
import { callBecOpenApi } from '../utils/aihcOpenApi';

interface ConfigFormProps {
  onConfigChange?: (config: PluginConfig) => void;
}

const ConfigForm: React.FC<ConfigFormProps> = ({ onConfigChange }) => {
  const [config, setConfig] = useState<PluginConfig>({
    ak: '',
    sk: '',
    host: 'aihc.bj.baidubce.com'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [configStatus, setConfigStatus] = useState({
    isValid: false,
    hasAk: false,
    hasSk: false,
    hasHost: false
  });

  // 加载配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        const savedConfig = await getPluginConfig();
        const status = await getConfigStatus();
        
        setConfig(savedConfig);
        setConfigStatus(status);
        
        if (onConfigChange) {
          onConfigChange(savedConfig);
        }
      } catch (error) {
        console.error('加载配置失败:', error);
        showMessage('error', '加载配置失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [onConfigChange]);

  // 显示消息
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // 处理输入变化
  const handleInputChange = (field: keyof PluginConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  // 保存配置
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await savePluginConfig(config);
      
      const status = await getConfigStatus();
      setConfigStatus(status);
      
      showMessage('success', '配置保存成功');
      
      if (onConfigChange) {
        onConfigChange(config);
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      showMessage('error', '保存配置失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 重置配置
  const handleReset = async () => {
    try {
      setIsSaving(true);
      await resetPluginConfig();
      
      const defaultConfig = await getPluginConfig();
      const status = await getConfigStatus();
      
      setConfig(defaultConfig);
      setConfigStatus(status);
      
      showMessage('success', '配置已重置');
      
      if (onConfigChange) {
        onConfigChange(defaultConfig);
      }
    } catch (error) {
      console.error('重置配置失败:', error);
      showMessage('error', '重置配置失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 验证配置
  const handleValidateConfig = async () => {
    if (!configStatus.isValid) {
      showMessage('error', '请先填写完整的配置信息');
      return;
    }

    try {
      setIsSaving(true);
      showMessage('success', '正在验证配置...');
      
      // 调用DescribeDatasets接口验证配置
      const path = '/';
      const method = 'GET';
      const query = {
        action: 'DescribeDatasets',
      };
      const headers = {
        version: 'v2',
      };
      const body = {};

      const result = await callBecOpenApi(config.ak, config.sk, config.host, path, method, query, body, headers);
      
      // 检查返回结果
      if (result && !result.error && !result.statusCode) {
        showMessage('success', '配置验证成功！API连接正常');
        console.log('验证成功，返回结果:', result);
      } else {
        const errorMessage = result?.message || result?.error?.message || '未知错误';
        showMessage('error', `配置验证失败: ${errorMessage}`);
        console.error('验证失败:', result);
      }
    } catch (error: any) {
      console.error('配置验证失败:', error);
      const errorMessage = error?.message || error?.toString() || '网络请求失败';
      showMessage('error', `配置验证失败: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="config-form">
        <div className="loading">
          <div className="spinner"></div>
          <p>正在加载配置...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="config-form">
      <div className="config-header">
        <h3>插件配置</h3>
        <div className="config-status">
          <span className={`status-indicator ${configStatus.isValid ? 'valid' : 'invalid'}`}>
            {configStatus.isValid ? '✅ 配置完整' : '⚠️ 配置不完整'}
          </span>
        </div>
      </div>

      {message && (
        <div className={`config-message ${message.type}`}>
          <span className="message-icon">
            {message.type === 'success' ? '✅' : '❌'}
          </span>
          {message.text}
        </div>
      )}

      <div className="config-fields">
        <div className="config-field-group">
          <label htmlFor="ak">Access Key (AK) *</label>
          <input
            id="ak"
            type="text"
            value={config.ak}
            onChange={(e) => handleInputChange('ak', e.target.value)}
            placeholder="请输入您的Access Key"
            className={configStatus.hasAk ? 'valid' : 'invalid'}
          />
          <small className="field-hint">
            用于API认证的访问密钥
          </small>
        </div>

        <div className="config-field-group">
          <label htmlFor="sk">Secret Key (SK) *</label>
          <input
            id="sk"
            type="password"
            value={config.sk}
            onChange={(e) => handleInputChange('sk', e.target.value)}
            placeholder="请输入您的Secret Key"
            className={configStatus.hasSk ? 'valid' : 'invalid'}
          />
          <small className="field-hint">
            用于API认证的秘密密钥
          </small>
        </div>

        <div className="config-field-group">
          <label htmlFor="host">API Host *</label>
          <input
            id="host"
            type="text"
            value={config.host}
            onChange={(e) => handleInputChange('host', e.target.value)}
            placeholder="请输入API主机地址"
            className={configStatus.hasHost ? 'valid' : 'invalid'}
          />
          <small className="field-hint">
            API服务的主机地址，默认为 aihc.bj.baidubce.com
          </small>
        </div>
      </div>

      <div className="config-actions">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="config-btn config-btn-primary"
        >
          {isSaving ? '保存中...' : '保存配置'}
        </button>
        
        <button
          type="button"
          onClick={handleValidateConfig}
          disabled={isSaving || !configStatus.isValid}
          className="config-btn config-btn-secondary"
        >
          {isSaving ? '验证中...' : '验证配置'}
        </button>
        
        <button
          type="button"
          onClick={handleReset}
          disabled={isSaving}
          className="config-btn config-btn-outline"
        >
          重置配置
        </button>
      </div>

      <div className="config-info">
        <h4>配置说明</h4>
        <ul>
          <li><strong>Access Key (AK)</strong>: 百度云控制台中的访问密钥ID</li>
          <li><strong>Secret Key (SK)</strong>: 百度云控制台中的访问密钥Secret</li>
          <li><strong>API Host</strong>: AIHC API服务的主机地址</li>
          <li>配置信息将安全存储在浏览器本地，不会上传到任何服务器</li>
          <li>建议定期更新您的访问密钥以确保安全性</li>
        </ul>
      </div>
    </div>
  );
};

export default ConfigForm;