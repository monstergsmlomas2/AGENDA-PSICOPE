import { WifiOff, AlertTriangle } from 'lucide-react';
import Button from './Button';

/**
 * ErrorState — estado visual de error con icono, mensaje y botón "Reintentar".
 *
 * @example
 *   <ErrorState onRetry={cargarData} />
 *   <ErrorState message="No se pudieron cargar las evaluaciones." onRetry={cargarData} />
 */
export default function ErrorState({
  icon: Icon = WifiOff,
  title = 'Error de conexión',
  message = 'No se pudieron cargar los datos. Verificá tu conexión e intentá de nuevo.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`text-center py-16 rounded-2xl border-2 border-dashed border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 ${className}`}>
      <div className="flex justify-center mb-5">
        <div className="bg-red-100 dark:bg-red-500/10 p-4 rounded-2xl text-red-500 dark:text-red-400">
          <Icon size={48} />
        </div>
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-900 dark:text-white max-w-md mx-auto mb-6 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry} className="mx-auto">
          Reintentar
        </Button>
      )}
    </div>
  );
}




