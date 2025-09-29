import React from 'react';
import { Card, Typography, Space, List, Button, Alert, Divider } from 'antd';
import { 
  ExclamationCircleOutlined, 
  LinkOutlined, 
  InfoCircleOutlined,
  CheckCircleOutlined,
  StarOutlined
} from '@ant-design/icons';
import { urlPatterns } from '../utils/pageDetection';

const { Text } = Typography;

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
        description: '请访问以下地址使用插件功能'
      };
    }
    if (isInBaiduCloud) {
      return {
        type: 'warning' as const,
        message: '请在AIHC控制台中使用该插件',
        description: '您当前在百度云控制台，请进入AIHC服务'
      };
    }
    return {
      type: 'info' as const,
      message: '请在百舸AIHC控制台页面使用',
      description: ''
    };
  };

  const alertInfo = getAlertMessage();

  // 获取支持的功能页面列表
  const supportedPages = Object.entries(urlPatterns).reduce((acc: Array<{url: string, name: string, hint?: string}>, [url, name]) => {
    if (!acc.find(item => item.name === name)) {
      let hint = '';
      if (name === '任务列表') {
        hint = '需要下拉选中一个资源池';
      } else if (name === '任务详情') {
        hint = '生成CLI命令、保存参数文件';
      }
      acc.push({ url, name, hint });
    }
    return acc;
  }, []);

  return (
    <div style={{ padding: '16px' }}>
      <Card 
        style={{ 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '16px'
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            message={alertInfo.message}
            description={alertInfo.description}
            type={alertInfo.type}
            icon={<ExclamationCircleOutlined />}
            showIcon
            style={{ borderRadius: '6px' }}
          />
          
          <Button
            type="primary"
            icon={<LinkOutlined />}
            size="large"
            href="https://console.bce.baidu.com/aihc"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              borderRadius: '6px',
              height: '40px',
              fontSize: '16px',
              fontWeight: 500
            }}
          >
            进入百舸AIHC控制台
          </Button>
        </Space>
      </Card>

      <Card 
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <span>支持的功能页面</span>
          </Space>
        }
        style={{ 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <List
          dataSource={supportedPages}
          renderItem={(item) => (
            <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
              <List.Item.Meta
                avatar={<StarOutlined style={{ color: '#1890ff' }} />}
                title={
                  <Space>
                    <Text strong style={{ fontSize: '14px' }}>{item.name}</Text>
                    {item.hint && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        <InfoCircleOutlined /> {item.hint}
                      </Text>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
        
        {currentUrl && (
          <>
            <Divider />
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <InfoCircleOutlined /> 当前页面：
              </Text>
              <Text 
                code 
                style={{ 
                  fontSize: '12px',
                  wordBreak: 'break-all',
                  background: '#f5f5f5',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  display: 'block'
                }}
              >
                {currentUrl}
              </Text>
            </Space>
          </>
        )}
      </Card>
    </div>
  );
};

export default UnsupportedPage;
