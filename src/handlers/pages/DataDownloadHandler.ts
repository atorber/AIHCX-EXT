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
    
    // 检查是否为数据转储页面（/dataDownload/info）
    if (_pageName === '数据下载任务详情') {
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
        category
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
}
