import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout, ConfigProvider, Button } from 'antd';
import { VerticalAlignTopOutlined } from '@ant-design/icons';
import { TaskParams, Message, PageInfo, TabType, DataDumpConfig, DataDumpTaskTemplate, DataImportConfig } from '../types';
import { getCurrentTabInfo } from '../utils/pageDetection';
import { copyToClipboard, saveToFile, openUrl, createMessage } from '../utils/helpers';
import { PageHandlerManager } from '../handlers';

// 导入重新设计的组件
import HeaderRedesigned from './HeaderRedesigned';
import LoadingIndicatorRedesigned from './LoadingIndicatorRedesigned';
import TabNavigationRedesigned from './TabNavigationRedesigned';
import ContentAreaRedesigned from './ContentAreaRedesigned';
import MessageDisplayRedesigned from './MessageDisplayRedesigned';
import UnsupportedPageRedesigned from './UnsupportedPageRedesigned';
import UserGuideAntd from './UserGuideAntd';

const { Content } = Layout;

interface PopupContainerProps {
  // 可以添加props
}

const PopupContainer: React.FC<PopupContainerProps> = () => {
  // 全局错误监听
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[PopupContainer] 全局错误捕获:', event.error);
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[PopupContainer] 未处理的Promise拒绝:', event.reason);
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // 回到顶部功能
  const scrollToTop = () => {
    const container = document.querySelector('.ant-layout-content');
    if (container) {
      container.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      // 如果找不到容器，尝试滚动整个窗口
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };
  
  const [activeTab, setActiveTab] = useState<TabType>('cli');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    isSupported: false,
    pageName: '支持的页面列表：',
    url: '',
    params: {}
  });
  
  const [taskParams, setTaskParams] = useState<TaskParams>({
    type: 'ocr',
    dataSource: 'local',
    priority: 'medium',
    customParams: '',
    generated: '',
    name: '',
    commandScript: '',
    jsonItems: [],
    yamlItems: [],
    cliItems: [],
    apiDocs: []
  });

  // 生成请求示例的通用方法
  const generateRequestExample = (
    method: 'GET' | 'POST', 
    action: string, 
    params?: { resourcePoolId?: string; resourcePoolType?: string; serviceId?: string; datasetId?: string; modelId?: string; pageNumber?: string; pageSize?: string; versionId?: string }
  ) => {
    const baseUrl = 'aihc.bj.baidubce.com';
    let endpoint = `?action=${action}`;
    
    if (params?.resourcePoolId) {
      endpoint += `&resourcePoolId=${params.resourcePoolId}`;
    }
    if (params?.resourcePoolType) {
      endpoint += `&resourcePoolType=${params.resourcePoolType}`;
    }
    if (params?.serviceId) {
      endpoint += `&serviceId=${params.serviceId}`;
    }
    if (params?.datasetId) {
      endpoint += `&datasetId=${params.datasetId}`;
    }
    if (params?.modelId) {
      endpoint += `&modelId=${params.modelId}`;
    }
    if (params?.pageNumber) {
      endpoint += `&pageNumber=${params.pageNumber}`;
    }
    if (params?.pageSize) {
      endpoint += `&pageSize=${params.pageSize}`;
    }
    if (params?.versionId) {
      endpoint += `&versionId=${params.versionId}`;
    }
    
    const headers = [
      `Host: ${baseUrl}`,
      'Authorization: authorization string',
      'Content-Type: application/json',
      'version: v2'
    ];
    
    return `${method} ${endpoint}
${headers.join('\n')}`;
  };

  // 创建页面处理器管理器
  const pageHandlerManager = new PageHandlerManager({ generateRequestExample });

  // 显示消息
  const showMessage = useCallback((type: Message['type'], text: string, duration: number = 3000) => {
    const newMessage = createMessage(type, text);
    setMessage(newMessage);
    
    if (duration > 0) {
      setTimeout(() => {
        setMessage(null);
      }, duration);
    }
  }, []);

  // 处理URL获取
  const handleFetchUrl = async (pageName: string, url: string, params: Record<string, string>) => {
    // 处理页面信息
    // 开发环境下记录当前状态
    if (process.env.NODE_ENV === 'development') {
      console.log('[AIHC助手] 当前状态:', {
        isDataDownloadPage: taskParams.isDataDownloadPage,
        isDataDumpPage: taskParams.isDataDumpPage,
        activeTab,
        isLoading
      });
    }
    
    // 防止重复加载
    if (isLoading) {
      // 正在加载中，跳过重复请求
      return;
    }
    
    try {
      setIsLoading(true);
      // 设置加载状态为true
      
      // 使用页面处理器管理器处理页面
      console.log('[AIHC助手] 调用页面处理器管理器');
      console.log('[AIHC助手] 传递的参数:', { pageName, url, params });
      const pageData = await pageHandlerManager.handlePage(pageName, { ...params, url });
      console.log('[AIHC助手] 页面处理器返回数据:', pageData);
      
      // 更新任务参数，完全替换旧状态
      setTaskParams(prev => {
        const newParams = {
          // 保留基础字段
          type: prev.type,
          dataSource: prev.dataSource,
          priority: prev.priority,
          customParams: prev.customParams,
          generated: prev.generated,
          name: prev.name,
          // 设置默认值，然后用新页面数据覆盖
          commandScript: '',
          jsonItems: [],
          yamlItems: [],
          cliItems: [],
          apiDocs: [],
          chatConfig: undefined,
          isDataDownloadPage: false,
          isDataDumpPage: false,
          isHuggingFaceDatasetPage: false,
          datasetId: undefined,
          category: undefined,
          // 用新页面数据覆盖默认值
          ...pageData
        };
        
        console.log('[AIHC助手] 🔍 状态更新详情:', {
          pageName,
          pageData,
          newParams,
          isHuggingFaceDatasetPage: newParams.isHuggingFaceDatasetPage,
          huggingFaceDataset: newParams.huggingFaceDataset
        });
        
        return newParams;
      });
      console.log('[AIHC助手] ✅ 任务参数已更新:', {
        oldIsDataDownloadPage: taskParams.isDataDownloadPage,
        newIsDataDownloadPage: pageData.isDataDownloadPage,
        oldIsDataDumpPage: taskParams.isDataDumpPage,
        newIsDataDumpPage: pageData.isDataDumpPage,
        oldIsHuggingFaceDatasetPage: taskParams.isHuggingFaceDatasetPage,
        newIsHuggingFaceDatasetPage: pageData.isHuggingFaceDatasetPage,
        pageName
      });
      
      // 检查当前activeTab是否仍然有效，如果无效则设置默认tab
      // 使用useCallback包装setActiveTab以避免异步状态问题
      const setDefaultTab = () => {
        if (pageData.apiDocs && pageData.apiDocs.length > 0) {
          setActiveTab('apiDocs');
        } else if (pageData.cliItems && pageData.cliItems.length > 0) {
          setActiveTab('cli');
        }
      };
      
      // 对于特殊页面（数据转储、数据下载、HuggingFace数据集页面），不设置activeTab
      if (pageData.isDataDumpPage || pageData.isDataDownloadPage || pageData.isHuggingFaceDatasetPage) {
        console.log('[AIHC助手] 特殊页面，跳过activeTab设置');
      } else {
        // 立即检查并设置默认tab，不使用setTimeout
        const currentTabValid = (
          (activeTab === 'cli' && pageData.cliItems && pageData.cliItems.length > 0) ||
          (activeTab === 'apiDocs' && pageData.apiDocs && pageData.apiDocs.length > 0) ||
          (activeTab === 'chat' && pageData.chatConfig) ||
          (activeTab === 'json' && pageData.jsonItems && pageData.jsonItems.length > 0) ||
          (activeTab === 'yaml' && pageData.yamlItems && pageData.yamlItems.length > 0) ||
          (activeTab === 'commandScript' && pageData.commandScript)
        );
        
        if (!currentTabValid) {
          setDefaultTab();
        }
      }
      
    } catch (error) {
      console.error('处理URL失败:', error);
      showMessage('error', '加载页面数据失败');
    } finally {
      console.log('[AIHC助手] 设置加载状态为false');
      setIsLoading(false);
    }
  };

  // 复制文本处理
  const handleCopyText = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      showMessage('success', '已复制到剪贴板', 2000);
    } else {
      showMessage('error', '复制失败', 2000);
    }
  };

  // 保存文件处理
  const handleSaveFile = (content: string, type: 'json' | 'yaml' | 'txt') => {
    saveToFile(content, type);
    showMessage('success', '文件已保存', 2000);
  };

  // 打开URL处理
  const handleOpenUrl = (url: string) => {
    openUrl(url);
  };

  // 加载Chat配置
  const handleLoadChatConfig = useCallback(async (serviceId: string) => {
    console.log('[PopupContainer] handleLoadChatConfig 被调用，serviceId:', serviceId);
    try {
      setIsLoading(true);
      setTaskParams(prev => ({ ...prev, chatLoading: true, chatError: undefined }));
      
      // 加载Chat配置
      
      // 调用API获取服务详情
      const apiUrl = `https://console.bce.baidu.com/api/aihcpom/app/v1/details?appId=${serviceId}&locale=zh-cn&_=${Date.now()}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(apiUrl, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[AIHC助手] 服务详情数据完整响应:', JSON.stringify(data, null, 2));
        
        // 尝试不同的数据结构路径
        let status = null;
        let serviceInfo = null;
        
        // 检查可能的路径
        if (data.data?.status) {
          status = data.data.status;
          console.log('[AIHC助手] 从 data.data.status 获取状态信息');
        } else if (data.status) {
          status = data.status;
          console.log('[AIHC助手] 从 data.status 获取状态信息');
        } else if (data.data) {
          serviceInfo = data.data;
          console.log('[AIHC助手] 从 data 获取服务信息');
        } else {
          console.log('[AIHC助手] 数据结构:', Object.keys(data));
          throw new Error('无法找到服务状态信息，请检查API响应格式');
        }
        
        // 从状态信息中提取配置
        let internalIP, port, token, basePath;
        
        if (status) {
          internalIP = status.accessIPs?.internal;
          port = status.accessPorts?.[0]?.servicePort || 8000;
          token = status.aiGateway?.tokens?.serveless;
          basePath = status.aiGateway?.basePath || '';
        } else if (serviceInfo) {
          // 尝试从服务信息中提取
          internalIP = serviceInfo.accessIPs?.internal;
          port = serviceInfo.accessPorts?.[0]?.servicePort || 8000;
          token = serviceInfo.aiGateway?.tokens?.serveless;
          basePath = serviceInfo.aiGateway?.basePath || '';
        }
        
        console.log('[AIHC助手] 提取的服务信息:', {
          internalIP,
          port,
          token: token ? `${token.substring(0, 20)}...` : 'none',
          basePath,
          hasStatus: !!status,
          hasServiceInfo: !!serviceInfo
        });
        
        if (internalIP && token) {
          const chatConfig = {
            serviceUrl: `http://${internalIP}${basePath}${port}`,
            accessToken: token,
            basePath: '',
            serviceId: serviceId,
            isLoaded: true
          };
          
          console.log('[AIHC助手] Chat配置创建成功:', {
            serviceUrl: chatConfig.serviceUrl,
            basePath: chatConfig.basePath,
            hasToken: !!chatConfig.accessToken
          });
          
          setTaskParams(prev => ({
            ...prev,
            chatConfig,
            chatLoading: false,
            chatError: undefined
          }));
          
          showMessage('success', 'Chat配置加载成功！');
        } else {
          throw new Error(`服务状态信息不完整，缺少必要的访问信息。IP: ${internalIP}, Token: ${token ? '有' : '无'}`);
        }
      } else {
        throw new Error(`API请求失败，状态码: ${response.status}`);
      }
    } catch (error) {
      console.error('[AIHC助手] Chat配置加载失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      setTaskParams(prev => ({
        ...prev,
        chatLoading: false,
        chatError: errorMessage
      }));
      
      showMessage('error', `Chat配置加载失败: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [showMessage]);

  // 处理数据转储提交 - 跳转到创建任务页面
  const handleSubmitDataDump = useCallback(async (config: DataDumpConfig) => {
    // 验证必要参数
    const requiredFields = ['resourcePoolType', 'resourcePoolId', 'queueId', 'pfsId', 'storagePath'];
    const missingFields = requiredFields.filter(field => !config[field as keyof DataDumpConfig]);
    
    if (missingFields.length > 0) {
      const errorMsg = `缺少必要参数: ${missingFields.join(', ')}`;
      showMessage('error', errorMsg);
      return;
    }
    
    try {
      // 生成任务模板
      const taskTemplate = generateDataDumpTaskTemplate(config);
      
      // 保存任务配置到localStorage，供后续使用
      localStorage.setItem('aihc_data_dump_config', JSON.stringify(config));
      localStorage.setItem('aihc_data_dump_template', JSON.stringify(taskTemplate));
      
      // 使用Chrome扩展API在当前页签打开创建任务页面
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].id) {
            chrome.tabs.update(tabs[0].id, {
              url: 'https://console.bce.baidu.com/aihc/task/create?from=dataDownload'
            });
          }
        });
      } else {
        // 如果不在扩展环境中，使用window.location
        window.location.href = 'https://console.bce.baidu.com/aihc/task/create?from=dataDownload';
      }
      
      showMessage('success', '正在跳转到创建任务页面...');
      
    } catch (error) {
      console.error('[AIHC助手] 跳转失败:', error);
      showMessage('error', `跳转失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [showMessage]);

  // 处理数据导入提交
  const handleSubmitDataImport = useCallback(async (config: DataImportConfig) => {
    console.log('[AIHC助手] 处理数据导入提交:', config);
    
    try {
      // 数据导入任务已经在DataImportForm中直接调用API创建
      // 这里只需要显示成功消息
      showMessage('success', '数据导入任务已创建成功！');
      
    } catch (error) {
      console.error('[AIHC助手] 数据导入处理失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showMessage('error', `数据导入处理失败: ${errorMessage}`);
    }
  }, [showMessage]);

  // 生成数据转储任务模板
  const generateDataDumpTaskTemplate = (config: DataDumpConfig): DataDumpTaskTemplate => {
    const timestamp = Date.now();
    const jobName = `data-dump-${config.resourcePoolId.substring(0, 8)}-${timestamp}`;
    
    console.log('[AIHC助手] 生成任务模板参数:', {
      resourcePoolType: config.resourcePoolType,
      resourcePoolId: config.resourcePoolId,
      queueId: config.queueId,
      pfsId: config.pfsId,
      storagePath: config.storagePath,
      jobName
    });
    
    // 构建 PFS 数据源配置（使用用户配置的存储路径）
    const pfsDataSource = {
      sourcePath: config.storagePath, // 用户配置的存储路径（已去除bos:前缀）
      mountPath: "/pfs/data",
      name: config.pfsId,
      pfsId: config.pfsId,
      options: {},
      type: "pfs"
    };
    
    // 构建 BOS 数据源配置（使用原始存储路径去除bos:前缀）
    let bosSourcePath = config.storagePath; // 默认使用用户配置路径
    if (config.originalStoragePath) {
      // 如果有原始路径，去除bos:前缀
      bosSourcePath = config.originalStoragePath.startsWith('bos:/') 
        ? config.originalStoragePath.substring(4) 
        : config.originalStoragePath;
    }
    
    const bosDataSource = {
      type: "bos",
      sourcePath: bosSourcePath, // 原始存储路径去除bos:前缀
      mountPath: "/bos/data",
      options: {}
    };
    
    console.log('[AIHC助手] 数据源配置详情:', {
      pfs: {
        sourcePath: pfsDataSource.sourcePath,
        description: '用户配置的存储路径'
      },
      bos: {
        sourcePath: bosDataSource.sourcePath,
        originalPath: config.originalStoragePath,
        description: '原始存储路径去除bos:前缀'
      }
    });
    
    return {
      tensorboard: {
        enable: false,
        logPath: "",
        serviceType: "LoadBalancer"
      },
      autoCreatePVC: true,
      priority: "normal",
      isCustomDelete: false,
      retentionPeriod: "",
      retentionUnit: "d",
      isPolicy: false,
      cpromId: "",
      selectedRowKeys: [],
      pfsId: config.pfsId,
      imageType: "ccr",
      runningTimeoutStopTimeUnit: "0d",
      visibleScope: 1,
      resourcePoolType: config.resourcePoolType === '自运维' ? 'normal' : 'serverless',
      jobFramework: "pytorch",
      name: jobName,
      command: `echo "数据转储任务开始执行..." && \
echo "数据集存储路径: ${config.storagePath}" && \
echo "PFS实例ID: ${config.pfsId}" && \
echo "转储开始时间: $(date)" && \
echo "开始数据转储操作..." && \
sleep 300 && \
echo "数据转储任务完成: $(date)"`,
      enabledHangDetection: false,
      unconditionalFaultToleranceLimit: 0,
      enableReplace: false,
      queue: config.queueId,
      vpcId: "vpc-f0pp0jbzip3c", // 这个值应该从资源池配置中动态获取
      datasource: [
        {
          type: "emptydir",
          name: "devshm",
          mountPath: "/dev/shm",
          options: {
            medium: "Memory",
            sizeLimit: 10
          }
        },
        pfsDataSource,
        bosDataSource
      ],
      jobSpec: {
        Master: {
          image: "registry.baidubce.com/aihcp-public/pytorch",
          tag: "22.08-py3",
          replicas: 1,
          env: {
            AIHC_JOB_NAME: jobName,
            NCCL_IB_DISABLE: "1",
            DATA_DUMP_STORAGE_PATH: config.storagePath,
            DATA_DUMP_RESOURCE_POOL: config.resourcePoolId,
            DATA_DUMP_PFS_ID: config.pfsId,
            DATA_DUMP_QUEUE_ID: config.queueId
          },
          resource: {},
          restartPolicy: "Never"
        }
      },
      faultTolerance: false,
      jobDistributed: false,
      labels: {
        "aijob.cce.baidubce.com/create-from-aihcp": "true",
        "data-dump-task": "true",
        "resource-pool-id": config.resourcePoolId,
        "pfs-id": config.pfsId,
        "queue-id": config.queueId
      },
      annotations: null,
      workloadType: "PytorchJob"
    };
  };

  // 防抖计时器
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 页面检测和更新函数
  const detectAndUpdatePage = useCallback(async () => {
    // 清除之前的防抖计时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 设置新的防抖计时器
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const currentTabInfo = await getCurrentTabInfo();
        console.log('[AIHC助手] 检测到页面变化:', currentTabInfo);
        
        setPageInfo(currentTabInfo);
        
        if (currentTabInfo.isSupported) {
          await handleFetchUrl(currentTabInfo.pageName, currentTabInfo.url, currentTabInfo.params);
        } else {
          // 清空不支持页面的数据，包括特殊页面标志
          setTaskParams(prev => ({
            ...prev,
            cliItems: [],
            apiDocs: [],
            jsonItems: [],
            yamlItems: [],
            commandScript: '',
            chatConfig: undefined,
            // 清除特殊页面标志
            isDataDownloadPage: false,
            isDataDumpPage: false,
            isHuggingFaceDatasetPage: false,
            datasetId: undefined,
            category: undefined,
            huggingFaceDataset: undefined
          }));
          setActiveTab('cli');
        }
      } catch (error) {
        console.error('页面检测失败:', error);
        showMessage('error', '页面检测失败');
      }
    }, 200); // 200ms防抖延迟
  }, []); // 移除依赖，避免无限循环

  // 初始化页面检测
  useEffect(() => {
    detectAndUpdatePage();
  }, [detectAndUpdatePage]);

  // 监听来自background的消息（比如页面变化通知）
  useEffect(() => {
    const handleBackgroundMessage = (message: any, _sender: any, sendResponse: (response?: any) => void) => {
      console.log('[AIHC助手] PopupContainer收到background消息:', message);
      
      // 处理页面变化通知
      if (message.action === 'pageChanged') {
        console.log('[AIHC助手] 收到页面变化通知，重新检测页面');
        console.log('[AIHC助手] 页面变化通知详情:', {
          url: message.url,
          timestamp: message.timestamp,
          currentUrl: window.location.href
        });
        // 触发页面重新检测
        detectAndUpdatePage();
        sendResponse({ success: true });
      }
      
      return true; // 保持消息通道开放
    };
    
    // 添加消息监听器
    if (chrome.runtime && chrome.runtime.onMessage) {
      console.log('[AIHC助手] 添加消息监听器');
      chrome.runtime.onMessage.addListener(handleBackgroundMessage);
    }
    
    // 清理监听器
    return () => {
      if (chrome.runtime && chrome.runtime.onMessage) {
        console.log('[AIHC助手] 移除消息监听器');
        chrome.runtime.onMessage.removeListener(handleBackgroundMessage);
      }
    };
  }, [detectAndUpdatePage]);
  
  // 监听页面变化
  useEffect(() => {
    const handleTabUpdate = (_tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      // 处理当前活动标签页的变化，包括所有页面（支持和不支持的）
      if (changeInfo.url && tab.active && tab.url) {
        console.log('[AIHC助手] 检测到页面URL变化:', changeInfo.url);
        // 使用防抖的detectAndUpdatePage，避免频繁触发
        detectAndUpdatePage();
      }
    };

    const handleTabActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
      console.log('[AIHC助手] 检测到标签页切换:', activeInfo.tabId);
      // 获取当前标签页信息，处理所有页面（支持和不支持的）
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab.url) {
          console.log('[AIHC助手] 标签页激活，URL:', tab.url);
          detectAndUpdatePage();
        }
      });
    };

    // 监听标签页更新
    if (chrome.tabs && chrome.tabs.onUpdated) {
      chrome.tabs.onUpdated.addListener(handleTabUpdate);
    }

    // 监听标签页激活
    if (chrome.tabs && chrome.tabs.onActivated) {
      chrome.tabs.onActivated.addListener(handleTabActivated);
    }

    // 清理监听器
    return () => {
      if (chrome.tabs && chrome.tabs.onUpdated) {
        chrome.tabs.onUpdated.removeListener(handleTabUpdate);
      }
      if (chrome.tabs && chrome.tabs.onActivated) {
        chrome.tabs.onActivated.removeListener(handleTabActivated);
      }
    };
  }, [detectAndUpdatePage]);

  // 渲染内容
  const renderContent = () => {
    console.log('[PopupContainer] 🟢 renderContent 被调用');
    console.log('[PopupContainer] 当前页面状态:', {
      isSupported: pageInfo.isSupported,
      pageName: pageInfo.pageName,
      url: pageInfo.url,
      isLoading,
      isDataDumpPage: taskParams.isDataDumpPage,
      isDataDownloadPage: taskParams.isDataDownloadPage,
      isHuggingFaceDatasetPage: taskParams.isHuggingFaceDatasetPage,
      datasetId: taskParams.datasetId,
      category: taskParams.category
    });
    
    if (!pageInfo.isSupported) {
      console.log('[PopupContainer] 页面不支持，显示 UnsupportedPage');
      return (
        <UnsupportedPageRedesigned 
          currentUrl={pageInfo.url}
        />
      );
    }

    if (isLoading) {
      console.log('[PopupContainer] 正在加载，显示 LoadingIndicator');
      return <LoadingIndicatorRedesigned />;
    }

    // 数据转储页面、数据下载页面和Hugging Face数据集页面不显示TAB导航
    if (taskParams.isDataDumpPage || taskParams.isDataDownloadPage || taskParams.isHuggingFaceDatasetPage) {
      console.log('[PopupContainer] 🟦 显示特殊页面（数据转储/下载/Hugging Face）');
      console.log('[PopupContainer] handleSubmitDataDump 函数情况:', {
        exists: !!handleSubmitDataDump,
        type: typeof handleSubmitDataDump,
        name: handleSubmitDataDump?.name,
        toString: handleSubmitDataDump?.toString().substring(0, 100)
      });
      
      return (
        <ContentAreaRedesigned
          activeTab={activeTab}
          taskParams={taskParams}
          onCopyText={handleCopyText}
          onSaveFile={handleSaveFile}
          onOpenUrl={handleOpenUrl}
          onLoadChatConfig={handleLoadChatConfig}
          onSubmitDataDump={handleSubmitDataDump}
          onSubmitDataImport={handleSubmitDataImport}
        />
      );
    }

    console.log('[PopupContainer] 显示常规页面内容');
    return (
      <>
        <TabNavigationRedesigned
          activeTab={activeTab}
          onTabChange={setActiveTab}
          taskParams={taskParams}
          pageName={pageInfo.pageName}
        />
        <ContentAreaRedesigned
          activeTab={activeTab}
          taskParams={taskParams}
          onCopyText={handleCopyText}
          onSaveFile={handleSaveFile}
          onOpenUrl={handleOpenUrl}
          onLoadChatConfig={handleLoadChatConfig}
          onSubmitDataDump={handleSubmitDataDump}
          onSubmitDataImport={handleSubmitDataImport}
        />
      </>
    );
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 4,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontSize: 12,
          lineHeight: 1.4,
        },
        components: {
          Layout: {
            bodyBg: 'transparent',
            headerBg: 'transparent',
            siderBg: 'transparent',
          },
          Card: {
            borderRadius: 4,
            boxShadow: 'none',
            paddingLG: 8,
          },
          Button: {
            borderRadius: 4,
            fontWeight: 500,
            fontSize: 10,
            paddingInline: 8,
            paddingBlock: 2,
          },
          Tabs: {
            cardPadding: '4px 8px',
            cardGutter: 2,
            fontSize: 10,
          },
          Typography: {
            fontSize: 12,
            lineHeight: 1.4,
          },
        },
      }}
    >
      <Layout style={{ 
        minHeight: '100vh', 
        background: '#ffffff',
        overflow: 'hidden'
      }}>
        <HeaderRedesigned pageName={pageInfo.pageName} />
        
        <Content style={{ 
          padding: 0,
          overflow: 'auto',
          maxHeight: 'calc(100vh - 60px)',
          background: '#ffffff'
        }}>
          {renderContent()}
        </Content>
        
        {message && (
          <MessageDisplayRedesigned 
            message={message} 
            onDismiss={() => setMessage(null)}
          />
        )}
        
        <UserGuideAntd />
        
        {/* 自定义回到顶部按钮 */}
        <Button
          type="primary"
          shape="circle"
          icon={<VerticalAlignTopOutlined />}
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            right: 16,
            bottom: 16,
            width: 32,
            height: 32,
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px'
          }}
          title="回到顶部"
        />
      </Layout>
    </ConfigProvider>
  );
};

export default PopupContainer;
