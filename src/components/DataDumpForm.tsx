import React, { useState, useEffect, useRef } from 'react';
import { aihcApiService, ResourcePool, Queue, PFSInstance } from '../services/aihcApi';

interface DataDumpFormProps {
  datasetId: string;
  category: string;
  onSubmit?: (config: DataDumpConfig) => Promise<void>;
  onCancel?: () => void;
}

interface DataDumpConfig {
  resourcePoolType: '自运维' | '全托管';
  resourcePoolId: string;
  queueId: string;
  pfsId: string;
  storagePath: string;
  originalStoragePath?: string; // 新增：原始存储路径（带bos:前缀）
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
  onSubmit, 
  onCancel 
}) => {
  // 检查是否已经跳转到创建任务页面
  const [isRedirected, setIsRedirected] = useState(false);
  
  // 检查localStorage中是否有任务配置数据
  useEffect(() => {
    const checkSavedData = () => {
      const savedConfig = localStorage.getItem('aihc_data_dump_config');
      const savedTemplate = localStorage.getItem('aihc_data_dump_template');
      
      console.log('[DataDumpForm] 检查localStorage数据:', {
        savedConfig: !!savedConfig,
        savedTemplate: !!savedTemplate,
        isRedirected: isRedirected
      });
      
      if (savedConfig && savedTemplate) {
        console.log('[DataDumpForm] 发现保存的数据，设置isRedirected为true');
        setIsRedirected(true);
        // 从localStorage恢复配置
        try {
          const config = JSON.parse(savedConfig);
          console.log('[DataDumpForm] 恢复配置:', config);
          setConfig(config);
        } catch (error) {
          console.error('恢复配置失败:', error);
        }
      } else {
        console.log('[DataDumpForm] 没有发现保存的数据');
      }
    };

    // 立即检查
    checkSavedData();

    // 监听localStorage变化
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'aihc_data_dump_config' || e.key === 'aihc_data_dump_template') {
        checkSavedData();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 定期检查localStorage（用于同页面内的变化）
    const interval = setInterval(checkSavedData, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  
  // 多种调试输出方式
  console.debug('[DataDumpForm] 🔧 组件初始化');
  console.warn('[DataDumpForm] ⚠️ 组件初始化 - WARN级别');
  console.error('[DataDumpForm] ❌ 组件初始化 - ERROR级别（用于调试）');
  console.info('[DataDumpForm] ℹ️ 组件初始化 - INFO级别');
  
  // 直接写入DOM元素用于调试
  if (typeof document !== 'undefined') {
    const debugDiv = document.createElement('div');
    debugDiv.style.cssText = 'position:fixed;top:0;right:0;background:red;color:white;padding:5px;z-index:99999;';
    debugDiv.textContent = `DataDumpForm初始化: ${new Date().toLocaleTimeString()}`;
    document.body.appendChild(debugDiv);
    setTimeout(() => {
      if (document.body.contains(debugDiv)) {
        document.body.removeChild(debugDiv);
      }
    }, 5000);
  }
  
  // 写入localStorage作为调试记录
  if (typeof localStorage !== 'undefined') {
    try {
      const debugLog = {
        component: 'DataDumpForm',
        action: 'initialized',
        timestamp: new Date().toISOString(),
        props: { datasetId, category, hasOnSubmit: !!onSubmit }
      };
      localStorage.setItem('aihc_debug_latest', JSON.stringify(debugLog));
    } catch (e) {
      // localStorage可能被禁用
    }
  }
  
  console.debug('[DataDumpForm] Props:', {
    datasetId,
    category,
    onSubmit: !!onSubmit,
    onCancel: !!onCancel
  });
  
  const [config, setConfig] = useState<DataDumpConfig>({
    resourcePoolType: '自运维',
    resourcePoolId: '',
    queueId: '',
    pfsId: '',
    storagePath: '',
    originalStoragePath: undefined // 初始化为 undefined
  });

  const [resourcePools, setResourcePools] = useState<ResourcePool[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [pfsInstances, setPfsInstances] = useState<PFSInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datasetInfo, setDatasetInfo] = useState<{ datasetName: string; datasetStoragePath: string } | null>(null);

  // 使用 useRef 管理请求和状态
  const requestManagerRef = useRef<RequestManager>({
    resourcePoolsController: null,
    queuesController: null,
    pfsInstancesController: null,
    currentResourcePoolType: '自运维',
    resourcePoolsSequence: 0,
    queuesSequence: 0,
    pfsInstancesSequence: 0
  });

  // 取消之前的请求
  const cancelPreviousRequests = (requestType?: 'resourcePools' | 'queues' | 'pfsInstances') => {
    const manager = requestManagerRef.current;
    
    if (!requestType || requestType === 'resourcePools') {
      if (manager.resourcePoolsController) {
        console.log('DataDumpForm: 取消之前的资源池列表请求');
        manager.resourcePoolsController.abort();
        manager.resourcePoolsController = null;
      }
    }
    
    if (!requestType || requestType === 'queues') {
      if (manager.queuesController) {
        console.log('DataDumpForm: 取消之前的队列列表请求');
        manager.queuesController.abort();
        manager.queuesController = null;
      }
    }
    
    if (!requestType || requestType === 'pfsInstances') {
      if (manager.pfsInstancesController) {
        console.log('DataDumpForm: 取消之前的PFS实例请求');
        manager.pfsInstancesController.abort();
        manager.pfsInstancesController = null;
      }
    }
  };

  // 清理资源，防止内存泄漏
  useEffect(() => {
    return () => {
      console.log('DataDumpForm: 组件卸载，清理所有请求');
      cancelPreviousRequests();
    };
  }, []);

  // 初始化加载：数据集信息和资源池列表
  useEffect(() => {
    console.debug('[DataDumpForm] useEffect 初始化加载触发');
    console.warn('[DataDumpForm] ⚠️ useEffect 初始化加载触发 - WARN');
    console.error('[DataDumpForm] ❌ useEffect 初始化加载触发 - ERROR（用于调试）');
    console.debug('[DataDumpForm] 数据集ID:', datasetId);
    
    // 在window上设置调试函数
    if (typeof window !== 'undefined') {
      (window as any).debugDataDumpForm = {
        config,
        datasetId,
        category,
        onSubmit: !!onSubmit,
        timestamp: new Date().toISOString()
      };
      console.debug('[DataDumpForm] 调试信息已设置到 window.debugDataDumpForm');
    }
    
    loadDatasetInfo();
    loadResourcePools();
  }, []);

  // 转换BOS存储路径为普通路径
  const convertBosPathToStoragePath = (bosPath: string): string => {
    // 移除 "bos:" 前缀
    if (bosPath.startsWith('bos:')) {
      return bosPath.substring(4); // 移除 "bos:" 4个字符
    }
    return bosPath;
  };

  // 加载数据集信息
  const loadDatasetInfo = async () => {
    if (!datasetId) {
      console.warn('DataDumpForm: datasetId 为空，跳过数据集信息加载');
      return;
    }

    console.log('DataDumpForm: 开始加载数据集信息, datasetId:', datasetId);
    setIsLoading(true);
    
    try {
      const info = await aihcApiService.getDatasetInfo(datasetId);
      console.log('DataDumpForm: 数据集信息加载成功:', info);
      
      setDatasetInfo({
        datasetName: info.datasetName,
        datasetStoragePath: info.datasetStoragePath
      });
      
      // 自动填充存储路径（去除bos:前缀）
      const defaultStoragePath = convertBosPathToStoragePath(info.datasetStoragePath);
      console.log('DataDumpForm: 自动填充存储路径:', {
        original: info.datasetStoragePath,
        converted: defaultStoragePath
      });
      
      setConfig(prev => ({
        ...prev,
        storagePath: defaultStoragePath,
        originalStoragePath: info.datasetStoragePath // 保存原始路径
      }));
      
    } catch (err) {
      console.error('DataDumpForm: 加载数据集信息失败:', err);
      setError('加载数据集信息失败，请检查网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  // 当资源池类型改变时，重新加载资源池列表
  useEffect(() => {
    if (config.resourcePoolType) {
      const manager = requestManagerRef.current;
      
      // 检查是否需要更新
      if (manager.currentResourcePoolType !== config.resourcePoolType) {
        console.log(`DataDumpForm: 资源池类型变更: ${manager.currentResourcePoolType} -> ${config.resourcePoolType}`);
        
        // 取消之前的所有请求
        cancelPreviousRequests();
        
        // 清空相关状态
        setResourcePools([]);
        setQueues([]);
        setPfsInstances([]);
        
        // 更新当前类型
        manager.currentResourcePoolType = config.resourcePoolType;
        
        // 加载新的资源池列表
        loadResourcePools();
      }
    }
  }, [config.resourcePoolType]);

  // 当资源池改变时，重新加载队列和PFS实例
  useEffect(() => {
    if (config.resourcePoolId) {
      // 取消之前的队列和PFS请求
      cancelPreviousRequests('queues');
      cancelPreviousRequests('pfsInstances');
      
      // 清空相关状态
      setQueues([]);
      setPfsInstances([]);
      
      // 加载新数据
      loadQueues(config.resourcePoolId);
      loadPFSInstances(config.resourcePoolId);
    }
  }, [config.resourcePoolId]);

  const loadResourcePools = async () => {
    // 取消之前的资源池请求
    cancelPreviousRequests('resourcePools');
    
    // 创建新的AbortController
    const controller = new AbortController();
    requestManagerRef.current.resourcePoolsController = controller;
    
    // 递增资源池请求序列号
    const currentSequence = ++requestManagerRef.current.resourcePoolsSequence;
    console.log(`DataDumpForm: 开始加载资源池列表 - 序列号: ${currentSequence}, 类型: ${config.resourcePoolType}`);
    
    setIsLoading(true);
    try {
      let pools: ResourcePool[] = [];
      
      if (config.resourcePoolType === '自运维') {
        pools = await aihcApiService.getSelfManagedResourcePools(controller);
      } else {
        pools = await aihcApiService.getFullyManagedResourcePools(controller);
      }
      
      // 检查请求是否已被取消或过时
      if (controller.signal.aborted) {
        console.log(`DataDumpForm: 资源池列表请求被取消 - 序列号: ${currentSequence}`);
        return;
      }
      
      // 检查是否为最新的请求
      if (currentSequence !== requestManagerRef.current.resourcePoolsSequence) {
        console.log(`DataDumpForm: 资源池列表请求已过时 - 当前序列号: ${currentSequence}, 最新序列号: ${requestManagerRef.current.resourcePoolsSequence}`);
        return;
      }
      
      console.log(`DataDumpForm: 成功加载资源池列表 - 序列号: ${currentSequence}, 数量: ${pools.length}`);
      setResourcePools(pools);
      setError(''); // 清除错误
    } catch (err) {
      // 检查是否为取消请求
      if (err instanceof Error && err.message === 'REQUEST_CANCELLED') {
        console.log(`DataDumpForm: 资源池列表请求被取消 - 序列号: ${currentSequence}`);
        return;
      }
      
      // 检查是否为最新的请求
      if (currentSequence !== requestManagerRef.current.resourcePoolsSequence) {
        console.log(`DataDumpForm: 资源池列表请求已过时，忽略错误 - 当前序列号: ${currentSequence}`);
        return;
      }
      
      console.error(`DataDumpForm: 加载资源池失败 - 序列号: ${currentSequence}:`, err);
      setError('加载资源池失败，请检查网络连接');
      setResourcePools([]);
    } finally {
      // 只有最新的请求才可以设置加载状态
      if (currentSequence === requestManagerRef.current.resourcePoolsSequence) {
        setIsLoading(false);
      }
      
      // 清理controller
      if (requestManagerRef.current.resourcePoolsController === controller) {
        requestManagerRef.current.resourcePoolsController = null;
      }
    }
  };

  const loadQueues = async (resourcePoolId: string) => {
    // 取消之前的队列请求
    cancelPreviousRequests('queues');
    
    // 创建新的AbortController
    const controller = new AbortController();
    requestManagerRef.current.queuesController = controller;
    
    // 递增队列请求序列号
    const currentSequence = ++requestManagerRef.current.queuesSequence;
    console.log(`DataDumpForm: 开始加载队列列表 - 序列号: ${currentSequence}, 资源池ID: ${resourcePoolId}`);
    
    setIsLoading(true);
    try {
      let queueList: Queue[] = [];
      
      if (config.resourcePoolType === '自运维') {
        queueList = await aihcApiService.getSelfManagedQueues(resourcePoolId, controller);
      } else {
        const allQueues = await aihcApiService.getFullyManagedQueues(controller);
        queueList = allQueues.filter(queue => queue.resourcePoolId === resourcePoolId);
      }
      
      // 检查请求是否已被取消或过时
      if (controller.signal.aborted) {
        console.log(`DataDumpForm: 队列列表请求被取消 - 序列号: ${currentSequence}`);
        return;
      }
      
      // 检查是否为最新的请求
      if (currentSequence !== requestManagerRef.current.queuesSequence) {
        console.log(`DataDumpForm: 队列列表请求已过时 - 当前序列号: ${currentSequence}, 最新序列号: ${requestManagerRef.current.queuesSequence}`);
        return;
      }
      
      console.log(`DataDumpForm: 成功加载队列列表 - 序列号: ${currentSequence}, 数量: ${queueList.length}`);
      setQueues(queueList);
    } catch (err) {
      // 检查是否为取消请求
      if (err instanceof Error && err.message === 'REQUEST_CANCELLED') {
        console.log(`DataDumpForm: 队列列表请求被取消 - 序列号: ${currentSequence}`);
        return;
      }
      
      // 检查是否为最新的请求
      if (currentSequence !== requestManagerRef.current.queuesSequence) {
        console.log(`DataDumpForm: 队列列表请求已过时，忽略错误 - 当前序列号: ${currentSequence}`);
        return;
      }
      
      console.error(`DataDumpForm: 加载队列失败 - 序列号: ${currentSequence}:`, err);
      setError('加载队列失败，请检查网络连接');
      setQueues([]);
    } finally {
      // 只有最新的请求才可以设置加载状态
      if (currentSequence === requestManagerRef.current.queuesSequence) {
        setIsLoading(false);
      }
      
      // 清理controller
      if (requestManagerRef.current.queuesController === controller) {
        requestManagerRef.current.queuesController = null;
      }
    }
  };

  const loadPFSInstances = async (resourcePoolId: string) => {
    // 取消之前的PFS实例请求
    cancelPreviousRequests('pfsInstances');
    
    // 创建新的AbortController
    const controller = new AbortController();
    requestManagerRef.current.pfsInstancesController = controller;
    
    // 递增PFS实例请求序列号
    const currentSequence = ++requestManagerRef.current.pfsInstancesSequence;
    console.log(`DataDumpForm: 开始加载PFS实例 - 序列号: ${currentSequence}, 资源池ID: ${resourcePoolId}, 类型: ${config.resourcePoolType}`);
    
    setIsLoading(true);
    try {
      const resourcePoolType = config.resourcePoolType === '自运维' ? 'common' : 'serverless';
      console.log(`DataDumpForm: 转换后的资源池类型: ${resourcePoolType}`);
      
      const pfsList = await aihcApiService.getPFSInstances(resourcePoolId, resourcePoolType, controller);
      
      // 检查请求是否已被取消或过时
      if (controller.signal.aborted) {
        console.log(`DataDumpForm: PFS实例请求被取消 - 序列号: ${currentSequence}`);
        return;
      }
      
      // 检查是否为最新的请求
      if (currentSequence !== requestManagerRef.current.pfsInstancesSequence) {
        console.log(`DataDumpForm: PFS实例请求已过时 - 当前序列号: ${currentSequence}, 最新序列号: ${requestManagerRef.current.pfsInstancesSequence}`);
        return;
      }
      
      console.log(`DataDumpForm: 成功获取PFS实例列表 - 序列号: ${currentSequence}, 数量: ${pfsList.length}`);
      console.log('DataDumpForm: PFS实例详情:', pfsList);
      
      setPfsInstances(pfsList);
      setError(''); // 清除之前的错误
      
      if (pfsList.length === 0) {
        console.warn('DataDumpForm: 该资源池下没有可用的PFS实例');
      }
    } catch (err) {
      // 检查是否为取消请求
      if (err instanceof Error && err.message === 'REQUEST_CANCELLED') {
        console.log(`DataDumpForm: PFS实例请求被取消 - 序列号: ${currentSequence}`);
        return;
      }
      
      // 检查是否为最新的请求
      if (currentSequence !== requestManagerRef.current.pfsInstancesSequence) {
        console.log(`DataDumpForm: PFS实例请求已过时，忽略错误 - 当前序列号: ${currentSequence}`);
        return;
      }
      
      console.error(`DataDumpForm: 加载PFS实例失败 - 序列号: ${currentSequence}:`, err);
      
      // 提供更详细的错误信息
      let errorMessage = '加载PFS实例失败';
      if (err instanceof Error) {
        console.error('DataDumpForm: 错误详情:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
        
        if (err.message.includes('网络')) {
          errorMessage = '网络连接失败，请检查网络设置';
        } else if (err.message.includes('404')) {
          errorMessage = '资源池不存在或无权访问';
        } else if (err.message.includes('403')) {
          errorMessage = '权限不足，请检查账号权限';
        } else if (err.message.includes('500')) {
          errorMessage = '服务器错误，请稍后重试';
        } else if (err.message.includes('Mount Target')) {
          errorMessage = '该资源池未配置PFS存储，无法获取PFS实例';
        } else {
          errorMessage = `加载失败: ${err.message}`;
        }
      }
      
      setError(errorMessage);
      setPfsInstances([]); // 清空列表
    } finally {
      // 只有最新的请求才可以设置加载状态
      if (currentSequence === requestManagerRef.current.pfsInstancesSequence) {
        setIsLoading(false);
      }
      
      // 清理controller
      if (requestManagerRef.current.pfsInstancesController === controller) {
        requestManagerRef.current.pfsInstancesController = null;
      }
    }
  };

  // 填充任务信息到创建任务页面
  const handleFillTaskInfo = () => {
    try {
      const savedTemplate = localStorage.getItem('aihc_data_dump_template');
      if (!savedTemplate) {
        alert('没有找到任务模板数据');
        return;
      }

      const taskTemplate = JSON.parse(savedTemplate);
      
      // 使用Chrome扩展的tabs API来填充表单
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].id) {
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              func: fillCreateTaskForm,
              args: [taskTemplate]
            });
          }
        });
      } else {
        // 如果不在扩展环境中，使用window.postMessage
        window.postMessage({
          type: 'FILL_TASK_FORM',
          data: taskTemplate
        }, '*');
      }
      
      alert('任务信息已填充到创建任务页面');
    } catch (error) {
      console.error('填充任务信息失败:', error);
      alert('填充任务信息失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 返回数据集下载详情页
  const handleReturnToDataset = () => {
    // 清除localStorage中的数据
    localStorage.removeItem('aihc_data_dump_config');
    localStorage.removeItem('aihc_data_dump_template');
    
    // 重置状态
    setIsRedirected(false);
    
    // 返回上一页
    window.history.back();
  };

  // 在创建任务页面上下文中执行的填充表单函数
  const fillCreateTaskForm = (taskTemplate: any) => {
    try {
      // 填充任务名称
      const nameInput = document.querySelector('input[data-test-target="name"]') as HTMLInputElement;
      if (nameInput) {
        nameInput.value = taskTemplate.name;
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // 填充镜像地址
      const imageInput = document.querySelector('input[placeholder="请输入镜像地址"]') as HTMLInputElement;
      if (imageInput) {
        imageInput.value = 'registry.baidubce.com/paddlepaddle/paddle:2.5.2-gpu-cuda11.2-cudnn8-devel';
        imageInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // 填充执行命令
      const commandTextarea = document.querySelector('textarea[data-uri="inmemory://model/1"]') as HTMLTextAreaElement;
      if (commandTextarea) {
        commandTextarea.value = taskTemplate.command;
        commandTextarea.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // 设置资源池类型
      const resourcePoolTypeInput = document.querySelector(`input[name="rc_unique_35"][value="${taskTemplate.resourcePoolType}"]`) as HTMLInputElement;
      if (resourcePoolTypeInput) {
        resourcePoolTypeInput.checked = true;
        resourcePoolTypeInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 设置优先级
      const priorityInput = document.querySelector('input[name="rc_unique_37"][value="normal"]') as HTMLInputElement;
      if (priorityInput) {
        priorityInput.checked = true;
        priorityInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 设置训练框架
      const frameworkInput = document.querySelector('input[name="rc_unique_38"][value="pytorch"]') as HTMLInputElement;
      if (frameworkInput) {
        frameworkInput.checked = true;
        frameworkInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 设置共享内存
      const sharedMemoryInput = document.querySelector('input[placeholder="请输入共享内存"]') as HTMLInputElement;
      if (sharedMemoryInput) {
        sharedMemoryInput.value = '10';
        sharedMemoryInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // 设置任务退出后自动删除
      const autoDeleteSwitch = document.querySelector('button[data-name="isCustomDelete"]') as HTMLButtonElement;
      if (autoDeleteSwitch) {
        autoDeleteSwitch.click();
      }

      // 设置自动容错
      const faultToleranceSwitch = document.querySelector('button[data-name="faultTolerance"]') as HTMLButtonElement;
      if (faultToleranceSwitch && !faultToleranceSwitch.getAttribute('aria-checked')) {
        faultToleranceSwitch.click();
      }

      console.log('任务表单填充完成');
    } catch (error) {
      console.error('填充表单失败:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      // localStorage记录
      if (typeof localStorage !== 'undefined') {
        try {
          const debugLog = {
            component: 'DataDumpForm',
            action: 'handleSubmit_triggered',
            timestamp: new Date().toISOString(),
            config: config
          };
          localStorage.setItem('aihc_debug_submit', JSON.stringify(debugLog));
        } catch (e) {}
      }
      
      // 多种调试输出方式
      console.debug('[DataDumpForm] 🔥 ==> handleSubmit 被触发 [第一行] - DEBUG');
      console.warn('[DataDumpForm] ⚠️ ==> handleSubmit 被触发 [第一行] - WARN');
      console.error('[DataDumpForm] ❌ ==> handleSubmit 被触发 [第一行] - ERROR（用于调试）');
      console.info('[DataDumpForm] ℹ️ ==> handleSubmit 被触发 [第一行] - INFO');
      
      // 在页面上显示调试信息
      if (typeof document !== 'undefined') {
        const debugDiv = document.createElement('div');
        debugDiv.style.cssText = 'position:fixed;top:100px;right:0;background:green;color:white;padding:10px;z-index:99999;';
        debugDiv.textContent = `handleSubmit触发: ${new Date().toLocaleTimeString()}`;
        document.body.appendChild(debugDiv);
        setTimeout(() => {
          if (document.body.contains(debugDiv)) {
            document.body.removeChild(debugDiv);
          }
        }, 5000);
      }
      
      console.debug('[DataDumpForm] 事件对象:', e);
      console.debug('[DataDumpForm] 当前配置:', JSON.stringify(config, null, 2));
      console.debug('[DataDumpForm] onSubmit 函数是否存在:', !!onSubmit);
      console.debug('[DataDumpForm] onSubmit 函数类型:', typeof onSubmit);
      
      e.preventDefault();
      console.debug('[DataDumpForm] 事件preventDefault已调用');
      
      setIsSubmitting(true);
      console.debug('[DataDumpForm] isSubmitting 设置为 true');
      
      setError('');
      console.debug('[DataDumpForm] error 已清空');

      console.debug('[DataDumpForm] 开始调用 onSubmit 函数...');
      if (onSubmit) {
        console.debug('[DataDumpForm] ✅ onSubmit 函数存在，开始执行');
        await onSubmit(config);
        console.debug('[DataDumpForm] ✅ onSubmit 函数执行成功');
      } else {
        console.error('[DataDumpForm] ❌ onSubmit 函数不存在！');
        throw new Error('onSubmit 函数未定义');
      }
    } catch (err) {
      console.error('[DataDumpForm] ❌ handleSubmit 捕获到错误:', err);
      console.debug('[DataDumpForm] 错误类型:', typeof err);
      console.error('[DataDumpForm] 错误详情:', err instanceof Error ? {
        name: err.name,
        message: err.message,
        stack: err.stack
      } : '非 Error 对象');
      
      const errorMessage = err instanceof Error ? err.message : '提交失败，请重试';
      console.error('[DataDumpForm] 设置错误信息:', errorMessage);
      setError(errorMessage);
    } finally {
      console.debug('[DataDumpForm] 设置 isSubmitting 为 false');
      setIsSubmitting(false);
    }
  };

  const updateConfig = (updates: Partial<DataDumpConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  // 渲染时的调试信息
  console.debug('[DataDumpForm] 🟢 组件正在渲染 - DEBUG', {
    timestamp: new Date().toISOString(),
    datasetId,
    category,
    onSubmitExists: !!onSubmit,
    configComplete: !!(config.resourcePoolId && config.queueId && config.pfsId && config.storagePath)
  });
  
  console.warn('[DataDumpForm] ⚠️ 组件正在渲染 - WARN', {
    timestamp: new Date().toISOString()
  });
  
  console.error('[DataDumpForm] ❌ 组件正在渲染 - ERROR（用于调试）', {
    timestamp: new Date().toISOString()
  });

  // 渲染时的调试信息
  console.log('[DataDumpForm] 渲染状态:', {
    isRedirected,
    config: config,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="data-dump-form">
      <div className="form-header">
        <h4>数据转储配置</h4>
        <p>数据集: {datasetInfo?.datasetName || datasetId} ({category})</p>
        {isRedirected && (
          <p style={{ color: '#1890ff', fontWeight: 'bold' }}>
            ✅ 已跳转到创建任务页面，表单已锁定
          </p>
        )}
        {datasetInfo?.datasetStoragePath && (
          <p className="dataset-storage-info">
            原始存储路径: <code>{datasetInfo.datasetStoragePath}</code>
          </p>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <form 
        onSubmit={handleSubmit} 
        className="dump-form"
        onSubmitCapture={(e) => {
          console.log('[DataDumpForm] 🟦 表单 onSubmitCapture 事件触发:', e);
        }}
        ref={(formRef) => {
          if (formRef) {
            console.log('[DataDumpForm] 📝 表单元素已挂载:', formRef);
          }
        }}
      >
        {/* 资源池类型 */}
        <div className="form-group">
          <label htmlFor="resourcePoolType">资源池类型 *</label>
          <select
            id="resourcePoolType"
            value={config.resourcePoolType}
            onChange={(e) => updateConfig({ 
              resourcePoolType: e.target.value as '自运维' | '全托管',
              resourcePoolId: '', // 重置资源池ID
              queueId: '', // 重置队列ID
              pfsId: '' // 重置PFS ID
            })}
            required
            disabled={isRedirected}
          >
            <option value="自运维">自运维资源池</option>
            <option value="全托管">全托管资源池</option>
          </select>
        </div>

        {/* 资源池选择 */}
        <div className="form-group">
          <label htmlFor="resourcePoolId">资源池 *</label>
          <select
            id="resourcePoolId"
            value={config.resourcePoolId}
            onChange={(e) => updateConfig({ 
              resourcePoolId: e.target.value,
              queueId: '', // 重置队列ID
              pfsId: '' // 重置PFS ID
            })}
            required
            disabled={isRedirected || isLoading || resourcePools.length === 0}
          >
            <option value="">
              {isLoading ? '正在加载资源池...' : '请选择资源池'}
            </option>
            {resourcePools.map(pool => (
              <option key={pool.resourcePoolId} value={pool.resourcePoolId}>
                {pool.name} ({pool.phase})
              </option>
            ))}
          </select>
          {isLoading && (
            <small className="form-hint">
              正在加载{config.resourcePoolType}资源池列表...
            </small>
          )}
          {!isLoading && resourcePools.length === 0 && (
            <small className="form-hint">
              该类型下暂无可用资源池
            </small>
          )}
        </div>

        {/* 队列选择 */}
        <div className="form-group">
          <label htmlFor="queueId">队列 *</label>
          <select
            id="queueId"
            value={config.queueId}
            onChange={(e) => updateConfig({ queueId: e.target.value })}
            required
            disabled={isRedirected || isLoading || queues.length === 0 || !config.resourcePoolId}
          >
            <option value="">
              {isLoading ? '正在加载队列...' : 
               !config.resourcePoolId ? '请先选择资源池' : 
               '请选择队列'}
            </option>
            {queues.map(queue => (
              <option key={queue.queueId} value={queue.queueId}>
                {queue.queueName} ({queue.phase})
              </option>
            ))}
          </select>
          {isLoading && config.resourcePoolId && (
            <small className="form-hint">
              正在加载队列列表...
            </small>
          )}
          {!isLoading && queues.length === 0 && config.resourcePoolId && (
            <small className="form-hint">
              该资源池下暂无可用队列
            </small>
          )}
        </div>

        {/* PFS实例选择 */}
        <div className="form-group">
          <label htmlFor="pfsId">PFS实例 *</label>
          <select
            id="pfsId"
            value={config.pfsId}
            onChange={(e) => updateConfig({ pfsId: e.target.value })}
            required
            disabled={isRedirected || isLoading || pfsInstances.length === 0 || !config.resourcePoolId}
          >
            <option value="">
              {isLoading ? '正在加载PFS实例...' : 
               !config.resourcePoolId ? '请先选择资源池' : 
               pfsInstances.length === 0 ? '无可用PFS实例' :
               '请选择PFS实例'}
            </option>
            {pfsInstances.map(pfs => (
              <option key={pfs.id} value={pfs.id}>
                {pfs.name} ({pfs.status})
                {pfs.capacity && pfs.usage && ` - ${((pfs.usage / pfs.capacity) * 100).toFixed(1)}% 使用`}
              </option>
            ))}
          </select>
          {isLoading && config.resourcePoolId && (
            <small className="form-hint">
              正在加载PFS实例列表...
            </small>
          )}
          {!isLoading && pfsInstances.length === 0 && config.resourcePoolId && (
            <small className="form-hint">
              该资源池下暂无可用PFS实例，请检查资源池是否配置了PFS存储
            </small>
          )}
          {!isLoading && pfsInstances.length > 0 && (
            <small className="form-hint">
              找到 {pfsInstances.length} 个可用PFS实例
            </small>
          )}
        </div>

        {/* 存储路径 */}
        <div className="form-group">
          <label htmlFor="storagePath">存储路径 *</label>
          <input
            type="text"
            id="storagePath"
            value={config.storagePath}
            onChange={(e) => updateConfig({ storagePath: e.target.value })}
            placeholder="例如: /aihc-datasets/huggingface.co/datasets/nvidia/PhysicalAI-Robotics-GR00T-GR1"
            required
            disabled={isRedirected}
          />
          <small className="form-hint">
            数据转储的目标存储路径（已自动从数据集存储路径中去除bos:前缀）
          </small>
        </div>

        {/* 操作按钮 */}
        <div className="form-actions">
          {isRedirected ? (
            <>
              <button
                type="button"
                onClick={handleReturnToDataset}
                className="btn btn-secondary"
              >
                返回数据集下载详情页
              </button>
              <button
                type="button"
                onClick={handleFillTaskInfo}
                className="btn btn-primary"
              >
                填充任务信息
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || isLoading}
                onClick={(e) => {
                  // localStorage记录
                  if (typeof localStorage !== 'undefined') {
                    try {
                      const debugLog = {
                        component: 'DataDumpForm',
                        action: 'button_clicked',
                        timestamp: new Date().toISOString(),
                        disabled: isSubmitting || isLoading
                      };
                      localStorage.setItem('aihc_debug_button', JSON.stringify(debugLog));
                    } catch (e) {}
                  }
                  
                  // 多种方式输出调试信息
                  console.debug('[DataDumpForm] 🔥 提交按钮被点击 - DEBUG');
                  console.warn('[DataDumpForm] ⚠️ 提交按钮被点击 - WARN');
                  console.error('[DataDumpForm] ❌ 提交按钮被点击 - ERROR（用于调试）');
                  console.info('[DataDumpForm] ℹ️ 提交按钮被点击 - INFO');
                  
                  // 尝试直接在页面上显示调试信息
                  if (typeof document !== 'undefined') {
                    const debugDiv = document.createElement('div');
                    debugDiv.style.cssText = 'position:fixed;top:50px;right:0;background:blue;color:white;padding:10px;z-index:99999;';
                    debugDiv.textContent = `按钮被点击: ${new Date().toLocaleTimeString()}`;
                    document.body.appendChild(debugDiv);
                    setTimeout(() => {
                      if (document.body.contains(debugDiv)) {
                        document.body.removeChild(debugDiv);
                      }
                    }, 5000);
                  }
                  
                  console.debug('[DataDumpForm] 事件对象存在:', !!e);
                  console.debug('[DataDumpForm] 按钮disabled状态:', isSubmitting || isLoading);
                  console.debug('[DataDumpForm] isSubmitting:', isSubmitting);
                  console.debug('[DataDumpForm] isLoading:', isLoading);
                  console.debug('[DataDumpForm] 当前时间戳:', new Date().toISOString());
                  // 注意：这里不要调用 e.preventDefault()，要让表单的 onSubmit 事件正常触发
                }}
              >
                {isSubmitting ? '提交中...' : '提交转储任务'}
              </button>
            </>
          )}
        </div>
      </form>

      <style>{`
        .data-dump-form {
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
        }

        .form-header {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e0e0e0;
        }

        .form-header h3 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 20px;
        }

        .form-header p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .dataset-storage-info {
          margin-top: 8px !important;
          padding: 8px 12px;
          background: #f8f9fa;
          border-radius: 4px;
          font-size: 12px !important;
          color: #555 !important;
        }

        .dataset-storage-info code {
          background: #e9ecef;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 11px;
          color: #495057;
        }

        .error-message {
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 20px;
          color: #c33;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .error-icon {
          font-size: 16px;
        }

        .dump-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        label {
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }

        input, select {
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        input:focus, select:focus {
          outline: none;
          border-color: #4285f4;
          box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.1);
        }

        input:disabled, select:disabled {
          background: #f5f5f5;
          color: #999;
          cursor: not-allowed;
        }

        .form-hint {
          color: #666;
          font-size: 12px;
          margin-top: 4px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #4285f4;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #3367d6;
        }

        .btn-secondary {
          background: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e8e8e8;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {
          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default DataDumpForm;
