import { callBecOpenApiWithConfig } from '../utils/aihcOpenApi';

// 数据导入任务配置接口
export interface DataImportTaskConfig {
  datasetId: string;
  datasetVersion: string;
  importType: 'HuggingFace' | 'ModelScope' | '数据集';
  importUrl: string;
  accessToken?: string; // 访问令牌，选填
  resourcePoolId: string;
  resourcePoolType: '自运维' | '全托管';
  queueId: string;
  datasetType?: string;
  storageInstance?: string;
  storagePath?: string; // 存储路径，用于BOS类型的数据源配置
  
  // 数据集导入模式下的源数据集信息
  sourceDatasetId?: string; // 源数据集ID
  sourceDatasetVersion?: string; // 源数据集版本
  sourceDatasetType?: string; // 源数据集类型
  sourceStorageInstance?: string; // 源数据集存储实例
  sourceStoragePath?: string; // 源数据集存储路径
  
  // 数据集导入模式下的目标数据集信息
  targetDatasetId?: string; // 目标数据集ID
  targetDatasetVersion?: string; // 目标数据集版本
  targetDatasetType?: string; // 目标数据集类型
  targetStorageInstance?: string; // 目标数据集存储实例
  targetStoragePath?: string; // 目标数据集存储路径
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
    storageInstance: config.storageInstance,
    importType: config.importType
  });

  // 如果是数据集导入，需要挂载两个数据源：源数据集和目标数据集
  if (config.importType === '数据集') {
    console.log('🔧 数据集导入模式：配置双数据源');
    console.log('🔧 源数据集信息:', {
      datasetType: config.datasetType,
      storageInstance: config.storageInstance,
      storagePath: config.storagePath,
      datasetVersion: config.datasetVersion
    });
    
    // 源数据集配置（选中的数据集）- 使用选中数据集的存储信息
    const sourceDatasetType = config.sourceDatasetType || config.datasetType || 'BOS';
    const sourceStorageInstance = config.sourceStorageInstance || config.storageInstance;
    const sourceStoragePath = config.sourceStoragePath || config.storagePath || config.datasetVersion;
    
    let sourceDataSource;
    
    switch (sourceDatasetType.toUpperCase()) {
      case 'BOS':
        const bosSourcePath = sourceStorageInstance 
          ? `${sourceStorageInstance}${sourceStoragePath.startsWith('/') ? sourceStoragePath : `/${sourceStoragePath}`}`
          : sourceStoragePath;
        sourceDataSource = {
          type: 'bos',
          name: '', // BOS类型name为空字符串
          sourcePath: bosSourcePath,
          mountPath: '/mnt/source',
          options: {} // 添加options字段以支持CSI配置
        };
        break;
        
      case 'PFS':
        sourceDataSource = {
          type: 'pfs',
          name: sourceStorageInstance || config.datasetId,
          sourcePath: sourceStoragePath,
          mountPath: '/mnt/source'
        };
        break;
        
      case 'NFS':
        sourceDataSource = {
          type: 'nfs',
          name: config.datasetId,
          sourcePath: sourceStoragePath,
          mountPath: '/mnt/source'
        };
        break;
        
      default:
        console.warn(`⚠️ 未知的源数据集类型: ${sourceDatasetType}，使用默认BOS配置`);
        sourceDataSource = {
          type: 'bos',
          name: '',
          sourcePath: sourceStoragePath,
          mountPath: '/mnt/source',
          options: {} // 添加options字段以支持CSI配置
        };
    }
    
    // 目标数据集配置（当前数据集）- 使用当前数据集的存储信息
    // 注意：这里需要获取当前数据集的信息，而不是源数据集的信息
    // 目标数据集的存储信息应该从config中获取，而不是从源数据集获取
    const targetStoragePath = config.targetStoragePath || config.storagePath || config.datasetVersion;
    const targetStorageInstance = config.targetStorageInstance || config.storageInstance;
    
    let targetSourcePath = '';
    if (targetStorageInstance && targetStoragePath) {
      targetSourcePath = `${targetStorageInstance}${targetStoragePath.startsWith('/') ? targetStoragePath : `/${targetStoragePath}`}`;
    }
    
    const targetDataSource = {
      type: 'bos', // 目标数据集默认为BOS类型
      name: '',
      sourcePath: targetSourcePath, // 使用当前数据集的存储路径
      mountPath: '/mnt/output',
      options: {} // 添加options字段以支持CSI配置
    };
    
    console.log('🔧 源数据集配置:', sourceDataSource);
    console.log('🔧 目标数据集配置:', targetDataSource);
    
    return [sourceDataSource, targetDataSource];
  }

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
          mountPath: '/mnt/output',
          options: {} // 添加options字段以支持CSI配置
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
          mountPath: '/mnt/output',
          options: {} // 添加options字段以支持CSI配置
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
  
  // 将中文导入类型映射为英文
  const importTypeMap: { [key: string]: string } = {
    'HuggingFace': 'huggingface',
    'ModelScope': 'modelscope',
    '数据集': 'dataset'
  };
  
  const cleanImportType = importTypeMap[importType] || importType.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // 生成基础任务名称
  const baseName = `data-import-${cleanedDatasetId}-${cleanImportType}-${Date.now()}`;
  
  // 确保以字母或数字开头和结尾，移除开头和结尾的非字母数字字符
  const finalName = baseName.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
  
  // 限制长度（DNS-1123子域名最大63个字符）
  return finalName.length > 63 ? finalName.substring(0, 63) : finalName;
};

