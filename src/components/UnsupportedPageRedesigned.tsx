import React from 'react';
import { Card, Typography, Button, Row, Col, Divider, Space } from 'antd';
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
      padding: '20px',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '500px'
    }}>
      {/* 主要提示卡片 */}
      <Card 
        style={{ 
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          marginBottom: '20px',
          border: 'none',
          overflow: 'hidden',
          position: 'relative'
        }}
        bodyStyle={{ padding: '30px' }}
      >
        {/* 背景装饰 */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-30%',
          width: '300px',
          height: '300px',
          background: 'linear-gradient(135deg, #667eea20, #764ba220)',
          borderRadius: '50%',
          zIndex: 0
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: '-40%',
          left: '-20%',
          width: '200px',
          height: '200px',
          background: 'linear-gradient(135deg, #764ba220, #667eea20)',
          borderRadius: '50%',
          zIndex: 0
        }} />

        <Space direction="vertical" size="large" style={{ width: '100%', position: 'relative', zIndex: 1 }}>
          {/* 状态图标和标题 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '32px',
              color: 'white',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
            }}>
              {alertInfo.icon}
            </div>
            <Title level={2} style={{ 
              margin: 0, 
              color: '#333',
              fontWeight: 600
            }}>
              {alertInfo.message}
            </Title>
            <Text type="secondary" style={{ fontSize: '16px', lineHeight: 1.5 }}>
              {alertInfo.description}
            </Text>
          </div>

          {/* 操作按钮 */}
          <div style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={<LinkOutlined />}
              href="https://console.bce.baidu.com/aihc"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                borderRadius: '12px',
                height: '48px',
                fontSize: '16px',
                fontWeight: 600,
                padding: '0 32px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(102, 126, 234, 0.3)';
              }}
            >
              进入百舸AIHC控制台
            </Button>
          </div>
        </Space>
      </Card>

      {/* 支持的功能页面 */}
      <Card 
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
            <span style={{ fontSize: '18px', fontWeight: 600 }}>支持的功能页面</span>
          </Space>
        }
        style={{ 
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: 'none'
        }}
        headStyle={{
          background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
          borderRadius: '16px 16px 0 0',
          borderBottom: '1px solid #d9f7be'
        }}
      >
        <Row gutter={[16, 16]}>
          {supportedPages.map((item, index) => (
            <Col span={12} key={index}>
              <Card 
                size="small"
                style={{ 
                  height: '100%',
                  borderRadius: '12px',
                  border: `1px solid ${item.color}20`,
                  background: `${item.color}05`,
                  transition: 'all 0.3s ease'
                }}
                bodyStyle={{ padding: '16px' }}
                hoverable
              >
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space align="center">
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: `${item.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.color,
                      fontSize: '16px'
                    }}>
                      {item.icon}
                    </div>
                    <Text strong style={{ fontSize: '14px', color: '#333' }}>
                      {item.name}
                    </Text>
                  </Space>
                  {item.hint && (
                    <Text type="secondary" style={{ fontSize: '12px', lineHeight: 1.4 }}>
                      <InfoCircleOutlined style={{ marginRight: '4px' }} />
                      {item.hint}
                    </Text>
                  )}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
        
        <Divider style={{ margin: '20px 0' }} />
        
        {/* 当前页面信息 */}
        {currentUrl && (
          <div style={{
            padding: '16px',
            background: 'rgba(0,0,0,0.02)',
            borderRadius: '8px',
            border: '1px solid #f0f0f0'
          }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: '12px', fontWeight: 500 }}>
                <InfoCircleOutlined style={{ marginRight: '4px' }} />
                当前页面：
              </Text>
              <Text 
                code 
                style={{ 
                  fontSize: '12px',
                  wordBreak: 'break-all',
                  background: '#f5f5f5',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  display: 'block',
                  border: '1px solid #e8e8e8'
                }}
              >
                {currentUrl}
              </Text>
            </Space>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UnsupportedPage;
