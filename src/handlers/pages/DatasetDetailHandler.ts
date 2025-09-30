import { BaseHandler } from '../BaseHandler';
import { TaskParams } from '../../types';

/**
 * 数据集详情页面处理器
 * 处理 /dataset/info? 页面的数据
 */
export class DatasetDetailHandler extends BaseHandler {
  async handle(_pageName: string, params: Record<string, string>): Promise<Partial<TaskParams>> {
    const datasetId = params.datasetId;
    
    // 通过API获取数据集详情，获取storageType字段
    let datasetType = '';
    try {
      // 调用数据集详情API获取storageType
      const apiUrl = `https://console.bce.baidu.com/api/aihc/asset/v1/datasets/${datasetId}?locale=zh-cn&_=${Date.now()}`;
      console.log('[DatasetDetailHandler] 请求数据集详情API:', apiUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
      
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        credentials: 'include'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[DatasetDetailHandler] API响应数据:', data);
        
        if (data.success && data.result && data.result.storageType) {
          datasetType = data.result.storageType;
          console.log('[DatasetDetailHandler] 获取到数据集类型:', datasetType);
        } else {
          console.warn('[DatasetDetailHandler] API响应中缺少storageType字段');
          datasetType = 'BOS'; // 默认假设为BOS类型
        }
      } else {
        console.warn('[DatasetDetailHandler] API请求失败:', response.status);
        datasetType = 'BOS'; // 默认假设为BOS类型
      }
    } catch (error) {
      console.warn('[DatasetDetailHandler] 获取数据集类型失败:', error);
      datasetType = 'BOS'; // 默认假设为BOS类型
    }

    return {
      datasetId: datasetId,
      datasetType: datasetType,
      cliItems: [],
      apiDocs: [
        {
          title: '获取数据集详情',
          text: 'https://cloud.baidu.com/doc/AIHC/s/Dmc09bpj1',
          requestExample: this.generateRequestExample('GET', 'DescribeDataset', { datasetId })
        }
      ]
    };
  }
}
