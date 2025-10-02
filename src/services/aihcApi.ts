// AIHC API服务模块
import { DataDumpTaskTemplate } from '../types';

export interface ResourcePool {
  resourcePoolId: string;
  name: string;
  type: 'common' | 'serverless';
  phase: string;
  region: string;
  pfsId?: string;
  pfsMountTarget?: string;
  vpcId?: string;
}

export interface Queue {
  queueId: string;
  queueName: string;
  resourcePoolId: string;
  phase: string;
  opened: boolean;
  remaining?: {
    cpuCores?: string;
    memoryGi?: string;
    milliCPUcores?: string;
  };
}

export interface PFSInstance {
  id: string;
  name: string;
  resourcePoolId: string;
  status: string;
  capacity?: number;
  usage?: number;
  instanceType?: string;
  mountPath?: string;
}

export interface DatasetInfo {
  datasetId: string;
  datasetName: string;
  datasetCategory: string;
  datasetStoragePath: string;
  datasetSource: string;
  state: string;
}

export interface TaskSubmissionResult {
  jobId: string;
  jobName: string;
  k8sName: string;
}

class AIHCApiService {
  private baseUrl = 'https://console.bce.baidu.com/api';

  // 获取百度云认证Token
  private getBaiduAuthToken(): string {
    if (typeof document !== 'undefined') {
      // 获取百度云的认证token
      const xBceJt = (window as any)['x-bce-jt'];
      if (xBceJt && typeof xBceJt === 'string') {
        console.log('[AIHCApiService] 获取到百度云认证token:', xBceJt.substring(0, 50) + '...');
        return xBceJt;
      }
      
      // 尝试其他可能的认证token
      const authKeys = ['x-bce-jt', 'bceToken', 'baiduToken', 'authToken', 'authorization'];
      for (const key of authKeys) {
        const token = (window as any)[key];
        if (token && typeof token === 'string') {
          console.log(`[AIHCApiService] 获取到认证token(${key}):`, token.substring(0, 50) + '...');
          return token;
        }
      }
      
      // 尝试从localStorage获取
      try {
        const localStorageKeys = Object.keys(localStorage);
        for (const key of localStorageKeys) {
          if (key.toLowerCase().includes('token') || key.toLowerCase().includes('auth') || key.toLowerCase().includes('bce')) {
            const token = localStorage.getItem(key);
            if (token && token.length > 10) {
              console.log(`[AIHCApiService] 从localStorage获取到认证token(${key}):`, token.substring(0, 50) + '...');
              return token;
            }
          }
        }
      } catch (e) {
        console.warn('[AIHCApiService] 访问localStorage失败:', e);
      }
      
      // 尝试从sessionStorage获取
      try {
        const sessionStorageKeys = Object.keys(sessionStorage);
        for (const key of sessionStorageKeys) {
          if (key.toLowerCase().includes('token') || key.toLowerCase().includes('auth') || key.toLowerCase().includes('bce')) {
            const token = sessionStorage.getItem(key);
            if (token && token.length > 10) {
              console.log(`[AIHCApiService] 从sessionStorage获取到认证token(${key}):`, token.substring(0, 50) + '...');
              return token;
            }
          }
        }
      } catch (e) {
        console.warn('[AIHCApiService] 访问sessionStorage失败:', e);
      }
      
      // 尝试从隐藏字段获取
      const hiddenInputs = document.querySelectorAll('input[type="hidden"]');
      for (const input of Array.from(hiddenInputs)) {
        const name = (input as HTMLInputElement).name || (input as HTMLInputElement).id;
        const value = (input as HTMLInputElement).value;
        if (name && (name.toLowerCase().includes('token') || name.toLowerCase().includes('auth') || name.toLowerCase().includes('csrf')) && value) {
          console.log(`[AIHCApiService] 从隐藏字段获取到认证token(${name}):`, value.substring(0, 50) + '...');
          return value;
        }
      }
    }
    
    console.log('[AIHCApiService] 未找到百度云认证token');
    return '';
  }


