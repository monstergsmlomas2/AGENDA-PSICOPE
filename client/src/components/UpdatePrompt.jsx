import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  const close = () => setNeedRefresh(false)

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border border-pink-200 dark:border-[#333] bg-white dark:bg-slate-900 shadow-lg px-4 py-3 animate-fade-in">
      <span className="text-sm font-medium text-slate-900 dark:text-white">
        Hay una nueva versión disponible
      </span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="flex items-center gap-1.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium px-3 py-1.5 transition-colors"
      >
        <RefreshCw size={14} />
        Actualizar
      </button>
      <button
        onClick={close}
        aria-label="Cerrar"
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )
}
