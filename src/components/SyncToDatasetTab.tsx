import React, { useState, useEffect } from 'react';
import { Form, Select, Input, Button, message, Alert } from 'antd';
import { SendOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
// 移除不需要的导入

const { Option } = Select;
const { TextArea } = Input;

interface CreateDatasetTabProps {
  datasetId: string;
  taskName?: string;
  onSubmit?: (config: any) => Promise<void>;
}

const CreateDatasetTab: React.FC<CreateDatasetTabProps> = ({ datasetId, taskName, onSubmit }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // 移除不需要的状态
  
  // 表单配置
  const [config, setConfig] = useState({
    datasetName: '',
    datasetDescription: '',
    storageType: 'BOS' as 'PFS' | 'BOS',
    storageInstance: '',
    importFormat: 'FOLDER' as 'FILE' | 'FOLDER',
    // initVersionEntry 字段
    versionDescription: '',
    storagePath: '',
    mountPath: ''
  });

  // 当taskName变化时，更新表单的默认描述
  useEffect(() => {
    console.log('[CreateDatasetTab] taskName 变化:', taskName);
    if (taskName) {
      const defaultDescription = `由数据下载任务 ${taskName} 导入创建`;
      console.log('[CreateDatasetTab] 设置默认描述:', defaultDescription);
      form.setFieldsValue({
        datasetDescription: defaultDescription,
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
        datasetName: values.datasetName,
        datasetDescription: values.datasetDescription,
        storageType: values.storageType,
        storageInstance: values.storageInstance,
        importFormat: values.importFormat,
        // initVersionEntry 字段
        versionDescription: values.versionDescription,
        storagePath: values.storagePath,
        mountPath: values.mountPath
      };

      console.log('🚀 提交创建数据集任务:', createConfig);

      if (onSubmit) {
        await onSubmit(createConfig);
        message.success('创建数据集任务已创建成功');
      } else {
        throw new Error('未配置创建数据集处理函数');
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
      datasetName: '',
      datasetDescription: '',
      storageType: 'BOS',
      storageInstance: '',
      importFormat: 'FOLDER',
      versionDescription: '',
      storagePath: '',
      mountPath: ''
    });
    // 移除不需要的状态重置
  };

  return (
    <div style={{ padding: '8px' }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          datasetName: '',
          datasetDescription: taskName ? `由数据下载任务 ${taskName} 导入创建` : '',
          storageType: 'BOS',
          storageInstance: '',
          importFormat: 'FOLDER',
          versionDescription: taskName ? `由数据下载任务 ${taskName} 导入创建` : '',
          storagePath: '',
          mountPath: ''
        }}
        style={{ margin: 0 }}
      >
        {/* 数据集名称 */}
        <Form.Item 
          name="datasetName"
          rules={[{ required: true, message: '请输入数据集名称' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>数据集名称 <span style={{ color: '#ff4d4f' }}>*</span></span>}
        >
          <Input
            placeholder="请输入数据集名称"
            style={{ fontSize: '11px' }}
          />
        </Form.Item>

        {/* 数据集描述 */}
        <Form.Item 
          name="datasetDescription"
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>数据集描述</span>}
        >
          <TextArea
            placeholder="请输入数据集描述"
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

          {/* 存储路径 */}
          <Form.Item 
            name="storagePath"
            rules={[{ required: true, message: '请输入存储路径' }]}
            style={{ marginBottom: '8px' }}
            label={<span style={{ fontSize: '11px', color: '#666' }}>存储路径 <span style={{ color: '#ff4d4f' }}>*</span></span>}
            extra={<span style={{ fontSize: '10px', color: '#999' }}>数据在存储系统中的路径</span>}
          >
            <Input
              placeholder="请输入存储路径，如：/path/to/data"
              style={{ fontSize: '11px' }}
            />
          </Form.Item>

          {/* 挂载路径 */}
          <Form.Item 
            name="mountPath"
            rules={[{ required: true, message: '请输入挂载路径' }]}
            style={{ marginBottom: '0px' }}
            label={<span style={{ fontSize: '11px', color: '#666' }}>挂载路径 <span style={{ color: '#ff4d4f' }}>*</span></span>}
            extra={<span style={{ fontSize: '10px', color: '#999' }}>数据在容器中的挂载路径</span>}
          >
            <Input
              placeholder="请输入挂载路径，如：/mnt/datasets/name"
              style={{ fontSize: '11px' }}
            />
          </Form.Item>
        </div>

        {/* 存储类型 */}
        <Form.Item 
          name="storageType"
          rules={[{ required: true, message: '请选择存储类型' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>存储类型 <span style={{ color: '#ff4d4f' }}>*</span></span>}
        >
          <Select
            placeholder="请选择存储类型"
            value={config.storageType}
            suffixIcon={<SettingOutlined />}
            style={{ width: '100%', fontSize: '11px' }}
          >
            <Option value="PFS">PFS并行存储</Option>
            <Option value="BOS">BOS对象存储</Option>
          </Select>
        </Form.Item>

        {/* 存储实例 */}
        <Form.Item 
          name="storageInstance"
          rules={[{ required: true, message: '请输入存储实例ID' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>存储实例ID <span style={{ color: '#ff4d4f' }}>*</span></span>}
          extra={<span style={{ fontSize: '10px', color: '#999' }}>PFS实例ID或BOS存储桶名称</span>}
        >
          <Input
            placeholder="请输入存储实例ID"
            style={{ fontSize: '11px' }}
          />
        </Form.Item>

        {/* 导入格式 */}
        <Form.Item 
          name="importFormat"
          rules={[{ required: true, message: '请选择导入格式' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>导入格式 <span style={{ color: '#ff4d4f' }}>*</span></span>}
        >
          <Select
            placeholder="请选择导入格式"
            value={config.importFormat}
            style={{ width: '100%', fontSize: '11px' }}
          >
            <Option value="FILE">文件</Option>
            <Option value="FOLDER">文件夹</Option>
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
            提交创建任务
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

export default CreateDatasetTab;
