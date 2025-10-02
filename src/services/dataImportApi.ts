import { callBecOpenApiWithConfig } from '../utils/aihcOpenApi';

// 数据导入任务配置接口
export interface DataImportTaskConfig {
  datasetId: string;
  datasetVersion: string;
  importType: 'HuggingFace' | 'ModelScope' | '数据集';
  importUrl: string;
  resourcePoolId: string;
  resourcePoolType: '自运维' | '全托管';
  queueId: string;
  datasetType?: string;
  storageInstance?: string;
  storagePath?: string; // 存储路径，用于BOS类型的数据源配置
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

/**
 * 根据数据集类型生成数据源配置
 */
const generateDataSources = (config: DataImportTaskConfig): any[] => {
  const datasetType = config.datasetType || 'BOS';
  
  console.log('🔧 生成数据源配置:', {
    datasetType,
    datasetId: config.datasetId,
    datasetVersion: config.datasetVersion,
    storageInstance: config.storageInstance
  });

  // 根据数据集类型生成相应的数据源配置
  switch (datasetType.toUpperCase()) {
    case 'BOS':
      // BOS类型：name为空字符串，sourcePath为存储实例ID拼接存储路径
      // 需要从selectedVersionInfo中获取存储路径，然后与存储实例ID拼接
      const storagePath = config.storagePath || config.datasetVersion; // 优先使用存储路径
      const bosSourcePath = config.storageInstance 
        ? `${config.storageInstance}${storagePath.startsWith('/') ? storagePath : `/${storagePath}`}`
        : storagePath;
      
      console.log('🔧 BOS数据源配置:', {
        storageInstance: config.storageInstance,
        datasetVersion: config.datasetVersion,
        storagePath: storagePath,
        sourcePath: bosSourcePath
      });
      
      return [
        {
          type: 'bos',
          name: '', // BOS类型name为空字符串
          sourcePath: bosSourcePath, // 存储实例ID拼接存储版本的存储路径
          mountPath: '/mnt/output'
        }
      ];
    
    case 'PFS':
      // PFS类型：name为存储实例ID，sourcePath为存储路径
      const pfsStoragePath = config.storagePath || config.datasetVersion; // 优先使用存储路径
      
      console.log('🔧 PFS数据源配置:', {
        storageInstance: config.storageInstance,
        datasetId: config.datasetId,
        datasetVersion: config.datasetVersion,
        storagePath: pfsStoragePath,
        name: config.storageInstance,
        sourcePath: pfsStoragePath
      });
      
      return [
        {
          type: 'pfs',
          name: config.storageInstance, // 使用存储实例ID作为name
          sourcePath: pfsStoragePath, // 使用存储路径作为sourcePath
          mountPath: '/mnt/output'
        }
      ];
    
    default:
      console.warn(`⚠️ 未知的数据集类型: ${datasetType}，使用默认BOS配置`);
      // 默认也使用BOS配置，遵循BOS类型的规则
      const defaultBosSourcePath = config.storageInstance 
        ? `${config.storageInstance}/${config.datasetVersion}`
        : config.datasetVersion;
      
      return [
        {
          type: 'bos',
          name: '', // BOS类型name为空字符串
          sourcePath: defaultBosSourcePath, // 存储实例ID拼接存储版本的存储路径
          mountPath: '/mnt/output'
        }
      ];
  }
};

/**
 * 生成符合DNS-1123子域名规范的任务名称
 */
const generateJobName = (datasetId: string, importType: string): string => {
  // 清理数据集ID，移除大写字母和特殊字符，只保留小写字母、数字和连字符
  const cleanDatasetId = datasetId.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  
  // 移除连续的连字符
  const cleanedDatasetId = cleanDatasetId.replace(/-+/g, '-');
  
  // 生成基础任务名称
  const baseName = `data-import-${cleanedDatasetId}-${importType.toLowerCase()}-${Date.now()}`;
  
  // 确保以字母或数字开头和结尾，移除开头和结尾的非字母数字字符
  const finalName = baseName.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
  
  // 限制长度（DNS-1123子域名最大63个字符）
  return finalName.length > 63 ? finalName.substring(0, 63) : finalName;
};

/**
 * 根据导入类型生成相应的启动命令
 */
const generateImportCommand = (importType: string, importUrl: string): string => {
  switch (importType) {
    case 'HuggingFace':
      return `echo "🚀 开始从HuggingFace下载数据..." \
        && START_TIME=$(date +%s) \
        && python -c "
import os
import sys
from datasets import load_dataset
from huggingface_hub import snapshot_download

urls = '''${importUrl}'''.strip().split('\\n')
for url in urls:
    if url.strip():
        print(f'📥 正在下载: {url.strip()}')
        try:
            # 尝试作为数据集下载
            if '/datasets/' in url:
                dataset_name = url.split('/datasets/')[-1]
                dataset = load_dataset(dataset_name)
                print(f'✅ 数据集 {dataset_name} 下载完成')
            else:
                # 作为模型下载
                model_name = url.split('huggingface.co/')[-1]
                snapshot_download(repo_id=model_name, local_dir=f'/mnt/output/{model_name}')
                print(f'✅ 模型 {model_name} 下载完成')
        except Exception as e:
            print(f'❌ 下载失败 {url}: {e}')
" \
        && END_TIME=$(date +%s) \
        && DIFF=$((END_TIME - START_TIME)) \
        && echo "✅ HuggingFace数据下载完成！耗时: \${DIFF}秒"`;

    case 'ModelScope':
      return `echo "🚀 开始从ModelScope下载数据..." \
        && START_TIME=$(date +%s) \
        && python -c "
import os
import sys
from modelscope import MsDataset
from modelscope.hub.snapshot_download import snapshot_download

urls = '''${importUrl}'''.strip().split('\\n')
for url in urls:
    if url.strip():
        print(f'📥 正在下载: {url.strip()}')
        try:
            # 尝试作为数据集下载
            if '/datasets/' in url:
                dataset_name = url.split('/datasets/')[-1]
                dataset = MsDataset.load(dataset_name)
                print(f'✅ 数据集 {dataset_name} 下载完成')
            else:
                # 作为模型下载
                model_name = url.split('modelscope.cn/')[-1]
                snapshot_download(model_name, cache_dir=f'/mnt/output/{model_name}')
                print(f'✅ 模型 {model_name} 下载完成')
        except Exception as e:
            print(f'❌ 下载失败 {url}: {e}')
" \
        && END_TIME=$(date +%s) \
        && DIFF=$((END_TIME - START_TIME)) \
        && echo "✅ ModelScope数据下载完成！耗时: \${DIFF}秒"`;

    case '数据集':
      return `echo "🚀 开始从其他数据集源下载数据..." \
        && START_TIME=$(date +%s) \
        && python -c "
import os
import sys
import requests
from urllib.parse import urlparse

urls = '''${importUrl}'''.strip().split('\\n')
for url in urls:
    if url.strip():
        print(f'📥 正在下载: {url.strip()}')
        try:
            # 简单的文件下载逻辑
            response = requests.get(url.strip(), stream=True)
            response.raise_for_status()
            
            # 从URL中提取文件名
            parsed_url = urlparse(url.strip())
            filename = os.path.basename(parsed_url.path) or 'downloaded_file'
            
            # 保存到挂载路径
            with open(f'/mnt/output/{filename}', 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f'✅ 文件 {filename} 下载完成')
        except Exception as e:
            print(f'❌ 下载失败 {url}: {e}')
" \
        && END_TIME=$(date +%s) \
        && DIFF=$((END_TIME - START_TIME)) \
        && echo "✅ 数据集下载完成！耗时: \${DIFF}秒"`;

    default:
      return `echo "❌ 不支持的导入类型: ${importType}"`;
  }
};

/**
 * 创建数据导入任务
 */
export const createDataImportTask = async (config: DataImportTaskConfig): Promise<TaskCreateResponse> => {
  try {
    console.log('创建数据导入任务:', config);

    // 生成导入命令
    const importCommand = generateImportCommand(config.importType, config.importUrl);

    // 生成符合DNS-1123规范的任务名称
    const jobName = generateJobName(config.datasetId, config.importType);
    
    console.log('🔧 任务名称生成:', {
      originalDatasetId: config.datasetId,
      importType: config.importType,
      generatedJobName: jobName
    });

    // 构建OpenAPI任务配置
    const taskConfig = {
      name: jobName,
      jobType: 'PyTorchJob',
      command: importCommand,
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
            value: `data-import-${config.datasetId}`
          },
          {
            name: 'IMPORT_TYPE',
            value: config.importType
          },
          {
            name: 'IMPORT_URL',
            value: config.importUrl
          }
        ],
        enableRDMA: false
      },
      labels: [],
      datasources: generateDataSources(config)
    };

    // 打印详细的请求参数
    console.log('🔍 数据导入任务详细请求参数:');
    console.log('📋 输入配置:', {
      datasetId: config.datasetId,
      datasetVersion: config.datasetVersion,
      importType: config.importType,
      importUrl: config.importUrl,
      resourcePoolType: config.resourcePoolType,
      resourcePoolId: config.resourcePoolId,
      queueId: config.queueId,
      datasetType: config.datasetType,
      storageInstance: config.storageInstance
    });
    console.log('📋 URL参数:', {
      action: 'CreateJob',
      resourcePoolId: config.resourcePoolId
    });
    console.log('📦 请求Body完整内容:');
    console.log('  - 任务名称:', taskConfig.name);
    console.log('  - 任务类型:', taskConfig.jobType);
    console.log('  - 启动命令:', taskConfig.command);
    console.log('  - 镜像:', taskConfig.jobSpec.image);
    console.log('  - 副本数:', taskConfig.jobSpec.replicas);
    console.log('  - 环境变量:', taskConfig.jobSpec.envs);
    console.log('  - 数据源配置:', taskConfig.datasources);
    console.log('📦 数据源配置详情:');
    taskConfig.datasources.forEach((ds, index) => {
      console.log(`  [${index}] 类型: ${ds.type}, 名称: ${ds.name}, 源路径: ${ds.sourcePath}, 挂载路径: ${ds.mountPath}`);
    });
    console.log('📦 请求Body JSON:', JSON.stringify(taskConfig, null, 2));

    // 根据资源池类型处理API调用参数
    const isFullyManaged = config.resourcePoolType === '全托管';
    const actualResourcePoolId = isFullyManaged ? 'aihc-serverless' : config.resourcePoolId;
    
    const queryParams: any = {
      action: 'CreateJob',
      resourcePoolId: actualResourcePoolId
    };
    
    // 如果是全托管资源池，添加queueID参数
    if (isFullyManaged && config.queueId) {
      queryParams.queueID = config.queueId;
    }

    console.log('🚀 开始调用OpenAPI创建数据导入任务...');
    console.log('📋 最终URL参数:', queryParams);
    console.log('📋 请求头:', {
      'Content-Type': 'application/json',
      'X-API-Version': 'v2'
    });

    // 调用OpenAPI创建任务
    const response = await callBecOpenApiWithConfig(
      '/',
      'POST',
      queryParams,
      taskConfig,
      {
        'Content-Type': 'application/json',
        'X-API-Version': 'v2'
      }
    );

    console.log('📥 OpenAPI响应结果:');
    console.log('  - 响应状态:', response.error ? '失败' : '成功');
    console.log('  - 错误信息:', response.error || '无');
    console.log('  - 消息:', response.message || '无');
    console.log('  - 任务ID:', response.jobId || '无');
    console.log('  - 任务名称:', response.jobName || '无');
    console.log('📦 完整响应:', response);

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
    console.error('创建数据导入任务失败:', error);
    return {
      success: false,
      error: error.message || '网络请求失败'
    };
  }
};

/**
 * 查询任务状态
 */
export const getTaskStatus = async (jobId: string): Promise<{
  success: boolean;
  status?: string;
  message?: string;
  startTime?: string;
  endTime?: string;
}> => {
  try {
    const response = await callBecOpenApiWithConfig(
      '/',
      'GET',
      {
        action: 'DescribeJob',
        jobId: jobId
      },
      null,
      {
        'Content-Type': 'application/json',
        'X-API-Version': 'v2'
      }
    );

    if (response.error) {
      return {
        success: false,
        message: response.message || '查询任务状态失败'
      };
    }

    return {
      success: true,
      status: response.status,
      message: response.message,
      startTime: response.startTime,
      endTime: response.endTime
    };

  } catch (error: any) {
    console.error('查询任务状态失败:', error);
    return {
      success: false,
      message: error.message || '网络请求失败'
    };
  }
};
