import React from 'react';
import { Typography, Button, Row, Col, Space } from 'antd';
import { 
  ExclamationCircleOutlined, 
  LinkOutlined, 
  InfoCircleOutlined,
  CheckCircleOutlined,
  StarOutlined,
  RocketOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { urlPatterns } from '../utils/pageDetection';

const { Text, Title } = Typography;

interface UnsupportedPageProps {
  currentUrl?: string;
}

const UnsupportedPage: React.FC<UnsupportedPageProps> = ({ currentUrl }) => {
  // 检查是否在百度云域名下但不在AIHC控制台
  const isInBaiduCloud = currentUrl?.includes('console.bce.baidu.com') && !currentUrl?.includes('/aihc');
  const isNotInBaiduCloud = currentUrl && !currentUrl.includes('console.bce.baidu.com');

  const getAlertMessage = () => {
    if (isNotInBaiduCloud) {
      return {
        type: 'error' as const,
        message: '该插件仅在百舸AIHC控制台中使用',
        description: '请访问以下地址使用插件功能',
        icon: <ExclamationCircleOutlined />
      };
    }
    if (isInBaiduCloud) {
      return {
        type: 'warning' as const,
        message: '请在AIHC控制台中使用该插件',
        description: '您当前在百度云控制台，请进入AIHC服务',
        icon: <InfoCircleOutlined />
      };
    }
    return {
      type: 'info' as const,
      message: '请在百舸AIHC控制台页面使用',
      description: '切换到支持的页面即可使用插件功能',
      icon: <InfoCircleOutlined />
    };
  };

  const alertInfo = getAlertMessage();

  // 获取支持的功能页面列表
  const supportedPages = Object.entries(urlPatterns).reduce((acc: Array<{url: string, name: string, hint?: string, icon?: React.ReactNode, color?: string}>, [url, name]) => {
    if (!acc.find(item => item.name === name)) {
      let hint = '';
      let icon = <StarOutlined />;
      let color = '#1890ff';
      
      if (name === '任务列表') {
        hint = '需要下拉选中一个资源池';
        icon = <ThunderboltOutlined />;
        color = '#52c41a';
      } else if (name === '任务详情') {
        hint = '生成CLI命令、保存参数文件';
        icon = <RocketOutlined />;
        color = '#faad14';
      } else if (name.includes('数据集')) {
        icon = <StarOutlined />;
        color = '#722ed1';
      } else if (name.includes('模型')) {
        icon = <StarOutlined />;
        color = '#13c2c2';
      }
      
      acc.push({ url, name, hint, icon, color });
    }
    return acc;
  }, []);

  return (
    <div style={{ 
      padding: '12px',
      background: '#f8f9fa',
      minHeight: '500px'
    }}>
      {/* 主要提示区域 - 简化布局 */}
      <div style={{
        background: '#fff',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '12px',
        border: '1px solid #e8e8e8',
        textAlign: 'center'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: '24px',
          color: 'white'
        }}>
          {alertInfo.icon}
        </div>
        <Title level={3} style={{ 
          margin: '0 0 8px 0', 
          color: '#333',
          fontSize: '16px'
        }}>
          {alertInfo.message}
        </Title>
        <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginBottom: '20px' }}>
          {alertInfo.description}
        </Text>
        
        <Button
          type="primary"
          icon={<LinkOutlined />}
          href="https://console.bce.baidu.com/aihc"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            borderRadius: '6px',
            height: '36px',
            fontSize: '14px',
            fontWeight: 500,
            padding: '0 24px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            border: 'none'
          }}
        >
          进入百舸AIHC控制台
        </Button>
      </div>

      {/* 支持的功能页面 - 简化布局 */}
      <div style={{
        background: '#fff',
        borderRadius: '8px',
        padding: '16px',
        border: '1px solid #e8e8e8'
      }}>
        <Space style={{ marginBottom: '16px' }}>
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
          <Text strong style={{ fontSize: '14px' }}>支持的功能页面</Text>
        </Space>
        
        <Row gutter={[8, 8]}>
          {supportedPages.map((item, index) => (
            <Col span={12} key={index}>
              <div style={{ 
                padding: '12px',
                borderRadius: '6px',
                border: `1px solid ${item.color}30`,
                background: `${item.color}08`,
                height: '100%'
              }}>
                <Space align="center" style={{ width: '100%' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    background: `${item.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: item.color,
                    fontSize: '12px'
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: '12px', color: '#333' }}>
                      {item.name}
                    </Text>
                    {item.hint && (
                      <div>
                        <Text type="secondary" style={{ fontSize: '10px', lineHeight: 1.3 }}>
                          <InfoCircleOutlined style={{ marginRight: '2px', fontSize: '10px' }} />
                          {item.hint}
                        </Text>
                      </div>
                    )}
                  </div>
                </Space>
              </div>
            </Col>
          ))}
        </Row>
        
        {/* 当前页面信息 */}
        {currentUrl && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#f5f5f5',
            borderRadius: '6px',
            border: '1px solid #e8e8e8'
          }}>
            <Text type="secondary" style={{ fontSize: '11px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
              <InfoCircleOutlined style={{ marginRight: '4px', fontSize: '11px' }} />
              当前页面：
            </Text>
            <Text 
              code 
              style={{ 
                fontSize: '10px',
                wordBreak: 'break-all',
                background: '#fff',
                padding: '6px 8px',
                borderRadius: '4px',
                display: 'block',
                border: '1px solid #d9d9d9'
              }}
            >
              {currentUrl}
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnsupportedPage;
