const variantStyles = {
  default:
    'bg-white dark:bg-[var(--bg-surface)] border border-purple-300 dark:border-[var(--border-subtle)] shadow-sm',
  elevated:
    'bg-white dark:bg-[var(--bg-surface)] border border-purple-300 dark:border-[var(--border-subtle)] shadow-md',
  flat:
    'bg-white dark:bg-[var(--bg-surface)] border-0 shadow-none',
};

/**
 * Componente Card unificado.
 *
 * @example
 * // Default con hover
 * <Card hoverable>
 *   <p>Contenido de la card</p>
 * </Card>
 *
 * @example
 * // Elevated sin hover
 * <Card variant="elevated">
 *   <h2>Título</h2>
 * </Card>
 *
 * @example
 * // Flat
 * <Card variant="flat" className="p-4">
 *   <span>Sin bordes ni sombras</span>
 * </Card>
 */
export default function Card({
  variant = 'default',
  hoverable = false,
  className = '',
  children,
  ...props
}) {
  return (
    <div
      className={`
        rounded-2xl p-6 transition-all duration-200
        ${variantStyles[variant] || variantStyles.default}
        ${hoverable ? 'hover:-translate-y-1 hover:shadow-lg hover:border-pink-500/50 dark:hover:border-teal-500/50 cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}




