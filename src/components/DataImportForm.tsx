import React, { useState, useEffect, useRef } from 'react';
import { Form, Select, Input, Button, message, Alert, Spin } from 'antd';
import { SendOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import { aihcApiService, ResourcePool, Queue } from '../services/aihcApi';

const { Option } = Select;
const { TextArea } = Input;

// 请求管理器类型定义
interface RequestManager {
  resourcePoolsController: AbortController | null;
  queuesController: AbortController | null;
  resourcePoolsSequence: number;
  queuesSequence: number;
  currentResourcePoolType: '自运维' | '全托管' | null;
}

interface DataImportFormProps {
  datasetId?: string;
  onSubmit?: (config: DataImportConfig) => Promise<void>;
}

interface DataImportConfig {
  datasetVersion: string;
  importType: 'HuggingFace' | 'ModelScope' | '数据集';
  importUrl: string;
  resourcePoolType: '自运维' | '全托管';
  resourcePoolId: string;
  queueId: string;
  datasetId?: string;
}

const DataImportForm: React.FC<DataImportFormProps> = ({ datasetId, onSubmit }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  
  // 加载状态
  const [isLoadingDatasetVersions, setIsLoadingDatasetVersions] = useState(false);
  const [isLoadingResourcePools, setIsLoadingResourcePools] = useState(false);
  const [isLoadingQueues, setIsLoadingQueues] = useState(false);
  
  // 选项数据
  const [datasetVersions, setDatasetVersions] = useState<any[]>([]);
  const [resourcePools, setResourcePools] = useState<ResourcePool[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [selectedVersionInfo, setSelectedVersionInfo] = useState<any>(null);
  const [datasetInfo, setDatasetInfo] = useState<any>(null);
  
  // 请求管理器
  const requestManagerRef = useRef<RequestManager>({
    resourcePoolsController: null,
    queuesController: null,
    resourcePoolsSequence: 0,
    queuesSequence: 0,
    currentResourcePoolType: null
  });
  
  // 表单配置
  const [config, setConfig] = useState<DataImportConfig>({
    datasetVersion: '',
    importType: 'HuggingFace',
    importUrl: '',
    resourcePoolType: '自运维',
    resourcePoolId: '',
    queueId: '',
    datasetId: datasetId || ''
  });

  // 获取数据集详情
  const fetchDatasetInfo = async () => {
    if (!datasetId) return;
    
    try {
      const apiUrl = `https://console.bce.baidu.com/api/aihc/asset/v1/datasets/${datasetId}?locale=zh-cn&_=${Date.now()}`;
      const response = await fetch(apiUrl, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.result) {
          setDatasetInfo({
            datasetType: data.result.storageType || 'BOS',
            datasetName: data.result.name || '',
            storageInstance: data.result.storageInstance || '',
            datasetId: datasetId
          });
        }
      }
    } catch (error) {
      console.warn('获取数据集详情失败:', error);
    }
  };

  // 获取数据集版本列表
  const fetchDatasetVersions = async () => {
    if (!datasetId) return;
    
    try {
      setIsLoadingDatasetVersions(true);
      setError('');
      
      // 调用真实的API获取数据集版本列表
      const versions = await aihcApiService.getDatasetVersions(datasetId);
      
      setDatasetVersions(versions);
      
      // 使用函数式更新来获取最新的config状态
      setConfig(currentConfig => {
        if (currentConfig.datasetVersion && !versions.find((version: any) => version.versionId === currentConfig.datasetVersion)) {
          const updatedConfig = { ...currentConfig, datasetVersion: '' };
          form.setFieldsValue(updatedConfig);
          return updatedConfig;
        } else if (versions.length > 0 && !currentConfig.datasetVersion) {
          // 如果没有选择版本且有可用版本，默认选中第一个
          const firstVersion = versions[0];
          const updatedConfig = { 
            ...currentConfig, 
            datasetVersion: firstVersion.versionId
          };
          form.setFieldsValue(updatedConfig);
          setSelectedVersionInfo(firstVersion);
          return updatedConfig;
        }
        return currentConfig;
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取数据集版本列表失败';
      setError(errorMessage);
      console.error('获取数据集版本列表失败:', err);
    } finally {
      setIsLoadingDatasetVersions(false);
    }
  };

  // 获取资源池列表
  const fetchResourcePools = async (resourcePoolType: '自运维' | '全托管') => {
    const manager = requestManagerRef.current;
    
    if (manager.resourcePoolsController) {
      manager.resourcePoolsController.abort();
    }
    
    manager.resourcePoolsController = new AbortController();
    manager.resourcePoolsSequence += 1;
    manager.currentResourcePoolType = resourcePoolType;
    const currentSequence = manager.resourcePoolsSequence;
    
    setIsLoadingResourcePools(true);
    setError('');
    
    try {
      const pools = resourcePoolType === '自运维'
        ? await aihcApiService.getSelfManagedResourcePools(manager.resourcePoolsController)
        : await aihcApiService.getFullyManagedResourcePools(manager.resourcePoolsController);
      
      if (currentSequence === manager.resourcePoolsSequence &&
          manager.currentResourcePoolType === resourcePoolType) {
        setResourcePools(pools);
        
        // 使用函数式更新来获取最新的config状态
        setConfig(currentConfig => {
          // 如果当前选择的资源池不在新列表中，清空选择
          if (currentConfig.resourcePoolId && !pools.find((pool: ResourcePool) => pool.resourcePoolId === currentConfig.resourcePoolId)) {
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
            fetchQueues(firstPool.resourcePoolId);
            return updatedConfig;
          }
          return currentConfig;
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('获取资源池失败:', error);
        setError('获取资源池失败');
        message.error('获取资源池失败');
      }
    } finally {
      setIsLoadingResourcePools(false);
    }
  };

  // 获取队列列表
  const fetchQueues = async (resourcePoolId: string) => {
    const manager = requestManagerRef.current;
    
    if (manager.queuesController) {
      manager.queuesController.abort();
    }
    
    manager.queuesController = new AbortController();
    manager.queuesSequence += 1;
    const currentSequence = manager.queuesSequence;
    
    setIsLoadingQueues(true);
    setError('');
    
    try {
      const queues = config.resourcePoolType === '自运维'
        ? await aihcApiService.getSelfManagedQueues(resourcePoolId, manager.queuesController)
        : await aihcApiService.getFullyManagedQueues(manager.queuesController);
      
      if (currentSequence === manager.queuesSequence) {
        setQueues(queues);
        
        // 使用函数式更新来获取最新的config状态
        setConfig(currentConfig => {
          // 如果当前选择的队列不在新列表中，清空选择
          if (currentConfig.queueId && !queues.find((queue: Queue) => queue.queueId === currentConfig.queueId)) {
            const updatedConfig = { ...currentConfig, queueId: '' };
            form.setFieldsValue(updatedConfig);
            return updatedConfig;
          } else if (queues.length > 0 && !currentConfig.queueId) {
            // 如果没有选择队列且有可用队列，默认选中第一个
            const firstQueue = queues[0];
            const updatedConfig = { 
              ...currentConfig, 
              queueId: firstQueue.queueId
            };
            form.setFieldsValue(updatedConfig);
            return updatedConfig;
          }
          return currentConfig;
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('获取队列失败:', error);
        setError('获取队列失败');
        message.error('获取队列失败');
      }
    } finally {
      setIsLoadingQueues(false);
    }
  };

  // 组件挂载时获取数据集版本和自运维资源池列表
  useEffect(() => {
    if (datasetId) {
      fetchDatasetInfo();
    }
    fetchDatasetVersions();
    fetchResourcePools('自运维');
  }, [datasetId]);

  // 处理数据集版本变化
  const handleDatasetVersionChange = (value: string) => {
    const updatedConfig = { ...config, datasetVersion: value };
    setConfig(updatedConfig);
    form.setFieldsValue(updatedConfig);
    
    // 设置选中版本的详细信息
    const selectedVersion = datasetVersions.find(version => version.versionId === value);
    setSelectedVersionInfo(selectedVersion || null);
  };

  // 处理导入方式变化
  const handleImportTypeChange = () => {
    // 清空导入地址字段
    form.setFieldsValue({
      importUrl: ''
    });
  };

  // 处理资源池类型变化
  const handleResourcePoolTypeChange = (value: string) => {
    const updatedConfig = { 
      ...config, 
      resourcePoolType: value as '自运维' | '全托管',
      resourcePoolId: '',
      queueId: ''
    };
    setConfig(updatedConfig);
    form.setFieldsValue(updatedConfig);
    setResourcePools([]);
    setQueues([]);
    
    if (value) {
      fetchResourcePools(value as '自运维' | '全托管');
    }
  };

  // 处理资源池变化
  const handleResourcePoolChange = (value: string) => {
    const updatedConfig = { 
      ...config, 
      resourcePoolId: value,
      queueId: ''
    };
    setConfig(updatedConfig);
    form.setFieldsValue(updatedConfig);
    setQueues([]);
    
    if (value) {
      fetchQueues(value);
    }
  };

  // 处理队列变化
  const handleQueueChange = (value: string) => {
    const updatedConfig = { ...config, queueId: value };
    setConfig(updatedConfig);
    form.setFieldsValue(updatedConfig);
  };

  // 处理导入地址变化
  const handleImportUrlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updatedConfig = { ...config, importUrl: e.target.value };
    setConfig(updatedConfig);
    form.setFieldsValue(updatedConfig);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);
      setError('');
      setShowResult(false);

      const config: DataImportConfig = {
        datasetVersion: values.datasetVersion,
        importType: values.importType,
        importUrl: values.importUrl,
        resourcePoolType: values.resourcePoolType,
        resourcePoolId: values.resourcePoolId,
        queueId: values.queueId,
        datasetId: datasetId || ''
      };

      console.log('🚀 提交数据导入任务:', config);

      // 这里应该调用实际的导入API
      // 暂时模拟成功响应
      await new Promise(resolve => setTimeout(resolve, 2000));

      const result = {
        success: true,
        taskId: `import-${Date.now()}`,
        message: '数据导入任务已创建成功'
      };

      setImportResult(result);
      setShowResult(true);
      message.success('数据导入任务创建成功');

      // 通知父组件
      if (onSubmit) {
        await onSubmit(config);
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
    setImportResult(null);
    setConfig({
      datasetVersion: '',
      importType: 'HuggingFace',
      importUrl: '',
      resourcePoolType: '自运维',
      resourcePoolId: '',
      queueId: '',
      datasetId: datasetId || ''
    });
    setDatasetVersions([]);
    setResourcePools([]);
    setQueues([]);
    setSelectedVersionInfo(null);
    fetchDatasetVersions();
    fetchResourcePools('自运维');
  };

  return (
    <div style={{ padding: '8px' }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          datasetVersion: '',
          importType: 'HuggingFace',
          importUrl: '',
          resourcePoolType: '自运维',
          resourcePoolId: '',
          queueId: ''
        }}
        style={{ margin: 0 }}
      >
        {/* 数据集基本信息 */}
        {datasetInfo && (
          <div style={{ 
            marginBottom: '8px',
            padding: '8px',
            backgroundColor: '#f0f8ff',
            borderRadius: '4px',
            border: '1px solid #b3d9ff'
          }}>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
              📊 数据集基本信息
            </div>
            <div style={{ fontSize: '10px', color: '#495057', fontFamily: 'monospace' }}>
              <div style={{ marginBottom: '2px' }}>
                <strong>存储类型:</strong> {datasetInfo.datasetType}
              </div>
              <div>
                <strong>存储实例ID:</strong> {datasetInfo.storageInstance}
              </div>
            </div>
          </div>
        )}

        {/* 数据集版本 */}
        <Form.Item 
          name="datasetVersion"
          rules={[{ required: true, message: '请选择数据集版本' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>数据集版本 <span style={{ color: '#ff4d4f' }}>*</span></span>}
        >
          <Select
            placeholder={isLoadingDatasetVersions ? "加载中..." : "请选择数据集版本"}
            onChange={handleDatasetVersionChange}
            disabled={isLoadingDatasetVersions}
            value={config.datasetVersion}
            style={{ width: '100%', fontSize: '11px' }}
            notFoundContent={isLoadingDatasetVersions ? <Spin size="small" /> : "暂无数据"}
          >
            {datasetVersions.map(version => (
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
                <strong>版本号:</strong> {selectedVersionInfo.versionName}
              </div>
              <div style={{ marginBottom: '2px' }}>
                <strong>默认挂载路径:</strong> {selectedVersionInfo.mountPath}
              </div>
              <div>
                <strong>存储路径:</strong> {selectedVersionInfo.storagePath}
              </div>
            </div>
          </div>
        )}

        {/* 导入方式 */}
        <Form.Item 
          name="importType"
          rules={[{ required: true, message: '请选择导入方式' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>导入方式 <span style={{ color: '#ff4d4f' }}>*</span></span>}
        >
          <Select
            placeholder="请选择导入方式"
            onChange={handleImportTypeChange}
            style={{ width: '100%', fontSize: '11px' }}
          >
            <Option value="HuggingFace">🤗 HuggingFace</Option>
            <Option value="ModelScope">🏛️ ModelScope</Option>
            <Option value="数据集">📊 数据集</Option>
          </Select>
        </Form.Item>

        {/* 导入地址 */}
        <Form.Item 
          name="importUrl"
          rules={[{ required: true, message: '请输入导入地址' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>导入地址 <span style={{ color: '#ff4d4f' }}>*</span></span>}
          extra={<span style={{ fontSize: '10px', color: '#999' }}>支持多行输入，每行一个地址</span>}
        >
          <TextArea
            placeholder="请输入导入地址&#10;支持多行输入，每行一个地址"
            rows={3}
            onChange={handleImportUrlChange}
            style={{ fontSize: '11px', resize: 'vertical' }}
          />
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
            value={config.resourcePoolType}
            onChange={handleResourcePoolTypeChange}
            suffixIcon={<SettingOutlined />}
            style={{ width: '100%', fontSize: '11px' }}
          >
            <Option value="自运维">自运维资源池</Option>
            <Option value="全托管">全托管资源池</Option>
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
            placeholder="请选择资源池"
            value={config.resourcePoolId}
            onChange={handleResourcePoolChange}
            loading={isLoadingResourcePools}
            disabled={isLoadingResourcePools || !config.resourcePoolType}
            notFoundContent={isLoadingResourcePools ? <Spin size="small" /> : '暂无数据'}
            style={{ width: '100%', fontSize: '11px' }}
          >
            {resourcePools.map((pool: ResourcePool) => (
              <Option key={pool.resourcePoolId} value={pool.resourcePoolId}>
                {pool.name} ({pool.phase})
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
            placeholder="请选择队列"
            value={config.queueId}
            onChange={handleQueueChange}
            loading={isLoadingQueues}
            disabled={isLoadingQueues || !config.resourcePoolId}
            notFoundContent={isLoadingQueues ? <Spin size="small" /> : '暂无数据'}
            style={{ width: '100%', fontSize: '11px' }}
          >
            {queues.map((queue: Queue) => (
              <Option key={queue.queueId} value={queue.queueId}>
                {queue.queueName} ({queue.phase})
              </Option>
            ))}
          </Select>
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

        {/* 导入结果提示 */}
        {showResult && importResult && (
          <Alert
            message={importResult.success ? '导入任务创建成功' : '导入任务创建失败'}
            description={
              importResult.success ? (
                <div>
                  <div style={{ fontSize: '11px' }}>任务ID: <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>{importResult.taskId}</span></div>
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>{importResult.message}</div>
                </div>
              ) : (
                <div style={{ fontSize: '11px' }}>{importResult.message}</div>
              )
            }
            type={importResult.success ? 'success' : 'error'}
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
            提交导入任务
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

export default DataImportForm;
