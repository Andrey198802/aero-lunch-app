import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Принудительная очистка кэша для Telegram Web App
console.log('🔄 Принудительная очистка кэша v2.0.0 - ' + new Date().toISOString());

// Очищаем ВСЕ виды кэша
localStorage.clear();
sessionStorage.clear();

// Очищаем кэш браузера
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name);
    });
  });
}

// Удаляем service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  });
}

// Добавляем уникальный параметр к URL для обхода кэша
const currentUrl = new URL(window.location.href);
if (!currentUrl.searchParams.has('cache_bust')) {
  currentUrl.searchParams.set('cache_bust', Date.now().toString());
  window.history.replaceState({}, '', currentUrl.toString());
}

// Инициализация Telegram Web App
if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready()
  window.Telegram.WebApp.expand()
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 