/**
 * 根据导入类型生成相应的启动命令
 */
const generateImportCommand = (importType: string, importUrl: string, accessToken?: string): string => {
  switch (importType) {
    case 'HuggingFace':
      return `echo "🚀 开始从HuggingFace下载数据..." \
        && echo "📦 安装HuggingFace依赖..." \
        && pip install datasets huggingface_hub -q \
        && START_TIME=$(date +%s) \
        && python -c "
import os
import sys
import time
from datasets import load_dataset
from huggingface_hub import snapshot_download, hf_hub_download, login
from huggingface_hub.utils import HfHubHTTPError

# 设置访问令牌
access_token = '${accessToken || ""}'
if access_token:
    print('🔑 使用Access Token进行认证...')
    login(token=access_token)
    print('✅ HuggingFace认证成功')
else:
    print('⚠️ 未提供Access Token，尝试匿名访问')

def download_with_retry(func, *args, **kwargs):
    max_retries = 3
    for attempt in range(max_retries):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            print(f'⚠️ 尝试 {attempt + 1}/{max_retries} 失败: {e}')
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # 指数退避
            else:
                raise e

urls = '''${importUrl}'''.strip().split('\\n')
for url in urls:
    if url.strip():
        print(f'📥 正在下载: {url.strip()}')
        try:
            # 尝试作为数据集下载
            if '/datasets/' in url:
                dataset_name = url.split('/datasets/')[-1]
                print(f'🔍 尝试下载数据集: {dataset_name}')
                dataset = download_with_retry(load_dataset, dataset_name)
                print(f'✅ 数据集 {dataset_name} 下载完成')
            else:
                # 作为模型下载
                model_name = url.split('huggingface.co/')[-1]
                print(f'🔍 尝试下载模型: {model_name}')
                
                # 首先尝试获取模型信息
                try:
                    from huggingface_hub import model_info
                    info = model_info(model_name)
                    print(f'📋 模型信息: {info.id}, 类型: {info.pipeline_tag or \"未知\"}')
                except Exception as e:
                    print(f'⚠️ 无法获取模型信息: {e}')
                
                # 尝试不同的下载方式
                try:
                    # 方式1: 使用snapshot_download下载整个仓库
                    download_with_retry(snapshot_download, 
                                      repo_id=model_name, 
                                      local_dir=f'/mnt/output/{model_name}',
                                      resume_download=True)
                    print(f'✅ 模型 {model_name} 下载完成 (snapshot_download)')
                except Exception as e1:
                    print(f'⚠️ snapshot_download 失败: {e1}')
                    try:
                        # 方式2: 尝试下载主要文件
                        main_files = ['config.json', 'tokenizer.json', 'tokenizer_config.json']
                        for file in main_files:
                            try:
                                download_with_retry(hf_hub_download, 
                                                  repo_id=model_name, 
                                                  filename=file,
                                                  local_dir=f'/mnt/output/{model_name}')
                                print(f'✅ 下载文件: {file}')
                            except Exception as e2:
                                print(f'⚠️ 文件 {file} 下载失败: {e2}')
                        print(f'✅ 模型 {model_name} 部分文件下载完成')
                    except Exception as e2:
                        print(f'❌ 所有下载方式都失败了: {e2}')
                        sys.exit(1)  # 所有下载方式都失败时退出任务
        except Exception as e:
            print(f'❌ 下载失败 {url}: {e}')
            print(f'💡 建议检查: 1) 网络连接 2) 模型是否存在 3) 是否需要认证')
            sys.exit(1)  # 下载失败时退出任务
" \
        && END_TIME=$(date +%s) \
        && DIFF=$((END_TIME - START_TIME)) \
        && echo "✅ HuggingFace数据下载完成！耗时: \${DIFF}秒"`;

    case 'ModelScope':
      return `echo "🚀 开始从ModelScope下载数据..." \
        && echo "📦 检查Python版本和安装依赖..." \
        && python --version \
        && echo "📦 安装兼容版本的ModelScope依赖..." \
        && pip install "modelscope>=1.9.0,<1.10.0" -q \
        && START_TIME=$(date +%s) \
        && python -c "
import os
import sys
import time
import warnings
warnings.filterwarnings('ignore')

# 设置访问令牌
access_token = '${accessToken || ""}'
if access_token:
    print('🔑 使用Access Token进行认证...')
    os.environ['MODELSCOPE_API_TOKEN'] = access_token
    print('✅ ModelScope认证成功')
else:
    print('⚠️ 未提供Access Token，尝试匿名访问')

try:
    from modelscope import MsDataset
    from modelscope.hub.snapshot_download import snapshot_download
    print('✅ ModelScope模块导入成功')
except Exception as e:
    print(f'⚠️ ModelScope导入失败，尝试使用requests下载: {e}')
    import requests
    import json
    from urllib.parse import urlparse

def download_with_retry(func, *args, **kwargs):
    max_retries = 3
    for attempt in range(max_retries):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            print(f'⚠️ 尝试 {attempt + 1}/{max_retries} 失败: {e}')
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # 指数退避
            else:
                raise e

# 检查ModelScope是否可用
modelscope_available = True
try:
    from modelscope import MsDataset
    from modelscope.hub.snapshot_download import snapshot_download
except:
    modelscope_available = False
    print('⚠️ ModelScope不可用，使用备用下载方案')

def download_modelscope_item(url):
    if modelscope_available:
        # 使用ModelScope官方API
        if '/datasets/' in url:
            dataset_name = url.split('/datasets/')[-1]
            print(f'🔍 尝试下载数据集: {dataset_name}')
            dataset = download_with_retry(MsDataset.load, dataset_name)
            print(f'✅ 数据集 {dataset_name} 下载完成')
        else:
            # 修复模型名称解析
            if '/models/' in url:
                model_name = url.split('/models/')[-1]
            else:
                model_name = url.split('modelscope.cn/')[-1]
            
            # 移除可能的'models/'前缀
            if model_name.startswith('models/'):
                model_name = model_name[7:]
            
            print(f'🔍 尝试下载模型: {model_name}')
            
            # 尝试不同的下载方式
            try:
                # 方式1: 直接下载
                model_dir = download_with_retry(snapshot_download, model_name)
                print(f'✅ 模型 {model_name} 下载完成，保存到: {model_dir}')
                
                import shutil
                target_dir = '/mnt/output/' + model_name.replace('/', '_')
                if os.path.exists(model_dir):
                    shutil.copytree(model_dir, target_dir, dirs_exist_ok=True)
                    print(f'📁 模型文件已复制到: {target_dir}')
                else:
                    print(f'⚠️ 模型目录不存在: {model_dir}')
            except Exception as e:
                print(f'⚠️ 直接下载失败: {e}')
                # 方式2: 尝试使用备用方案
                print(f'🔍 尝试备用下载方案...')
                try:
                    download_modelscope_fallback(model_name)
                except Exception as fallback_error:
                    print(f'❌ 备用下载方案也失败: {fallback_error}')
                    sys.exit(1)  # 备用方案也失败时退出任务
    else:
        # 备用方案：使用requests直接下载
        print(f'🔍 使用备用方案下载: {url}')
        model_name = url.split('modelscope.cn/')[-1]
        if model_name.startswith('models/'):
            model_name = model_name[7:]
        download_modelscope_fallback(model_name)

def download_modelscope_fallback(model_name):
    """ModelScope备用下载方案"""
    target_dir = '/mnt/output/' + model_name.replace('/', '_')
    os.makedirs(target_dir, exist_ok=True)
    
    print(f'📋 尝试获取模型信息: {model_name}')
    
    # 尝试从ModelScope API获取文件列表
    api_url = f'https://modelscope.cn/api/v1/models/{model_name}/repo'
    try:
        response = requests.get(api_url, timeout=30)
        if response.status_code == 200:
            data = response.json()
            print(f'📋 获取到模型信息: {data.get("name", "未知")}')
            print(f'📋 模型描述: {data.get("description", "无描述")}')
            
            # 尝试获取文件列表
            files_url = f'https://modelscope.cn/api/v1/models/{model_name}/repo/files'
            files_response = requests.get(files_url, timeout=30)
            if files_response.status_code == 200:
                files_data = files_response.json()
                print(f'📁 发现 {len(files_data.get("data", []))} 个文件')
                
                # 下载主要文件
                for file_info in files_data.get("data", [])[:5]:  # 限制下载前5个文件
                    file_name = file_info.get("name", "")
                    if file_name and not file_name.endswith('.md'):
                        file_url = f'https://modelscope.cn/api/v1/models/{model_name}/repo/files/{file_name}'
                        try:
                            file_response = requests.get(file_url, timeout=60)
                            if file_response.status_code == 200:
                                file_path = os.path.join(target_dir, file_name)
                                with open(file_path, 'wb') as f:
                                    f.write(file_response.content)
                                print(f'✅ 下载文件: {file_name}')
                        except Exception as e:
                            print(f'⚠️ 下载文件失败 {file_name}: {e}')
            else:
                print(f'⚠️ 获取文件列表失败: {files_response.status_code}')
        else:
            print(f'⚠️ API请求失败: {response.status_code}')
            print(f'💡 模型可能不存在或需要认证，请检查URL是否正确')
            sys.exit(1)  # API请求失败时退出任务
    except Exception as e:
        print(f'⚠️ 备用下载方案失败: {e}')
        sys.exit(1)  # 备用方案失败时退出任务

urls = '''${importUrl}'''.strip().split('\\n')
for url in urls:
    if url.strip():
        print(f'📥 正在下载: {url.strip()}')
        try:
            download_modelscope_item(url.strip())
        except Exception as e:
            print(f'❌ 下载失败 {url}: {e}')
            print(f'💡 建议检查: 1) 网络连接 2) 模型/数据集是否存在 3) 是否需要认证')
            sys.exit(1)  # 下载失败时退出任务
" \
        && END_TIME=$(date +%s) \
        && DIFF=$((END_TIME - START_TIME)) \
        && echo "✅ ModelScope数据下载完成！耗时: \${DIFF}秒"`;

    case '数据集':
      return `echo "🚀 开始从选中数据集复制数据到当前数据集..." \
        && START_TIME=$(date +%s) \
        && echo "📋 源数据集路径: /mnt/source" \
        && echo "📋 目标数据集路径: /mnt/output" \
        && echo "🔍 检查源数据集内容..." \
        && ls -la /mnt/source/ \
        && echo "📁 开始复制数据..." \
        && cp -r /mnt/source/* /mnt/output/ 2>/dev/null || cp -r /mnt/source/. /mnt/output/ 2>/dev/null || echo "⚠️ 复制过程中遇到一些文件，继续处理..." \
        && echo "🔍 检查复制结果..." \
        && ls -la /mnt/output/ \
        && echo "📊 统计复制结果..." \
        && echo "源数据集文件数量: \$(find /mnt/source -type f | wc -l)" \
        && echo "目标数据集文件数量: \$(find /mnt/output -type f | wc -l)" \
        && echo "源数据集总大小: \$(du -sh /mnt/source | cut -f1)" \
        && echo "目标数据集总大小: \$(du -sh /mnt/output | cut -f1)" \
        && END_TIME=$(date +%s) \
        && DIFF=$((END_TIME - START_TIME)) \
        && echo "✅ 数据集复制完成！耗时: \${DIFF}秒"`;

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
    const importCommand = generateImportCommand(config.importType, config.importUrl, config.accessToken);

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
