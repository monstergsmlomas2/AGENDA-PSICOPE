import { AlertTriangle } from 'lucide-react';

/**
 * ConfirmDialog — modal de confirmación reutilizable.
 *
 * Props:
 *   isOpen       : boolean — controla visibilidad
 *   onClose      : () => void — callback al cancelar/cerrar
 *   onConfirm    : () => void — callback al confirmar
 *   title        : string — título del modal
 *   message      : string — mensaje de confirmación
 *   confirmLabel : string — texto del botón de confirmar (default: "Confirmar")
 *   cancelLabel  : string — texto del botón de cancelar (default: "Cancelar")
 *   variant      : 'danger' | 'warning' | 'info' (default: 'danger')
 *
 * @example
 *   <ConfirmDialog
 *     isOpen={showConfirm}
 *     onClose={() => setShowConfirm(false)}
 *     onConfirm={handleConfirmDelete}
 *     title="Eliminar paciente"
 *     message="¿Estás seguro de que querés eliminar este paciente?"
 *     confirmLabel="Eliminar"
 *   />
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar acción',
  message = '¿Estás seguro de que querés continuar?',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
}) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: 'bg-red-100 dark:bg-red-500/10',
      iconColor: 'text-red-600 dark:text-red-400',
      button: 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white shadow-lg shadow-red-500/20',
    },
    warning: {
      iconBg: 'bg-yellow-100 dark:bg-yellow-500/10',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      button: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white shadow-lg shadow-yellow-500/20',
    },
    info: {
      iconBg: 'bg-pink-100 dark:bg-blue-500/10',
      iconColor: 'text-slate-900 font-bold dark:text-pink-600 dark:text-blue-400',
      button: 'bg-pink-500 hover:bg-pink-400 text-white shadow-lg shadow-pink-500/20 dark:bg-teal-600 dark:hover:bg-teal-500 dark:shadow-teal-500/20',
    },
  };

  const vs = variantStyles[variant] || variantStyles.danger;

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9998] p-4">
      <div
        className="bg-white dark:bg-[#141414] w-full max-w-md rounded-2xl shadow-2xl border border-purple-300 dark:border-[#333] p-6 animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          {/* Icono */}
          <div className={`${vs.iconBg} ${vs.iconColor} p-4 rounded-2xl mb-5`}>
            <AlertTriangle size={36} />
          </div>

          {/* Título */}
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>

          {/* Mensaje */}
          <p className="text-slate-900 dark:text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
            {message}
          </p>

          {/* Botones */}
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-3 font-bold rounded-xl transition-colors text-slate-900 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800 border border-purple-300 dark:border-[#333]"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`flex-1 px-5 py-3 rounded-xl font-bold transition-all hover:-translate-y-0.5 ${vs.button}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}






