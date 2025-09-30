import React, { useState, useEffect } from 'react';
import { Form, Select, Input, Button, message, Alert, Spin } from 'antd';
import { SendOutlined, ReloadOutlined } from '@ant-design/icons';
import { aihcApiService } from '../services/aihcApi';

const { Option } = Select;
const { TextArea } = Input;

interface DatasetRegisterModelFormProps {
  datasetId: string;
  datasetType?: string;
  datasetName?: string;
  storageInstance?: string;
  latestVersionEntry?: any;
  onSubmit?: (config: any) => Promise<void>;
}

// 移除RequestManager，简化组件

const DatasetRegisterModelForm: React.FC<DatasetRegisterModelFormProps> = ({ 
  datasetId, 
  datasetType, 
  datasetName, 
  storageInstance, 
  latestVersionEntry, 
  onSubmit 
}) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // 加载状态
  const [isLoadingDatasetVersions, setIsLoadingDatasetVersions] = useState(false);
  
  // 选项数据
  const [datasetVersions, setDatasetVersions] = useState<any[]>([]);
  const [selectedVersionInfo, setSelectedVersionInfo] = useState<any>(null);

  // 表单配置
  const [config, setConfig] = useState({
    datasetVersion: '',
    modelName: '',
    modelDescription: '',
    modelFormat: 'PyTorch',
    versionDescription: '',
    storageBucket: '',
    storagePath: '',
    modelMetrics: ''
  });

  // 获取数据集版本
  const fetchDatasetVersions = async () => {
    if (!datasetId) return;

    try {
      setIsLoadingDatasetVersions(true);
      const versions = await aihcApiService.getDatasetVersions(datasetId);
      
      setDatasetVersions(versions);
      
      // 自动选择第一个版本
      if (versions.length > 0) {
        const firstVersion = versions[0];
        setConfig(currentConfig => ({
          ...currentConfig,
          datasetVersion: firstVersion.versionId
        }));
        setSelectedVersionInfo(firstVersion);
        
        // 设置数据集版本，并触发自动填充
        form.setFieldsValue({
          datasetVersion: firstVersion.versionId
        });
        
        // 触发自动填充逻辑
        triggerAutoFill();
      }
    } catch (err: any) {
      console.error('获取数据集版本失败:', err);
      message.error('获取数据集版本失败');
    } finally {
      setIsLoadingDatasetVersions(false);
    }
  };

  // 自动填充逻辑函数
  const triggerAutoFill = () => {
    console.log('[DatasetRegisterModelForm] 触发自动填充:', {
      datasetName,
      storageInstance,
      latestVersionEntry
    });

    if (datasetName || storageInstance || latestVersionEntry) {
      // 模型名称直接使用数据集名称
      const modelName = datasetName || '';
      const defaultDescription = datasetName ? `由数据集 ${datasetName} 注册创建` : '';
      
      // 从latestVersionEntry获取存储路径
      const storagePath = latestVersionEntry?.storagePath || '';
      const mountPath = latestVersionEntry?.mountPath || '';
      
      console.log('[DatasetRegisterModelForm] 设置默认值:', {
        modelName,
        defaultDescription,
        storageInstance,
        storagePath,
        mountPath
      });
      
      form.setFieldsValue({
        modelName: modelName,
        modelDescription: defaultDescription,
        versionDescription: defaultDescription,
        storageBucket: storageInstance,
        storagePath: storagePath
      });
    }
  };

  // 移除资源池和队列相关函数，注册模型不需要这些参数

  // 初始化加载数据集版本
  useEffect(() => {
    fetchDatasetVersions();
  }, [datasetId]);

  // 自动填充表单字段
  useEffect(() => {
    triggerAutoFill();
  }, [datasetName, storageInstance, latestVersionEntry, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);
      setError('');
      
      const registerConfig = {
        datasetId: datasetId,
        datasetVersion: values.datasetVersion,
        modelName: values.modelName,
        modelDescription: values.modelDescription,
        modelFormat: values.modelFormat,
        versionDescription: values.versionDescription,
        storageBucket: values.storageBucket,
        storagePath: values.storagePath,
        modelMetrics: values.modelMetrics
      };

      console.log('🚀 提交注册模型任务:', registerConfig);

      // 这里应该调用实际的注册模型API
      await new Promise(resolve => setTimeout(resolve, 2000));

      message.success('注册模型任务已创建成功');
      
      if (onSubmit) {
        await onSubmit(registerConfig);
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
      datasetVersion: '',
      modelName: '',
      modelDescription: '',
      modelFormat: 'PyTorch',
      versionDescription: '',
      storageBucket: '',
      storagePath: '',
      modelMetrics: ''
    });
    setSelectedVersionInfo(null);
  };

  const handleDatasetVersionChange = (value: string) => {
    const version = datasetVersions.find(v => v.versionId === value);
    if (version) {
      setSelectedVersionInfo(version);
    }
  };

  // 移除资源池相关的事件处理函数

  // 检查数据集类型是否为BOS
  if (datasetType && datasetType !== 'BOS') {
    return (
      <div style={{ padding: '8px' }}>
        <Alert
          message="不支持的数据集类型"
          description={`当前数据集类型为 ${datasetType}，只有BOS类型的数据集支持注册模型功能。`}
          type="warning"
          showIcon
          style={{ fontSize: '11px' }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '8px' }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          datasetVersion: '',
          modelName: '',
          modelDescription: '',
          modelFormat: 'PyTorch',
          versionDescription: '',
          storageBucket: '',
          storagePath: '',
          modelMetrics: ''
        }}
        style={{ margin: 0 }}
      >
        {/* 数据集版本 */}
        <Form.Item 
          name="datasetVersion"
          rules={[{ required: true, message: '请选择数据集版本' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>数据集版本 <span style={{ color: '#ff4d4f' }}>*</span></span>}
        >
          <Select
            placeholder="请选择数据集版本"
            value={config.datasetVersion}
            loading={isLoadingDatasetVersions}
            disabled={isLoadingDatasetVersions}
            notFoundContent={isLoadingDatasetVersions ? <Spin size="small" /> : '暂无数据'}
            onChange={handleDatasetVersionChange}
            style={{ width: '100%', fontSize: '11px' }}
          >
            {datasetVersions.map((version: any) => (
              <Option key={version.versionId} value={version.versionId}>
                {version.versionName} ({version.createTime})
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 选中版本信息 */}
        {selectedVersionInfo && (
          <div style={{
            marginBottom: '8px',
            padding: '8px',
            backgroundColor: '#f6f8fa',
            borderRadius: '4px',
            border: '1px solid #e1e4e8'
          }}>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
              📁 选中版本路径信息
            </div>
            <div style={{ fontSize: '10px', color: '#495057', fontFamily: 'monospace' }}>
              <div style={{ marginBottom: '2px' }}>
                <strong>版本号:</strong> {selectedVersionInfo.versionName}
              </div>
              <div style={{ marginBottom: '2px' }}>
                <strong>挂载路径:</strong> {selectedVersionInfo.mountPath}
              </div>
              <div style={{ marginBottom: '2px' }}>
                <strong>存储路径:</strong> {selectedVersionInfo.storagePath}
              </div>
              <div style={{ marginBottom: '2px' }}>
                <strong>创建时间:</strong> {selectedVersionInfo.createTime}
              </div>
              <div style={{ marginBottom: '2px' }}>
                <strong>创建用户:</strong> {selectedVersionInfo.createUser}
              </div>
              <div>
                <strong>更新时间:</strong> {selectedVersionInfo.updateTime}
              </div>
            </div>
          </div>
        )}

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
            <Option value="PyTorch">PyTorch</Option>
            <Option value="TensorFlow">TensorFlow</Option>
            <Option value="ONNX">ONNX</Option>
            <Option value="PaddlePaddle">PaddlePaddle</Option>
          </Select>
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
            rules={[{ required: true, message: '请输入存储桶' }]}
            style={{ marginBottom: '8px' }}
            label={<span style={{ fontSize: '11px', color: '#666' }}>存储桶 <span style={{ color: '#ff4d4f' }}>*</span></span>}
            extra={<span style={{ fontSize: '10px', color: '#999' }}>BOS存储桶名称</span>}
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
            extra={<span style={{ fontSize: '10px', color: '#999' }}>模型在存储系统中的路径</span>}
          >
            <Input
              placeholder="请输入存储路径，如：/path/to/model"
              style={{ fontSize: '11px' }}
            />
          </Form.Item>

          {/* 模型指标 */}
          <Form.Item 
            name="modelMetrics"
            style={{ marginBottom: '0px' }}
            label={<span style={{ fontSize: '11px', color: '#666' }}>模型指标</span>}
            extra={<span style={{ fontSize: '10px', color: '#999' }}>模型的性能指标信息（JSON格式）</span>}
          >
            <TextArea
              placeholder='请输入模型指标，如：{"accuracy": 0.95, "precision": 0.92}'
              rows={2}
              style={{ fontSize: '11px', resize: 'vertical' }}
            />
          </Form.Item>
        </div>

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
            立即注册
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

export default DatasetRegisterModelForm;
