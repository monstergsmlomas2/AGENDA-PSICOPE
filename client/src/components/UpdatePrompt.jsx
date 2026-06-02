import { useState, useEffect } from 'react'
import { RefreshCw, X } from 'lucide-react'

export default function UpdatePrompt() {
  const [waitingSW, setWaitingSW] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const detectWaiting = async () => {
      const reg = await navigator.serviceWorker.getRegistration()
      if (!reg) return

      // Ya hay uno esperando al montar
      if (reg.waiting) {
        setWaitingSW(reg.waiting)
        return
      }

      // Escuchar nuevas instalaciones
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing
        if (!sw) return
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingSW(sw)
          }
        })
      })
    }

    detectWaiting()

    // Forzar chequeo de actualización cada 30s
    const poll = setInterval(async () => {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        await reg.update()
        if (reg.waiting && navigator.serviceWorker.controller) {
          setWaitingSW(reg.waiting)
        }
      }
    }, 30_000)

    return () => clearInterval(poll)
  }, [])

  const handleUpdate = () => {
    if (!waitingSW) return
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    }, { once: true })
    waitingSW.postMessage({ type: 'SKIP_WAITING' })
  }

  if (!waitingSW || dismissed) return null

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
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-pink-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Cerrar"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
