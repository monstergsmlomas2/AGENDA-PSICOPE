import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

/* ─────────────────────────────────────────────
   CONTEXT Y HOOK (useToast exportado desde aquí)
   ───────────────────────────────────────────── */

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}

/* ─────────────────────────────────────────────
   ICONOS POR VARIANTE
   ───────────────────────────────────────────── */

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const variantStyles = {
  success:
    'border-green-500/30 bg-green-500/10',
  error:
    'border-red-500/30 bg-red-500/10',
  warning:
    'border-yellow-500/30 bg-yellow-500/10',
  info:
    'border-blue-500/30 bg-blue-500/10',
};

const iconColors = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-orange-700 dark:text-yellow-400',
  info: 'text-blue-400',
};

const progressColors = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
};

/* ─────────────────────────────────────────────
   TOAST INDIVIDUAL
   ───────────────────────────────────────────── */

function ToastItem({ id, variant, title, message, onRemove }) {
  const [exiting, setExiting] = useState(false);
  const Icon = iconMap[variant];

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(id), 300);
  }, [id, onRemove]);

  useEffect(() => {
    const timer = setTimeout(handleClose, 4000);
    return () => clearTimeout(timer);
  }, [handleClose]);

  return (
    <div
      className={`
        relative w-full max-w-sm rounded-xl border shadow-lg
        backdrop-blur-md overflow-hidden
        ${variantStyles[variant]}
        ${exiting ? 'toast-exit' : 'toast-enter'}
      `}
      role="alert"
    >
      <div className="flex items-start gap-3 p-4">
        <Icon size={20} className={`shrink-0 mt-0.5 ${iconColors[variant]}`} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{title}</p>
          {message && (
            <p className="text-xs text-slate-900 dark:text-white mt-0.5 leading-relaxed">{message}</p>
          )}
        </div>
        <button
          onClick={handleClose}
          className="shrink-0 p-1 rounded-lg text-slate-900 hover:text-slate-700 hover:bg-black/5 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-purple-100/10 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      {/* Barra de progreso */}
      <div className={`h-0.5 ${progressColors[variant]}`} style={{ animation: 'toast-progress 4s linear forwards' }} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   PROVIDER + CONTAINER
   ───────────────────────────────────────────── */

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((variant, title, message) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, variant, title, message }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, desc) => addToast('success', msg, desc),
    error: (msg, desc) => addToast('error', msg, desc),
    warning: (msg, desc) => addToast('warning', msg, desc),
    info: (msg, desc) => addToast('info', msg, desc),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast Container — esquina inferior derecha */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ─────────────────────────────────────────────
   EXPORT DEFAULT (componente individual, si se necesita)
   ───────────────────────────────────────────── */
export default ToastItem;





