import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Space, 
  Typography, 
  message, 
  Alert,
  Divider,
  Row,
  Col
} from 'antd';
import { 
  SettingOutlined, 
  SaveOutlined, 
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { savePluginConfig, resetPluginConfig, getConfigStatus } from '../utils/config';
import { callBecOpenApi } from '../utils/aihcOpenApi';

const { Text } = Typography;

const ConfigForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [configStatus, setConfigStatus] = useState<{
    isValid: boolean;
    hasAk: boolean;
    hasSk: boolean;
    hasHost: boolean;
    config: any;
  }>({ isValid: false, hasAk: false, hasSk: false, hasHost: false, config: {} });

  // 加载配置状态
  useEffect(() => {
    loadConfigStatus();
  }, []);

  const loadConfigStatus = async () => {
    try {
      const status = await getConfigStatus();
      setConfigStatus(status);
      
      if (status.hasAk && status.hasSk && status.hasHost) {
        form.setFieldsValue(status.config);
      }
    } catch (error) {
      console.error('加载配置状态失败:', error);
      message.error('加载配置状态失败');
    }
  };

  // 保存配置
  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      await savePluginConfig(values);
      await loadConfigStatus();
      
      message.success('配置保存成功！');
    } catch (error) {
      console.error('保存配置失败:', error);
      message.error('保存配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 重置配置
  const handleReset = async () => {
    try {
      setLoading(true);
      await resetPluginConfig();
      form.resetFields();
      await loadConfigStatus();
      
      message.success('配置已重置');
    } catch (error) {
      console.error('重置配置失败:', error);
      message.error('重置配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 验证配置
  const handleValidateConfig = async () => {
    try {
      setValidating(true);
      const values = await form.validateFields();
      
      // 调用DescribeDatasets接口验证配置
      const result = await callBecOpenApi(
        values.ak,
        values.sk,
        values.host,
        '/',
        'GET',
        { action: 'DescribeDatasets' },
        {}
      );
      
      if (result.success) {
        message.success('配置验证成功！');
        await loadConfigStatus();
      } else {
        message.error('配置验证失败，请检查AK/SK/Host是否正确');
      }
    } catch (error: any) {
      console.error('验证配置失败:', error);
      message.error('配置验证失败: ' + (error.message || '未知错误'));
    } finally {
      setValidating(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card 
        title={
          <Space>
            <SettingOutlined />
            <span>插件配置</span>
          </Space>
        }
        extra={
          <Space>
            {configStatus.isValid ? (
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <Text type="success">配置有效</Text>
              </Space>
            ) : (
              <Space>
                <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                <Text type="warning">配置无效</Text>
              </Space>
            )}
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          size="middle"
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Access Key (AK)"
                name="ak"
                rules={[
                  { required: true, message: '请输入Access Key' },
                  { min: 10, message: 'Access Key长度不能少于10位' }
                ]}
                extra="百度云Access Key，用于API认证"
              >
                <Input.Password
                  placeholder="请输入Access Key"
                  autoComplete="off"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Secret Key (SK)"
                name="sk"
                rules={[
                  { required: true, message: '请输入Secret Key' },
                  { min: 10, message: 'Secret Key长度不能少于10位' }
                ]}
                extra="百度云Secret Key，用于API认证"
              >
                <Input.Password
                  placeholder="请输入Secret Key"
                  autoComplete="off"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="API Host"
                name="host"
                rules={[
                  { required: true, message: '请输入API Host' },
                  { 
                    pattern: /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 
                    message: '请输入有效的域名格式' 
                  }
                ]}
                extra="API服务地址，如: aihc.bj.baidubce.com"
              >
                <Input
                  placeholder="请输入API Host"
                  autoComplete="off"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          {/* 配置状态提示 */}
          {!configStatus.isValid && (configStatus.hasAk || configStatus.hasSk || configStatus.hasHost) && (
            <Alert
              message="配置不完整或无效"
              description="请检查并完善配置信息"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* 操作按钮 */}
          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={loading}
              >
                保存配置
              </Button>
              
              <Button
                icon={<CheckCircleOutlined />}
                onClick={handleValidateConfig}
                loading={validating}
              >
                验证配置
              </Button>
              
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
                loading={loading}
                danger
              >
                重置配置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 帮助信息 */}
      <Card 
        title="配置说明" 
        style={{ marginTop: 16 }}
        size="small"
      >
        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <p><strong>Access Key (AK):</strong> 百度云控制台获取的访问密钥ID</p>
          <p><strong>Secret Key (SK):</strong> 百度云控制台获取的访问密钥</p>
          <p><strong>API Host:</strong> AIHC服务的API地址</p>
          <p><strong>验证配置:</strong> 点击验证按钮会调用DescribeDatasets接口测试配置是否正确</p>
        </div>
      </Card>
    </div>
  );
};

export default ConfigForm;
