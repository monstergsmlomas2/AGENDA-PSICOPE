import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('Nueva versión disponible. Recargá la página para actualizar.')
  },
  onOfflineReady() {
    console.log('App lista para usar offline')
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Exponer updateSW para recarga manual si se desea
window.__pwaUpdateSW = updateSW
