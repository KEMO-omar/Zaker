import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import '../styles.css';

// Register Service Worker for Chrome PWA Installation & Offline Support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Resolve sw.js relative to current document location (handles GitHub Pages /Zaker/ seamlessly)
    const currentUrl = window.location.href;
    const swPath = new URL('sw.js', currentUrl).href;

    navigator.serviceWorker
      .register(swPath)
      .then((registration) => {
        console.log('[PWA] Service Worker registered successfully with scope:', registration.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Primary SW registration failed, attempting fallback ./sw.js:', err);
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