  // 获取自运维资源池列表
  async getSelfManagedResourcePools(abortController?: AbortController): Promise<ResourcePool[]> {
    const url = `${this.baseUrl}/aihc/aihc-service/v3/resourcepools?keywordType=resourcePoolName&keyword=&pageSize=100&orderBy=createdAt&order=desc&region=bj&pageNumber=1&resourcePoolType=common&locale=zh-cn&_=${Date.now()}`;
    
    try {
      const response = await fetch(url, {
        signal: abortController?.signal
      });
      
      if (!response.ok) {
        throw new Error(`获取自运维资源池失败: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error('API返回失败');
      }
      
      return data.result.resourcePools
        .filter((pool: any) => pool.phase === 'running') // 只返回running状态的资源池
        .map((pool: any) => ({
          resourcePoolId: pool.resourcePoolId,
          name: pool.name,
          type: 'common' as const,
          phase: pool.phase,
          region: pool.region,
          vpcId: pool.network?.master?.vpcId,
          pfsId: pool.bindingStorages?.[0]?.id,
          pfsMountTarget: pool.bindingStorages?.[0]?.id
        }));
    } catch (error) {
      // 检查是否为取消请求
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('获取自运维资源池请求被取消');
        throw new Error('REQUEST_CANCELLED');
      }
      console.error('获取自运维资源池失败:', error);
      throw error;
    }
  }

  // 获取全托管资源池列表
  async getFullyManagedResourcePools(abortController?: AbortController): Promise<ResourcePool[]> {
    const url = `${this.baseUrl}/aihc/aihc-service/v2/serverless/resourcePool?keywordType=resourcePoolName&keyword=&pageNo=1&pageSize=100&locale=zh-cn&_=${Date.now()}`;
    
    try {
      const response = await fetch(url, {
        signal: abortController?.signal
      });
      
      if (!response.ok) {
        throw new Error(`获取全托管资源池失败: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('全托管资源池列表API响应:', data);
      
      if (!data.success) {
        throw new Error('API返回失败');
      }
      
      const items = data.result.result.items;
      console.log('全托管资源池原始数据数量:', items.length);
      
      // 打印第一个项目的结构供调试
      if (items.length > 0) {
        console.log('第一个资源池项目结构:', {
          resourcePoolId: items[0].resourcePoolId,
          name: items[0].name,
          phase: items[0].phase,
          pfsId: items[0].pfsId,
          pfsMountTarget: items[0].pfsMountTarget,
          allKeys: Object.keys(items[0])
        });
      }
      
      const filteredPools = items
        .filter((pool: any) => {
          const isRunning = pool.phase === 'running';
          console.log(`资源池 ${pool.resourcePoolId} (${pool.name}) 状态: ${pool.phase}, 是否Running: ${isRunning}`);
          return isRunning;
        })
        .map((pool: any) => {
          const mappedPool = {
            resourcePoolId: pool.resourcePoolId,
            name: pool.name,
            type: 'serverless' as const,
            phase: pool.phase,
            region: pool.region || 'bj',
            vpcId: pool.vpcId,
            pfsId: pool.pfsId,
            pfsMountTarget: pool.pfsMountTarget
          };
          console.log(`映射后的资源池:`, mappedPool);
          return mappedPool;
        });
      
      console.log('过滤后的全托管资源池数量:', filteredPools.length);
      return filteredPools;
    } catch (error) {
      // 检查是否为取消请求
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('获取全托管资源池请求被取消');
        throw new Error('REQUEST_CANCELLED');
      }
      console.error('获取全托管资源池失败:', error);
      throw error;
    }
  }

  // 获取自运维资源池的队列列表
  async getSelfManagedQueues(resourcePoolId: string, abortController?: AbortController): Promise<Queue[]> {
    const url = `${this.baseUrl}/aihc/aihc-service/v3/queues?resourcePoolId=${resourcePoolId}&keyword=&keywordType=queueName&locale=zh-cn&_=${Date.now()}`;
    
    try {
      const response = await fetch(url, {
        signal: abortController?.signal
      });
      
      if (!response.ok) {
        throw new Error(`获取队列列表失败: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error('API返回失败');
      }
      
      return data.result.result.queueList
        .filter((queue: any) => queue.opened === true) // 只返回开启状态的队列
        .map((queue: any) => ({
          queueId: queue.queueId,
          queueName: queue.queueName,
          resourcePoolId: queue.resourcePoolId,
          phase: queue.opened ? 'ready' : 'disabled',
          opened: queue.opened,
          remaining: {
            cpuCores: queue.remaining?.cpuCores,
            memoryGi: queue.remaining?.memoryGi,
            milliCPUcores: queue.remaining?.milliCPUcores
          }
        }));
    } catch (error) {
      // 检查是否为取消请求
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('获取自运维队列请求被取消');
        throw new Error('REQUEST_CANCELLED');
      }
      console.error('获取队列列表失败:', error);
      throw error;
    }
  }

  // 获取全托管资源池的队列列表
  async getFullyManagedQueues(abortController?: AbortController): Promise<Queue[]> {
    const url = `${this.baseUrl}/aihc/aihc-service/v2/serverless/resourceQueue?pageNo=1&pageSize=100&keywordType=resourceQueueName&keyword=&locale=zh-cn&_=${Date.now()}`;
    
    try {
      const response = await fetch(url, {
        signal: abortController?.signal
      });
      
      if (!response.ok) {
        throw new Error(`获取全托管队列列表失败: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error('API返回失败');
      }
      
      const queues: Queue[] = [];
      data.result.result.items.forEach((queue: any) => {
        // 全托管资源池的队列结构：
        // items[].children[] 才是可选择的队列
        // items[] 本身是父队列，不能直接选择
        if (queue.children) {
          queue.children
            .filter((child: any) => child.opened === true) // 只返回开启状态的子队列
            .forEach((child: any) => {
              queues.push({
                queueId: child.id,
                queueName: child.name,
                resourcePoolId: child.resourcePoolIds?.[0] || '',
                phase: child.phase,
                opened: child.opened,
                remaining: {
                  cpuCores: child.remaining?.cpu,
                  memoryGi: child.remaining?.memory,
                }
              });
            });
        }
      });
      
      return queues;
    } catch (error) {
      // 检查是否为取消请求
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('获取全托管队列请求被取消');
        throw new Error('REQUEST_CANCELLED');
      }
      console.error('获取全托管队列列表失败:', error);
      throw error;
    }
  }

  // 获取数据集信息
  async getDatasetInfo(datasetId: string): Promise<DatasetInfo> {
    const url = `${this.baseUrl}/aihc/data/v1/dataset/${datasetId}?locale=zh-cn&_=${Date.now()}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`获取数据集信息失败: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error('API返回失败');
      }
      
      return {
        datasetId: data.result.datasetId,
        datasetName: data.result.datasetName,
        datasetCategory: data.result.datasetCategory,
        datasetStoragePath: data.result.datasetStoragePath,
        datasetSource: data.result.datasetSource,
        state: data.result.state
      };
    } catch (error) {
      console.error('获取数据集信息失败:', error);
      throw error;
    }
  }

  // 提交数据转储任务
  async submitDataDumpTask(
    resourcePoolId: string,
    queueId: string,
    taskTemplate: any
  ): Promise<TaskSubmissionResult> {
    // 开始提交数据转储任务
    // 开发环境下记录参数
    if (process.env.NODE_ENV === 'development') {
      console.log('[AIHCApiService] 接收参数:', {
        resourcePoolId,
        queueId,
        taskTemplateType: typeof taskTemplate,
        taskTemplateKeys: taskTemplate ? Object.keys(taskTemplate) : 'null'
      });
    }
    
    // 开发环境下在页面上显示API调用信息
    if (process.env.NODE_ENV === 'development' && typeof document !== 'undefined') {
      const apiDiv = document.createElement('div');
      apiDiv.style.cssText = 'position:fixed;top:450px;right:0;background:navy;color:white;padding:10px;z-index:99999;max-width:350px;word-wrap:break-word;font-size:12px;';
      apiDiv.innerHTML = `
        <div><strong>🚀 API调用开始 (开发模式)</strong></div>
        <div>资源池ID: ${resourcePoolId}</div>
        <div>队列ID: ${queueId}</div>
        <button onclick="this.parentElement.remove()" style="background:red;color:white;border:none;padding:2px 5px;border-radius:2px;cursor:pointer;margin-top:5px;">关闭</button>
      `;
      document.body.appendChild(apiDiv);
      setTimeout(() => {
        if (document.body.contains(apiDiv)) {
          document.body.removeChild(apiDiv);
        }
      }, 5000);
    }
    
    // 参数验证
    if (!resourcePoolId) {
      throw new Error('资源池ID不能为空');
    }
    if (!queueId) {
      throw new Error('队列ID不能为空');
    }
    if (!taskTemplate) {
      throw new Error('任务模板不能为空');
    }
    
    // 根据资源池类型选择不同的API端点
    const isServerless = taskTemplate.resourcePoolType === 'serverless';
    const clusterId = isServerless ? 'aihc-serverless' : resourcePoolId;
    
    const url = `${this.baseUrl}/cce/ai-service/v1/cluster/${clusterId}/aijobv3?queueID=${queueId}&locale=zh-cn&_=${Date.now()}`;
    
    console.log('[AIHCApiService] 计算出的请求参数:', {
      isServerless,
      clusterId,
      url,
      requestMethod: 'POST'
    });
    
    const requestBody = JSON.stringify(taskTemplate);
    
    // 记录API调用信息（仅开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log('[AIHCApiService] 提交数据转储任务:', { resourcePoolId, queueId });
    }
    
    // 格式化请求体（仅开发环境）
    if (process.env.NODE_ENV === 'development') {
      try {
        const formattedBody = JSON.stringify(JSON.parse(requestBody), null, 2);
        console.log('[AIHCApiService] 请求体内容:', formattedBody);
      } catch (e) {
        console.error('[AIHCApiService] 请求体JSON格式化失败:', e);
      }
    }
    
    // 开发环境下在页面上显示请求详情
    if (process.env.NODE_ENV === 'development' && typeof document !== 'undefined') {
      const requestDiv = document.createElement('div');
      requestDiv.style.cssText = 'position:fixed;top:550px;right:0;background:teal;color:white;padding:10px;z-index:99999;max-width:500px;word-wrap:break-word;font-size:11px;max-height:400px;overflow-y:auto;';
      requestDiv.innerHTML = `
        <div><strong>📤 HTTP请求详情 (开发模式)</strong></div>
        <div>URL: ${url}</div>
        <div>资源池类型: ${isServerless ? 'serverless' : 'normal'}</div>
        <div>任务名称: ${taskTemplate.name}</div>
        <button onclick="this.parentElement.remove()" style="background:red;color:white;border:none;padding:2px 5px;border-radius:2px;cursor:pointer;margin-top:5px;">关闭</button>
      `;
      document.body.appendChild(requestDiv);
      setTimeout(() => {
        if (document.body.contains(requestDiv)) {
          document.body.removeChild(requestDiv);
        }
      }, 10000);
    }
    
    try {
      // 发送HTTP请求
      
      // 获取百度云认证Token
      const baiduAuthToken = this.getBaiduAuthToken();
      
      // 开发环境下显示认证Token信息
      if (process.env.NODE_ENV === 'development' && typeof document !== 'undefined') {
        const authDiv = document.createElement('div');
        authDiv.style.cssText = 'position:fixed;top:750px;right:0;background:darkblue;color:white;padding:10px;z-index:99999;max-width:350px;word-wrap:break-word;font-size:11px;';
        authDiv.innerHTML = `
          <div><strong>🔐 百度云认证Token (开发模式)</strong></div>
          <div>Token: ${baiduAuthToken ? baiduAuthToken.substring(0, 20) + '...' : '未获取'}</div>
          <button onclick="this.parentElement.remove()" style="background:red;color:white;border:none;padding:2px 5px;border-radius:2px;cursor:pointer;margin-top:5px;">关闭</button>
        `;
        document.body.appendChild(authDiv);
        setTimeout(() => {
          if (document.body.contains(authDiv)) {
            document.body.removeChild(authDiv);
          }
        }, 5000);
      }
      
      // 构建请求头，模拟百度云控制台的请求
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': window.location.href,
        'Origin': window.location.origin,
        'User-Agent': navigator.userAgent,
        'Accept-Language': navigator.language || 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'X-Requested-With': 'XMLHttpRequest'
      };

      // 添加百度云认证token
      if (baiduAuthToken) {
        headers['x-bce-jt'] = baiduAuthToken;
        headers['version'] = 'v2';
        
        // 尝试多种CSRF头格式
        headers['X-CSRF-Token'] = baiduAuthToken;
        headers['X-CSRFToken'] = baiduAuthToken;
        headers['X-CSRF-TOKEN'] = baiduAuthToken;
        headers['X-CSRF'] = baiduAuthToken;
        
        // 尝试其他认证头格式
        headers['X-Auth-Token'] = baiduAuthToken;
        headers['X-Authorization'] = baiduAuthToken;
        headers['Authorization'] = `Bearer ${baiduAuthToken}`;
      }

      // 添加百度云特有的头信息
      headers['x-bce-request-id'] = `aihc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      headers['x-bce-date'] = new Date().toISOString();
      headers['x-bce-region'] = 'bj'; // 默认北京区域
      
      // 添加一些可能需要的百度云控制台头信息
      if (typeof document !== 'undefined') {
        const cookies = document.cookie;
        if (cookies) {
          headers['Cookie'] = cookies;
        }
        
        // 尝试从localStorage获取百度云特有的认证信息
        try {
          const localStorageKeys = Object.keys(localStorage);
          for (const key of localStorageKeys) {
            if (key.includes('BCE_CONSOLE_CSI') || key.includes('BCE_MONITOR')) {
              const value = localStorage.getItem(key);
              if (value && value.length > 10) {
                // 提取可能的认证信息
                try {
                  const parsed = JSON.parse(value);
                  if (parsed && typeof parsed === 'object') {
                    // 查找可能的认证字段
                    const findAuthFields = (obj: any, path = ''): string[] => {
                      const authFields: string[] = [];
                      for (const [k, v] of Object.entries(obj)) {
                        const currentPath = path ? `${path}.${k}` : k;
                        if (typeof v === 'string' && (k.toLowerCase().includes('token') || k.toLowerCase().includes('auth') || k.toLowerCase().includes('session'))) {
                          authFields.push(`${currentPath}: ${v.substring(0, 50)}...`);
                        } else if (typeof v === 'object' && v !== null) {
                          authFields.push(...findAuthFields(v, currentPath));
                        }
                      }
                      return authFields;
                    };
                    
                    const authFields = findAuthFields(parsed);
                    if (authFields.length > 0) {
                      console.log(`[AIHCApiService] 从${key}中找到认证字段:`, authFields);
                    }
                  }
                } catch (e) {
                  // 忽略JSON解析错误
                }
              }
            }
          }
        } catch (e) {
          console.warn('[AIHCApiService] 访问localStorage失败:', e);
        }
      }

      console.log('[AIHCApiService] 发送请求头信息:', Object.keys(headers).map(key => `${key}: ${headers[key].substring(0, 50)}${headers[key].length > 50 ? '...' : ''}`).join('\n'));

      const response = await fetch(url, {
        method: 'POST',
        headers,
        credentials: 'include', // 包含cookies
        body: requestBody
      });
      
      console.log('[AIHCApiService] HTTP响应接收完成:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(Array.from(response.headers.entries()))
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AIHCApiService] HTTP错误响应内容:', errorText);
        
        // 在页面上显示HTTP错误
        if (typeof document !== 'undefined') {
          const errorDiv = document.createElement('div');
          errorDiv.style.cssText = 'position:fixed;top:650px;right:0;background:darkred;color:white;padding:10px;z-index:99999;max-width:400px;word-wrap:break-word;font-size:11px;';
          
          // 安全地转换错误文本
          const safeErrorText = typeof errorText === 'string' ? errorText : JSON.stringify(errorText);
          const truncatedErrorText = safeErrorText.length > 200 ? safeErrorText.substring(0, 200) + '...' : safeErrorText;
          
          errorDiv.innerHTML = `
            <div><strong>❌ HTTP错误响应</strong></div>
            <div>状态码: ${response.status}</div>
            <div>状态文本: ${response.statusText}</div>
            <div>错误内容: ${truncatedErrorText}</div>
            <div>时间: ${new Date().toLocaleTimeString()}</div>
          `;
          document.body.appendChild(errorDiv);
          setTimeout(() => {
            if (document.body.contains(errorDiv)) {
              document.body.removeChild(errorDiv);
            }
          }, 15000);
        }
        
        throw new Error(`API请求失败，状态码: ${response.status}, 错误信息: ${errorText}`);
      }
      
      // 解析JSON响应
      const result = await response.json();
      // 开发环境下记录响应数据
      if (process.env.NODE_ENV === 'development') {
        console.log('[AIHCApiService] 响应数据:', result);
      }
      
      if (!result.success) {
        const apiError = result.message || '任务提交失败';
        console.error('[AIHCApiService] API返回失败:', apiError);
        console.error('[AIHCApiService] API错误详情:', {
          success: result.success,
          code: result.code,
          message: result.message,
          fullResult: result
        });
        
        // 在页面上显示API错误
        if (typeof document !== 'undefined') {
          const apiErrorDiv = document.createElement('div');
          apiErrorDiv.style.cssText = 'position:fixed;top:650px;right:0;background:darkorange;color:white;padding:10px;z-index:99999;max-width:400px;word-wrap:break-word;font-size:11px;';
          
          // 安全地转换错误信息为字符串
          const safeApiError = typeof apiError === 'object' ? JSON.stringify(apiError, null, 2) : String(apiError);
          const safeCode = result.code !== undefined ? String(result.code) : 'undefined';
          
          apiErrorDiv.innerHTML = `
            <div><strong>❌ API返回失败</strong></div>
            <div>错误信息: ${safeApiError}</div>
            <div>代码: ${safeCode}</div>
            <div>时间: ${new Date().toLocaleTimeString()}</div>
          `;
          document.body.appendChild(apiErrorDiv);
          setTimeout(() => {
            if (document.body.contains(apiErrorDiv)) {
              document.body.removeChild(apiErrorDiv);
            }
          }, 15000);
        }
        
        throw new Error(apiError);
      }
      
      if (!result.result) {
        console.error('[AIHCApiService] API返回成功但缺少result字段');
        throw new Error('API返回数据格式错误');
      }

      console.log('[AIHCApiService] ✅ 任务提交成功，返回结果:', result.result);
      
      // 在页面上显示成功响应
      if (typeof document !== 'undefined') {
        const successDiv = document.createElement('div');
        successDiv.style.cssText = 'position:fixed;top:650px;right:0;background:darkgreen;color:white;padding:10px;z-index:99999;max-width:400px;word-wrap:break-word;font-size:11px;';
        successDiv.innerHTML = `
          <div><strong>✅ API调用成功</strong></div>
          <div>任务ID: ${result.result.jobId}</div>
          <div>任务名称: ${result.result.jobName}</div>
          <div>K8S名称: ${result.result.k8sName}</div>
          <div>时间: ${new Date().toLocaleTimeString()}</div>
        `;
        document.body.appendChild(successDiv);
        setTimeout(() => {
          if (document.body.contains(successDiv)) {
            document.body.removeChild(successDiv);
          }
        }, 15000);
      }
      
      return result.result;
      
    } catch (error) {
      console.error('[AIHCApiService] ❌ submitDataDumpTask 发生异常:', error);
      
      // 记录错误信息（仅开发环境）
      if (process.env.NODE_ENV === 'development') {
        console.error('[AIHCApiService] 数据转储任务提交失败:', error);
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('[AIHCApiService] 网络连接错误');
        throw new Error('网络连接失败，请检查网络连接');
      }
      
      console.error('[AIHCApiService] 重新抛出错误');
      throw error;
    }
  }

  // 获取自运维资源池详情
  async getSelfManagedResourcePoolDetail(resourcePoolId: string): Promise<any> {
    const url = `${this.baseUrl}/aihc/aihc-service/v3/resourcepools/${resourcePoolId}?locale=zh-cn&_=${Date.now()}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`获取自运维资源池详情失败: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error('API返回失败');
      }
      
      return data.result;
    } catch (error) {
      console.error('获取自运维资源池详情失败:', error);
      throw error;
    }
  }

  // 获取全托管资源池详情
  async getFullyManagedResourcePoolDetail(resourcePoolId: string): Promise<any> {
    const url = `${this.baseUrl}/aihc/aihc-service/v2/serverless/resourcePool/${resourcePoolId}?locale=zh-cn&_=${Date.now()}`;
    
    console.log('调用全托管资源池详情API:', url);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`获取全托管资源池详情失败: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('全托管资源池详情API响应:', data);
      
      if (!data.success) {
        throw new Error('API返回失败');
      }
      
      const resourcePool = data.result.resourcePool;
      console.log('详情中的资源池结构:', {
        resourcePoolId: resourcePool.resourcePoolId,
        name: resourcePool.name,
        phase: resourcePool.phase,
        pfsId: resourcePool.pfsId,
        pfsMountTarget: resourcePool.pfsMountTarget,
        allKeys: Object.keys(resourcePool)
      });
      
      return resourcePool;
    } catch (error) {
      console.error('获取全托管资源池详情失败:', error);
      throw error;
    }
  }

  // 获取托管资源池存储实例
  async getManagedResourcePoolStorageInfo(resourcePoolId: string, mountTargetId: string): Promise<any> {
    const url = `${this.baseUrl}/aihc/aihc-service/v2/resourcePools/${resourcePoolId}/storage/info?mountTargetId=${mountTargetId}&locale=zh-cn&_=${Date.now()}`;
    
    console.log('调用存储信息API:', url);
    console.log('请求参数 - resourcePoolId:', resourcePoolId, 'mountTargetId:', mountTargetId);
    
    try {
      const response = await fetch(url);
      console.log('存储信息API响应状态:', response.status);
      console.log('响应头:', Object.fromEntries(Array.from(response.headers.entries())));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('存储信息API错误响应:', errorText);
        throw new Error(`获取托管资源池存储信息失败: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('存储信息API响应数据结构:', {
        code: data.code,
        message: data.message,
        requestId: data.requestId,
        resultKeys: data.result ? Object.keys(data.result) : 'null',
        pfsInstancesCount: data.result?.pfsInstances?.length || 0
      });
      
      if (data.code !== 200) {
        console.error('API返回错误代码:', data.code, '错误信息:', data.message);
        throw new Error(`API返回失败: ${data.message || '未知错误'}`);
      }
      
      return data.result;
    } catch (error) {
      console.error('获取托管资源池存储信息失败:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查网络连接');
      }
      throw error;
    }
  }

  // 获取PFS实例列表（通过专门的存储信息接口获取）
  async getPFSInstances(resourcePoolId: string, resourcePoolType: 'common' | 'serverless', abortController?: AbortController): Promise<PFSInstance[]> {
    // 获取PFS实例
    
    try {
      if (resourcePoolType === 'common') {
        console.log('获取自运维资源池PFS实例');
        
        // 自运维资源池：从详情API获取PFS实例信息
        const resourcePoolDetail = await this.getSelfManagedResourcePoolDetail(resourcePoolId);
        console.log('自运维资源池详情:', resourcePoolDetail);
        
        if (!resourcePoolDetail || resourcePoolDetail.phase !== 'running') {
          console.log('自运维资源池详情获取失败或状态不正确:', resourcePoolDetail);
          return [];
        }
        
        // 从bindingStorages中获取PFS实例信息
        const bindingStorages = resourcePoolDetail.bindingStorages || [];
        console.log('绑定存储列表:', bindingStorages);
        
        const pfsStorages = bindingStorages.filter((storage: any) => storage.provider === 'pfs');
        console.log('PFS存储列表:', pfsStorages);
        
        if (pfsStorages.length === 0) {
          console.log('自运维资源池没有绑定PFS存储');
          return [];
        }
        
        // 检查是否需要通过存储信息接口获取PFS实例ID
        const pfsInstances = [];
        
        for (const storage of pfsStorages) {
          console.log(`处理PFS存储:`, storage);
          
          if (storage.id.startsWith('mt-')) {
            // 如果是挂载点ID，需要通过存储信息接口获取PFS实例ID
            console.log(`检测到挂载点ID: ${storage.id}，需要通过存储信息接口获取PFS实例ID`);
            
            try {
              const storageInfo = await this.getManagedResourcePoolStorageInfo(resourcePoolId, storage.id);
              console.log('存储信息API返回:', storageInfo);
              
              // 从存储信息中提取PFS实例列表
              const instances = storageInfo.pfsInstances || [];
              console.log('从存储信息获取的PFS实例数量:', instances.length);
              
              // 过滤并映射PFS实例
              const filteredInstances = instances
                .filter((instance: any) => instance.instanceStatus === 'RUNNING')
                .map((instance: any) => ({
                  id: instance.instanceId, // PFS实例ID (如: pfs-qnL8Jh)
                  name: instance.name || `PFS-${instance.instanceId}`,
                  resourcePoolId: resourcePoolId,
                  status: 'ready',
                  capacity: instance.capacity,
                  usage: instance.usage,
                  instanceType: instance.instanceType,
                  mountPath: instance.mountTargets?.[0]?.mountPath
                }));
              
              console.log('从存储信息映射的PFS实例:', filteredInstances);
              pfsInstances.push(...filteredInstances);
              
            } catch (error) {
              console.error(`获取存储信息失败 (挂载点ID: ${storage.id}):`, error);
              // 如果获取失败，仍然使用原始ID作为备选
              pfsInstances.push({
                id: storage.id,
                name: `PFS-${storage.id}`,
                resourcePoolId: resourcePoolId,
                status: 'ready',
                instanceType: storage.type
              });
            }
          } else {
            // 如果已经是PFS实例ID，直接使用
            console.log(`检测到PFS实例ID: ${storage.id}，直接使用`);
            pfsInstances.push({
              id: storage.id, // PFS实例ID (如: pfs-7xWeAt)
              name: `PFS-${storage.id}`,
              resourcePoolId: resourcePoolId,
              status: 'ready',
              instanceType: storage.type // 如: pfsL1
            });
          }
        }
        
        console.log('返回自运维PFS实例:', pfsInstances);
        return pfsInstances;
        
      } else {
        console.log('获取全托管资源池PFS实例');
        
        // 全托管资源池：先从列表API获取pfsMountTarget信息（更可靠）
        console.log('首先从列表API获取pfsMountTarget信息');
        const resourcePools = await this.getFullyManagedResourcePools(abortController);
        const targetPool = resourcePools.find(pool => pool.resourcePoolId === resourcePoolId);
        
        if (!targetPool) {
          console.log('在列表API中找不到目标资源池:', resourcePoolId);
          return [];
        }
        
        if (targetPool.phase !== 'running') {
          console.log('资源池状态不是running:', targetPool.phase);
          return [];
        }
        
        let pfsMountTarget = targetPool.pfsMountTarget;
        console.log('从列表API获取到的pfsMountTarget:', pfsMountTarget);
        
        // 如果列表API中没有pfsMountTarget，尝试从详情API获取
        if (!pfsMountTarget) {
          console.log('列表API中没有pfsMountTarget，尝试从详情API获取');
          const resourcePoolDetail = await this.getFullyManagedResourcePoolDetail(resourcePoolId);
          console.log('全托管资源池详情:', resourcePoolDetail);
          
          pfsMountTarget = resourcePoolDetail.pfsMountTarget;
          console.log('从详情API获取到的pfsMountTarget:', pfsMountTarget);
        }
        
        if (!pfsMountTarget) {
          console.log('无法获取pfsMountTarget，该资源池可能没有配置PFS存储');
          return [];
        }
        
        console.log(`使用Mount Target ID获取存储信息: ${pfsMountTarget}`);
        
        // 使用专门的存储信息接口获取PFS实例列表
        const storageInfo = await this.getManagedResourcePoolStorageInfo(resourcePoolId, pfsMountTarget);
        console.log('存储信息API返回:', storageInfo);
        
        // 从存储信息中提取PFS实例列表
        const pfsInstances = storageInfo.pfsInstances || [];
        console.log('原始PFS实例列表数量:', pfsInstances.length);
        console.log('原始PFS实例列表详情:', pfsInstances);
        
        if (pfsInstances.length === 0) {
          console.log('存储信息API返回的PFS实例列表为空');
          return [];
        }
        
        const filteredInstances = pfsInstances
          .filter((instance: any) => {
            const isRunning = instance.instanceStatus === 'RUNNING';
            console.log(`PFS实例 ${instance.instanceId} 状态: ${instance.instanceStatus}, 是否Running: ${isRunning}`);
            return isRunning;
          })
          .map((instance: any) => {
            const pfsInstance = {
              id: instance.instanceId, // PFS实例ID (如: pfs-qnL8Jh)
              name: instance.name || `PFS-${instance.instanceId}`,
              resourcePoolId: resourcePoolId,
              status: 'ready',
              capacity: instance.capacity,
              usage: instance.usage,
              instanceType: instance.instanceType,
              mountPath: instance.mountTargets?.[0]?.mountPath // 添加挂载路径信息
            };
            console.log(`映射PFS实例:`, pfsInstance);
            return pfsInstance;
          });
        
        console.log('过滤后的PFS实例列表数量:', filteredInstances.length);
        console.log('过滤后的PFS实例列表详情:', filteredInstances);
        return filteredInstances;
      }
    } catch (error) {
      // 检查是否为取消请求
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('获取PFS实例请求被取消');
        throw new Error('REQUEST_CANCELLED');
      }
      console.error('获取PFS实例失败:', error);
      throw error;
    }
  }

  // 通过页面注入脚本提交任务 - 绕过CSRF限制
  async submitDataDumpTaskViaPageScript(taskTemplate: DataDumpTaskTemplate, resourcePoolId: string): Promise<any> {
    // 页面注入脚本提交任务
    
    try {
      // 使用页面注入脚本提交任务
      const result = await this.submitTaskViaPageScript(taskTemplate, resourcePoolId);
      console.log('[AIHCApiService] 任务提交成功:', result);
      return result;
      
    } catch (error) {
      console.error('[AIHCApiService] 页面注入脚本提交失败:', error);
      throw error;
    }
  }

  // 获取数据集版本列表
  async getDatasetVersions(datasetId: string, abortController?: AbortController): Promise<any[]> {
    const url = `${this.baseUrl}/aihc/asset/v1/datasets/${datasetId}/versions?tab=versions&pageNo=1&pageSize=100&locale=zh-cn&_=${Date.now()}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-bce-jt': this.getBaiduAuthToken()
        },
        signal: abortController?.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.result && data.result.versions) {
        // 转换API返回的版本数据格式
        return data.result.versions.map((version: any) => ({
          versionId: version.id,
          versionName: version.version,
          description: `版本 ${version.version}`,
          createTime: version.createTime,
          createUser: version.createUserName,
          mountPath: version.mountPath,
          storagePath: version.storagePath,
          updateTime: version.updateTime
        }));
      } else {
        throw new Error(data.message || '获取数据集版本失败');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw error;
      }
      console.error('获取数据集版本失败:', error);
      throw new Error(`获取数据集版本失败: ${error.message}`);
    }
  }

  // 获取模型版本列表
  async getModelVersions(modelId: string, abortController?: AbortController): Promise<any[]> {
    const url = `${this.baseUrl}/aihc/asset/v1/models/${modelId}/versions?tab=versions&pageNo=1&pageSize=100&locale=zh-cn&_=${Date.now()}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-bce-jt': this.getBaiduAuthToken()
        },
        signal: abortController?.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.result && data.result.versions) {
        // 转换API返回的版本数据格式
        return data.result.versions.map((version: any) => ({
          versionId: version.id,
          versionName: version.version,
          description: `版本 ${version.version}`,
          createTime: version.createTime,
          createUser: version.createUserName,
          storageBucket: version.storageBucket,
          storagePath: version.storagePath
        }));
      } else {
        throw new Error(data.message || '获取模型版本失败');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw error;
      }
      console.error('获取模型版本失败:', error);
      throw new Error(`获取模型版本失败: ${error.message}`);
    }
  }

  // 通过页面注入脚本提交任务
  private async submitTaskViaPageScript(taskTemplate: DataDumpTaskTemplate, resourcePoolId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // 生成唯一ID
      const taskId = 'aihc_task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // 创建一个script元素，在页面上下文中执行
      const script = document.createElement('script');
      script.textContent = `
        (function() {
          try {
            const clusterId = '${taskTemplate.resourcePoolType}' === 'serverless' ? 'aihc-serverless' : '${resourcePoolId}';
            const queueId = '${taskTemplate.queue}' || 'default';
            const timestamp = Date.now();
            const apiEndpoint = \`https://console.bce.baidu.com/api/cce/ai-service/v1/cluster/\${clusterId}/aijobv3?queueID=\${queueId}&locale=zh-cn&_=\${timestamp}\`;
            
            fetch(apiEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Cache-Control': 'no-cache',
                'Referer': window.location.href,
                'Origin': window.location.origin,
                'X-Requested-With': 'XMLHttpRequest'
              },
              credentials: 'include',
              body: JSON.stringify(${JSON.stringify(taskTemplate)})
            })
            .then(response => response.json())
            .then(result => {
              window['${taskId}'] = { success: true, result: result };
            })
            .catch(error => {
              window['${taskId}'] = { success: false, error: error.message || error.toString() };
            });
            
          } catch (error) {
            window['${taskId}'] = { success: false, error: error.message || error.toString() };
          }
        })();
      `;
      
      // 添加script到页面
      document.body.appendChild(script);
      
      // 轮询检查结果
      const checkResult = () => {
        const result = (window as any)[taskId];
        if (result) {
          // 清理
          delete (window as any)[taskId];
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
          
          if (result.success) {
            resolve(result.result);
          } else {
            reject(new Error(result.error));
          }
        } else {
          setTimeout(checkResult, 50); // 更频繁的检查
        }
      };
      
      // 开始轮询
      setTimeout(checkResult, 50);
      
      // 10秒超时
      setTimeout(() => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
        delete (window as any)[taskId];
        reject(new Error('页面注入脚本提交超时'));
      }, 10000);
    });
  }

  // 获取数据集列表
  async getDatasets(): Promise<any[]> {
    try {
      const response = await fetch(
        `https://console.bce.baidu.com/api/aihc/asset/v1/datasets?keywordType=name&keyword=&pageNo=1&pageSize=100&locale=zh-cn&_=${Date.now()}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.result && data.result.datasets) {
        return data.result.datasets;
      } else {
        throw new Error('获取数据集列表失败');
      }
    } catch (error) {
      console.error('获取数据集列表失败:', error);
      throw error;
    }
  }
}

export const aihcApiService = new AIHCApiService();
