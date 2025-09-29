import React, { useState } from 'react';

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
}

const DataDownloadInput: React.FC<DataDownloadInputProps> = ({ onParseUrl }) => {
  const [url, setUrl] = useState('');
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
    console.log('🚀 开始填充页面表单...');
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
    <div style={{ 
      padding: '12px',
      background: '#ffffff',
      borderRadius: '6px',
      border: '1px solid #e8e8e8'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '16px', 
          color: '#333333',
          fontWeight: 500
        }}>
          🤗 HuggingFace自动填充
        </h3>
        <p style={{ 
          margin: 0, 
          fontSize: '12px', 
          color: '#666666' 
        }}>
          输入HuggingFace数据集或模型地址，自动解析并填充页面表单
        </p>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <div style={{ marginBottom: '8px' }}>
          <label htmlFor="dataset-url" style={{ 
            display: 'block', 
            fontSize: '12px', 
            color: '#333333',
            marginBottom: '4px',
            fontWeight: 500
          }}>
            数据集/模型地址
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              id="dataset-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="请输入HuggingFace地址，如：https://huggingface.co/datasets/..."
              style={{
                flex: 1,
                padding: '8px 12px',
                border: `1px solid ${error ? '#ff4d4f' : '#d9d9d9'}`,
                borderRadius: '4px',
                fontSize: '12px',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              disabled={isLoading}
              onFocus={(e) => e.target.style.borderColor = '#1890ff'}
              onBlur={(e) => e.target.style.borderColor = error ? '#ff4d4f' : '#d9d9d9'}
            />
            <button
              onClick={handleParseUrl}
              disabled={isLoading || !url.trim()}
              style={{
                padding: '8px 16px',
                background: isLoading || !url.trim() ? '#f5f5f5' : '#1890ff',
                color: isLoading || !url.trim() ? '#bfbfbf' : 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: isLoading || !url.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {isLoading ? (
                <>
                  <span style={{ 
                    width: '12px', 
                    height: '12px', 
                    border: '2px solid #fff', 
                    borderLeftColor: 'transparent', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite' 
                  }}></span>
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
            <div style={{ 
              marginTop: '4px', 
              fontSize: '11px', 
              color: '#ff4d4f' 
            }}>
              ❌ {error}
            </div>
          )}
          {url.trim() && !error && !isLoading && (
            <div style={{ 
              marginTop: '4px', 
              fontSize: '11px', 
              color: '#1890ff' 
            }}>
              💡 按Enter键或点击按钮开始解析
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ 
          margin: '0 0 12px 0', 
          fontSize: '14px', 
          color: '#333333',
          fontWeight: 500
        }}>
          📋 示例地址
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setUrl('https://huggingface.co/datasets/nvidia/PhysicalAI-SmartSpaces')}
            disabled={isLoading}
            style={{
              padding: '10px',
              background: '#f8f9fa',
              border: '1px solid #e8e8e8',
              borderRadius: '4px',
              textAlign: 'left',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              width: '100%'
            }}
            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.borderColor = '#1890ff')}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e8e8e8'}
          >
            <span style={{ 
              display: 'inline-block', 
              width: '20px', 
              height: '20px', 
              background: '#1890ff', 
              borderRadius: '4px', 
              textAlign: 'center', 
              lineHeight: '20px', 
              color: 'white', 
              fontSize: '10px',
              marginRight: '6px'
            }}>
              📄
            </span>
            <div style={{ display: 'inline-block' }}>
              <div style={{ 
                fontSize: '11px', 
                color: '#333333',
                fontWeight: 500,
                marginBottom: '2px'
              }}>
                nvidia/PhysicalAI-SmartSpaces
              </div>
              <div style={{ 
                fontSize: '10px', 
                color: '#666666' 
              }}>
                数据集示例
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setUrl('https://huggingface.co/datasets/openai/gdpval')}
            disabled={isLoading}
            style={{
              padding: '10px',
              background: '#f8f9fa',
              border: '1px solid #e8e8e8',
              borderRadius: '4px',
              textAlign: 'left',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              width: '100%'
            }}
            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.borderColor = '#1890ff')}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e8e8e8'}
          >
            <span style={{ 
              display: 'inline-block', 
              width: '20px', 
              height: '20px', 
              background: '#1890ff', 
              borderRadius: '4px', 
              textAlign: 'center', 
              lineHeight: '20px', 
              color: 'white', 
              fontSize: '10px',
              marginRight: '6px'
            }}>
              📄
            </span>
            <div style={{ display: 'inline-block' }}>
              <div style={{ 
                fontSize: '11px', 
                color: '#333333',
                fontWeight: 500,
                marginBottom: '2px'
              }}>
                openai/gdpval
              </div>
              <div style={{ 
                fontSize: '10px', 
                color: '#666666' 
              }}>
                数据集示例
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setUrl('https://huggingface.co/Alibaba-NLP/Tongyi-DeepResearch-30B-A3B')}
            disabled={isLoading}
            style={{
              padding: '10px',
              background: '#f8f9fa',
              border: '1px solid #e8e8e8',
              borderRadius: '4px',
              textAlign: 'left',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              width: '100%',
              gridColumn: 'span 2'
            }}
            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.borderColor = '#1890ff')}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e8e8e8'}
          >
            <span style={{ 
              display: 'inline-block', 
              width: '20px', 
              height: '20px', 
              background: '#722ed1', 
              borderRadius: '4px', 
              textAlign: 'center', 
              lineHeight: '20px', 
              color: 'white', 
              fontSize: '10px',
              marginRight: '6px'
            }}>
              🤖
            </span>
            <div style={{ display: 'inline-block' }}>
              <div style={{ 
                fontSize: '11px', 
                color: '#333333',
                fontWeight: 500,
                marginBottom: '2px'
              }}>
                Alibaba-NLP/Tongyi-DeepResearch-30B-A3B
              </div>
              <div style={{ 
                fontSize: '10px', 
                color: '#666666' 
              }}>
                模型示例
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 解析结果显示区域 */}
      {parsedResult && (
        <div style={{ 
          padding: '12px', 
          background: '#f8f9fa', 
          borderRadius: '4px', 
          border: '1px solid #e8e8e8' 
        }}>
          <h4 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '14px', 
            color: '#333333',
            fontWeight: 500
          }}>
            📋 解析结果
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '10px',
            fontSize: '12px'
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                color: '#666666', 
                marginBottom: '4px' 
              }}>
                创建内容
              </label>
              <div style={{ 
                padding: '6px 8px', 
                background: parsedResult.type === 'DATASET' ? '#f6ffed' : '#f9f0ff', 
                borderRadius: '4px', 
                border: `1px solid ${parsedResult.type === 'DATASET' ? '#b7eb8f' : '#d3adf7'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ 
                  width: '16px', 
                  height: '16px', 
                  background: parsedResult.type === 'DATASET' ? '#52c41a' : '#722ed1', 
                  borderRadius: '2px', 
                  textAlign: 'center', 
                  lineHeight: '16px', 
                  color: 'white', 
                  fontSize: '10px'
                }}>
                  {parsedResult.type === 'DATASET' ? '📄' : '🤖'}
                </span>
                <span style={{ color: '#333333' }}>
                  {parsedResult.type === 'DATASET' ? '数据集' : '模型'}
                </span>
              </div>
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                color: '#666666', 
                marginBottom: '4px' 
              }}>
                {parsedResult.type === 'DATASET' ? '数据集名称' : '模型名称'}
              </label>
              <div style={{ 
                padding: '6px 8px', 
                background: 'white', 
                borderRadius: '4px', 
                border: '1px solid #e8e8e8',
                color: '#333333',
                wordBreak: 'break-all'
              }}>
                {parsedResult.fullName}
              </div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ 
                display: 'block', 
                color: '#666666', 
                marginBottom: '4px' 
              }}>
                子路径名称
              </label>
              <div style={{ 
                padding: '6px 8px', 
                background: 'white', 
                borderRadius: '4px', 
                border: '1px solid #e8e8e8',
                color: '#333333',
                wordBreak: 'break-all'
              }}>
                {parsedResult.storagePath}
              </div>
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                color: '#666666', 
                marginBottom: '4px' 
              }}>
                {parsedResult.type === 'DATASET' ? '开源数据集' : '开源模型'}
              </label>
              <div style={{ 
                padding: '6px 8px', 
                background: 'white', 
                borderRadius: '4px', 
                border: '1px solid #e8e8e8',
                color: '#333333',
                wordBreak: 'break-all'
              }}>
                {parsedResult.fullName}
              </div>
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                color: '#666666', 
                marginBottom: '4px' 
              }}>
                原始地址
              </label>
              <div style={{ 
                padding: '6px 8px', 
                background: 'white', 
                borderRadius: '4px', 
                border: '1px solid #e8e8e8'
              }}>
                <a 
                  href={url.trim()} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#1890ff', 
                    textDecoration: 'none',
                    fontSize: '11px',
                    wordBreak: 'break-all'
                  }}
                >
                  {url.trim()}
                </a>
              </div>
            </div>
          </div>
          <div style={{ 
            marginTop: '12px',
            padding: '8px', 
            background: '#f6ffed', 
            borderRadius: '4px', 
            border: '1px solid #b7eb8f',
            fontSize: '12px',
            color: '#52c41a',
            textAlign: 'center'
          }}>
            ✅ 以上信息已自动填充到页面表单中
          </div>
        </div>
      )}
      
      {/* 添加旋转动画样式 */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DataDownloadInput;
