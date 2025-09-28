import { callBecOpenApi } from '../src/utils/aihcOpenApi';

// 测试配置验证功能
const testConfigValidation = async () => {
    console.log('=== 配置验证测试 ===');
    
    // 使用测试脚本中的配置
    const ak = '';
    const sk = '';
    const host = 'aihc.bj.baidubce.com';
    
    try {
        console.log('正在测试DescribeDatasets接口...');
        
        // 调用DescribeDatasets接口验证配置
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
        if (result && !result.error) {
            console.log('✅ 配置验证成功！API连接正常');
            console.log('返回结果:', JSON.stringify(result, null, 2));
        } else {
            console.log('❌ 配置验证失败');
            console.log('错误信息:', result?.message || '未知错误');
            console.log('完整结果:', JSON.stringify(result, null, 2));
        }
    } catch (error: any) {
        console.error('❌ 配置验证过程中发生错误:', error);
        console.error('错误详情:', error?.message || error?.toString());
    }
};

// 测试不同配置的错误处理
const testErrorHandling = async () => {
    console.log('\n=== 错误处理测试 ===');
    
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
    } catch (error: any) {
        console.log('✅ 正确捕获到错误:', error?.message || error?.toString());
    }
};

// 运行测试
const runTests = async () => {
    await testConfigValidation();
    await testErrorHandling();
    console.log('\n=== 测试完成 ===');
};

runTests();
