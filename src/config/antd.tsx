// Ant Design 主题配置
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import React from 'react';

// 自定义主题配置
export const antdTheme = {
  token: {
    // 主色调
    colorPrimary: '#1890ff',
    // 圆角
    borderRadius: 6,
    // 字体
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    // 组件尺寸
    controlHeight: 32,
    // 间距
    padding: 16,
    margin: 16,
  },
  components: {
    Button: {
      borderRadius: 6,
      controlHeight: 32,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 32,
    },
    Select: {
      borderRadius: 6,
      controlHeight: 32,
    },
    Card: {
      borderRadius: 8,
    },
    Modal: {
      borderRadius: 8,
    },
    Drawer: {
      borderRadius: 8,
    },
    Message: {
      borderRadius: 6,
    },
    Notification: {
      borderRadius: 6,
    },
  },
};

// Ant Design 配置提供者组件
export const AntdConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ConfigProvider
      theme={antdTheme}
      locale={zhCN}
      componentSize="middle"
    >
      {children}
    </ConfigProvider>
  );
};

export default AntdConfigProvider;
