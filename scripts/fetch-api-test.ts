import { callBecOpenApi } from '../src/utils/aihcOpenApi';

// 测试新的fetch实现
const testFetchImplementation = async () => {
    console.log('=== 测试新的Fetch实现 ===');
    
    // 使用测试配置
    const ak = '';
    const sk = '';
    const host = 'aihc.bj.baidubce.com';
    
    try {
        console.log('正在测试DescribeDatasets接口...');
        
        // 调用DescribeDatasets接口
        const path = '/';
        const method = 'GET';
        const query = {
            action: 'DescribeDatasets',
        };
        const headers = {
            version: 'v2',
        };
        const body = {};

        const result = await callBecOpenApi(ak, sk, host, path, method, query, body, headers);
        
        // 检查返回结果
        if (result && !result.error && !result.statusCode) {
            console.log('✅ Fetch实现测试成功！');
            console.log('返回结果:', JSON.stringify(result, null, 2));
        } else {
            console.log('❌ Fetch实现测试失败');
            console.log('错误信息:', result?.message || result?.error?.message || '未知错误');
            console.log('完整结果:', JSON.stringify(result, null, 2));
        }
    } catch (error: any) {
        console.error('❌ Fetch实现测试过程中发生错误:', error);
        console.error('错误详情:', error?.message || error?.toString());
    }
};

// 测试错误处理
const testErrorHandling = async () => {
    console.log('\n=== 测试错误处理 ===');
    
    // 测试无效的AK/SK
    const invalidAk = 'invalid-ak';
    const invalidSk = 'invalid-sk';
    const host = 'aihc.bj.baidubce.com';
    
    try {
        console.log('测试无效的AK/SK...');
        
        const path = '/';
        const method = 'GET';
        const query = {
            action: 'DescribeDatasets',
        };
        const headers = {
            version: 'v2',
        };
        const body = {};

        const result = await callBecOpenApi(invalidAk, invalidSk, host, path, method, query, body, headers);
        
        console.log('无效配置的返回结果:', JSON.stringify(result, null, 2));
        
        if (result.statusCode === 403) {
            console.log('✅ 正确捕获到403错误');
        } else {
            console.log('❌ 错误处理可能有问题');
        }
    } catch (error: any) {
        console.log('✅ 正确捕获到异常:', error?.message || error?.toString());
    }
};

// 运行测试
const runTests = async () => {
    await testFetchImplementation();
    await testErrorHandling();
    console.log('\n=== 测试完成 ===');
};

runTests();
