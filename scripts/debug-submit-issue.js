/**
 * AIHC数据转储任务提交问题诊断脚本
 * 
 * 此脚本用于诊断"提交转储任务按钮提示提交失败，但是控制台没有打印任何信息"的问题
 * 
 * 使用方法：
 * 1. 打开AIHC控制台的数据集详情页面
 * 2. 按F12打开开发者工具
 * 3. 切换到Console标签
 * 4. 将此脚本全部内容复制粘贴到控制台中执行
 * 5. 调用 diagnoseSubmitIssue() 函数开始诊断
 */

// 诊断函数
async function diagnoseSubmitIssue() {
  console.log('🔍 开始诊断数据转储任务提交问题...');
  console.group('📋 诊断报告');
  
  // 1. 检查环境
  console.log('1. 环境检查:');
  console.log('   - 浏览器:', navigator.userAgent);
  console.log('   - 当前页面:', window.location.href);
  console.log('   - 登录状态:', document.cookie.includes('BAIDUID') ? '已登录' : '未登录');
  
  // 2. 检查扩展程序状态
  console.log('2. 扩展程序检查:');
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('   - Chrome扩展API可用');
    try {
      const manifest = chrome.runtime.getManifest();
      console.log('   - 扩展名称:', manifest.name);
      console.log('   - 扩展版本:', manifest.version);
    } catch (e) {
      console.log('   - 无法获取扩展信息:', e.message);
    }
  } else {
    console.log('   - Chrome扩展API不可用');
  }
  
  // 3. 检查页面元素
  console.log('3. 页面元素检查:');
  const formElements = document.querySelectorAll('form, .data-dump-form, [type="submit"]');
  console.log('   - 表单元素数量:', formElements.length);
  
  const submitButtons = document.querySelectorAll('[type="submit"], .btn-primary');
  console.log('   - 提交按钮数量:', submitButtons.length);
  
  if (submitButtons.length > 0) {
    console.log('   - 第一个提交按钮:', submitButtons[0]);
    console.log('   - 按钮文本:', submitButtons[0].textContent);
    console.log('   - 按钮状态:', submitButtons[0].disabled ? '禁用' : '启用');
  }
  
  // 4. 检查事件监听器
  console.log('4. 事件监听器检查:');
  if (submitButtons.length > 0) {
    const button = submitButtons[0];
    console.log('   - 检查按钮事件监听器...');
    // 注意：getEventListeners只在Chrome开发者工具中可用
    if (typeof getEventListeners !== 'undefined') {
      const listeners = getEventListeners(button);
      console.log('   - 按钮事件监听器:', Object.keys(listeners));
    } else {
      console.log('   - 无法检查事件监听器（需要Chrome开发者工具）');
    }
  }
  
  // 5. 检查网络状态
  console.log('5. 网络状态检查:');
  console.log('   - 在线状态:', navigator.onLine ? '在线' : '离线');
  console.log('   - 网络连接类型:', navigator.connection ? navigator.connection.effectiveType : '未知');
  
  // 6. 测试基本网络请求
  console.log('6. 网络请求测试:');
  try {
    const testUrl = 'https://console.bce.baidu.com/api/aihc/aihc-service/v1/clusters?locale=zh-cn&_=' + Date.now();
    console.log('   - 测试请求URL:', testUrl);
    
    // 注意：由于CORS限制，这个请求可能会失败，但我们仍然可以检查基本连接
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    console.log('   - 请求状态:', response.status);
    console.log('   - 请求成功:', response.ok);
  } catch (error) {
    console.log('   - 网络请求测试失败:', error.message);
    console.log('   - 这可能是正常的（CORS限制）');
  }
  
  // 7. 检查存储
  console.log('7. 存储检查:');
  try {
    localStorage.setItem('aihc_debug_test', 'test');
    const testValue = localStorage.getItem('aihc_debug_test');
    console.log('   - localStorage工作正常:', testValue === 'test');
    localStorage.removeItem('aihc_debug_test');
  } catch (e) {
    console.log('   - localStorage异常:', e.message);
  }
  
  console.groupEnd();
  
  // 提供解决建议
  console.log('\n💡 解决建议:');
  console.log('1. 检查扩展程序是否正确加载');
  console.log('2. 确认是否在正确的AIHC控制台页面');
  console.log('3. 检查浏览器控制台过滤器设置');
  console.log('4. 尝试禁用其他扩展程序');
  console.log('5. 清除浏览器缓存和Cookie后重试');
  console.log('6. 检查网络连接和防火墙设置');
  
  console.log('\n🔧 进一步调试:');
  console.log('手动测试提交任务:');
  console.log('1. 在控制台中执行: manualSubmitTest()');
  console.log('2. 或者直接调用提交函数测试');
  
  return {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    elements: {
      forms: formElements.length,
      buttons: submitButtons.length
    }
  };
}

