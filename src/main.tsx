import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Принудительное обновление кэша для Telegram Web App
if (window.location.search.includes('tgWebAppVersion')) {
  // Очищаем localStorage
  localStorage.clear()
  sessionStorage.clear()
  
  // Принудительное обновление
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name)
      })
    })
  }
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