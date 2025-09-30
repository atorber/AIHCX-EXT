import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Card, 
  Typography, 
  Space, 
  Button, 
  Checkbox, 
  Row, 
  Col,
  Divider
} from 'antd';
import { 
  SearchOutlined, 
  SettingOutlined, 
  FileTextOutlined, 
  RocketOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { shouldShowUserGuide, hideUserGuide } from '../utils/chromeApi';

const { Title, Text } = Typography;

const UserGuide: React.FC = () => {
  const [showGuide, setShowGuide] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const guideSteps = [
    {
      title: '支持页面检测',
      description: '插件会自动检测您是否在AIHC控制台的支持页面，并显示相应功能',
      icon: <SearchOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
    },
    {
      title: 'CLI命令生成',
      description: '在任务详情页可以生成创建任务的CLI命令，方便本地使用',
      icon: <SettingOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
    },
    {
      title: '参数导出',
      description: '支持将任务参数导出为JSON、YAML格式，便于备份和修改',
      icon: <FileTextOutlined style={{ fontSize: '20px', color: '#faad14' }} />
    },
    {
      title: '快速复制',
      description: '一键复制命令或参数到剪贴板，提高工作效率',
      icon: <RocketOutlined style={{ fontSize: '20px', color: '#f5222d' }} />
    }
  ];

  useEffect(() => {
    const checkShowGuide = async () => {
      const should = await shouldShowUserGuide();
      setShowGuide(should);
    };
    
    checkShowGuide();
  }, []);

  const closeGuide = async () => {
    setShowGuide(false);
    if (dontShowAgain) {
      hideUserGuide();
    }
  };

  return (
    <Modal
      title={
        <Space>
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
          <span>欢迎使用 AIHC助手</span>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            v0.8.0
          </Text>
        </Space>
      }
      open={showGuide}
      onCancel={closeGuide}
      footer={null}
      width={600}
      centered
      closable={false}
      style={{ top: 20 }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card 
          style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '8px'
          }}
          bodyStyle={{ padding: '20px', textAlign: 'center' }}
        >
          <Space direction="vertical" size="small">
            <Title level={3} style={{ color: 'white', margin: 0 }}>
              🎉 欢迎使用 AIHC助手
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
              为AIHC用户提供便捷的CLI命令生成和参数管理功能
            </Text>
          </Space>
        </Card>

        <div>
          <Title level={4} style={{ marginBottom: '16px' }}>
            主要功能
          </Title>
          <Row gutter={[16, 16]}>
            {guideSteps.map((step, index) => (
              <Col span={12} key={index}>
                <Card 
                  size="small"
                  style={{ 
                    height: '100%',
                    borderRadius: '8px',
                    border: '1px solid #f0f0f0'
                  }}
                  bodyStyle={{ padding: '16px' }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Space>
                      {step.icon}
                      <Text strong style={{ fontSize: '14px' }}>
                        {step.title}
                      </Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: '12px', lineHeight: 1.4 }}>
                      {step.description}
                    </Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        <Divider />

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Checkbox 
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
          >
            不再显示此向导
          </Checkbox>
          
          <Button 
            type="primary" 
            onClick={closeGuide}
            icon={<CheckCircleOutlined />}
            style={{ borderRadius: '6px' }}
          >
            开始使用
          </Button>
        </Space>
      </Space>
    </Modal>
  );
};

export default UserGuide;
