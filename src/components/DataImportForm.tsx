import React, { useState } from 'react';
import { Form, Select, Input, Button, message, Alert } from 'antd';
import { CloudDownloadOutlined, SendOutlined, ReloadOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

interface DataImportFormProps {
  datasetId?: string;
  onSubmit?: (config: DataImportConfig) => Promise<void>;
}

interface DataImportConfig {
  importType: 'HuggingFace' | 'ModelScope' | '数据集';
  importUrl: string;
  datasetId?: string;
}

const DataImportForm: React.FC<DataImportFormProps> = ({ datasetId, onSubmit }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);
      setError('');
      setShowResult(false);

      const config: DataImportConfig = {
        importType: values.importType,
        importUrl: values.importUrl,
        datasetId: datasetId || ''
      };

      console.log('🚀 提交数据导入任务:', config);

      // 这里应该调用实际的导入API
      // 暂时模拟成功响应
      await new Promise(resolve => setTimeout(resolve, 2000));

      const result = {
        success: true,
        taskId: `import-${Date.now()}`,
        message: '数据导入任务已创建成功'
      };

      setImportResult(result);
      setShowResult(true);
      message.success('数据导入任务创建成功');

      // 通知父组件
      if (onSubmit) {
        await onSubmit(config);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '提交失败，请重试';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setError('');
    setShowResult(false);
    setImportResult(null);
  };

  const handleImportTypeChange = () => {
    // 清空导入地址字段
    form.setFieldsValue({
      importUrl: ''
    });
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
        <CloudDownloadOutlined style={{ color: '#1890ff', marginRight: '6px' }} />
        <span style={{ fontSize: '13px', fontWeight: 600 }}>📥 数据导入任务</span>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          importType: 'HuggingFace'
        }}
        style={{ margin: 0 }}
      >
        {/* 导入方式 */}
        <Form.Item 
          name="importType"
          rules={[{ required: true, message: '请选择导入方式' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>导入方式 <span style={{ color: '#ff4d4f' }}>*</span></span>}
        >
          <Select
            placeholder="请选择导入方式"
            onChange={handleImportTypeChange}
            style={{ width: '100%', fontSize: '11px' }}
          >
            <Option value="HuggingFace">🤗 HuggingFace</Option>
            <Option value="ModelScope">🏛️ ModelScope</Option>
            <Option value="数据集">📊 数据集</Option>
          </Select>
        </Form.Item>

        {/* 导入地址 */}
        <Form.Item 
          name="importUrl"
          rules={[{ required: true, message: '请输入导入地址' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>导入地址 <span style={{ color: '#ff4d4f' }}>*</span></span>}
          extra={<span style={{ fontSize: '10px', color: '#999' }}>支持多行输入，每行一个地址</span>}
        >
          <TextArea
            placeholder="请输入导入地址&#10;支持多行输入，每行一个地址"
            rows={3}
            style={{ fontSize: '11px', resize: 'vertical' }}
          />
        </Form.Item>

        {/* 错误提示 */}
        {error && (
          <Alert
            message="操作失败"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError('')}
            style={{ marginBottom: '8px', fontSize: '11px' }}
            closeIcon={
              <span style={{ 
                color: '#fff !important', 
                fontSize: '12px !important',
                fontWeight: 'bold !important',
                cursor: 'pointer !important',
                padding: '0 !important',
                margin: '0 !important',
                borderRadius: '2px !important',
                backgroundColor: 'rgba(255, 255, 255, 0.2) !important',
                border: 'none !important',
                outline: 'none !important',
                boxShadow: 'none !important',
                transition: 'background-color 0.2s',
                display: 'inline-flex !important',
                alignItems: 'center !important',
                justifyContent: 'center !important',
                minWidth: '16px !important',
                maxWidth: '16px !important',
                width: '16px !important',
                height: '16px !important',
                lineHeight: '1 !important',
                textAlign: 'center',
                verticalAlign: 'middle !important'
              }}>
                ×
              </span>
            }
          />
        )}

        {/* 导入结果提示 */}
        {showResult && importResult && (
          <Alert
            message={importResult.success ? '导入任务创建成功' : '导入任务创建失败'}
            description={
              importResult.success ? (
                <div>
                  <div style={{ fontSize: '11px' }}>任务ID: <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>{importResult.taskId}</span></div>
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>{importResult.message}</div>
                </div>
              ) : (
                <div style={{ fontSize: '11px' }}>{importResult.message}</div>
              )
            }
            type={importResult.success ? 'success' : 'error'}
            showIcon
            closable
            onClose={() => setShowResult(false)}
            style={{ marginBottom: '8px', fontSize: '11px' }}
            closeIcon={
              <span style={{ 
                color: '#fff !important', 
                fontSize: '12px !important',
                fontWeight: 'bold !important',
                cursor: 'pointer !important',
                padding: '0 !important',
                margin: '0 !important',
                borderRadius: '2px !important',
                backgroundColor: 'rgba(255, 255, 255, 0.2) !important',
                border: 'none !important',
                outline: 'none !important',
                boxShadow: 'none !important',
                transition: 'background-color 0.2s',
                display: 'inline-flex !important',
                alignItems: 'center !important',
                justifyContent: 'center !important',
                minWidth: '16px !important',
                maxWidth: '16px !important',
                width: '16px !important',
                height: '16px !important',
                lineHeight: '1 !important',
                textAlign: 'center',
                verticalAlign: 'middle !important'
              }}>
                ×
              </span>
            }
          />
        )}

        {/* 提交按钮 */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
          <Button
            type="primary"
            htmlType="submit"
            onClick={handleSubmit}
            loading={isSubmitting}
            icon={<SendOutlined />}
            style={{ fontSize: '11px', height: '28px', flex: 1 }}
          >
            提交导入任务
          </Button>
          
          <Button
            onClick={handleReset}
            icon={<ReloadOutlined />}
            style={{ fontSize: '11px', height: '28px', flex: 1 }}
          >
            重置
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default DataImportForm;
