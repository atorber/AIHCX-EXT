import React, { useState, useEffect } from 'react';
import { Form, Select, Input, Button, message, Alert } from 'antd';
import { SendOutlined, ReloadOutlined } from '@ant-design/icons';
// 移除不需要的导入

const { Option } = Select;
const { TextArea } = Input;

interface RegisterModelTabProps {
  datasetId: string;
  taskName?: string;
  onSubmit?: (config: any) => Promise<void>;
}

const RegisterModelTab: React.FC<RegisterModelTabProps> = ({ datasetId, taskName, onSubmit }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // 移除不需要的状态
  
  // 表单配置
  const [config, setConfig] = useState({
    modelName: '',
    modelDescription: '',
    modelFormat: 'HuggingFace',
    // initVersionEntry 字段
    versionDescription: '',
    storageBucket: '',
    storagePath: '',
    modelMetrics: ''
  });

  // 当taskName变化时，更新表单的默认值
  useEffect(() => {
    console.log('[RegisterModelTab] taskName 变化:', taskName);
    if (taskName) {
      // 处理模型名称：转换为小写，特殊字符替换为-
      const modelName = taskName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const defaultDescription = `由数据下载任务 ${taskName} 导入创建`;
      
      console.log('[RegisterModelTab] 设置默认值:', {
        modelName,
        defaultDescription
      });
      
      form.setFieldsValue({
        modelName: modelName,
        modelDescription: defaultDescription,
        versionDescription: defaultDescription
      });
    }
  }, [taskName, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);
      setError('');
      
      const createConfig = {
        sourceDatasetId: datasetId,
        modelName: values.modelName,
        modelDescription: values.modelDescription,
        modelFormat: values.modelFormat,
        // initVersionEntry 字段
        versionDescription: values.versionDescription,
        storageBucket: values.storageBucket,
        storagePath: values.storagePath,
        modelMetrics: values.modelMetrics
      };

      console.log('🚀 提交注册模型任务:', createConfig);

      if (onSubmit) {
        await onSubmit(createConfig);
        message.success('注册模型任务已创建成功');
      } else {
        throw new Error('未配置注册模型处理函数');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '提交失败';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setError('');
    setConfig({
      modelName: '',
      modelDescription: '',
      modelFormat: 'HuggingFace',
      versionDescription: '',
      storageBucket: '',
      storagePath: '',
      modelMetrics: ''
    });
    // 移除不需要的状态重置
  };

  return (
    <div style={{ padding: '8px' }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          modelName: '',
          modelDescription: taskName ? `由数据下载任务 ${taskName} 导入创建` : '',
          modelFormat: 'HuggingFace',
          versionDescription: taskName ? `由数据下载任务 ${taskName} 导入创建` : '',
          storageBucket: '',
          storagePath: '',
          modelMetrics: ''
        }}
        style={{ margin: 0 }}
      >
        {/* 模型名称 */}
        <Form.Item 
          name="modelName"
          rules={[{ required: true, message: '请输入模型名称' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>模型名称 <span style={{ color: '#ff4d4f' }}>*</span></span>}
        >
          <Input
            placeholder="请输入模型名称"
            style={{ fontSize: '11px' }}
          />
        </Form.Item>

        {/* 模型描述 */}
        <Form.Item 
          name="modelDescription"
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>模型描述</span>}
        >
          <TextArea
            placeholder="请输入模型描述"
            rows={2}
            style={{ fontSize: '11px', resize: 'vertical' }}
          />
        </Form.Item>


        {/* 版本信息 */}
        <div style={{ 
          marginBottom: '8px', 
          padding: '8px', 
          background: '#f8f9fa', 
          borderRadius: '4px',
          border: '1px solid #e8e8e8'
        }}>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: 'bold', 
            color: '#333', 
            marginBottom: '8px' 
          }}>
            初始版本信息
          </div>
          
          {/* 版本描述 */}
          <Form.Item 
            name="versionDescription"
            style={{ marginBottom: '8px' }}
            label={<span style={{ fontSize: '11px', color: '#666' }}>版本描述</span>}
          >
            <Input
              placeholder="请输入版本描述"
              style={{ fontSize: '11px' }}
            />
          </Form.Item>

          {/* 存储桶 */}
          <Form.Item 
            name="storageBucket"
            rules={[{ required: true, message: '请输入存储桶名称' }]}
            style={{ marginBottom: '8px' }}
            label={<span style={{ fontSize: '11px', color: '#666' }}>存储桶 <span style={{ color: '#ff4d4f' }}>*</span></span>}
            extra={<span style={{ fontSize: '10px', color: '#999' }}>模型文件存储的BOS桶名称</span>}
          >
            <Input
              placeholder="请输入存储桶名称"
              style={{ fontSize: '11px' }}
            />
          </Form.Item>

          {/* 存储路径 */}
          <Form.Item 
            name="storagePath"
            rules={[{ required: true, message: '请输入存储路径' }]}
            style={{ marginBottom: '8px' }}
            label={<span style={{ fontSize: '11px', color: '#666' }}>存储路径 <span style={{ color: '#ff4d4f' }}>*</span></span>}
            extra={<span style={{ fontSize: '10px', color: '#999' }}>模型在存储桶中的路径</span>}
          >
            <Input
              placeholder="请输入存储路径，如：/models/my-model"
              style={{ fontSize: '11px' }}
            />
          </Form.Item>

          {/* 模型指标 */}
          <Form.Item 
            name="modelMetrics"
            style={{ marginBottom: '0px' }}
            label={<span style={{ fontSize: '11px', color: '#666' }}>模型指标</span>}
            extra={<span style={{ fontSize: '10px', color: '#999' }}>JSON格式的模型性能指标（可选）</span>}
          >
            <TextArea
              placeholder='请输入JSON格式的模型指标，如：{"loss": 0.1, "accuracy": 0.95}'
              rows={2}
              style={{ fontSize: '11px', resize: 'vertical' }}
            />
          </Form.Item>
        </div>

        {/* 模型格式 */}
        <Form.Item 
          name="modelFormat"
          rules={[{ required: true, message: '请选择模型格式' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>模型格式 <span style={{ color: '#ff4d4f' }}>*</span></span>}
        >
          <Select
            placeholder="请选择模型格式"
            value={config.modelFormat}
            style={{ width: '100%', fontSize: '11px' }}
          >
            <Option value="HuggingFace">HuggingFace</Option>
            <Option value="MegatronCore">MegatronCore</Option>
            <Option value="ONNX">ONNX</Option>
            <Option value="TensorRT">TensorRT</Option>
          </Select>
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
          />
        )}

        {/* 提交按钮 */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          justifyContent: 'flex-end',
          marginTop: '12px'
        }}>
          <Button 
            type="primary" 
            onClick={handleSubmit}
            loading={isSubmitting}
            icon={<SendOutlined />}
            style={{ fontSize: '11px' }}
          >
            提交注册任务
          </Button>
          <Button 
            onClick={handleReset}
            icon={<ReloadOutlined />}
            style={{ fontSize: '11px' }}
          >
            重置
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default RegisterModelTab;
