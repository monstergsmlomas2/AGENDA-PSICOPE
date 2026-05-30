import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const STORAGE_KEY = 'pwa-prompt-dismissed'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Verificar si ya está en modo standalone (ya instalada)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) return

    // Verificar si el usuario descartó el banner antes
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed === 'true') return

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('Usuario aceptó instalar la PWA')
    } else {
      console.log('Usuario rechazó instalar la PWA')
    }

    setDeferredPrompt(null)
    setShowBanner(false)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[60] animate-fade-in">
      <div className="bg-pink-500 text-white rounded-xl shadow-lg p-4 flex items-center justify-between gap-3">
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
        <p className="text-sm font-medium flex-1">Instalá la app para acceder más rápido</p>
        <button
          onClick={handleInstall}
          className="shrink-0 bg-white text-pink-600 font-semibold text-sm px-5 py-2 rounded-lg hover:bg-pink-50 transition-colors"
        >
          Instalar
        </button>
      </div>
    </div>
  )
}
