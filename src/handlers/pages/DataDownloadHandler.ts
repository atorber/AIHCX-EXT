import { BaseHandler } from '../BaseHandler';
import { TaskParams } from '../../types';

/**
 * 数据下载页面处理器
 * 处理 /dataDownload/create 和 /dataDownload/info 页面的数据
 */
export class DataDownloadHandler extends BaseHandler {
  async handle(_pageName: string, params: Record<string, string>): Promise<Partial<TaskParams>> {
    // 从URL参数中提取数据集信息
    const datasetId = params.datasetId || '';
    const category = params.category || 'DATASET';
    const hfUrl = params.hf || ''; // 提取HuggingFace URL参数
    
    console.log('[DataDownloadHandler] 处理数据下载页面:', { pageName: _pageName, params });
    
    // 检查是否为数据转储页面（/dataDownload/info）
    if (_pageName === '数据下载任务详情') {
      // 获取数据下载任务详情以获取任务名称和存储路径
      let taskName = '';
      let datasetStoragePath = '';
      try {
        const response = await fetch(`https://console.bce.baidu.com/api/aihc/data/v1/dataset/${datasetId}?locale=zh-cn&_=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.result) {
            taskName = data.result.datasetName || '';
            datasetStoragePath = data.result.datasetStoragePath || '';
            console.log('[DataDownloadHandler] 获取到任务信息:', { taskName, datasetStoragePath });
          }
        }
      } catch (error) {
        console.error('[DataDownloadHandler] 获取任务详情失败:', error);
      }
      
      return {
        // 不显示任何Tab，只显示数据转储表单
        cliItems: [],
        apiDocs: [],
        jsonItems: [],
        yamlItems: [],
        commandScript: '',
        // 标记为数据转储页面，需要特殊处理
        isDataDumpPage: true,
        datasetId,
        category,
        name: taskName,
        datasetStoragePath: datasetStoragePath
      };
    }
    
    // 检查是否为创建数据下载任务页面且有HuggingFace URL参数
    if (_pageName === '创建数据下载任务' && hfUrl) {
      console.log('[DataDownloadHandler] 检测到HuggingFace URL参数:', hfUrl);
      
      // 解析HuggingFace URL获取数据集信息
      const datasetInfo = this.parseHuggingFaceUrl(hfUrl);
      
      return {
        // 不显示任何Tab，只显示输入框
        cliItems: [],
        apiDocs: [],
        jsonItems: [],
        yamlItems: [],
        commandScript: '',
        // 标记为数据下载页面，需要特殊处理
        isDataDownloadPage: true,
        // 添加HuggingFace相关信息用于自动填充
        huggingFaceUrl: hfUrl,
        huggingFaceDataset: datasetInfo || undefined,
        datasetName: datasetInfo?.fullName || '',
        datasetDescription: datasetInfo?.description || ''
      };
    }
    
    // 原有的数据下载页面逻辑
    return {
      // 不显示任何Tab，只显示输入框
      cliItems: [],
      apiDocs: [],
      jsonItems: [],
      yamlItems: [],
      commandScript: '',
      // 标记为数据下载页面，需要特殊处理
      isDataDownloadPage: true
    };
  }

  /**
   * 解析Hugging Face URL，提取数据集信息
   */
  private parseHuggingFaceUrl(url: string): {
    organization: string;
    name: string;
    fullName: string;
    description?: string;
    license?: string;
    tags?: string[];
  } | null {
    try {
      // 匹配Hugging Face数据集URL格式
      // https://huggingface.co/datasets/organization/dataset-name
      const urlPattern = /^https:\/\/huggingface\.co\/datasets\/([^/]+)\/([^/?#]+)/;
      const match = url.match(urlPattern);
      
      if (!match) {
        return null;
      }
      
      const organization = match[1];
      const name = match[2];
      const fullName = `${organization}/${name}`;
      
      return {
        organization,
        name,
        fullName,
        description: undefined,
        license: undefined,
        tags: []
      };
    } catch (error) {
      console.error('[DataDownloadHandler] URL解析失败:', error);
      return null;
    }
  }
}
