/**
 * 数据转储任务提交测试脚本
 * 
 * 使用方法：
 * 1. 打开AIHC控制台页面
 * 2. 按F12打开开发者工具
 * 3. 切换到Console标签
 * 4. 将此脚本内容复制粘贴到控制台中执行
 */

// 生成数据转储任务模板
function generateDataDumpTaskTemplate(config) {
  const timestamp = Date.now();
  const jobName = `data-dump-${config.resourcePoolId.substring(0, 8)}-${timestamp}`;
  
  console.log('[测试脚本] 生成任务模板参数:', {
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
    bosSourcePath = config.originalStoragePath.startsWith('bos:') 
      ? config.originalStoragePath.substring(4) 
      : config.originalStoragePath;
  }
  
  const bosDataSource = {
    type: "bos",
    sourcePath: bosSourcePath, // 原始存储路径去除bos:前缀
    mountPath: "/bos/data",
    options: {}
  };
  
  console.log('[测试脚本] 数据源配置详情:', {
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
}

// 提交数据转储任务
async function submitDataDumpTask(resourcePoolId, queueId, taskTemplate) {
  console.log('[测试脚本] ==> submitDataDumpTask 开始');
  console.log('[测试脚本] 接收参数:', {
    resourcePoolId,
    queueId,
    taskTemplateType: typeof taskTemplate,
    taskTemplateKeys: taskTemplate ? Object.keys(taskTemplate) : 'null'
  });
  
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
  
  const baseUrl = 'https://console.bce.baidu.com/api';
  const url = `${baseUrl}/cce/ai-service/v1/cluster/${clusterId}/aijobv3?queueID=${queueId}&locale=zh-cn&_=${Date.now()}`;
  
  console.log('[测试脚本] 计算出的请求参数:', {
    isServerless,
    clusterId,
    url,
    requestMethod: 'POST'
  });
  
  const requestBody = JSON.stringify(taskTemplate);
  console.log('[测试脚本] 请求体大小:', requestBody.length, '字节');
  
  try {
    console.log('[测试脚本] 开始发送HTTP请求...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody
    });
    
    console.log('[测试脚本] HTTP响应接收完成:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[测试脚本] HTTP错误响应内容:', errorText);
      throw new Error(`API请求失败，状态码: ${response.status}, 错误信息: ${errorText}`);
    }
    
    console.log('[测试脚本] 开始解析JSON响应...');
    const result = await response.json();
    console.log('[测试脚本] JSON解析完成，响应数据:', result);
    console.log('[测试脚本] 响应数据结构:', {
      success: result.success,
      resultKeys: result.result ? Object.keys(result.result) : 'null',
      code: result.code,
      message: result.message
    });
    
    if (!result.success) {
      const apiError = result.message || '任务提交失败';
      console.error('[测试脚本] API返回失败:', apiError);
      throw new Error(apiError);
    }
    
    if (!result.result) {
      console.error('[测试脚本] API返回成功但缺少result字段');
      throw new Error('API返回数据格式错误');
    }

    console.log('[测试脚本] ✅ 任务提交成功，返回结果:', result.result);
    return result.result;
    
  } catch (error) {
    console.error('[测试脚本] ❌ submitDataDumpTask 发生异常:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('[测试脚本] 网络连接错误');
      throw new Error('网络连接失败，请检查网络连接');
    }
    
    console.error('[测试脚本] 重新抛出错误');
    throw error;
  }
}

// 测试函数 - 请根据实际情况修改参数
async function testSubmitDataDumpTask() {
  try {
    console.log('开始测试数据转储任务提交...');
    
    // 示例配置 - 请根据实际情况修改这些参数
    const config = {
      resourcePoolType: '自运维', // 或 '全托管'
      resourcePoolId: 'your-resource-pool-id', // 替换为实际的资源池ID
      queueId: 'your-queue-id', // 替换为实际的队列ID
      pfsId: 'your-pfs-id', // 替换为实际的PFS实例ID
      storagePath: '/aihc-datasets/your-dataset-path', // 替换为实际的存储路径
      originalStoragePath: 'bos:/aihc-datasets/your-dataset-path' // 可选：原始存储路径
    };
    
    // 生成任务模板
    console.log('生成任务模板...');
    const taskTemplate = generateDataDumpTaskTemplate(config);
    
    // 提交任务
    console.log('提交任务...');
    const result = await submitDataDumpTask(
      config.resourcePoolId,
      config.queueId,
      taskTemplate
    );
    
    console.log('✅ 任务提交成功！');
    console.log('任务ID:', result.jobId);
    console.log('任务名称:', result.jobName);
    console.log('K8s名称:', result.k8sName);
    
    return result;
  } catch (error) {
    console.error('❌ 任务提交失败:', error);
    throw error;
  }
}

// 将函数暴露到全局作用域，方便在控制台中调用
window.testSubmitDataDumpTask = testSubmitDataDumpTask;
window.generateDataDumpTaskTemplate = generateDataDumpTaskTemplate;
window.submitDataDumpTask = submitDataDumpTask;

console.log('✅ 数据转储任务测试脚本已加载');
console.log('使用方法：');
console.log('1. 调用 testSubmitDataDumpTask() 进行完整测试');
console.log('2. 或者分别调用 generateDataDumpTaskTemplate() 和 submitDataDumpTask()');

// 导出函数（如果在模块环境中）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateDataDumpTaskTemplate,
    submitDataDumpTask,
    testSubmitDataDumpTask
  };
}