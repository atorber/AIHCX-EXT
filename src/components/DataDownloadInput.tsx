import React, { useState } from 'react';
import { DatabaseOutlined } from '@ant-design/icons';

interface DataDownloadInputProps {
  onParseUrl?: (parsedData: {
    type: 'DATASET' | 'MODEL';
    fullName: string;
    storagePath: string;
    organization: string;
    name: string;
    displayName: string;
    // 数据集特有字段
    datasetName?: string;
    openSourceDataset?: string;
    // 模型特有字段
    modelName?: string;
    openSourceModel?: string;
  }) => void;
  initialUrl?: string; // 初始URL，用于自动填充
}

const DataDownloadInput: React.FC<DataDownloadInputProps> = ({ onParseUrl, initialUrl }) => {
  const [url, setUrl] = useState(initialUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsedResult, setParsedResult] = useState<{
    type: 'DATASET' | 'MODEL';
    fullName: string;
    storagePath: string;
    organization: string;
    name: string;
    displayName: string;
    // 数据集特有字段
    datasetName?: string;
    openSourceDataset?: string;
    // 模型特有字段
    modelName?: string;
    openSourceModel?: string;
  } | null>(null);

  // 当有初始URL时，自动解析
  React.useEffect(() => {
    if (initialUrl && initialUrl.trim()) {
      console.log('[DataDownloadInput] 检测到初始URL，自动解析:', initialUrl);
      setUrl(initialUrl);
      // 延迟执行解析，确保组件完全挂载
      setTimeout(() => {
        handleParseUrl();
      }, 100);
    }
  }, [initialUrl]);

  // 解析HuggingFace URL（支持数据集和模型）
  const parseHuggingFaceUrl = (url: string) => {
    // 移除末尾的斜杠和空格
    const cleanUrl = url.trim().replace(/\/$/, '');
    
    // 检查是否为有效的HuggingFace URL
    const urlPattern = /^https:\/\/huggingface\.co\/(datasets\/)?([^/]+)\/([^/?#]+)/;
    const match = cleanUrl.match(urlPattern);
    
    if (!match) {
      throw new Error('无效的HuggingFace地址格式。请确保地址格式为：https://huggingface.co/datasets/organization/name 或 https://huggingface.co/organization/name');
    }
    
    const isDataset = !!match[1]; // 如果有 'datasets/' 前缀，则为数据集
    const organization = match[2];
    const name = match[3];
    const fullName = `${organization}/${name}`;
    
    if (isDataset) {
      // 数据集URL: https://huggingface.co/datasets/organization/dataset-name
      return {
        type: 'DATASET' as const,
        organization,
        name,
        fullName,
        storagePath: `huggingface.co/datasets/${fullName}`,
        displayName: fullName,
        // 数据集特有字段
        datasetName: fullName,
        openSourceDataset: fullName
      };
    } else {
      // 模型URL: https://huggingface.co/organization/model-name
      return {
        type: 'MODEL' as const,
        organization,
        name,
        fullName,
        storagePath: `huggingface.co/${fullName}`,
        displayName: fullName,
        // 模型特有字段
        modelName: fullName,
        openSourceModel: fullName
      };
    }
  };

  const handleParseUrl = async () => {
    if (!url.trim()) {
      setError('请输入HuggingFace地址');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const parsed = parseHuggingFaceUrl(url.trim());
      console.log('✅ URL解析成功:', parsed);
      
      // 保存解析结果用于显示
      setParsedResult(parsed);
      
      // 自动填充页面表单
      await fillPageForm(parsed);
      
      // 通知父组件解析成功
      if (onParseUrl) {
        onParseUrl(parsed);
      }
      
      // 显示成功消息
      setError(''); // 清除之前的错误
      console.log('🎉 信息已自动填充完成:', parsed);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '解析失败';
      setError(errorMessage);
      setParsedResult(null); // 清除解析结果
      console.error('❌ 自动填充失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fillPageForm = async (parsed: {
    type: 'DATASET' | 'MODEL';
    fullName: string;
    storagePath: string;
    organization: string;
    name: string;
    displayName: string;
    datasetName?: string;
    openSourceDataset?: string;
    modelName?: string;
    openSourceModel?: string;
  }) => {
    // 开始填充页面表单
    console.log('解析结果:', parsed);
    console.log('原始URL:', url.trim());
    
    // 直接使用chrome.tabs.sendMessage方式，跳过background script
    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        throw new Error('无法获取当前活动标签页');
      }
      
      console.log('📤 直接向content script发送消息...', tab.url);
      
      // 直接发送消息给content script
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'FILL_FORM',
        data: {
          type: parsed.type, // 修正字段名为'type'
          // 根据类型传递不同的字段
          ...(parsed.type === 'DATASET' ? {
            datasetName: parsed.datasetName || parsed.fullName,
            openSourceDataset: parsed.openSourceDataset || parsed.fullName
          } : {
            modelName: parsed.modelName || parsed.fullName,
            openSourceModel: parsed.openSourceModel || parsed.fullName
          }),
          storagePath: parsed.storagePath,
          openSourceUrl: url.trim()
        }
      });
      
      console.log('📥 收到content script响应:', response);
      
      if (response && response.success) {
        console.log('✅ 页面表单填充成功:', response);
        setParsedResult(parsed);
      } else {
        console.error('❌ 页面表单填充失败:', response);
        setError(`填充失败：${response?.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('❌ 发送填充消息失败:', error);
      
      // 提供手动填充指导
      const instructions = [
        '自动填充失败，请手动在浏览器控制台中执行以下代码：',
        '',
        `// 设置内容类型为 ${parsed.type === 'DATASET' ? '数据集' : '模型'}`,
        'const radioGroup = document.querySelector(\'.ant-radio-group\')',
        'if(radioGroup) {',
        `  const targetRadio = radioGroup.querySelector(\'input[value="${parsed.type}"]\')`,,
        '  if(targetRadio) {',
        '    targetRadio.checked = true;',
        '    targetRadio.dispatchEvent(new Event("change", {bubbles: true}));',
        '  }',
        '}',
        '',
        parsed.type === 'DATASET' ? '// 填充数据集名称' : '// 填充模型名称',
        `const nameInput = document.querySelector(\'input[placeholder="请输入${parsed.type === 'DATASET' ? '数据集' : '模型'}名称"]\')`,,
        'if(nameInput) {',
        '  nameInput.value = "' + parsed.fullName + '";',
        '  nameInput.dispatchEvent(new Event("input", {bubbles: true}));',
        '}',
        '',
        '// 填充存储子路径',
        'const pathInput = document.querySelector(\'input[placeholder="请输入子路径名称"]\')',
        'if(pathInput) {',
        '  pathInput.value = "' + parsed.storagePath + '";',
        '  pathInput.dispatchEvent(new Event("input", {bubbles: true}));',
        '}',
        '',
        `// 填充开源${parsed.type === 'DATASET' ? '数据集' : '模型'}`,
        `const sourceInput = document.querySelector(\'input[placeholder="请输入开源${parsed.type === 'DATASET' ? '数据集' : '模型'}"]\')`,,
        'if(sourceInput) {',
        '  sourceInput.value = "' + parsed.fullName + '";',
        '  sourceInput.dispatchEvent(new Event("input", {bubbles: true}));',
        '}'
      ].join('\n');
      
      setError('自动填充失败，请在控制台手动执行填充代码');
      
      // 复制指令到剪贴板
      try {
        await navigator.clipboard.writeText(instructions);
        console.log('📋 手动填充指令已复制到剪贴板');
      } catch {
        console.log('📋 手动填充指令:', instructions);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleParseUrl();
    }
  };

  return (
    <div style={{ padding: '8px' }}>
      {/* 表单标题 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '12px',
        padding: '8px 0',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <DatabaseOutlined style={{ color: '#1890ff', marginRight: '6px' }} />
        <span style={{ fontSize: '13px', fontWeight: 600 }}>🤗 HuggingFace自动填充</span>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>数据集/模型地址</div>
        <div style={{ marginBottom: '8px' }}>
          <textarea
            id="dataset-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="请输入HuggingFace地址，如：https://huggingface.co/datasets/...&#10;支持多行输入，每行一个地址"
            disabled={isLoading}
            rows={3}
            style={{
              width: '100%',
              padding: '6px 8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#495057',
              background: '#fff',
              transition: 'all 0.3s ease',
              boxSizing: 'border-box',
              resize: 'vertical',
              minHeight: '60px',
              fontFamily: 'inherit'
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleParseUrl}
            disabled={isLoading || !url.trim()}
            title={isLoading ? '解析中...' : !url.trim() ? '请输入地址' : '点击解析并填充表单'}
            style={{
              padding: '6px 12px',
              border: '1px solid #1890ff',
              borderRadius: '4px',
              fontSize: '11px',
              color: isLoading || !url.trim() ? '#999' : '#1890ff',
              background: isLoading || !url.trim() ? '#f5f5f5' : '#fff',
              cursor: isLoading || !url.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {isLoading ? (
              <>
                <span>⏳</span>
                解析中...
              </>
            ) : (
              <>
                <span>🚀</span>
                解析填充
              </>
            )}
          </button>
        </div>
        {error && (
          <div style={{ fontSize: '10px', color: '#ff4d4f', marginTop: '4px' }}>
            ❌ {error}
          </div>
        )}
        {url.trim() && !error && !isLoading && (
          <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
            💡 按Enter键或点击按钮开始解析
          </div>
        )}
      </div>

      <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>📋 示例地址</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setUrl('https://huggingface.co/datasets/nvidia/PhysicalAI-SmartSpaces')}
            disabled={isLoading}
            style={{
              padding: '6px 8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              fontSize: '10px',
              color: '#666',
              background: '#fafafa',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📄</span>
            <div>
              <div style={{ fontWeight: 500 }}>nvidia/PhysicalAI-SmartSpaces</div>
              <div style={{ fontSize: '9px', color: '#999' }}>数据集示例</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setUrl('https://huggingface.co/datasets/openai/gdpval')}
            disabled={isLoading}
            style={{
              padding: '6px 8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              fontSize: '10px',
              color: '#666',
              background: '#fafafa',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📄</span>
            <div>
              <div style={{ fontWeight: 500 }}>openai/gdpval</div>
              <div style={{ fontSize: '9px', color: '#999' }}>数据集示例</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setUrl('https://huggingface.co/Alibaba-NLP/Tongyi-DeepResearch-30B-A3B')}
            disabled={isLoading}
            style={{
              padding: '6px 8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              fontSize: '10px',
              color: '#666',
              background: '#fafafa',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🤖</span>
            <div>
              <div style={{ fontWeight: 500 }}>Alibaba-NLP/Tongyi-DeepResearch-30B-A3B</div>
              <div style={{ fontSize: '9px', color: '#999' }}>模型示例</div>
            </div>
          </button>
        </div>
      </div>

      {/* 解析结果显示区域 */}
      {parsedResult && (
        <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>📋 解析结果</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#666' }}>创建内容</span>
              <div style={{ fontSize: '10px', color: '#1890ff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{parsedResult.type === 'DATASET' ? '📄' : '🤖'}</span>
                {parsedResult.type === 'DATASET' ? '数据集' : '模型'}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#666' }}>{parsedResult.type === 'DATASET' ? '数据集名称' : '模型名称'}</span>
              <span style={{ fontSize: '10px', color: '#333', fontWeight: 500 }}>{parsedResult.fullName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#666' }}>子路径名称</span>
              <span style={{ fontSize: '10px', color: '#333' }}>{parsedResult.storagePath}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#666' }}>{parsedResult.type === 'DATASET' ? '开源数据集' : '开源模型'}</span>
              <span style={{ fontSize: '10px', color: '#333' }}>{parsedResult.fullName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#666' }}>原始地址</span>
              <a href={url.trim()} target="_blank" rel="noopener noreferrer" style={{ fontSize: '10px', color: '#1890ff', textDecoration: 'none' }}>
                {url.trim().length > 30 ? url.trim().substring(0, 30) + '...' : url.trim()}
              </a>
            </div>
          </div>
          <div style={{ fontSize: '10px', color: '#52c41a', marginTop: '8px', padding: '4px 8px', background: '#f6ffed', borderRadius: '4px', border: '1px solid #b7eb8f' }}>
            ✅ 以上信息已自动填充到页面表单中
          </div>
        </div>
      )}
    </div>
  );
};

export default DataDownloadInput;
