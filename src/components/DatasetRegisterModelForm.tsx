import React, { useState, useEffect, useRef } from 'react';
import { Form, Select, Input, Button, message, Alert, Spin } from 'antd';
import { SendOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import { aihcApiService, ResourcePool, Queue } from '../services/aihcApi';

const { Option } = Select;
const { TextArea } = Input;

interface DatasetRegisterModelFormProps {
  datasetId: string;
  datasetType?: string;
  onSubmit?: (config: any) => Promise<void>;
}

interface RequestManager {
  datasetVersionsController: AbortController | null;
  resourcePoolsController: AbortController | null;
  queuesController: AbortController | null;
  datasetVersionsSequence: number;
  resourcePoolsSequence: number;
  queuesSequence: number;
  currentResourcePoolType: '自运维' | '全托管' | null;
}

const DatasetRegisterModelForm: React.FC<DatasetRegisterModelFormProps> = ({ datasetId, datasetType, onSubmit }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // 加载状态
  const [isLoadingDatasetVersions, setIsLoadingDatasetVersions] = useState(false);
  const [isLoadingResourcePools, setIsLoadingResourcePools] = useState(false);
  const [isLoadingQueues, setIsLoadingQueues] = useState(false);
  
  // 选项数据
  const [datasetVersions, setDatasetVersions] = useState<any[]>([]);
  const [resourcePools, setResourcePools] = useState<ResourcePool[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [selectedVersionInfo, setSelectedVersionInfo] = useState<any>(null);
  
  // 请求管理器
  const requestManagerRef = useRef<RequestManager>({
    datasetVersionsController: null,
    resourcePoolsController: null,
    queuesController: null,
    datasetVersionsSequence: 0,
    resourcePoolsSequence: 0,
    queuesSequence: 0,
    currentResourcePoolType: null
  });

  // 表单配置
  const [config, setConfig] = useState({
    datasetVersion: '',
    modelName: '',
    modelDescription: '',
    resourcePoolType: '自运维' as '自运维' | '全托管',
    resourcePoolId: '',
    queueId: ''
  });

  // 获取数据集版本
  const fetchDatasetVersions = async () => {
    if (!datasetId) return;
    
    const manager = requestManagerRef.current;
    if (manager.datasetVersionsController) {
      manager.datasetVersionsController.abort();
    }
    manager.datasetVersionsController = new AbortController();
    manager.datasetVersionsSequence += 1;
    const currentSequence = manager.datasetVersionsSequence;

    try {
      setIsLoadingDatasetVersions(true);
      const versions = await aihcApiService.getDatasetVersions(datasetId, manager.datasetVersionsController);
      
      if (manager.datasetVersionsSequence !== currentSequence) return;
      
      setDatasetVersions(versions);
      
      // 自动选择第一个版本
      if (versions.length > 0) {
        const firstVersion = versions[0];
        setConfig(currentConfig => ({
          ...currentConfig,
          datasetVersion: firstVersion.versionId
        }));
        setSelectedVersionInfo(firstVersion);
        form.setFieldsValue({
          datasetVersion: firstVersion.versionId,
          modelName: '',
          modelDescription: ''
        });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('获取数据集版本失败:', err);
      message.error('获取数据集版本失败');
    } finally {
      if (manager.datasetVersionsSequence === currentSequence) {
        setIsLoadingDatasetVersions(false);
      }
    }
  };

  // 获取资源池
  const fetchResourcePools = async (resourcePoolType: '自运维' | '全托管') => {
    const manager = requestManagerRef.current;
    if (manager.resourcePoolsController) {
      manager.resourcePoolsController.abort();
    }
    manager.resourcePoolsController = new AbortController();
    manager.resourcePoolsSequence += 1;
    manager.currentResourcePoolType = resourcePoolType;
    const currentSequence = manager.resourcePoolsSequence;

    try {
      setIsLoadingResourcePools(true);
      let pools: ResourcePool[] = [];
      
      if (resourcePoolType === '自运维') {
        pools = await aihcApiService.getSelfManagedResourcePools(manager.resourcePoolsController);
      } else {
        pools = await aihcApiService.getFullyManagedResourcePools(manager.resourcePoolsController);
      }
      
      if (manager.resourcePoolsSequence !== currentSequence) return;
      
      setResourcePools(pools);
      
      // 自动选择第一个资源池
      if (pools.length > 0) {
        const firstPool = pools[0];
        setConfig(currentConfig => ({
          ...currentConfig,
          resourcePoolId: firstPool.resourcePoolId
        }));
        form.setFieldsValue({
          resourcePoolId: firstPool.resourcePoolId
        });
        
        // 获取队列
        await fetchQueues(firstPool.resourcePoolId);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('获取资源池失败:', err);
      message.error('获取资源池失败');
    } finally {
      if (manager.resourcePoolsSequence === currentSequence) {
        setIsLoadingResourcePools(false);
      }
    }
  };

  // 获取队列
  const fetchQueues = async (resourcePoolId: string) => {
    const manager = requestManagerRef.current;
    if (manager.queuesController) {
      manager.queuesController.abort();
    }
    manager.queuesController = new AbortController();
    manager.queuesSequence += 1;
    const currentSequence = manager.queuesSequence;

    try {
      setIsLoadingQueues(true);
      let queueList: Queue[] = [];
      
      if (manager.currentResourcePoolType === '自运维') {
        queueList = await aihcApiService.getSelfManagedQueues(resourcePoolId, manager.queuesController);
      } else {
        queueList = await aihcApiService.getFullyManagedQueues(manager.queuesController);
      }
      
      if (manager.queuesSequence !== currentSequence) return;
      
      setQueues(queueList);
      
      // 自动选择第一个队列
      if (queueList.length > 0) {
        const firstQueue = queueList[0];
        setConfig(currentConfig => ({
          ...currentConfig,
          queueId: firstQueue.queueId
        }));
        form.setFieldsValue({
          queueId: firstQueue.queueId
        });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('获取队列失败:', err);
      message.error('获取队列失败');
    } finally {
      if (manager.queuesSequence === currentSequence) {
        setIsLoadingQueues(false);
      }
    }
  };

  // 初始化加载数据集版本
  useEffect(() => {
    fetchDatasetVersions();
  }, [datasetId]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);
      setError('');
      
      const registerConfig = {
        datasetId: datasetId,
        datasetVersion: values.datasetVersion,
        modelName: values.modelName,
        modelDescription: values.modelDescription,
        resourcePoolType: values.resourcePoolType,
        resourcePoolId: values.resourcePoolId,
        queueId: values.queueId
      };

      console.log('🚀 提交注册模型任务:', registerConfig);

      // 这里应该调用实际的注册模型API
      await new Promise(resolve => setTimeout(resolve, 2000));

      message.success('注册模型任务已创建成功');
      
      if (onSubmit) {
        await onSubmit(registerConfig);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '提交失败';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setError('');
    setConfig({
      datasetVersion: '',
      modelName: '',
      modelDescription: '',
      resourcePoolType: '自运维',
      resourcePoolId: '',
      queueId: ''
    });
    setResourcePools([]);
    setQueues([]);
    setSelectedVersionInfo(null);
  };

  const handleDatasetVersionChange = (value: string) => {
    const version = datasetVersions.find(v => v.versionId === value);
    if (version) {
      setSelectedVersionInfo(version);
    }
  };

  const handleResourcePoolTypeChange = (value: '自运维' | '全托管') => {
    setConfig(currentConfig => ({
      ...currentConfig,
      resourcePoolType: value,
      resourcePoolId: '',
      queueId: ''
    }));
    form.setFieldsValue({
      resourcePoolId: '',
      queueId: ''
    });
    setResourcePools([]);
    setQueues([]);
    fetchResourcePools(value);
  };

  const handleResourcePoolChange = (value: string) => {
    setConfig(currentConfig => ({
      ...currentConfig,
      resourcePoolId: value,
      queueId: ''
    }));
    form.setFieldsValue({
      queueId: ''
    });
    setQueues([]);
    fetchQueues(value);
  };

  // 检查数据集类型是否为BOS
  if (datasetType && datasetType !== 'BOS') {
    return (
      <div style={{ padding: '8px' }}>
        <Alert
          message="不支持的数据集类型"
          description={`当前数据集类型为 ${datasetType}，只有BOS类型的数据集支持注册模型功能。`}
          type="warning"
          showIcon
          style={{ fontSize: '11px' }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '8px' }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          datasetVersion: '',
          modelName: '',
          modelDescription: '',
          resourcePoolType: '自运维',
          resourcePoolId: '',
          queueId: ''
        }}
        style={{ margin: 0 }}
      >
        {/* 数据集版本 */}
        <Form.Item 
          name="datasetVersion"
          rules={[{ required: true, message: '请选择数据集版本' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>数据集版本 <span style={{ color: '#ff4d4f' }}>*</span></span>}
        >
          <Select
            placeholder="请选择数据集版本"
            value={config.datasetVersion}
            loading={isLoadingDatasetVersions}
            disabled={isLoadingDatasetVersions}
            notFoundContent={isLoadingDatasetVersions ? <Spin size="small" /> : '暂无数据'}
            onChange={handleDatasetVersionChange}
            style={{ width: '100%', fontSize: '11px' }}
          >
            {datasetVersions.map((version: any) => (
              <Option key={version.versionId} value={version.versionId}>
                {version.versionName} ({version.createTime})
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 选中版本信息 */}
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
                <strong>挂载路径:</strong> {selectedVersionInfo.mountPath}
              </div>
              <div style={{ marginBottom: '2px' }}>
                <strong>存储路径:</strong> {selectedVersionInfo.storagePath}
              </div>
              <div style={{ marginBottom: '2px' }}>
                <strong>创建时间:</strong> {selectedVersionInfo.createTime}
              </div>
              <div style={{ marginBottom: '2px' }}>
                <strong>创建用户:</strong> {selectedVersionInfo.createUser}
              </div>
              <div>
                <strong>更新时间:</strong> {selectedVersionInfo.updateTime}
              </div>
            </div>
          </div>
        )}

        {/* 模型名称 */}
        <Form.Item 
          name="modelName"
          rules={[{ required: true, message: '请输入模型名称' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>模型名称 <span style={{ color: '#ff4d4f' }}>*</span></span>}
        >
          <Input
            placeholder="请输入模型名称"
            style={{ fontSize: '11px' }}
          />
        </Form.Item>

        {/* 模型描述 */}
        <Form.Item 
          name="modelDescription"
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>模型描述</span>}
        >
          <TextArea
            placeholder="请输入模型描述"
            rows={2}
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
            loading={isLoadingResourcePools}
            disabled={isLoadingResourcePools || !config.resourcePoolType}
            notFoundContent={isLoadingResourcePools ? <Spin size="small" /> : '暂无数据'}
            onChange={handleResourcePoolChange}
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
          />
        )}

        {/* 提交按钮 */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          justifyContent: 'flex-end',
          marginTop: '12px'
        }}>
          <Button 
            type="primary" 
            onClick={handleSubmit}
            loading={isSubmitting}
            icon={<SendOutlined />}
            style={{ fontSize: '11px' }}
          >
            提交注册任务
          </Button>
          <Button 
            onClick={handleReset}
            icon={<ReloadOutlined />}
            style={{ fontSize: '11px' }}
          >
            重置
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default DatasetRegisterModelForm;
