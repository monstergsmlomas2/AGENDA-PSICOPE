import { Loader2 } from 'lucide-react';

const variantStyles = {
  primary:
    'bg-pink-500 hover:bg-pink-400 text-white shadow-lg shadow-pink-500/20 dark:bg-teal-600 dark:hover:bg-teal-500 dark:shadow-teal-500/20',
  secondary:
    'bg-white dark:bg-[var(--bg-surface)] border border-pink-300 dark:border-[var(--border-default)] text-slate-900 dark:text-white hover:bg-white dark:hover:bg-[var(--bg-elevated)] hover:border-pink-500 dark:hover:border-teal-500 shadow-sm',
  danger:
    'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20',
  ghost:
    'text-slate-900 dark:text-white hover:bg-pink-100 dark:hover:bg-[var(--bg-elevated)] border border-transparent',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-xs gap-1.5 rounded-lg',
  md: 'px-5 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'px-6 py-3 text-base gap-2.5 rounded-xl',
};

/**
 * Componente Button unificado.
 *
 * @example
 * // Primary (default)
 * <Button>Guardar</Button>
 *
 * @example
 * // Secondary outline
 * <Button variant="secondary" onClick={handleCancel}>Cancelar</Button>
 *
 * @example
 * // Danger con loading
 * <Button variant="danger" loading>Eliminando...</Button>
 *
 * @example
 * // Ghost pequeño
 * <Button variant="ghost" size="sm">Editar</Button>
 *
 * @example
 * // Disabled
 * <Button disabled>No disponible</Button>
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-bold
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        active:scale-[0.97]
        ${variantStyles[variant] || variantStyles.primary}
        ${sizeStyles[size] || sizeStyles.md}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="animate-spin shrink-0" />
      )}
      {children}
    </button>
  );
}





