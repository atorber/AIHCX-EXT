import React, { useState, useEffect, useRef } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  Button, 
  Typography, 
  message, 
  Spin,
  Alert
} from 'antd';
import { 
  DatabaseOutlined, 
  CloudOutlined, 
  SettingOutlined,
  SendOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { aihcApiService, ResourcePool, Queue, PFSInstance } from '../services/aihcApi';
import { createDataDumpTask, DataDumpTaskConfig, TaskCreateResponse } from '../services/dataDumpApi';

const { Text } = Typography;
const { Option } = Select;

interface DataDumpFormProps {
  datasetId: string;
  category: string;
  onSubmit?: (config: DataDumpConfig) => Promise<void>;
  onCancel?: () => void;
}

interface DataDumpConfig {
  datasetId: string;
  datasetName: string;
  resourcePoolType: '自运维' | '全托管';
  resourcePoolId: string;
  queueId: string;
  pfsId: string;
  storagePath: string;
  originalStoragePath?: string;
}

// 请求管理器类型
interface RequestManager {
  resourcePoolsController: AbortController | null;
  queuesController: AbortController | null;
  pfsInstancesController: AbortController | null;
  currentResourcePoolType: string;
  resourcePoolsSequence: number;
  queuesSequence: number;
  pfsInstancesSequence: number;
}

const DataDumpForm: React.FC<DataDumpFormProps> = ({ 
  datasetId, 
  category, 
  onSubmit: _onSubmit, 
  onCancel: _onCancel 
}) => {
  const [form] = Form.useForm();
  
  // 检查是否已经跳转到创建任务页面
  const [isRedirected, setIsRedirected] = useState(false);
  
  // 任务状态管理
  const [taskResult, setTaskResult] = useState<TaskCreateResponse | null>(null);
  const [showTaskResult, setShowTaskResult] = useState(false);
  
  // 表单状态
  const [config, setConfig] = useState<DataDumpConfig>({
    datasetId,
    datasetName: '',
    resourcePoolType: '自运维',
    resourcePoolId: '',
    queueId: '',
    pfsId: '',
    storagePath: '',
    originalStoragePath: ''
  });

  // 数据状态
  const [datasetInfo, setDatasetInfo] = useState<{ datasetName: string; datasetStoragePath: string } | null>(null);
  const [resourcePools, setResourcePools] = useState<ResourcePool[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [pfsInstances, setPfsInstances] = useState<PFSInstance[]>([]);
  
  // 加载状态
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingResourcePools, setIsLoadingResourcePools] = useState(false);
  const [isLoadingQueues, setIsLoadingQueues] = useState(false);
  const [isLoadingPfsInstances, setIsLoadingPfsInstances] = useState(false);
  
  // 错误状态
  const [error, setError] = useState<string>('');
  
  
  // 请求管理器
  const requestManagerRef = useRef<RequestManager>({
    resourcePoolsController: null,
    queuesController: null,
    pfsInstancesController: null,
    currentResourcePoolType: '',
    resourcePoolsSequence: 0,
    queuesSequence: 0,
    pfsInstancesSequence: 0
  });

  // 检查localStorage中是否有任务配置数据
  useEffect(() => {
    const checkSavedData = () => {
      try {
        const savedData = localStorage.getItem('aihc_data_dump_config');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          if (parsedData.datasetId === datasetId) {
            setIsRedirected(true);
            setConfig(parsedData);
            form.setFieldsValue(parsedData);
          }
        }
      } catch (error) {
        console.error('解析保存的数据失败:', error);
      }
    };

    checkSavedData();
  }, [datasetId, form]);


  // 获取数据集信息
  useEffect(() => {
    const fetchDatasetInfo = async () => {
      try {
        const datasetInfo = await aihcApiService.getDatasetInfo(datasetId);
        setDatasetInfo(datasetInfo);
        
        // 自动设置存储路径（移除bos:前缀）
        const storagePath = datasetInfo.datasetStoragePath.replace(/^bos:/, '');
        const originalStoragePath = datasetInfo.datasetStoragePath.replace(/^bos:/, '');
        const updatedConfig = {
          ...config,
          datasetName: datasetInfo.datasetName,
          storagePath,
          originalStoragePath
        };
        setConfig(updatedConfig);
        form.setFieldsValue(updatedConfig);
      } catch (error) {
        console.error('获取数据集信息失败:', error);
        message.error('获取数据集信息失败');
      }
    };

    if (datasetId) {
      fetchDatasetInfo();
    }
  }, [datasetId, form]);

  // 组件初始化时自动加载自运维资源池列表
  useEffect(() => {
    const initializeResourcePools = async () => {
      // 只有在没有保存的配置数据时才自动加载
      const savedData = localStorage.getItem('aihc_data_dump_config');
      if (!savedData || JSON.parse(savedData).datasetId !== datasetId) {
        console.log('[DataDumpForm] 初始化时自动加载自运维资源池列表');
        await fetchResourcePools('自运维');
      }
    };

    // 延迟执行，确保组件完全初始化
    const timer = setTimeout(initializeResourcePools, 100);
    return () => clearTimeout(timer);
  }, [datasetId]);

  // 获取资源池列表
  const fetchResourcePools = async (resourcePoolType: string) => {
    const manager = requestManagerRef.current;
    
    // 取消之前的请求
    if (manager.resourcePoolsController) {
      manager.resourcePoolsController.abort();
    }
    
    // 创建新的请求控制器
    manager.resourcePoolsController = new AbortController();
    manager.currentResourcePoolType = resourcePoolType;
    manager.resourcePoolsSequence += 1;
    const currentSequence = manager.resourcePoolsSequence;
    
    setIsLoadingResourcePools(true);
    setError('');
    
    try {
      const pools = resourcePoolType === '自运维' 
        ? await aihcApiService.getSelfManagedResourcePools(manager.resourcePoolsController)
        : await aihcApiService.getFullyManagedResourcePools(manager.resourcePoolsController);
      
      // 检查请求是否仍然有效
      if (currentSequence === manager.resourcePoolsSequence && 
          manager.currentResourcePoolType === resourcePoolType) {
        setResourcePools(pools);
        
        // 使用函数式更新来获取最新的config状态
        setConfig(currentConfig => {
          // 如果当前选择的资源池不在新列表中，清空选择
          if (currentConfig.resourcePoolId && !pools.find((pool: ResourcePool) => pool.resourcePoolId === currentConfig.resourcePoolId)) {
            const updatedConfig = { ...currentConfig, resourcePoolId: '', queueId: '', pfsId: '' };
            form.setFieldsValue(updatedConfig);
            setQueues([]);
            setPfsInstances([]);
            return updatedConfig;
          } else if (pools.length > 0 && !currentConfig.resourcePoolId) {
            // 如果没有选择资源池且有可用资源池，默认选中第一个
            const firstPool = pools[0];
            const updatedConfig = { 
              ...currentConfig, 
              resourcePoolId: firstPool.resourcePoolId,
              queueId: '',
              pfsId: ''
            };
            form.setFieldsValue(updatedConfig);
            setQueues([]);
            setPfsInstances([]);
            
            // 自动获取队列和PFS实例
            fetchQueues(firstPool.resourcePoolId);
            fetchPfsInstances(firstPool.resourcePoolId);
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
          // 根据资源池类型决定使用队列名称还是队列ID
          const getQueueValue = (queue: Queue) => 
            currentConfig.resourcePoolType === '自运维' ? queue.queueName : queue.queueId;
          
          // 如果当前选择的队列不在新列表中，清空选择
          if (currentConfig.queueId && !queues.find((queue: Queue) => getQueueValue(queue) === currentConfig.queueId)) {
            const updatedConfig = { ...currentConfig, queueId: '', pfsId: '' };
            form.setFieldsValue(updatedConfig);
            setPfsInstances([]);
            return updatedConfig;
          } else if (queues.length > 0 && !currentConfig.queueId) {
            // 如果没有选择队列且有可用队列，默认选中第一个
            const firstQueue = queues[0];
            const updatedConfig = { 
              ...currentConfig, 
              queueId: getQueueValue(firstQueue),
              pfsId: ''
            };
            form.setFieldsValue(updatedConfig);
            setPfsInstances([]);
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

  // 获取PFS实例列表
  const fetchPfsInstances = async (resourcePoolId: string) => {
    const manager = requestManagerRef.current;
    
    if (manager.pfsInstancesController) {
      manager.pfsInstancesController.abort();
    }
    
    manager.pfsInstancesController = new AbortController();
    manager.pfsInstancesSequence += 1;
    const currentSequence = manager.pfsInstancesSequence;
    
    setIsLoadingPfsInstances(true);
    setError('');
    
    try {
      const instances = await aihcApiService.getPFSInstances(
        resourcePoolId, 
        config.resourcePoolType === '自运维' ? 'common' : 'serverless',
        manager.pfsInstancesController
      );
      
      if (currentSequence === manager.pfsInstancesSequence) {
        setPfsInstances(instances);
        
        // 使用函数式更新来获取最新的config状态
        setConfig(currentConfig => {
          // 如果当前选择的PFS实例不在新列表中，清空选择
          if (currentConfig.pfsId && !instances.find((instance: PFSInstance) => instance.id === currentConfig.pfsId)) {
            const updatedConfig = { ...currentConfig, pfsId: '' };
            form.setFieldsValue(updatedConfig);
            return updatedConfig;
          } else if (instances.length > 0 && !currentConfig.pfsId) {
            // 如果没有选择PFS实例且有可用实例，默认选中第一个
            const firstInstance = instances[0];
            const updatedConfig = { 
              ...currentConfig, 
              pfsId: firstInstance.id
            };
            form.setFieldsValue(updatedConfig);
            return updatedConfig;
          }
          return currentConfig;
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('获取PFS实例失败:', error);
        setError('获取PFS实例失败');
        message.error('获取PFS实例失败');
      }
    } finally {
      setIsLoadingPfsInstances(false);
    }
  };

  // 处理资源池类型变化
  const handleResourcePoolTypeChange = (value: string) => {
    const updatedConfig = { 
      ...config, 
      resourcePoolType: value as '自运维' | '全托管',
      resourcePoolId: '',
      queueId: '',
      pfsId: ''
    };
    setConfig(updatedConfig);
    form.setFieldsValue(updatedConfig);
    setResourcePools([]);
    setQueues([]);
    setPfsInstances([]);
    
    if (value) {
      fetchResourcePools(value);
    }
  };

  // 处理资源池变化
  const handleResourcePoolChange = (value: string) => {
    const updatedConfig = { 
      ...config, 
      resourcePoolId: value,
      queueId: '',
      pfsId: ''
    };
    setConfig(updatedConfig);
    form.setFieldsValue(updatedConfig);
    setQueues([]);
    setPfsInstances([]);
    
    if (value) {
      fetchQueues(value);
      fetchPfsInstances(value);
    }
  };

  // 处理队列变化
  const handleQueueChange = (value: string) => {
    const updatedConfig = { ...config, queueId: value };
    setConfig(updatedConfig);
    form.setFieldsValue(updatedConfig);
  };

  // 处理PFS实例变化
  const handlePfsChange = (value: string) => {
    const updatedConfig = { ...config, pfsId: value };
    setConfig(updatedConfig);
    form.setFieldsValue(updatedConfig);
  };

  // 处理存储路径变化
  const handleStoragePathChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const updatedConfig = { ...config, storagePath: e.target.value };
    setConfig(updatedConfig);
  };

  // 重置表单到默认状态
  const handleReset = () => {
    // 重置表单字段
    form.resetFields();
    
    // 重置到默认状态
    const defaultConfig = {
      datasetId,
      datasetName: datasetInfo?.datasetName || '',
      resourcePoolType: '自运维' as '自运维' | '全托管',
      resourcePoolId: '',
      queueId: '',
      pfsId: '',
      storagePath: datasetInfo?.datasetStoragePath?.replace(/^bos:/, '') || '',
      originalStoragePath: datasetInfo?.datasetStoragePath?.replace(/^bos:/, '') || ''
    };
    
    setConfig(defaultConfig);
    form.setFieldsValue(defaultConfig);
    
    // 清空下级数据
    setQueues([]);
    setPfsInstances([]);
    setError('');
    setShowTaskResult(false);
    
    // 重新加载资源池列表并自动选择第一个
    if (resourcePools.length > 0) {
      // 如果已有资源池列表，直接选择第一个
      const firstPool = resourcePools[0];
      const updatedConfig = {
        ...defaultConfig,
        resourcePoolId: firstPool.resourcePoolId,
        queueId: '',
        pfsId: ''
      };
      setConfig(updatedConfig);
      form.setFieldsValue(updatedConfig);
      
      // 自动获取队列和PFS实例
      fetchQueues(firstPool.resourcePoolId);
      fetchPfsInstances(firstPool.resourcePoolId);
    } else {
      // 如果没有资源池列表，重新加载
      fetchResourcePools('自运维');
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      setShowTaskResult(false);

      await form.validateFields();
      const taskConfig: DataDumpTaskConfig = {
        datasetId: config.datasetId,
        datasetName: config.datasetName,
        sourcePath: config.originalStoragePath || '',
        targetPath: config.storagePath,
        originalStoragePath: config.originalStoragePath || '',
        resourcePoolId: config.resourcePoolId,
        resourcePoolType: config.resourcePoolType,
        queueId: config.queueId,
        pfsInstanceId: config.pfsId
      };

      console.log('📋 提交数据转储任务 - 原始配置:', config);
      console.log('📦 提交数据转储任务 - 任务配置:', taskConfig);

      const result = await createDataDumpTask(taskConfig);
      
      setTaskResult(result);
      setShowTaskResult(true);

      if (result.success) {
        console.log('✅ 任务创建成功:', result.result);
        console.log('📋 任务详情:', {
          jobId: result.result?.jobId,
          jobName: result.result?.jobName,
          k8sName: result.result?.k8sName
        });
        message.success('任务创建成功！');
      } else {
        console.error('❌ 任务创建失败:', result.error);
        console.error('🔍 详细错误信息:', {
          error: result.error,
          config: taskConfig,
          timestamp: new Date().toISOString()
        });
        
        // 直接显示错误信息
        const errorMsg = result.error || '任务创建失败';
        setError(errorMsg);
        message.error(errorMsg);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '提交失败，请重试';
      console.error('❌ 提交数据转储任务异常:', err);
      console.error('🔍 异常详情:', {
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
        config: config,
        timestamp: new Date().toISOString()
      });
      
      // 直接显示错误信息
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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
        <DatabaseOutlined style={{ color: '#1890ff', marginRight: '6px' }} />
        <span style={{ fontSize: '13px', fontWeight: 600 }}>数据转储配置</span>
        {isRedirected && (
          <Alert 
            message="已跳转到创建任务页面，表单已锁定" 
            type="info" 
            showIcon 
            style={{ marginLeft: '12px', fontSize: '11px' }}
          />
        )}
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={config}
        disabled={isRedirected}
        style={{ margin: 0 }}
      >
        {/* 数据集信息 */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>数据集</div>
          <Input
            value={`${datasetInfo?.datasetName || datasetId} (${category})`}
            disabled
            prefix={<DatabaseOutlined />}
            style={{ fontSize: '11px' }}
          />
        </div>

        {datasetInfo?.datasetStoragePath && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>原始存储路径</div>
            <Input
              value={datasetInfo.datasetStoragePath}
              disabled
              prefix={<CloudOutlined />}
              style={{ fontSize: '11px' }}
            />
          </div>
        )}

        {/* 分隔线 */}
        <div style={{ 
          height: '1px', 
          background: '#f0f0f0', 
          margin: '8px 0' 
        }} />

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
              <Option 
                key={queue.queueId} 
                value={config.resourcePoolType === '自运维' ? queue.queueName : queue.queueId}
              >
                {queue.queueName} ({queue.phase})
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* PFS实例 */}
        <Form.Item 
          name="pfsId"
          rules={[{ required: true, message: '请选择PFS实例' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>PFS实例 <span style={{ color: '#ff4d4f' }}>*</span></span>}
        >
          <Select
            placeholder="请选择PFS实例"
            value={config.pfsId}
            onChange={handlePfsChange}
            loading={isLoadingPfsInstances}
            disabled={isLoadingPfsInstances || !config.resourcePoolId}
            notFoundContent={isLoadingPfsInstances ? <Spin size="small" /> : '暂无数据'}
            style={{ width: '100%', fontSize: '11px' }}
          >
            {pfsInstances.map(instance => (
              <Option key={instance.id} value={instance.id}>
                {instance.name} ({instance.status})
              </Option>
            ))}
          </Select>
        </Form.Item>

        {pfsInstances.length > 0 && (
          <div style={{ fontSize: '10px', color: '#999', marginBottom: '8px' }}>
            找到 {pfsInstances.length} 个可用PFS实例
          </div>
        )}

        {/* 存储路径 */}
        <Form.Item 
          name="storagePath"
          rules={[{ required: true, message: '请输入存储路径' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>存储路径 <span style={{ color: '#ff4d4f' }}>*</span></span>}
          extra={<span style={{ fontSize: '10px', color: '#999' }}>数据转储的目标存储路径 (已自动从数据集存储路径中去除bos:前缀)</span>}
        >
          <Input.TextArea
            placeholder="请输入存储路径&#10;支持多行输入，每行一个路径"
            onChange={handleStoragePathChange}
            rows={3}
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

        {/* 任务结果提示 */}
        {showTaskResult && taskResult && (
          <Alert
            message={taskResult.success ? '任务创建成功' : '任务创建失败'}
            description={
              taskResult.success ? (
                <div>
                  <div style={{ fontSize: '11px' }}>任务ID: <Text code style={{ fontSize: '10px' }}>{taskResult.result?.jobId}</Text></div>
                  <Button 
                    type="link" 
                    size="small"
                    onClick={() => {
                      console.log('跳转到任务详情页面:', taskResult.result?.jobId);
                    }}
                    style={{ fontSize: '10px', padding: 0 }}
                  >
                    查看任务详情
                  </Button>
                </div>
              ) : (
                '请查看控制台获取详细错误信息'
              )
            }
            type={taskResult.success ? 'success' : 'error'}
            showIcon
            closable
            onClose={() => setShowTaskResult(false)}
            style={{ marginBottom: '8px', fontSize: '11px' }}
            closeIcon={
              <span style={{ 
                color: `${taskResult.success ? '#52c41a' : '#fff'} !important`, 
                fontSize: '12px !important',
                fontWeight: 'bold !important',
                cursor: 'pointer !important',
                padding: '0 !important',
                margin: '0 !important',
                borderRadius: '2px !important',
                backgroundColor: `${taskResult.success ? 'rgba(82, 196, 26, 0.1)' : 'rgba(255, 255, 255, 0.2)'} !important`,
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
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginTop: '12px',
          paddingTop: '8px',
          borderTop: '1px solid #f0f0f0'
        }}>
          <Button
            type="primary"
            htmlType="submit"
            onClick={handleSubmit}
            loading={isSubmitting}
            icon={<SendOutlined />}
            disabled={isRedirected}
            style={{ fontSize: '11px', height: '28px' }}
          >
            提交转储任务
          </Button>
          
          <Button
            onClick={handleReset}
            icon={<ReloadOutlined />}
            disabled={isRedirected}
            style={{ fontSize: '11px', height: '28px' }}
          >
            重置
          </Button>
        </div>
      </Form>
      
    </div>
  );
};

export default DataDumpForm;
