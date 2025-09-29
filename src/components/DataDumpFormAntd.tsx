import React, { useState, useEffect, useRef } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  Button, 
  Card, 
  Space, 
  Typography, 
  message, 
  Spin,
  Alert,
  Divider
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
        const updatedConfig = {
          ...config,
          datasetName: datasetInfo.datasetName,
          storagePath,
          originalStoragePath: datasetInfo.datasetStoragePath
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
        
        // 如果当前选择的资源池不在新列表中，清空选择
        if (config.resourcePoolId && !pools.find((pool: ResourcePool) => pool.resourcePoolId === config.resourcePoolId)) {
          const updatedConfig = { ...config, resourcePoolId: '', queueId: '', pfsId: '' };
          setConfig(updatedConfig);
          form.setFieldsValue(updatedConfig);
          setQueues([]);
          setPfsInstances([]);
        }
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
        
        // 如果当前选择的队列不在新列表中，清空选择
        if (config.queueId && !queues.find((queue: Queue) => queue.queueId === config.queueId)) {
          const updatedConfig = { ...config, queueId: '', pfsId: '' };
          setConfig(updatedConfig);
          form.setFieldsValue(updatedConfig);
          setPfsInstances([]);
        }
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
        
        // 如果当前选择的PFS实例不在新列表中，清空选择
        if (config.pfsId && !instances.find((instance: PFSInstance) => instance.id === config.pfsId)) {
          const updatedConfig = { ...config, pfsId: '' };
          setConfig(updatedConfig);
          form.setFieldsValue(updatedConfig);
        }
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
  const handleStoragePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedConfig = { ...config, storagePath: e.target.value };
    setConfig(updatedConfig);
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
        resourcePoolId: config.resourcePoolId,
        queueId: config.queueId,
        pfsInstanceId: config.pfsId
      };

      console.log('提交数据转储任务:', taskConfig);

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
        message.error('任务创建失败，请查看控制台');
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
      message.error('操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div style={{ padding: '16px' }}>
      <Card 
        title={
          <Space>
            <DatabaseOutlined />
            <span>数据转储配置</span>
          </Space>
        }
        extra={
          isRedirected && (
            <Alert 
              message="已跳转到创建任务页面，表单已锁定" 
              type="info" 
              showIcon 
            />
          )
        }
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={config}
          disabled={isRedirected}
        >
          {/* 数据集信息 */}
          <Form.Item label="数据集">
            <Input
              value={`${datasetInfo?.datasetName || datasetId} (${category})`}
              disabled
              prefix={<DatabaseOutlined />}
            />
          </Form.Item>

          {datasetInfo?.datasetStoragePath && (
            <Form.Item label="原始存储路径">
              <Input
                value={datasetInfo.datasetStoragePath}
                disabled
                prefix={<CloudOutlined />}
              />
            </Form.Item>
          )}

          <Divider />

          {/* 资源池类型 */}
          <Form.Item 
            label="资源池类型" 
            name="resourcePoolType"
            rules={[{ required: true, message: '请选择资源池类型' }]}
          >
            <Select
              placeholder="请选择资源池类型"
              onChange={handleResourcePoolTypeChange}
              suffixIcon={<SettingOutlined />}
            >
              <Option value="自运维">自运维资源池</Option>
              <Option value="全托管">全托管资源池</Option>
            </Select>
          </Form.Item>

          {/* 资源池 */}
          <Form.Item 
            label="资源池" 
            name="resourcePoolId"
            rules={[{ required: true, message: '请选择资源池' }]}
          >
            <Select
              placeholder="请选择资源池"
              onChange={handleResourcePoolChange}
              loading={isLoadingResourcePools}
              notFoundContent={isLoadingResourcePools ? <Spin size="small" /> : '暂无数据'}
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
            label="队列" 
            name="queueId"
            rules={[{ required: true, message: '请选择队列' }]}
          >
            <Select
              placeholder="请选择队列"
              onChange={handleQueueChange}
              loading={isLoadingQueues}
              notFoundContent={isLoadingQueues ? <Spin size="small" /> : '暂无数据'}
            >
              {queues.map((queue: Queue) => (
                <Option key={queue.queueId} value={queue.queueId}>
                  {queue.queueName} ({queue.phase})
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* PFS实例 */}
          <Form.Item 
            label="PFS实例" 
            name="pfsId"
            rules={[{ required: true, message: '请选择PFS实例' }]}
          >
            <Select
              placeholder="请选择PFS实例"
              onChange={handlePfsChange}
              loading={isLoadingPfsInstances}
              notFoundContent={isLoadingPfsInstances ? <Spin size="small" /> : '暂无数据'}
            >
              {pfsInstances.map(instance => (
                <Option key={instance.id} value={instance.id}>
                  {instance.name} ({instance.status})
                </Option>
              ))}
            </Select>
          </Form.Item>

          {pfsInstances.length > 0 && (
            <Form.Item>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                找到 {pfsInstances.length} 个可用PFS实例
              </Text>
            </Form.Item>
          )}

          {/* 存储路径 */}
          <Form.Item 
            label="存储路径" 
            name="storagePath"
            rules={[{ required: true, message: '请输入存储路径' }]}
            extra="数据转储的目标存储路径 (已自动从数据集存储路径中去除bos:前缀)"
          >
            <Input
              placeholder="请输入存储路径"
              onChange={handleStoragePathChange}
              prefix={<CloudOutlined />}
            />
          </Form.Item>

          {/* 错误提示 */}
          {error && (
            <Alert
              message="操作失败"
              description="请查看控制台获取详细错误信息"
              type="error"
              showIcon
              closable
              onClose={() => setError('')}
            />
          )}

          {/* 任务结果提示 */}
          {showTaskResult && taskResult && (
            <Alert
              message={taskResult.success ? '任务创建成功' : '任务创建失败'}
              description={
                taskResult.success ? (
                  <div>
                    <div>任务ID: <Text code>{taskResult.result?.jobId}</Text></div>
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => {
                        console.log('跳转到任务详情页面:', taskResult.result?.jobId);
                      }}
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
            />
          )}

          {/* 提交按钮 */}
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                onClick={handleSubmit}
                loading={isSubmitting}
                icon={<SendOutlined />}
                disabled={isRedirected}
              >
                提交转储任务
              </Button>
              
              <Button
                onClick={() => {
                  form.resetFields();
                  setConfig({
                    datasetId,
                    datasetName: '',
                    resourcePoolType: '自运维',
                    resourcePoolId: '',
                    queueId: '',
                    pfsId: '',
                    storagePath: '',
                    originalStoragePath: ''
                  });
                  setResourcePools([]);
                  setQueues([]);
                  setPfsInstances([]);
                  setError('');
                  setShowTaskResult(false);
                }}
                icon={<ReloadOutlined />}
                disabled={isRedirected}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default DataDumpForm;
