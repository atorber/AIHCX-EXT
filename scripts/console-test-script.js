/**
 * AIHC数据转储任务控制台测试脚本
 * 
 * 使用说明：
 * 1. 打开AIHC控制台页面（确保已登录）
 * 2. 按F12打开开发者工具
 * 3. 切换到Console标签
 * 4. 将此脚本的全部内容复制粘贴到控制台中执行
 * 5. 调用 testSubmitDumpTask() 函数进行测试
 */

// 任务模板生成函数
function generateDumpTaskTemplate(config) {
  const timestamp = Date.now();
  const jobName = `data-dump-test-${timestamp}`;
  
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
    command: `echo "数据转储测试任务开始..." && \
echo "存储路径: ${config.storagePath}" && \
echo "开始时间: $(date)" && \
sleep 10 && \
echo "测试任务完成: $(date)"`,
    enabledHangDetection: false,
    unconditionalFaultToleranceLimit: 0,
    enableReplace: false,
    queue: config.queueId,
    vpcId: "vpc-f0pp0jbzip3c",
    datasource: [
      {
        type: "emptydir",
        name: "devshm",
        mountPath: "/dev/shm",
        options: {
          medium: "Memory",
          sizeLimit: 10
        }
      }
    ],
    jobSpec: {
      Master: {
        image: "registry.baidubce.com/aihcp-public/pytorch",
        tag: "22.08-py3",
        replicas: 1,
        env: {
          AIHC_JOB_NAME: jobName,
          NCCL_IB_DISABLE: "1"
        },
        resource: {},
        restartPolicy: "Never"
      }
    },
    faultTolerance: false,
    jobDistributed: false,
    labels: {
      "aijob.cce.baidubce.com/create-from-aihcp": "true",
      "test-dump-task": "true"
    },
    annotations: null,
    workloadType: "PytorchJob"
  };
}

// 提交任务函数
async function submitDumpTask(resourcePoolId, queueId, taskTemplate) {
  // 根据资源池类型选择不同的API端点
  const isServerless = taskTemplate.resourcePoolType === 'serverless';
  const clusterId = isServerless ? 'aihc-serverless' : resourcePoolId;
  
  const baseUrl = 'https://console.bce.baidu.com/api';
  const url = `${baseUrl}/cce/ai-service/v1/cluster/${clusterId}/aijobv3?queueID=${queueId}&locale=zh-cn&_=${Date.now()}`;
  
  console.log('提交任务到:', url);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskTemplate)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API请求失败: ${response.status}, ${errorText}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || '任务提交失败');
  }
  
  return result.result;
}

// 测试函数
async function testSubmitDumpTask() {
  console.log('🚀 开始测试数据转储任务提交...');
  
  // 请根据实际情况修改以下配置
  const testConfig = {
    resourcePoolType: '自运维', // '自运维' 或 '全托管'
    resourcePoolId: 'rp-xxxxxx', // 替换为实际资源池ID
    queueId: 'default', // 替换为实际队列ID
    pfsId: 'pfs-xxxxxx', // 替换为实际PFS实例ID
    storagePath: '/test/storage/path' // 替换为实际存储路径
  };
  
  try {
    // 生成任务模板
    console.log('📋 生成任务模板...');
    const taskTemplate = generateDumpTaskTemplate(testConfig);
    console.log('✅ 任务模板生成完成');
    
    // 提交任务
    console.log('📤 提交任务...');
    const result = await submitDumpTask(
      testConfig.resourcePoolId,
      testConfig.queueId,
      taskTemplate
    );
    
    console.log('🎉 任务提交成功！');
    console.log('任务ID:', result.jobId);
    console.log('任务名称:', result.jobName);
    
    return result;
  } catch (error) {
    console.error('❌ 任务提交失败:', error);
    throw error;
  }
}

// 简化测试函数（使用最小配置）
async function quickTest() {
  console.log('⚡ 快速测试数据转储任务提交...');
  
  // 最小配置任务模板
  const minimalTemplate = {
    tensorboard: { enable: false, logPath: "", serviceType: "LoadBalancer" },
    autoCreatePVC: true,
    priority: "normal",
    isCustomDelete: false,
    retentionPeriod: "",
    retentionUnit: "d",
    isPolicy: false,
    cpromId: "",
    selectedRowKeys: [],
    pfsId: "pfs-test",
    imageType: "ccr",
    runningTimeoutStopTimeUnit: "0d",
    visibleScope: 1,
    resourcePoolType: "normal",
    jobFramework: "pytorch",
    name: `quick-test-${Date.now()}`,
    command: "echo 'Quick test' && sleep 5",
    enabledHangDetection: false,
    unconditionalFaultToleranceLimit: 0,
    enableReplace: false,
    queue: "default",
    vpcId: "vpc-f0pp0jbzip3c",
    datasource: [],
    jobSpec: {
      Master: {
        image: "registry.baidubce.com/aihcp-public/pytorch",
        tag: "22.08-py3",
        replicas: 1,
        env: { AIHC_JOB_NAME: `quick-test-${Date.now()}` },
        resource: {},
        restartPolicy: "Never"
      }
    },
    faultTolerance: false,
    jobDistributed: false,
    labels: { "test-task": "true" },
    annotations: null,
    workloadType: "PytorchJob"
  };
  
  try {
    // 这里需要替换为实际的资源池ID和队列ID
    const result = await submitDumpTask('rp-test', 'default', minimalTemplate);
    console.log('✅ 快速测试成功:', result);
    return result;
  } catch (error) {
    console.error('❌ 快速测试失败:', error);
    throw error;
  }
}

// 将函数添加到全局作用域
window.testSubmitDumpTask = testSubmitDumpTask;
window.quickTest = quickTest;
window.generateDumpTaskTemplate = generateDumpTaskTemplate;
window.submitDumpTask = submitDumpTask;

console.log('✅ AIHC数据转储任务测试脚本已加载');
console.log('可用函数：');
console.log('- testSubmitDumpTask(): 完整测试');
console.log('- quickTest(): 快速测试');
console.log('- generateDumpTaskTemplate(config): 生成任务模板');
console.log('- submitDumpTask(resourcePoolId, queueId, taskTemplate): 提交任务');

console.log('\n使用示例：');
console.log('// 完整测试');
console.log('testSubmitDumpTask()');
console.log('\n// 快速测试');
console.log('quickTest()');