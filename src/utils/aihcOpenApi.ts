import { Auth } from "@baiducloud/sdk";
import { getPluginConfig } from './config';

const getSignature = (ak: string, sk: string, method: string, path: string, query: Record<string, any>, headers: Record<string, any>) => {
  const auth = new Auth(ak, sk);
  // 设置有效时间
  let timestamp = Math.floor(new Date().getTime() / 1000);
  let expirationPeriondInSeconds = 1800;
  let signature = auth.generateAuthorization(
    method,
    path,
    query,
    headers,
    timestamp,
    expirationPeriondInSeconds
  );
  return signature;
};

const callBecOpenApi = async (ak: string, sk: string, host: string, path: string, method: string, query: any = {}, body: any = {}, headers: Record<string, any> = {}) => {
  // 构建URL
  const url = new URL(`https://${host}${path}`);
  
  // 添加查询参数
  Object.keys(query).forEach(key => {
    if (query[key] !== undefined && query[key] !== null) {
      url.searchParams.append(key, query[key]);
    }
  });

  // 设置请求头
  const requestHeaders: Record<string, string> = {
    'Host': host,
    'Content-Type': 'application/json',
    ...headers
  };

  // 生成签名
  const signature = getSignature(ak, sk, method, path, query, requestHeaders);
  requestHeaders.Authorization = signature;

  // 准备请求体
  let requestBody: string | undefined;
  if (body && Object.keys(body).length > 0) {
    requestBody = JSON.stringify(body);
  }

  try {
    console.debug("请求参数：", {
      method,
      url: url.toString(),
      headers: requestHeaders,
      body: requestBody
    });

    const response = await fetch(url.toString(), {
      method,
      headers: requestHeaders,
      body: requestBody
    });

    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      const error = {
        statusCode: response.status,
        message: `${response.status} - ${errorData.message || response.statusText}`,
        error: errorData,
        response: {
          statusCode: response.status,
          body: errorData,
          headers: Object.fromEntries(response.headers.entries())
        }
      };
      
      console.error("API请求失败：", error);
      return error;
    }

    const result = await response.json();
    console.debug("返回的结果：", result);
    return result;
  } catch (err: any) {
    console.error("请求异常：", err);
    return {
      error: true,
      message: err.message || '网络请求失败',
      originalError: err
    };
  }
};

/**
 * 使用全局配置调用BCE OpenAPI
 */
const callBecOpenApiWithConfig = async (path: string, method: string, query: any = {}, body: any = {}, headers: Record<string, any> = {}) => {
  try {
    const config = await getPluginConfig();
    
    if (!config.ak || !config.sk || !config.host) {
      throw new Error('请先在插件设置中配置AK、SK和Host');
    }
    
    return await callBecOpenApi(config.ak, config.sk, config.host, path, method, query, body, headers);
  } catch (error) {
    console.error('使用全局配置调用API失败:', error);
    throw error;
  }
};

export { callBecOpenApi, callBecOpenApiWithConfig };
