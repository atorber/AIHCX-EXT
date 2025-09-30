import React, { useState } from 'react';
import { Form, Select, Input, Button, message, Alert, Spin } from 'antd';
import { SendOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import { ResourcePool, Queue } from '../services/aihcApi';

const { Option } = Select;
const { TextArea } = Input;

interface CreateDatasetTabProps {
  datasetId: string;
  onSubmit?: (config: any) => Promise<void>;
}

const CreateDatasetTab: React.FC<CreateDatasetTabProps> = ({ datasetId, onSubmit }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // 加载状态
  const [isLoadingResourcePools] = useState(false);
  const [isLoadingQueues] = useState(false);
  
  // 选项数据
  const [resourcePools, setResourcePools] = useState<ResourcePool[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  
  // 表单配置
  const [config, setConfig] = useState({
    datasetName: '',
    datasetDescription: '',
    resourcePoolType: '自运维' as '自运维' | '全托管',
    resourcePoolId: '',
    queueId: '',
    sourcePath: ''
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);
      setError('');
      
      const createConfig = {
        sourceDatasetId: datasetId,
        datasetName: values.datasetName,
        datasetDescription: values.datasetDescription,
        resourcePoolType: values.resourcePoolType,
        resourcePoolId: values.resourcePoolId,
        queueId: values.queueId,
        sourcePath: values.sourcePath
      };

      console.log('🚀 提交创建数据集任务:', createConfig);

      // 这里应该调用实际的同步API
      await new Promise(resolve => setTimeout(resolve, 2000));

      message.success('创建数据集任务已创建成功');
      
      if (onSubmit) {
        await onSubmit(createConfig);
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
      resourcePoolType: '自运维',
      resourcePoolId: '',
      queueId: '',
      sourcePath: ''
    });
    setResourcePools([]);
    setQueues([]);
  };

  return (
    <div style={{ padding: '8px' }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          datasetName: '',
          datasetDescription: '',
          resourcePoolType: '自运维',
          resourcePoolId: '',
          queueId: '',
          sourcePath: ''
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

        {/* 源数据路径 */}
        <Form.Item 
          name="sourcePath"
          rules={[{ required: true, message: '请输入源数据路径' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>源数据路径 <span style={{ color: '#ff4d4f' }}>*</span></span>}
          extra={<span style={{ fontSize: '10px', color: '#999' }}>指定要创建数据集的数据路径</span>}
        >
          <TextArea
            placeholder="请输入源数据路径"
            rows={3}
            style={{ fontSize: '11px', resize: 'vertical' }}
          />
        </Form.Item>

        {/* 资源池类型 */}
        <Form.Item 
          name="resourcePoolType"
          rules={[{ required: true, message: '请选择资源池类型' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>资源池类型 <span style={{ color: '#ff4d4f' }}>*</span></span>}
        >
          <Select
            placeholder="请选择资源池类型"
            value={config.resourcePoolType}
            suffixIcon={<SettingOutlined />}
            style={{ width: '100%', fontSize: '11px' }}
          >
            <Option value="自运维">自运维资源池</Option>
            <Option value="全托管">全托管资源池</Option>
          </Select>
        </Form.Item>

        {/* 资源池 */}
        <Form.Item 
          name="resourcePoolId"
          rules={[{ required: true, message: '请选择资源池' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>资源池 <span style={{ color: '#ff4d4f' }}>*</span></span>}
        >
          <Select
            placeholder="请选择资源池"
            value={config.resourcePoolId}
            loading={isLoadingResourcePools}
            disabled={isLoadingResourcePools || !config.resourcePoolType}
            notFoundContent={isLoadingResourcePools ? <Spin size="small" /> : '暂无数据'}
            style={{ width: '100%', fontSize: '11px' }}
          >
            {resourcePools.map((pool: ResourcePool) => (
              <Option key={pool.resourcePoolId} value={pool.resourcePoolId}>
                {pool.name} ({pool.phase})
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 队列 */}
        <Form.Item 
          name="queueId"
          rules={[{ required: true, message: '请选择队列' }]}
          style={{ marginBottom: '8px' }}
          label={<span style={{ fontSize: '11px', color: '#666' }}>队列 <span style={{ color: '#ff4d4f' }}>*</span></span>}
        >
          <Select
            placeholder="请选择队列"
            value={config.queueId}
            loading={isLoadingQueues}
            disabled={isLoadingQueues || !config.resourcePoolId}
            notFoundContent={isLoadingQueues ? <Spin size="small" /> : '暂无数据'}
            style={{ width: '100%', fontSize: '11px' }}
          >
            {queues.map((queue: Queue) => (
              <Option key={queue.queueId} value={queue.queueId}>
                {queue.queueName} ({queue.phase})
              </Option>
            ))}
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
