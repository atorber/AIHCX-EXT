import { getPluginConfig, savePluginConfig, resetPluginConfig, getConfigStatus } from '../src/utils/config';

const testConfig = async () => {
    console.log('=== 插件配置测试 ===');
    
    try {
        // 测试获取默认配置
        console.log('1. 获取默认配置:');
        const defaultConfig = await getPluginConfig();
        console.log(defaultConfig);
        
        // 测试保存配置
        console.log('\n2. 保存测试配置:');
        await savePluginConfig({
            ak: 'test-ak',
            sk: 'test-sk',
            host: 'test-host.com'
        });
        console.log('配置已保存');
        
        // 测试获取保存的配置
        console.log('\n3. 获取保存的配置:');
        const savedConfig = await getPluginConfig();
        console.log(savedConfig);
        
        // 测试配置状态
        console.log('\n4. 获取配置状态:');
        const status = await getConfigStatus();
        console.log(status);
        
        // 测试重置配置
        console.log('\n5. 重置配置:');
        await resetPluginConfig();
        const resetConfig = await getPluginConfig();
        console.log('重置后的配置:', resetConfig);
        
        console.log('\n✅ 配置测试完成！');
        
    } catch (error) {
        console.error('❌ 配置测试失败:', error);
    }
};

testConfig();
