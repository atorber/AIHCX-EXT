import React, { useState, useEffect } from 'react';
import { Form, Select, Input, Button, message, Alert, Spin } from 'antd';
import { RocketOutlined, SendOutlined, ReloadOutlined } from '@ant-design/icons';
import { aihcApiService } from '../services/aihcApi';

const { Option } = Select;
const { TextArea } = Input;

interface ModelDeploymentFormProps {
  modelId?: string;
  onSubmit?: (config: ModelDeploymentConfig) => Promise<void>;
}

interface ModelDeploymentConfig {
  modelVersion: string;
  accelerationFramework: string;
  resourcePoolType: '自运维' | '全托管';
  resourcePoolId: string;
  queueId: string;
  startupCommand: string;
  modelId?: string;
}

const ModelDeploymentForm: React.FC<ModelDeploymentFormProps> = ({ modelId, onSubmit }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  
  // 加载状态
  const [isLoadingModelVersions, setIsLoadingModelVersions] = useState(false);
  const [isLoadingResourcePools, setIsLoadingResourcePools] = useState(false);
  const [isLoadingQueues, setIsLoadingQueues] = useState(false);
  
  // 选项数据
  const [modelVersions, setModelVersions] = useState<any[]>([]);
  const [resourcePools, setResourcePools] = useState<any[]>([]);
  const [queues, setQueues] = useState<any[]>([]);
  const [selectedVersionInfo, setSelectedVersionInfo] = useState<any>(null);
  
  // 表单配置
  const [config, setConfig] = useState<ModelDeploymentConfig>({
    modelVersion: '',
    accelerationFramework: '',
    resourcePoolType: '自运维',
    resourcePoolId: '',
    queueId: '',
    startupCommand: '',
    modelId: modelId || ''
  });

  // 加速框架选项
  const accelerationFrameworks = [
    { value: 'aiak', label: 'AIAK' },
    { value: 'sglang', label: 'SGLang' },
    { value: 'vllm', label: 'vLLM' }
  ];

  // 获取模型版本列表
  const fetchModelVersions = async () => {
    if (!modelId) return;
    
    try {
      setIsLoadingModelVersions(true);
      setError('');
      
      // 调用真实的API获取模型版本列表
      const versions = await aihcApiService.getModelVersions(modelId);
      
      setModelVersions(versions);
      
      // 使用函数式更新来获取最新的config状态
      setConfig(currentConfig => {
        // 如果当前选择的版本不在新列表中，清空选择
        if (currentConfig.modelVersion && !versions.find((version: any) => version.versionId === currentConfig.modelVersion)) {
          const updatedConfig = { ...currentConfig, modelVersion: '' };
          form.setFieldsValue(updatedConfig);
          return updatedConfig;
        } else if (versions.length > 0 && !currentConfig.modelVersion) {
          // 如果没有选择版本且有可用版本，默认选中第一个
          const firstVersion = versions[0];
          const updatedConfig = { 
            ...currentConfig, 
            modelVersion: firstVersion.versionId
          };
          form.setFieldsValue(updatedConfig);
          setSelectedVersionInfo(firstVersion);
          return updatedConfig;
        }
        return currentConfig;
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取模型版本列表失败';
      setError(errorMessage);
      console.error('获取模型版本列表失败:', err);
    } finally {
      setIsLoadingModelVersions(false);
    }
  };

  // 获取资源池列表
  const fetchResourcePools = async (resourcePoolType: '自运维' | '全托管') => {
    try {
      setIsLoadingResourcePools(true);
      setError('');
      
      const pools = resourcePoolType === '自运维' 
        ? await aihcApiService.getSelfManagedResourcePools()
        : await aihcApiService.getFullyManagedResourcePools();
      
      setResourcePools(pools);
      
      // 使用函数式更新来获取最新的config状态
      setConfig(currentConfig => {
        // 如果当前选择的资源池不在新列表中，清空选择
        if (currentConfig.resourcePoolId && !pools.find((pool: any) => pool.resourcePoolId === currentConfig.resourcePoolId)) {
          const updatedConfig = { ...currentConfig, resourcePoolId: '', queueId: '' };
          form.setFieldsValue(updatedConfig);
          setQueues([]);
          return updatedConfig;
        } else if (pools.length > 0 && !currentConfig.resourcePoolId) {
          // 如果没有选择资源池且有可用资源池，默认选中第一个
          const firstPool = pools[0];
          const updatedConfig = { 
            ...currentConfig, 
            resourcePoolId: firstPool.resourcePoolId,
            queueId: ''
          };
          form.setFieldsValue(updatedConfig);
          setQueues([]);
          
          // 自动获取队列
          fetchQueues(firstPool.resourcePoolId, resourcePoolType);
          return updatedConfig;
        }
        return currentConfig;
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取资源池列表失败';
      setError(errorMessage);
      console.error('获取资源池列表失败:', err);
    } finally {
      setIsLoadingResourcePools(false);
    }
  };

  // 获取队列列表
  const fetchQueues = async (resourcePoolId: string, resourcePoolType: '自运维' | '全托管') => {
    if (!resourcePoolId) return;
    
    try {
      setIsLoadingQueues(true);
      setError('');
      
      const queueList = resourcePoolType === '自运维'
        ? await aihcApiService.getSelfManagedQueues(resourcePoolId)
        : await aihcApiService.getFullyManagedQueues();
      
      setQueues(queueList);
      
      // 使用函数式更新来获取最新的config状态
      setConfig(currentConfig => {
        // 如果当前选择的队列不在新列表中，清空选择
        if (currentConfig.queueId && !queueList.find((queue: any) => queue.queueId === currentConfig.queueId)) {
          const updatedConfig = { ...currentConfig, queueId: '' };
          form.setFieldsValue(updatedConfig);
          return updatedConfig;
        } else if (queueList.length > 0 && !currentConfig.queueId) {
          // 如果没有选择队列且有可用队列，默认选中第一个
          const firstQueue = queueList[0];
          const updatedConfig = { 
            ...currentConfig, 
            queueId: firstQueue.queueId
          };
          form.setFieldsValue(updatedConfig);
          return updatedConfig;
        }
        return currentConfig;
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取队列列表失败';
      setError(errorMessage);
      console.error('获取队列列表失败:', err);
    } finally {
      setIsLoadingQueues(false);
    }
  };

  // 组件挂载时获取模型版本和自运维资源池列表
  useEffect(() => {
    fetchModelVersions();
    fetchResourcePools('自运维');
  }, []);

  // 处理模型版本变化
  const handleModelVersionChange = (value: string) => {
    const updatedConfig = { ...config, modelVersion: value };
    setConfig(updatedConfig);
    form.setFieldsValue(updatedConfig);
    
    // 设置选中版本的详细信息
    const selectedVersion = modelVersions.find(version => version.versionId === value);
    setSelectedVersionInfo(selectedVersion || null);
  };

  // 处理资源池类型变化
  const handleResourcePoolTypeChange = (value: '自运维' | '全托管') => {
    const updatedConfig = { ...config, resourcePoolType: value, resourcePoolId: '', queueId: '' };
    setConfig(updatedConfig);
    form.setFieldsValue(updatedConfig);
    setResourcePools([]);
    setQueues([]);
    fetchResourcePools(value);
  };

  // 处理资源池变化
  const handleResourcePoolChange = (value: string) => {
    const updatedConfig = { ...config, resourcePoolId: value, queueId: '' };
    setConfig(updatedConfig);
    form.setFieldsValue(updatedConfig);
    setQueues([]);
    fetchQueues(value, config.resourcePoolType);
  };

  // 处理队列变化
  const handleQueueChange = (value: string) => {
    const updatedConfig = { ...config, queueId: value };
    setConfig(updatedConfig);
    form.setFieldsValue(updatedConfig);
  };

  // 处理加速框架变化
  const handleAccelerationFrameworkChange = (value: string) => {
    const updatedConfig = { ...config, accelerationFramework: value };
    setConfig(updatedConfig);
    form.setFieldsValue(updatedConfig);
  };

  // 处理启动命令变化
  const handleStartupCommandChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updatedConfig = { ...config, startupCommand: e.target.value };
    setConfig(updatedConfig);
    form.setFieldsValue(updatedConfig);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);
      setError('');
      setShowResult(false);

      const deploymentConfig: ModelDeploymentConfig = {
        modelVersion: values.modelVersion,
        accelerationFramework: values.accelerationFramework,
        resourcePoolType: values.resourcePoolType,
        resourcePoolId: values.resourcePoolId,
        queueId: values.queueId,
        startupCommand: values.startupCommand,
        modelId: modelId || ''
      };

      console.log('🚀 提交模型服务部署任务:', deploymentConfig);

      // 这里应该调用实际的部署API
      // 暂时模拟成功响应
      await new Promise(resolve => setTimeout(resolve, 2000));

      const result = {
        success: true,
        serviceId: `service-${Date.now()}`,
        message: '模型服务部署任务已创建成功'
      };

      setDeploymentResult(result);
      setShowResult(true);
      message.success('模型服务部署任务创建成功');

      // 通知父组件
      if (onSubmit) {
        await onSubmit(deploymentConfig);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '提交失败，请重试';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setError('');
    setShowResult(false);
    setDeploymentResult(null);
    setConfig({
      modelVersion: '',
      accelerationFramework: '',
      resourcePoolType: '自运维',
      resourcePoolId: '',
      queueId: '',
      startupCommand: '',
      modelId: modelId || ''
    });
    setModelVersions([]);
    setResourcePools([]);
    setQueues([]);
    setSelectedVersionInfo(null);
    fetchModelVersions();
    fetchResourcePools('自运维');
  };

  return (
    <div style={{ padding: '8px' }}>
      {/* 表单标题 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '12px',
        padding: '8px 0',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <RocketOutlined style={{ color: '#1890ff', marginRight: '6px' }} />
        <span style={{ fontSize: '13px', fontWeight: 600 }}>🚀 模型服务部署</span>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          modelVersion: '',
          accelerationFramework: '',
          resourcePoolType: '自运维',
          resourcePoolId: '',
          queueId: '',
          startupCommand: ''
        }}
        style={{ margin: 0 }}
      >
        {/* 模型版本 */}
        <Form.Item 
          name="modelVersion"
          rules={[{ required: true, message: '请选择模型版本' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>模型版本 <span style={{ color: '#ff4d4f' }}>*</span></span>}
        >
          <Select
            placeholder={isLoadingModelVersions ? "加载中..." : "请选择模型版本"}
            onChange={handleModelVersionChange}
            disabled={isLoadingModelVersions}
            value={config.modelVersion}
            style={{ width: '100%', fontSize: '11px' }}
            notFoundContent={isLoadingModelVersions ? <Spin size="small" /> : "暂无数据"}
          >
            {modelVersions.map(version => (
              <Option key={version.versionId} value={version.versionId}>
                {version.versionName} - {version.description}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 选中版本路径信息 */}
        {selectedVersionInfo && (
          <div style={{ 
            marginBottom: '8px',
            padding: '8px',
            backgroundColor: '#f6f8fa',
            borderRadius: '4px',
            border: '1px solid #e1e4e8'
          }}>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
              📁 选中版本路径信息
            </div>
            <div style={{ fontSize: '10px', color: '#495057', fontFamily: 'monospace' }}>
              <div style={{ marginBottom: '2px' }}>
                <strong>存储桶:</strong> {selectedVersionInfo.storageBucket}
              </div>
              <div style={{ marginBottom: '2px' }}>
                <strong>存储路径:</strong> {selectedVersionInfo.storagePath}
              </div>
              <div style={{ marginBottom: '2px' }}>
                <strong>完整路径:</strong> bos://{selectedVersionInfo.storageBucket}{selectedVersionInfo.storagePath}
              </div>
              <div style={{ marginBottom: '2px' }}>
                <strong>创建时间:</strong> {selectedVersionInfo.createTime}
              </div>
              <div>
                <strong>创建用户:</strong> {selectedVersionInfo.createUser}
              </div>
            </div>
          </div>
        )}

        {/* 加速框架 */}
        <Form.Item 
          name="accelerationFramework"
          rules={[{ required: true, message: '请选择加速框架' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>加速框架 <span style={{ color: '#ff4d4f' }}>*</span></span>}
        >
          <Select
            placeholder="请选择加速框架"
            onChange={handleAccelerationFrameworkChange}
            style={{ width: '100%', fontSize: '11px' }}
          >
            {accelerationFrameworks.map(framework => (
              <Option key={framework.value} value={framework.value}>
                {framework.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 资源池类型 */}
        <Form.Item 
          name="resourcePoolType"
          rules={[{ required: true, message: '请选择资源池类型' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>资源池类型 <span style={{ color: '#ff4d4f' }}>*</span></span>}
        >
          <Select
            placeholder="请选择资源池类型"
            onChange={handleResourcePoolTypeChange}
            style={{ width: '100%', fontSize: '11px' }}
          >
            <Option value="自运维">自运维</Option>
            <Option value="全托管">全托管</Option>
          </Select>
        </Form.Item>

        {/* 资源池 */}
        <Form.Item 
          name="resourcePoolId"
          rules={[{ required: true, message: '请选择资源池' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>资源池 <span style={{ color: '#ff4d4f' }}>*</span></span>}
        >
          <Select
            placeholder={isLoadingResourcePools ? "加载中..." : "请选择资源池"}
            onChange={handleResourcePoolChange}
            disabled={isLoadingResourcePools || !config.resourcePoolType}
            value={config.resourcePoolId}
            style={{ width: '100%', fontSize: '11px' }}
            notFoundContent={isLoadingResourcePools ? <Spin size="small" /> : "暂无数据"}
          >
            {resourcePools.map(pool => (
              <Option key={pool.resourcePoolId} value={pool.resourcePoolId}>
                {pool.name || pool.resourcePoolId}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 队列 */}
        <Form.Item 
          name="queueId"
          rules={[{ required: true, message: '请选择队列' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>队列 <span style={{ color: '#ff4d4f' }}>*</span></span>}
        >
          <Select
            placeholder={isLoadingQueues ? "加载中..." : "请选择队列"}
            onChange={handleQueueChange}
            disabled={isLoadingQueues || !config.resourcePoolId}
            value={config.queueId}
            style={{ width: '100%', fontSize: '11px' }}
            notFoundContent={isLoadingQueues ? <Spin size="small" /> : "暂无数据"}
          >
            {queues.map(queue => (
              <Option key={queue.queueId} value={queue.queueId}>
                {queue.queueName || queue.queueId}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 启动命令 */}
        <Form.Item 
          name="startupCommand"
          rules={[{ required: true, message: '请输入启动命令' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>启动命令 <span style={{ color: '#ff4d4f' }}>*</span></span>}
          extra={<span style={{ fontSize: '10px', color: '#999' }}>模型的启动命令，支持多行输入</span>}
        >
          <TextArea
            placeholder="请输入启动命令&#10;例如：python app.py --model-path /mnt/model --port 8000"
            onChange={handleStartupCommandChange}
            rows={4}
            style={{ fontSize: '11px', resize: 'vertical' }}
          />
        </Form.Item>

        {/* 错误提示 */}
        {error && (
          <Alert
            message="操作失败"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError('')}
            style={{ marginBottom: '8px', fontSize: '11px' }}
            closeIcon={
              <span style={{ 
                color: '#fff !important', 
                fontSize: '12px !important',
                fontWeight: 'bold !important',
                cursor: 'pointer !important',
                padding: '0 !important',
                margin: '0 !important',
                borderRadius: '2px !important',
                backgroundColor: 'rgba(255, 255, 255, 0.2) !important',
                border: 'none !important',
                outline: 'none !important',
                boxShadow: 'none !important',
                transition: 'background-color 0.2s',
                display: 'inline-flex !important',
                alignItems: 'center !important',
                justifyContent: 'center !important',
                minWidth: '16px !important',
                maxWidth: '16px !important',
                width: '16px !important',
                height: '16px !important',
                lineHeight: '1 !important',
                textAlign: 'center',
                verticalAlign: 'middle !important'
              }}>
                ×
              </span>
            }
          />
        )}

        {/* 部署结果提示 */}
        {showResult && deploymentResult && (
          <Alert
            message={deploymentResult.success ? '部署任务创建成功' : '部署任务创建失败'}
            description={
              deploymentResult.success ? (
                <div>
                  <div style={{ fontSize: '11px' }}>服务ID: <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>{deploymentResult.serviceId}</span></div>
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>{deploymentResult.message}</div>
                </div>
              ) : (
                <div style={{ fontSize: '11px' }}>{deploymentResult.message}</div>
              )
            }
            type={deploymentResult.success ? 'success' : 'error'}
            showIcon
            closable
            onClose={() => setShowResult(false)}
            style={{ marginBottom: '8px', fontSize: '11px' }}
            closeIcon={
              <span style={{ 
                color: '#fff !important', 
                fontSize: '12px !important',
                fontWeight: 'bold !important',
                cursor: 'pointer !important',
                padding: '0 !important',
                margin: '0 !important',
                borderRadius: '2px !important',
                backgroundColor: 'rgba(255, 255, 255, 0.2) !important',
                border: 'none !important',
                outline: 'none !important',
                boxShadow: 'none !important',
                transition: 'background-color 0.2s',
                display: 'inline-flex !important',
                alignItems: 'center !important',
                justifyContent: 'center !important',
                minWidth: '16px !important',
                maxWidth: '16px !important',
                width: '16px !important',
                height: '16px !important',
                lineHeight: '1 !important',
                textAlign: 'center',
                verticalAlign: 'middle !important'
              }}>
                ×
              </span>
            }
          />
        )}

        {/* 提交按钮 */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
          <Button
            type="primary"
            htmlType="submit"
            onClick={handleSubmit}
            loading={isSubmitting}
            icon={<SendOutlined />}
            style={{ fontSize: '11px', height: '28px', flex: 1 }}
          >
            立即部署
          </Button>
          
          <Button
            onClick={handleReset}
            icon={<ReloadOutlined />}
            style={{ fontSize: '11px', height: '28px', flex: 1 }}
          >
            重置
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ModelDeploymentForm;
