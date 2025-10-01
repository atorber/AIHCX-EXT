import { BaseHandler } from '../BaseHandler';
import { TaskParams } from '../../types';

/**
 * Hugging Face数据集页面处理器
 * 处理 https://huggingface.co/datasets/ 页面的数据
 */
export class HuggingFaceHandler extends BaseHandler {
  async handle(_pageName: string, params: Record<string, string>): Promise<Partial<TaskParams>> {
    console.log('[HuggingFaceHandler] 🟢 开始处理Hugging Face页面');
    
    // 从参数中获取URL，如果没有则使用window.location.href
    const url = params.url || window.location.href;
    console.log('[HuggingFaceHandler] 当前URL:', url);
    console.log('[HuggingFaceHandler] 参数:', params);
    
    const datasetInfo = this.parseHuggingFaceUrl(url);
    
    if (!datasetInfo) {
      console.error('[HuggingFaceHandler] 无法解析Hugging Face URL:', url);
      return {
        cliItems: [],
        apiDocs: [],
        jsonItems: [],
        yamlItems: [],
        commandScript: ''
      };
    }

    console.log('[HuggingFaceHandler] 解析到数据集信息:', datasetInfo);

    const result = {
      // 标记为Hugging Face数据集页面
      isHuggingFaceDatasetPage: true,
      // 数据集信息
      datasetName: datasetInfo.fullName,
      datasetDescription: datasetInfo.description || '',
      datasetStoragePath: `bos:/aihc-datasets/huggingface.co/datasets/${datasetInfo.fullName}`,
      // 不显示任何Tab，只显示数据集下载功能
      cliItems: [],
      apiDocs: [],
      jsonItems: [],
      yamlItems: [],
      commandScript: '',
      // 数据集详细信息
      huggingFaceDataset: datasetInfo,
      // 添加HuggingFace URL用于跳转
      huggingFaceUrl: url
    };
    
    console.log('[HuggingFaceHandler] ✅ 返回处理结果:', result);
    return result;
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
      
      // 尝试从页面DOM中提取更多信息
      const description = this.extractDatasetDescription();
      const license = this.extractDatasetLicense();
      const tags = this.extractDatasetTags();
      
      return {
        organization,
        name,
        fullName,
        description,
        license,
        tags
      };
    } catch (error) {
      console.error('[HuggingFaceHandler] URL解析失败:', error);
      return null;
    }
  }

  /**
   * 从页面DOM中提取数据集描述
   */
  private extractDatasetDescription(): string | undefined {
    try {
      // 尝试多种选择器来获取描述
      const selectors = [
        'h1 + p', // 标题后的第一个段落
        '[data-testid="dataset-description"] p', // 数据集描述区域
        '.prose p', // 通用内容段落
        'main p', // 主要内容区域的段落
        'div[class*="prose"] p', // 包含prose的div中的段落
        'section p' // section中的段落
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent && element.textContent.trim().length > 10) {
          const text = element.textContent.trim();
          // 过滤掉太短或看起来不像描述的文本
          if (text.length > 20 && !text.includes('Download') && !text.includes('Loading')) {
            return text;
          }
        }
      }
      
      return undefined;
    } catch (error) {
      console.error('[HuggingFaceHandler] 提取描述失败:', error);
      return undefined;
    }
  }

  /**
   * 从页面DOM中提取许可证信息
   */
  private extractDatasetLicense(): string | undefined {
    try {
      // 查找许可证相关的元素
      const licenseSelectors = [
        'button[aria-label*="License"]',
        '[data-testid="license"]',
        'span:contains("License")',
        'div:contains("License")',
        'button:contains("License")'
      ];
      
      for (const selector of licenseSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          const text = element.textContent.trim();
          if (text.includes('License') && text.length < 50) {
            // 提取许可证名称
            const match = text.match(/License[:\s]*(.+)/i);
            if (match) {
              return match[1].trim();
            }
          }
        }
      }
      
      return undefined;
    } catch (error) {
      console.error('[HuggingFaceHandler] 提取许可证失败:', error);
      return undefined;
    }
  }

  /**
   * 从页面DOM中提取标签信息
   */
  private extractDatasetTags(): string[] {
    try {
      const tags: string[] = [];
      
      // 查找标签元素
      const tagSelectors = [
        '[data-testid="tag"]',
        '.tag',
        '.badge',
        'span[class*="tag"]',
        'div[class*="tag"]',
        'a[class*="tag"]'
      ];
      
      tagSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          const text = element.textContent?.trim();
          if (text && text.length > 0 && text.length < 50 && !text.includes(' ')) {
            // 避免重复添加
            if (!tags.includes(text)) {
              tags.push(text);
            }
          }
        });
      });
      
      // 限制标签数量，避免过多
      return tags.slice(0, 10);
    } catch (error) {
      console.error('[HuggingFaceHandler] 提取标签失败:', error);
      return [];
    }
  }
}
