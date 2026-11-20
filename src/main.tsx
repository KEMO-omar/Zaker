import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import '../styles.css';

// Service Worker: Disable/clean up in Vite Dev Mode (prevents stale React chunk mismatches); register in Production PWA
if ('serviceWorker' in navigator) {
  if ((import.meta as any).env?.DEV) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    }).catch(() => {});
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      }).catch(() => {});
    }
  } else {
    window.addEventListener('load', () => {
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
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
