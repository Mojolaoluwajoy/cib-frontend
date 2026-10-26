import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Icon font, bundled at a fixed version (see package.json) so icons cannot change underneath the app
import '@tabler/icons-webfont/tabler-icons.min.css';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
