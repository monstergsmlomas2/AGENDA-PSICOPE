const variantStyles = {
  success:
    'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30',
  warning:
    'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30',
  danger:
    'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30',
  info:
    'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
  neutral:
    'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  accent:
    'bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/30',
};

const dotColors = {
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  neutral: 'bg-slate-400',
  accent: 'bg-teal-500',
};

const sizeStyles = {
  sm: 'text-[10px] px-2 py-0.5 gap-1 rounded-full',
  md: 'text-xs px-2.5 py-1 gap-1.5 rounded-full',
};

/**
 * Componente Badge reutilizable.
 *
 * @example
 * // Badge success básico
 * <Badge variant="success">Pagado</Badge>
 *
 * @example
 * // Badge warning con dot
 * <Badge variant="warning" dot>Pendiente</Badge>
 *
 * @example
 * // Badge accent pequeño
 * <Badge variant="accent" size="sm">Nuevo</Badge>
 *
 * @example
 * // Badge danger mediano con dot
 * <Badge variant="danger" size="md" dot>Deuda</Badge>
 */
export default function Badge({
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className = '',
  children,
  ...props
}) {
  return (
    <span
      className={`
        inline-flex items-center font-bold border
        ${variantStyles[variant] || variantStyles.neutral}
        ${sizeStyles[size] || sizeStyles.sm}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.neutral}`}
        />
      )}
      {children}
    </span>
  );
}



