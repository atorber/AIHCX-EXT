import { createRoot } from 'react-dom/client';
import OptionsContainer from '../components/OptionsContainer';
import { AntdConfigProvider } from '../config/antd';
import '../styles/options.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <AntdConfigProvider>
      <OptionsContainer />
    </AntdConfigProvider>
  );
} else {
  console.error('Root container not found');
}