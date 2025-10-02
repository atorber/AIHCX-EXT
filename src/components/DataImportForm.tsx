import React, { useState, useEffect, useRef } from 'react';
import { Form, Select, Input, Button, message, Alert, Spin } from 'antd';
import { SendOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import { aihcApiService, ResourcePool, Queue } from '../services/aihcApi';
import { createDataImportTask, DataImportTaskConfig } from '../services/dataImportApi';

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
  targetDatasetVersion: string; // 目标数据集版本
  sourceDatasetVersion: string; // 源数据集版本（当导入方式为"数据集"时使用）
  importType: 'HuggingFace' | 'ModelScope' | '数据集';
  importUrl: string;
  accessToken?: string; // 访问令牌，选填
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
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);
  
  // 选项数据
  const [datasetVersions, setDatasetVersions] = useState<any[]>([]); // 目标数据集版本列表
  const [sourceDatasetVersions, setSourceDatasetVersions] = useState<any[]>([]); // 源数据集版本列表
  const [resourcePools, setResourcePools] = useState<ResourcePool[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]); // 数据集列表
  const [selectedVersionInfo, setSelectedVersionInfo] = useState<any>(null); // 目标数据集版本信息
  const [selectedSourceVersionInfo, setSelectedSourceVersionInfo] = useState<any>(null); // 源数据集版本信息
  const [datasetInfo, setDatasetInfo] = useState<any>(null);
  const [selectedDataset, setSelectedDataset] = useState<any>(null); // 选中的数据集
  
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
    targetDatasetVersion: '', // 目标数据集版本
    sourceDatasetVersion: '', // 源数据集版本
    importType: 'HuggingFace',
    importUrl: '',
    accessToken: '', // 访问令牌，选填
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

  // 获取目标数据集版本列表
  const fetchTargetDatasetVersions = async () => {
    if (!datasetId) return;
    
    try {
      setIsLoadingDatasetVersions(true);
      setError('');
      
      // 调用真实的API获取数据集版本列表
      const versions = await aihcApiService.getDatasetVersions(datasetId);
      
      setDatasetVersions(versions);
      
      // 使用函数式更新来获取最新的config状态
      setConfig(currentConfig => {
        if (currentConfig.targetDatasetVersion && !versions.find((version: any) => version.versionId === currentConfig.targetDatasetVersion)) {
          const updatedConfig = { ...currentConfig, targetDatasetVersion: '' };
          form.setFieldsValue({ targetDatasetVersion: '' });
          return updatedConfig;
        } else if (versions.length > 0 && !currentConfig.targetDatasetVersion) {
          // 如果没有选择版本且有可用版本，默认选中第一个
          const firstVersion = versions[0];
          const updatedConfig = { 
            ...currentConfig, 
            targetDatasetVersion: firstVersion.versionId
          };
          form.setFieldsValue({ targetDatasetVersion: firstVersion.versionId });
          setSelectedVersionInfo(firstVersion);
          return updatedConfig;
        }
        return currentConfig;
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取目标数据集版本列表失败';
      setError(errorMessage);
      console.error('获取目标数据集版本列表失败:', err);
    } finally {
      setIsLoadingDatasetVersions(false);
    }
  };

  // 获取数据集列表
  const fetchDatasets = async () => {
    setIsLoadingDatasets(true);
    setError('');
    
    try {
      const datasets = await aihcApiService.getDatasets();
      setDatasets(datasets);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取数据集列表失败';
      setError(errorMessage);
      console.error('获取数据集列表失败:', err);
    } finally {
      setIsLoadingDatasets(false);
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
  const fetchQueues = async (resourcePoolId: string, resourcePoolType?: '自运维' | '全托管') => {
    const manager = requestManagerRef.current;
    
    if (manager.queuesController) {
      manager.queuesController.abort();
    }
    
    manager.queuesController = new AbortController();
    manager.queuesSequence += 1;
    const currentSequence = manager.queuesSequence;
    
    setIsLoadingQueues(true);
    setError('');
    
    // 使用传入的资源池类型，如果没有则使用当前配置中的类型
    const poolType = resourcePoolType || config.resourcePoolType;
    
    try {
      const queues = poolType === '自运维'
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
      fetchTargetDatasetVersions();
    }
    fetchResourcePools('自运维');
  }, [datasetId]);

  // 处理目标数据集版本变化
  const handleTargetDatasetVersionChange = (value: string) => {
    const updatedConfig = { ...config, targetDatasetVersion: value };
    setConfig(updatedConfig);
    form.setFieldsValue({ targetDatasetVersion: value });
    
    // 设置选中版本的详细信息
    const selectedVersion = datasetVersions.find(version => version.versionId === value);
    setSelectedVersionInfo(selectedVersion || null);
  };

  // 处理源数据集版本变化
  const handleSourceDatasetVersionChange = (value: string) => {
    const updatedConfig = { ...config, sourceDatasetVersion: value };
    setConfig(updatedConfig);
    form.setFieldsValue({ sourceDatasetVersion: value });
    
    // 设置选中版本的详细信息
    const selectedVersion = sourceDatasetVersions.find(version => version.versionId === value);
    setSelectedSourceVersionInfo(selectedVersion || null);
  };

  // 处理导入方式变化
  const handleImportTypeChange = (value: string) => {
    const updatedConfig = { 
      ...config, 
      importType: value as 'HuggingFace' | 'ModelScope' | '数据集',
      importUrl: '' // 切换导入方式时清空导入地址
    };
    setConfig(updatedConfig);
    form.setFieldsValue(updatedConfig);
    
    // 如果选择"数据集"，自动获取数据集列表
    if (value === '数据集') {
      fetchDatasets();
    }
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
      fetchQueues(value, config.resourcePoolType);
    }
  };

  // 处理队列变化
  const handleQueueChange = (value: string) => {
    const updatedConfig = { ...config, queueId: value };
    setConfig(updatedConfig);
    form.setFieldsValue(updatedConfig);
  };

  // 自动检测导入方式
  const detectImportType = (url: string): 'HuggingFace' | 'ModelScope' | '数据集' => {
    if (!url.trim()) return 'HuggingFace'; // 默认为HuggingFace
    
    // 处理多行输入，按行分割
    const urls = url.split('\n').map(line => line.trim()).filter(line => line);
    if (urls.length === 0) return 'HuggingFace';
    
    // 统计各种类型的URL数量
    let huggingfaceCount = 0;
    let modelscopeCount = 0;
    let datasetCount = 0;
    
    urls.forEach(url => {
      const lowerUrl = url.toLowerCase();
      
      // 检测HuggingFace
      if (lowerUrl.includes('huggingface.co') || lowerUrl.includes('hf.co')) {
        huggingfaceCount++;
      }
      // 检测ModelScope
      else if (lowerUrl.includes('modelscope.cn') || lowerUrl.includes('modelscope')) {
        modelscopeCount++;
      }
      // 检测其他数据集源
      else if (lowerUrl.includes('github.com') || 
               lowerUrl.includes('kaggle.com') || 
               lowerUrl.includes('zenodo.org') ||
               lowerUrl.includes('figshare.com') ||
               lowerUrl.includes('drive.google.com') ||
               lowerUrl.includes('dropbox.com') ||
               lowerUrl.includes('onedrive.live.com') ||
               lowerUrl.includes('mega.nz') ||
               lowerUrl.includes('baidu.com') ||
               lowerUrl.includes('aliyun.com') ||
               lowerUrl.includes('tencent.com')) {
        datasetCount++;
      }
    });
    
    // 根据数量最多的类型返回
    if (huggingfaceCount >= modelscopeCount && huggingfaceCount >= datasetCount) {
      return 'HuggingFace';
    } else if (modelscopeCount >= datasetCount) {
      return 'ModelScope';
    } else {
      return '数据集';
    }
  };

  // 处理导入地址变化
  const handleImportUrlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const importUrl = e.target.value;
    const detectedImportType = detectImportType(importUrl);
    
    const updatedConfig = { 
      ...config, 
      importUrl: importUrl,
      importType: detectedImportType // 自动切换导入方式
    };
    
    setConfig(updatedConfig);
    form.setFieldsValue(updatedConfig);
    
    // 显示自动检测结果
    if (importUrl.trim() && detectedImportType !== config.importType) {
      console.log(`🔍 自动检测导入方式: ${detectedImportType}`);
    }
  };

  // 处理Access Token变化
  const handleAccessTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedConfig = { ...config, accessToken: e.target.value };
    setConfig(updatedConfig);
    form.setFieldsValue(updatedConfig);
  };

  // 处理数据集选择变化
  const handleDatasetChange = (value: string) => {
    const selectedDataset = datasets.find(dataset => dataset.id === value);
    setSelectedDataset(selectedDataset || null);
    
    // 清空源版本选择和相关信息
    setConfig(prev => ({ ...prev, sourceDatasetVersion: '' }));
    form.setFieldsValue({ sourceDatasetVersion: '' });
    setSelectedSourceVersionInfo(null);
    
    if (selectedDataset) {
      // 获取选中数据集的版本列表
      fetchSourceDatasetVersions(selectedDataset.id);
    } else {
      setSourceDatasetVersions([]);
    }
  };

  // 获取源数据集的版本列表
  const fetchSourceDatasetVersions = async (datasetId: string) => {
    setIsLoadingDatasetVersions(true);
    setError('');
    
    try {
      const versions = await aihcApiService.getDatasetVersions(datasetId);
      setSourceDatasetVersions(versions);
      
      // 清空之前选择的源版本
      setConfig(prev => ({ ...prev, sourceDatasetVersion: '' }));
      form.setFieldsValue({ sourceDatasetVersion: '' });
      setSelectedSourceVersionInfo(null);
      
      // 不自动选择版本，让用户手动选择
      console.log(`📋 获取到源数据集 ${versions.length} 个版本，请手动选择`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取源数据集版本失败';
      setError(errorMessage);
      console.error('获取源数据集版本失败:', err);
    } finally {
      setIsLoadingDatasetVersions(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);
      setError('');
      setShowResult(false);

      // 根据导入方式确定数据集信息
      let finalDatasetId = datasetId || '';
      let finalDatasetType = datasetInfo?.datasetType;
      let finalStorageInstance = datasetInfo?.storageInstance;
      let finalStoragePath = selectedVersionInfo?.storagePath;
      
      // 如果是数据集导入方式，需要分别处理源数据集和目标数据集的信息
      if (values.importType === '数据集' && selectedDataset) {
        // 对于数据集导入，我们需要传递源数据集的信息
        // 但目标数据集的信息仍然使用当前数据集的信息
        finalDatasetId = selectedDataset.id;
        finalDatasetType = selectedDataset.storageType;
        finalStorageInstance = selectedDataset.storageInstance;
        finalStoragePath = selectedSourceVersionInfo?.storagePath;
      }
      
      // 确定使用的数据集版本
      const datasetVersion = values.importType === '数据集' 
        ? values.sourceDatasetVersion 
        : values.targetDatasetVersion;
      
      const importConfig: DataImportTaskConfig = {
        datasetId: finalDatasetId,
        datasetVersion: datasetVersion,
        importType: values.importType,
        importUrl: values.importUrl,
        accessToken: values.accessToken, // 添加访问令牌
        resourcePoolId: values.resourcePoolId,
        resourcePoolType: values.resourcePoolType,
        queueId: values.queueId,
        datasetType: finalDatasetType,
        storageInstance: finalStorageInstance,
        storagePath: finalStoragePath, // 添加存储路径
        
        // 在数据集导入模式下，添加源数据集和目标数据集的详细信息
        ...(values.importType === '数据集' && selectedDataset ? {
          // 源数据集信息（选中的数据集）
          sourceDatasetId: selectedDataset.id,
          sourceDatasetVersion: values.sourceDatasetVersion,
          sourceDatasetType: selectedDataset.storageType,
          sourceStorageInstance: selectedDataset.storageInstance,
          sourceStoragePath: selectedSourceVersionInfo?.storagePath,
          
          // 目标数据集信息（当前数据集）
          targetDatasetId: datasetId,
          targetDatasetVersion: values.targetDatasetVersion,
          targetDatasetType: datasetInfo?.datasetType,
          targetStorageInstance: datasetInfo?.storageInstance,
          targetStoragePath: selectedVersionInfo?.storagePath
        } : {})
      };

      console.log('🚀 提交数据导入任务:');
      console.log('📋 表单配置:', {
        datasetId: importConfig.datasetId,
        datasetVersion: importConfig.datasetVersion,
        targetDatasetVersion: values.targetDatasetVersion,
        sourceDatasetVersion: values.sourceDatasetVersion,
        importType: importConfig.importType,
        importUrl: importConfig.importUrl,
        accessToken: importConfig.accessToken ? '***已设置***' : '未设置',
        resourcePoolType: importConfig.resourcePoolType,
        resourcePoolId: importConfig.resourcePoolId,
        queueId: importConfig.queueId,
        datasetType: importConfig.datasetType,
        storageInstance: importConfig.storageInstance,
        storagePath: importConfig.storagePath
      });
      console.log('📋 数据集信息:', datasetInfo);
      console.log('📋 目标版本信息:', selectedVersionInfo);
      console.log('📋 源版本信息:', selectedSourceVersionInfo);

      // 调用数据导入API
      console.log('🔄 开始调用数据导入API...');
      const result = await createDataImportTask(importConfig);
      
      setImportResult(result);
      setShowResult(true);

      if (result.success) {
        console.log('✅ 数据导入任务创建成功:', result.result);
        console.log('📋 任务详情:', {
          jobId: result.result?.jobId,
          jobName: result.result?.jobName,
          k8sName: result.result?.k8sName
        });
        message.success('数据导入任务创建成功！');
      } else {
        console.error('❌ 数据导入任务创建失败:', result.error);
        console.error('🔍 详细错误信息:', {
          error: result.error,
          config: importConfig,
          timestamp: new Date().toISOString()
        });
        
        // 直接显示错误信息
        const errorMsg = result.error || '数据导入任务创建失败';
        setError(errorMsg);
        message.error(errorMsg);
      }

      // 通知父组件
      if (onSubmit) {
        const config: DataImportConfig = {
          targetDatasetVersion: values.targetDatasetVersion,
          sourceDatasetVersion: values.sourceDatasetVersion,
          importType: values.importType,
          importUrl: values.importUrl,
          resourcePoolType: values.resourcePoolType,
          resourcePoolId: values.resourcePoolId,
          queueId: values.queueId,
          datasetId: datasetId || ''
        };
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
      targetDatasetVersion: '',
      sourceDatasetVersion: '',
      importType: 'HuggingFace',
      importUrl: '',
      resourcePoolType: '自运维',
      resourcePoolId: '',
      queueId: '',
      datasetId: datasetId || ''
    });
    setDatasetVersions([]);
    setSourceDatasetVersions([]);
    setResourcePools([]);
    setQueues([]);
    setSelectedVersionInfo(null);
    setSelectedSourceVersionInfo(null);
    setSelectedDataset(null);
    if (datasetId) {
      fetchTargetDatasetVersions();
    }
    fetchResourcePools('自运维');
  };

  return (
    <div style={{ padding: '8px' }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          targetDatasetVersion: '',
          sourceDatasetVersion: '',
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

        {/* 目标数据集版本 */}
        <Form.Item 
          name="targetDatasetVersion"
          rules={[{ required: true, message: '请选择目标数据集版本' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>目标数据集版本 <span style={{ color: '#ff4d4f' }}>*</span></span>}
        >
          <Select
            placeholder={isLoadingDatasetVersions ? "加载中..." : "请选择目标数据集版本"}
            onChange={handleTargetDatasetVersionChange}
            disabled={isLoadingDatasetVersions}
            value={config.targetDatasetVersion}
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
            value={config.importType}
            onChange={handleImportTypeChange}
            style={{ width: '100%', fontSize: '11px' }}
          >
            <Option value="HuggingFace">🤗 HuggingFace</Option>
            <Option value="ModelScope">🏛️ ModelScope</Option>
            <Option value="数据集">📊 数据集</Option>
          </Select>
        </Form.Item>

        {/* 导入地址 - 仅当导入方式不为"数据集"时显示 */}
        {config.importType !== '数据集' && (
          <Form.Item 
            name="importUrl"
            rules={[{ required: true, message: '请输入导入地址' }]}
            style={{ marginBottom: '8px' }}
            label={<span style={{ fontSize: '11px', color: '#666' }}>导入地址 <span style={{ color: '#ff4d4f' }}>*</span></span>}
            extra={
              <div style={{ fontSize: '10px', color: '#999' }}>
                <div>支持多行输入，每行一个地址</div>
                {config.importUrl && (
                  <div style={{ color: '#1890ff', marginTop: '2px' }}>
                    🔍 自动检测为: {config.importType === 'HuggingFace' ? '🤗 HuggingFace' : 
                                     config.importType === 'ModelScope' ? '🏛️ ModelScope' : '📊 数据集'}
                  </div>
                )}
              </div>
            }
          >
            <TextArea
              placeholder="请输入导入地址&#10;支持多行输入，每行一个地址"
              rows={3}
              onChange={handleImportUrlChange}
              style={{ fontSize: '11px', resize: 'vertical' }}
            />
          </Form.Item>
        )}

        {/* 数据集选择 - 仅当导入方式为"数据集"时显示 */}
        {config.importType === '数据集' && (
          <Form.Item 
            name="selectedDataset"
            rules={[{ required: true, message: '请选择数据集' }]}
            style={{ marginBottom: '8px' }}
            label={<span style={{ fontSize: '11px', color: '#666' }}>选择源数据集 <span style={{ color: '#ff4d4f' }}>*</span></span>}
          >
            <Select
              placeholder="请选择数据集"
              value={selectedDataset?.id}
              onChange={handleDatasetChange}
              loading={isLoadingDatasets}
              disabled={isLoadingDatasets}
              notFoundContent={isLoadingDatasets ? <Spin size="small" /> : '暂无数据集'}
              style={{ width: '100%', fontSize: '11px' }}
            >
              {datasets.map((dataset: any) => (
                <Option key={dataset.id} value={dataset.id}>
                  {dataset.name} ({dataset.storageType}) - {dataset.latestVersion}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {/* 源数据集版本选择 - 仅当导入方式为"数据集"且已选择数据集时显示 */}
        {config.importType === '数据集' && selectedDataset && (
          <Form.Item 
            name="sourceDatasetVersion"
            rules={[{ required: true, message: '请选择源数据集版本' }]}
            style={{ marginBottom: '8px' }}
            label={<span style={{ fontSize: '11px', color: '#666' }}>源数据集版本 <span style={{ color: '#ff4d4f' }}>*</span></span>}
          >
            <Select
              placeholder="请选择源数据集版本"
              value={config.sourceDatasetVersion}
              onChange={handleSourceDatasetVersionChange}
              loading={isLoadingDatasetVersions}
              disabled={isLoadingDatasetVersions}
              notFoundContent={isLoadingDatasetVersions ? <Spin size="small" /> : '暂无版本'}
              style={{ width: '100%', fontSize: '11px' }}
            >
              {sourceDatasetVersions.map((version: any) => (
                <Option key={version.versionId} value={version.versionId}>
                  {version.versionName} - {version.description || '无描述'}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {/* 源数据集版本信息显示 */}
        {config.importType === '数据集' && selectedSourceVersionInfo && (
          <div style={{ 
            marginBottom: '8px',
            padding: '8px',
            backgroundColor: '#fff7e6',
            borderRadius: '4px',
            border: '1px solid #ffd591'
          }}>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
              📁 源版本路径信息
            </div>
            <div style={{ fontSize: '10px', color: '#495057', fontFamily: 'monospace' }}>
              <div style={{ marginBottom: '2px' }}>
                <strong>版本号:</strong> {selectedSourceVersionInfo.versionName}
              </div>
              <div style={{ marginBottom: '2px' }}>
                <strong>默认挂载路径:</strong> {selectedSourceVersionInfo.mountPath}
              </div>
              <div>
                <strong>存储路径:</strong> {selectedSourceVersionInfo.storagePath}
              </div>
            </div>
          </div>
        )}

        {/* Access Token - 仅当导入方式不为"数据集"时显示 */}
        {config.importType !== '数据集' && (
          <Form.Item 
            name="accessToken"
            style={{ marginBottom: '8px' }}
            label={<span style={{ fontSize: '11px', color: '#666' }}>Access Token</span>}
            extra={<span style={{ fontSize: '10px', color: '#999' }}>用于访问私有模型/数据集，选填</span>}
          >
            <Input.Password
              placeholder="请输入Access Token（选填）"
              value={config.accessToken}
              onChange={handleAccessTokenChange}
              style={{ fontSize: '11px' }}
              visibilityToggle
            />
          </Form.Item>
        )}

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
            message={importResult.success ? '数据导入任务创建成功' : '数据导入任务创建失败'}
            description={
              importResult.success ? (
                <div>
                  <div style={{ fontSize: '11px' }}>任务ID: <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>{importResult.result?.jobId}</span></div>
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>任务名称: <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>{importResult.result?.jobName}</span></div>
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>K8s名称: <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>{importResult.result?.k8sName}</span></div>
                </div>
              ) : (
                <div style={{ fontSize: '11px' }}>{importResult.error}</div>
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
