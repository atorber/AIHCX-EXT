import { BaseHandler } from '../BaseHandler';
import { TaskParams } from '../../types';

/**
 * 创建任务页面处理器
 * 处理 /task/create 和 /task/copy 页面的数据
 */
export class CreateTaskHandler extends BaseHandler {
  async handle(_pageName: string, _params: Record<string, string>): Promise<Partial<TaskParams>> {
    // 检查localStorage中是否有数据转储配置
    const savedConfig = localStorage.getItem('aihc_data_dump_config');
    const savedTemplate = localStorage.getItem('aihc_data_dump_template');
    
    if (savedConfig && savedTemplate) {
      // 如果有保存的数据转储配置，显示数据转储表单
      try {
        const config = JSON.parse(savedConfig);
        return {
          // 不显示任何Tab，只显示数据转储表单
          cliItems: [],
          apiDocs: [],
          jsonItems: [],
          yamlItems: [],
          commandScript: '',
          // 标记为数据转储页面，需要特殊处理
          isDataDumpPage: true,
          datasetId: config.datasetId || '',
          category: config.datasetCategory || 'DATASET'
        };
      } catch (error) {
        console.error('解析保存的数据转储配置失败:', error);
      }
    }
    
    // 如果没有保存的配置，返回空的TaskParams
    return {
      cliItems: [],
      apiDocs: [],
      jsonItems: [],
      yamlItems: [],
      commandScript: '',
      isDataDumpPage: false
    };
  }
}
