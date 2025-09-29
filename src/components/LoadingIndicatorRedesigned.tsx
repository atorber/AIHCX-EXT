import React from 'react';
import { Spin, Card, Typography, Space, Progress } from 'antd';
import { LoadingOutlined, ThunderboltOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const LoadingIndicator: React.FC = () => {
  return (
    <div style={{ 
      padding: '40px 20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <Card 
        style={{ 
          textAlign: 'center',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          border: 'none',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
          position: 'relative'
        }}
        bodyStyle={{ padding: '40px 30px' }}
      >
        {/* 背景装饰 */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-30%',
          width: '200px',
          height: '200px',
          background: 'linear-gradient(135deg, #667eea20, #764ba220)',
          borderRadius: '50%',
          zIndex: 0
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: '-40%',
          left: '-20%',
          width: '150px',
          height: '150px',
          background: 'linear-gradient(135deg, #764ba220, #667eea20)',
          borderRadius: '50%',
          zIndex: 0
        }} />

        <Space direction="vertical" size="large" style={{ position: 'relative', zIndex: 1 }}>
          {/* 主加载动画 */}
          <div style={{ position: 'relative' }}>
            <Spin 
              indicator={
                <LoadingOutlined 
                  style={{ 
                    fontSize: 48, 
                    color: '#667eea'
                  }} 
                  spin 
                />
              } 
            />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              <ThunderboltOutlined />
            </div>
          </div>

          {/* 标题和描述 */}
          <div>
            <Title level={3} style={{ 
              margin: 0, 
              color: '#333',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              正在加载页面数据
            </Title>
            <Text 
              style={{ 
                fontSize: '14px',
                color: '#666',
                lineHeight: 1.5
              }}
            >
              正在分析当前页面，提取相关信息...
            </Text>
          </div>

          {/* 进度条 */}
          <div style={{ width: '200px' }}>
            <Progress
              percent={75}
              strokeColor={{
                '0%': '#667eea',
                '100%': '#764ba2',
              }}
              trailColor="#f0f0f0"
              strokeWidth={6}
              showInfo={false}
              style={{ marginBottom: '8px' }}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              预计还需要 2-3 秒
            </Text>
          </div>

          {/* 加载提示 */}
          <div style={{
            padding: '12px 16px',
            background: 'rgba(102, 126, 234, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(102, 126, 234, 0.2)'
          }}>
            <Space>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#667eea',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
              <Text style={{ fontSize: '12px', color: '#667eea' }}>
                正在检测页面类型和提取参数
              </Text>
            </Space>
          </div>
        </Space>

        {/* CSS动画 */}
        <style>
          {`
            @keyframes pulse {
              0% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(1.1); }
              100% { opacity: 1; transform: scale(1); }
            }
          `}
        </style>
      </Card>
    </div>
  );
};

export default LoadingIndicator;
