// 数据转储API测试脚本
import { createDataDumpTask, getResourcePools, getQueues, getPfsInstances, DataDumpTaskConfig } from '../src/services/dataDumpApi';

console.log('=== 数据转储API测试 ===');

// 测试创建数据转储任务
const testCreateDataDumpTask = async () => {
  console.log('\n📋 测试创建数据转储任务 (OpenAPI)...');
  
  const testConfig: DataDumpTaskConfig = {
    datasetId: 'test-dataset-123',
    datasetName: '测试数据集',
    sourcePath: '/source/data',
    targetPath: '/target/data',
    resourcePoolId: 'test-pool-123',
    queueId: 'default',
    pfsInstanceId: 'pfs-test-123'
  };

  try {
    console.log('使用OpenAPI接口创建任务...');
    console.log('请求参数:', {
      action: 'CreateJob',
      resourcePoolId: testConfig.resourcePoolId,
      jobType: 'PyTorchJob',
      name: `data-dump-${testConfig.datasetId}-${Date.now()}`
    });
    
    const result = await createDataDumpTask(testConfig);
    console.log('任务创建结果:', result);
    
    if (result.success) {
      console.log('✅ 任务创建成功');
      console.log('任务ID:', result.result?.jobId);
      console.log('任务名称:', result.result?.jobName);
      console.log('K8s名称:', result.result?.k8sName);
    } else {
      console.log('❌ 任务创建失败:', result.error);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
};

// 测试获取资源池列表
const testGetResourcePools = async () => {
  console.log('\n📋 测试获取资源池列表 (OpenAPI)...');
  
  try {
    console.log('使用OpenAPI接口获取资源池列表...');
    console.log('请求参数:', { action: 'DescribeResourcePools' });
    
    const result = await getResourcePools();
    console.log('资源池列表:', result);
    console.log('✅ 获取资源池列表成功');
  } catch (error) {
    console.error('❌ 获取资源池列表失败:', error);
  }
};

// 测试获取队列列表
const testGetQueues = async () => {
  console.log('\n📋 测试获取队列列表 (OpenAPI)...');
  
  const testResourcePoolId = 'test-pool-123';
  
  try {
    console.log('使用OpenAPI接口获取队列列表...');
    console.log('请求参数:', { 
      action: 'DescribeQueues', 
      resourcePoolId: testResourcePoolId 
    });
    
    const result = await getQueues(testResourcePoolId);
    console.log('队列列表:', result);
    console.log('✅ 获取队列列表成功');
  } catch (error) {
    console.error('❌ 获取队列列表失败:', error);
  }
};

// 测试获取PFS实例列表
const testGetPfsInstances = async () => {
  console.log('\n📋 测试获取PFS实例列表 (OpenAPI)...');
  
  const testResourcePoolId = 'test-pool-123';
  
  try {
    console.log('使用OpenAPI接口获取PFS实例列表...');
    console.log('请求参数:', { 
      action: 'DescribePfsInstances', 
      resourcePoolId: testResourcePoolId 
    });
    
    const result = await getPfsInstances(testResourcePoolId);
    console.log('PFS实例列表:', result);
    console.log('✅ 获取PFS实例列表成功');
  } catch (error) {
    console.error('❌ 获取PFS实例列表失败:', error);
  }
};

// 运行所有测试
const runAllTests = async () => {
  console.log('🚀 开始运行数据转储API测试...');
  
  try {
    await testGetResourcePools();
    await testGetQueues();
    await testGetPfsInstances();
    await testCreateDataDumpTask();
    
    console.log('\n=== 测试完成 ===');
    console.log('✅ 所有API测试已执行');
    console.log('💡 注意: 由于需要有效的AK/SK配置，某些测试可能会失败');
    console.log('💡 请在插件设置中配置正确的AK、SK和Host后重试');
    
  } catch (error) {
    console.error('❌ 测试执行失败:', error);
  }
};

// 检查配置状态
const checkConfigStatus = async () => {
  console.log('\n🔧 检查配置状态...');
  
  try {
    const { getPluginConfig } = await import('../src/utils/config');
    const config = await getPluginConfig();
    
    console.log('当前配置状态:');
    console.log('- AK:', config.ak ? '已配置' : '未配置');
    console.log('- SK:', config.sk ? '已配置' : '未配置');
    console.log('- Host:', config.host ? '已配置' : '未配置');
    
    if (!config.ak || !config.sk || !config.host) {
      console.log('⚠️ 请先在插件设置中配置AK、SK和Host');
      console.log('💡 配置方法: 点击侧边栏右上角的设置按钮');
    } else {
      console.log('✅ 配置完整，可以运行API测试');
    }
  } catch (error) {
    console.error('❌ 检查配置状态失败:', error);
  }
};

// 主函数
const main = async () => {
  await checkConfigStatus();
  await runAllTests();
};

main().catch(console.error);
