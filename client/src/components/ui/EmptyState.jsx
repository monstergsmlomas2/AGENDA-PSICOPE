import Button from './Button';

/**
 * Componente EmptyState para estados vacíos.
 *
 * @example
 * // Básico
 * <EmptyState
 *   icon={Users}
 *   title="No hay pacientes"
 *   description="Agregá tu primer paciente para empezar."
 * />
 *
 * @example
 * // Con acción
 * <EmptyState
 *   icon={Calendar}
 *   title="Sin turnos"
 *   description="No hay turnos programados para hoy."
 *   action={{ label: "Nuevo Turno", onClick: () => setShowModal(true) }}
 * />
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div className={`text-center py-16 ${className}`}>
      {Icon && (
        <Icon
          size={48}
          className="mx-auto text-pink-300 dark:text-slate-700 mb-4"
        />
      )}
      {title && (
        <p className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 font-bold text-lg">
          {title}
        </p>
      )}
      {description && (
        <p className="text-pink-500 dark:text-slate-500 text-sm mt-1">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6">
          <Button onClick={action.onClick}>{action.label}</Button>
        </div>
      )}
    </div>
  );
}



