import { callBecOpenApiWithConfig } from '../utils/aihcOpenApi';

// 数据转储任务配置接口
export interface DataDumpTaskConfig {
  datasetId: string;
  datasetName: string;
  sourcePath: string;
  targetPath: string;
  originalStoragePath: string;
  resourcePoolId: string;
  queueId: string;
  pfsInstanceId: string;
}

// 任务创建响应接口
export interface TaskCreateResponse {
  success: boolean;
  result?: {
    jobId: string;
    jobName: string;
    k8sName: string;
  };
  error?: string;
}

// 任务状态接口
export interface TaskStatus {
  jobId: string;
  status: 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown';
  message?: string;
  startTime?: string;
  endTime?: string;
}

/**
 * 创建数据转储任务
 */
export const createDataDumpTask = async (config: DataDumpTaskConfig): Promise<TaskCreateResponse> => {
  try {
    console.log('创建数据转储任务:', config);

    // 构建OpenAPI任务配置
    const taskConfig = {
      name: `data-dump-${config.datasetId}-${Date.now()}`,
      jobType: 'PyTorchJob',
      command: 'echo "🚀 开始数据转储操作..." \
        && START_TIME=$(date +%s) \
        && cp -vr /mnt/bos/* /mnt/pfs/ \
        && END_TIME=$(date +%s) \
        && DIFF=$((END_TIME - START_TIME)) \
        && echo "✅ 数据转储完成！耗时: ${DIFF}秒"',
      jobSpec: {
        replicas: 1,
        image: 'registry.baidubce.com/aihc-aiak/aiak-megatron:ubuntu20.04-cu11.8-torch1.14.0-py38_v1.2.7.12_release',
        resources: [],
        envs: [
          {
            name: 'NCCL_DEBUG',
            value: 'DEBUG'
          },
          {
            name: 'NCCL_IB_DISABLE',
            value: '0'
          },
          {
            name: 'AIHC_JOB_NAME',
            value: `data-dump-${config.datasetId}`
          }
        ],
        enableRDMA: false
      },
      labels: [],
      datasources: [
        {
          type: 'pfs',
          name: config.pfsInstanceId,
          sourcePath: config.sourcePath, // 去掉开头的/
          mountPath: '/mnt/pfs'
        },
        {
          type: 'bos',
          name: '',
          sourcePath: config.originalStoragePath.replace(/^\//, ''), // 去掉开头的/
          mountPath: '/mnt/bos'
        }
      ]
    };

    // 打印详细的请求参数
    console.log('🔍 详细请求参数:');
    console.log('📋 URL参数:', {
      action: 'CreateJob',
      resourcePoolId: config.resourcePoolId
    });
    console.log('📦 请求Body:', JSON.stringify(taskConfig, null, 2));
    console.log('📋 请求Headers:', {
      'Content-Type': 'application/json',
      'X-API-Version': 'v2'
    });
    console.log('🔍 PFS实例ID调试:', {
      pfsInstanceId: config.pfsInstanceId,
      type: typeof config.pfsInstanceId,
      length: config.pfsInstanceId?.length
    });

    // 显示API请求参数用于调试
    const apiRequestInfo = {
      url: `https://aihc.bj.baidubce.com/`,
      method: 'POST',
      queryParams: {
        action: 'CreateJob',
        resourcePoolId: config.resourcePoolId
      },
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': 'v2'
      },
      body: taskConfig
    };
    
    // 使用window.postMessage发送调试信息到组件
    window.postMessage({
      type: 'API_DEBUG_INFO',
      data: apiRequestInfo
    }, '*');

    // 调用OpenAPI创建任务
    const response = await callBecOpenApiWithConfig(
      '/',
      'POST',
      {
        action: 'CreateJob',
        resourcePoolId: config.resourcePoolId
      },
      taskConfig,
      {
        'Content-Type': 'application/json',
        'X-API-Version': 'v2'
      }
    );

    console.log('任务创建响应:', response);

    if (response.error) {
      return {
        success: false,
        error: response.message || '任务创建失败'
      };
    }

    // OpenAPI返回格式
    return {
      success: true,
      result: {
        jobId: response.jobId,
        jobName: response.jobName,
        k8sName: response.jobId // OpenAPI没有k8sName字段，使用jobId
      }
    };

  } catch (error: any) {
    console.error('创建数据转储任务失败:', error);
    return {
      success: false,
      error: error.message || '网络请求失败'
    };
  }
};

/**
 * 查询任务状态
 */
export const getTaskStatus = async (jobId: string): Promise<TaskStatus> => {
  try {
    const response = await callBecOpenApiWithConfig(
      '/',
      'GET',
      {
        action: 'DescribeJob',
        jobId: jobId
      },
      {},
      {
        'X-API-Version': 'v2'
      }
    );

    if (response.error) {
      return {
        jobId,
        status: 'Unknown',
        message: response.message || '查询任务状态失败'
      };
    }

    // 解析任务状态
    const status = response.status || 'Unknown';
    return {
      jobId,
      status: status as TaskStatus['status'],
      message: response.message,
      startTime: response.startTime,
      endTime: response.endTime
    };

  } catch (error: any) {
    console.error('查询任务状态失败:', error);
    return {
      jobId,
      status: 'Unknown',
      message: error.message || '网络请求失败'
    };
  }
};

/**
 * 获取资源池列表
 */
export const getResourcePools = async () => {
  try {
    const response = await callBecOpenApiWithConfig(
      '/',
      'GET',
      {
        action: 'DescribeResourcePools'
      },
      {},
      {
        'X-API-Version': 'v2'
      }
    );

    if (response.error) {
      throw new Error(response.message || '获取资源池列表失败');
    }

    return response;

  } catch (error: any) {
    console.error('获取资源池列表失败:', error);
    throw error;
  }
};

/**
 * 获取队列列表
 */
export const getQueues = async (resourcePoolId: string) => {
  try {
    const response = await callBecOpenApiWithConfig(
      '/',
      'GET',
      {
        action: 'DescribeQueues',
        resourcePoolId: resourcePoolId
      },
      {},
      {
        'X-API-Version': 'v2'
      }
    );

    if (response.error) {
      throw new Error(response.message || '获取队列列表失败');
    }

    return response;

  } catch (error: any) {
    console.error('获取队列列表失败:', error);
    throw error;
  }
};

/**
 * 获取PFS实例列表
 */
export const getPfsInstances = async (resourcePoolId: string) => {
  try {
    const response = await callBecOpenApiWithConfig(
      '/',
      'GET',
      {
        action: 'DescribePfsInstances',
        resourcePoolId: resourcePoolId
      },
      {},
      {
        'X-API-Version': 'v2'
      }
    );

    if (response.error) {
      throw new Error(response.message || '获取PFS实例列表失败');
    }

    return response;

  } catch (error: any) {
    console.error('获取PFS实例列表失败:', error);
    throw error;
  }
};
