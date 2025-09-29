import React from 'react';
import { Layout, Typography, Button, Space, Tooltip, Badge, Avatar } from 'antd';
import { 
  SettingOutlined, 
  QuestionCircleOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';

const { Header: AntHeader } = Layout;
const { Title, Text } = Typography;

interface HeaderProps {
  pageName: string;
}

const Header: React.FC<HeaderProps> = ({ pageName }) => {
  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  const openHelp = () => {
    // 可以打开帮助文档或显示使用提示
    console.log('打开帮助');
  };

  return (
    <AntHeader 
      className="bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 h-auto min-h-[70px] flex items-center justify-between shadow-xl relative overflow-hidden"
    >
      {/* 背景装饰 - 使用Tailwind */}
      <div className="absolute -top-1/2 -right-1/4 w-48 h-48 bg-white/10 rounded-full z-0" />
      <div className="absolute -bottom-1/3 -left-1/4 w-36 h-36 bg-white/5 rounded-full z-0" />

      {/* 左侧内容 */}
      <div className="flex-1 relative z-10">
        <Space direction="vertical" size={2}>
          <div className="flex items-center gap-2">
            <Avatar 
              size="small" 
              className="bg-white/20 text-white text-xs font-bold"
            >
              <ThunderboltOutlined />
            </Avatar>
            <Title 
              level={4} 
              className="text-white m-0 font-semibold text-base text-shadow-soft"
            >
              AIHC助手
            </Title>
            <Badge 
              count="v0.6" 
              className="bg-white/20 text-white text-xs font-bold" 
            />
          </div>
          <Text 
            className="text-white/85 text-xs leading-tight font-normal text-shadow-soft"
          >
            {pageName}
          </Text>
        </Space>
      </div>
      
      {/* 右侧操作按钮 */}
      <Space className="relative z-10">
        <Tooltip title="使用帮助" placement="bottomRight">
          <Button
            type="text"
            icon={<QuestionCircleOutlined />}
            onClick={openHelp}
            className="text-white/90 border-none bg-white/10 rounded-lg w-9 h-9 flex items-center justify-center transition-all duration-300 glass-effect hover:bg-white/20 hover:scale-105 hover:-translate-y-0.5 hover:shadow-medium"
          />
        </Tooltip>
        
        <Tooltip title="插件设置" placement="bottomRight">
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={openSettings}
            className="text-white/90 border-none bg-white/10 rounded-lg w-9 h-9 flex items-center justify-center transition-all duration-300 glass-effect hover:bg-white/20 hover:scale-105 hover:-translate-y-0.5 hover:shadow-medium"
          />
        </Tooltip>
      </Space>
    </AntHeader>
  );
};

export default Header;
