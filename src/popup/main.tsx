import { createRoot } from 'react-dom/client';
import PopupContainerRedesigned from '../components/PopupContainerRedesigned';
import '../styles/popup.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<PopupContainerRedesigned />);
} else {
  console.error('Root container not found');
}