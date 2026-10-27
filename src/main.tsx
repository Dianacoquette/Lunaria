import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

const registrarServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return

  try {
    const registro = await navigator.serviceWorker.register('/sw.js')
    console.log('Service Worker registrado:', registro.scope)
  } catch (error) {
    console.error('Error al registrar el Service Worker:', error)
  }
}

registrarServiceWorker()
