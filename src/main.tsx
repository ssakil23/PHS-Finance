import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for offline fast caching & instant updates
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New version ready.');
  },
  onOfflineReady() {
    console.log('[PWA] Application resources cached on local device. Ready for instant offline use.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