// 手动提交测试函数
async function manualSubmitTest() {
  console.log('🧪 开始手动提交测试...');
  
  // 模拟表单数据
  const mockConfig = {
    resourcePoolType: '自运维',
    resourcePoolId: 'test-rp-id',
    queueId: 'test-queue-id',
    pfsId: 'test-pfs-id',
    storagePath: '/test/storage/path'
  };
  
  console.log('📋 模拟配置:', mockConfig);
  
  // 生成任务模板
  const taskTemplate = {
    tensorboard: { enable: false, logPath: "", serviceType: "LoadBalancer" },
    autoCreatePVC: true,
    priority: "normal",
    isCustomDelete: false,
    retentionPeriod: "",
    retentionUnit: "d",
    isPolicy: false,
    cpromId: "",
    selectedRowKeys: [],
    pfsId: mockConfig.pfsId,
    imageType: "ccr",
    runningTimeoutStopTimeUnit: "0d",
    visibleScope: 1,
    resourcePoolType: mockConfig.resourcePoolType === '自运维' ? 'normal' : 'serverless',
    jobFramework: "pytorch",
    name: `debug-test-${Date.now()}`,
    command: "echo 'Debug test' && sleep 5",
    enabledHangDetection: false,
    unconditionalFaultToleranceLimit: 0,
    enableReplace: false,
    queue: mockConfig.queueId,
    vpcId: "vpc-f0pp0jbzip3c",
    datasource: [],
    jobSpec: {
      Master: {
        image: "registry.baidubce.com/aihcp-public/pytorch",
        tag: "22.08-py3",
        replicas: 1,
        env: { AIHC_JOB_NAME: `debug-test-${Date.now()}` },
        resource: {},
        restartPolicy: "Never"
      }
    },
    faultTolerance: false,
    jobDistributed: false,
    labels: { "debug-test": "true" },
    annotations: null,
    workloadType: "PytorchJob"
  };
  
  console.log('📤 尝试提交任务...');
  
  try {
    // 根据资源池类型选择不同的API端点
    const isServerless = taskTemplate.resourcePoolType === 'serverless';
    const clusterId = isServerless ? 'aihc-serverless' : mockConfig.resourcePoolId;
    
    const baseUrl = 'https://console.bce.baidu.com/api';
    const url = `${baseUrl}/cce/ai-service/v1/cluster/${clusterId}/aijobv3?queueID=${mockConfig.queueId}&locale=zh-cn&_=${Date.now()}`;
    
    console.log('🎯 提交到URL:', url);
    
    // 尝试发送请求（可能会因为认证问题失败，但我们可以看到错误信息）
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskTemplate)
    });
    
    console.log('📡 响应状态:', response.status);
    console.log('📡 响应状态文本:', response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ 提交成功:', result);
      return result;
    } else {
      const errorText = await response.text();
      console.log('❌ 提交失败:', errorText);
      return { error: true, status: response.status, message: errorText };
    }
  } catch (error) {
    console.log('💥 提交异常:', error);
    return { error: true, message: error.message, stack: error.stack };
  }
}

// 检查控制台输出函数
function checkConsoleOutput() {
  console.log('📢 控制台输出检查');
  console.warn('⚠️ 这是警告信息');
  console.error('❌ 这是错误信息');
  console.info('ℹ️ 这是信息');
  console.debug('🐛 这是调试信息');
  console.log('✅ 如果你能看到这些信息，说明控制台输出正常');
}

// 检查扩展程序通信
function checkExtensionCommunication() {
  console.log('🔌 扩展程序通信检查');
  
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('✅ Chrome扩展API可用');
    
    // 尝试发送消息到扩展程序
    try {
      if (chrome.runtime.sendMessage) {
        console.log('📨 尝试发送消息到扩展程序...');
        // 注意：这可能会失败，因为我们不知道扩展程序的ID
        // chrome.runtime.sendMessage({action: 'debugCheck'}, (response) => {
        //   console.log('📬 扩展程序响应:', response);
        // });
        console.log('⚠️ 无法直接测试扩展程序通信（需要知道扩展程序ID）');
      } else {
        console.log('❌ chrome.runtime.sendMessage不可用');
      }
    } catch (e) {
      console.log('❌ 扩展程序通信测试失败:', e.message);
    }
  } else {
    console.log('❌ Chrome扩展API不可用');
  }
}

// 将函数添加到全局作用域
window.diagnoseSubmitIssue = diagnoseSubmitIssue;
window.manualSubmitTest = manualSubmitTest;
window.checkConsoleOutput = checkConsoleOutput;
window.checkExtensionCommunication = checkExtensionCommunication;

console.log('✅ AIHC数据转储任务提交问题诊断脚本已加载');
console.log('可用函数：');
console.log('- diagnoseSubmitIssue(): 诊断提交问题');
console.log('- manualSubmitTest(): 手动提交测试');
console.log('- checkConsoleOutput(): 检查控制台输出');
console.log('- checkExtensionCommunication(): 检查扩展程序通信');

console.log('\n🚀 开始诊断:');
console.log('diagnoseSubmitIssue()');