import { PageInfo } from '../types';

// URL模式映射表
export const urlPatterns = {
  // AIHC控制台页面
  'https://console.bce.baidu.com/aihc/resources': '自运维资源池列表',
  'https://console.bce.baidu.com/aihc/serverless/resource/list?tab=resourcePool': '全托管资源池列表',
  'https://console.bce.baidu.com/aihc/serverless/resource/list': '全托管资源池列表',
  'https://console.bce.baidu.com/aihc/serverless/resource/list?tab=resourceQueue': '全托管队列列表',
  'https://console.bce.baidu.com/aihc/resource/info?': '自运维资源池详情',
  'https://console.bce.baidu.com/aihc/serverless/resource/info?': '全托管资源池详情',
  'https://console.bce.baidu.com/aihc/resource/queue?': '队列列表',
  'https://console.bce.baidu.com/aihc/tasks': '任务列表',
  'https://console.bce.baidu.com/aihc/infoTaskIndex/detail?': '任务详情',
  'https://console.bce.baidu.com/aihc/deployments/custom': '自定义部署',
  'https://console.bce.baidu.com/aihc/deployment/custom?': '在线服务部署详情',
  'https://console.bce.baidu.com/aihc/datasets': '数据集管理',
  'https://console.bce.baidu.com/aihc/dataset/info?tab=detail&': '数据集详情',
  'https://console.bce.baidu.com/aihc/dataset/info?': '数据集详情',
  'https://console.bce.baidu.com/aihc/dataset/info?tab=versions&': '数据集版本列表',
  'https://console.bce.baidu.com/aihc/modelManage/list': '模型管理列表',
  'https://console.bce.baidu.com/aihc/modelManage/info?tab=versions&': '模型版本列表',
  'https://console.bce.baidu.com/aihc/modelManage/info?tab=detail&': '模型详情',
  'https://console.bce.baidu.com/aihc/modelManage/info?': '模型详情',
  'https://console.bce.baidu.com/aihc/developmentMachines': '开发机列表',
  'https://console.bce.baidu.com/aihc/dataDownload/create': '创建数据下载任务',
  'https://console.bce.baidu.com/aihc/dataDownload/info?datasetId=': '数据下载任务详情',
  'https://console.bce.baidu.com/aihc/task/create?from=dataDownload': '创建任务',
  
  // Hugging Face页面
  'https://huggingface.co/datasets/': 'Hugging Face数据集页面',
  'https://huggingface.co/': 'Hugging Face模型页面',
};

// 检测当前页面类型
export const detectPageType = (url: string): PageInfo => {
  // 检测URL
  
  // 检查是否为AIHC控制台页面或Hugging Face页面
  if (!isAIHCConsolePage(url) && !isHuggingFacePage(url)) {
    console.log('[页面检测] 不是支持的页面');
    return {
      isSupported: false,
      pageName: '请在百舸AIHC控制台页面或Hugging Face数据集页面使用',
      url,
      params: {}
    };
  }

  let matched = false;
  let pageName = '支持的页面列表：';

  // 按模式长度降序排序，确保更具体的模式优先匹配
  const sortedPatterns = Object.entries(urlPatterns).sort((a, b) => b[0].length - a[0].length);
  // 匹配URL模式
  
  for (const [pattern, name] of sortedPatterns) {
    const isMatch = url.startsWith(pattern);
    if (isMatch) {
      console.log('[页面检测] 匹配成功:', pattern, '->', name);
      // 特殊处理任务列表页面
      if (name === '任务列表' && url.includes('?clusters=all')) {
        console.log('[页面检测] 任务列表页面特殊处理：跳过clusters=all');
        matched = false;
        break;
      }
      matched = true;
      pageName = name;
      break;
    } else {
      // 只在调试模式下输出所有未匹配的模式
      if (pattern.includes('dataDownload')) {
        console.log('[页面检测] 数据下载相关模式未匹配:', pattern, '当前URL:', url);
      }
    }
  }

  const { params } = parseUrl(url);
  console.log('[页面检测] 最终结果:', { matched, pageName, params });

  return {
    isSupported: matched,
    pageName: matched ? pageName : '请在支持的AIHC功能页面使用',
    url,
    params
  };
};

// 解析URL，获取url和query参数
export const parseUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    const queryParams = urlObj.searchParams;
    const params: Record<string, string> = {};
    
    for (const [key, value] of queryParams.entries()) {
      params[key] = value;
    }
    
    return {
      url: urlObj.origin + urlObj.pathname,
      params: params
    };
  } catch (error) {
    console.error('解析URL失败:', error);
    return {
      url: '',
      params: {}
    };
  }
};

// 检查是否为AIHC控制台页面
export const isAIHCConsolePage = (url: string = window.location.href): boolean => {
  return url.startsWith('https://console.bce.baidu.com/aihc');
};

// 检查是否为Hugging Face页面
export const isHuggingFacePage = (url: string = window.location.href): boolean => {
  return url.startsWith('https://huggingface.co/datasets/') || 
         (url.startsWith('https://huggingface.co/') && 
          !url.includes('/datasets/') && 
          url.split('/').length >= 4);
};

// 获取当前活动标签页信息
export const getCurrentTabInfo = (): Promise<PageInfo> => {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          console.error('[AIHC助手] 获取标签页时出错:', chrome.runtime.lastError.message);
          resolve({
            isSupported: false,
            pageName: chrome.runtime.lastError.message || '获取页面信息失败',
            url: '',
            params: {}
          });
          return;
        }

        if (!tabs || tabs.length === 0) {
          console.error('[AIHC助手] 未找到活动标签页');
          resolve({
            isSupported: false,
            pageName: '未找到活动标签页',
            url: '',
            params: {}
          });
          return;
        }

        const currentUrl = tabs[0].url;
        console.log('[AIHC助手] 当前URL:', currentUrl);
        
        if (!currentUrl) {
          console.error('[AIHC助手] 无法获取页面URL');
          resolve({
            isSupported: false,
            pageName: '无法获取页面URL',
            url: '',
            params: {}
          });
          return;
        }

        const pageInfo = detectPageType(currentUrl);
        console.log('[AIHC助手] 页面检测结果:', pageInfo);
        resolve(pageInfo);
      });
    } else {
      // 在content script中直接使用window.location
      const pageInfo = detectPageType(window.location.href);
      console.log('[AIHC助手] Content Script页面检测结果:', pageInfo);
      resolve(pageInfo);
    }
  });
};