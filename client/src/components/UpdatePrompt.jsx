import { useState, useEffect } from 'react'
import { RefreshCw, X } from 'lucide-react'

export default function UpdatePrompt() {
  const [show, setShow] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const checkForWaiting = (reg) => {
      if (reg.waiting) {
        setWaitingWorker(reg.waiting)
        setShow(true)
      }
    }

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return

      // Ya hay un SW esperando al cargar (común en PWA instalada)
      checkForWaiting(reg)

      // Un nuevo SW terminó de instalarse y está esperando
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker)
            setShow(true)
          }
        })
      })
    })
  }, [])

  const handleUpdate = () => {
    if (waitingWorker) {
      // Le decimos al SW en espera que tome el control ahora
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    }
    // Recargamos cuando el nuevo SW toma el control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    }, { once: true })

    // Fallback: si controllerchange no dispara en 1s, recargar igual
    setTimeout(() => window.location.reload(), 1000)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[70] animate-fade-in w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-white dark:bg-slate-900 border-2 border-pink-400 dark:border-pink-500 rounded-2xl shadow-2xl shadow-pink-300/40 dark:shadow-pink-500/20 px-4 py-3 flex items-center gap-3">
        <div className="shrink-0 w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-500/20 flex items-center justify-center">
          <RefreshCw size={18} className="text-pink-500 dark:text-pink-400 animate-spin-slow" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Nueva versión disponible</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Actualizá para ver los últimos cambios</p>
        </div>

        <button
          onClick={handleUpdate}
          className="shrink-0 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-md shadow-pink-400/30"
        >
          Actualizar
        </button>

        <button
          onClick={() => setShow(false)}
          className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-pink-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Cerrar"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
