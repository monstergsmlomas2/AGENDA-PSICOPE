/**
 * Skeleton — placeholder de carga con animate-pulse.
 *
 * Variants:
 *   - text   : línea de texto (ancho por defecto 100%, alto 16px)
 *   - card   : bloque rectangular redondeado (por defecto 100% x 120px)
 *   - circle : avatar circular (por defecto 40x40)
 *   - table-row : fila de tabla simulada (por defecto 100% x 48px)
 *
 * @example
 *   <Skeleton variant="text" className="w-3/4" />
 *   <Skeleton variant="card" className="h-32" />
 *   <Skeleton variant="circle" className="w-10 h-10" />
 *   <Skeleton variant="table-row" />
 */
export default function Skeleton({ variant = 'text', width, height, className = '' }) {
  const base = 'animate-pulse bg-pink-200 dark:bg-[#262626] rounded-xl';

  const variants = {
    text: 'h-4 w-full rounded-md',
    card: 'h-[120px] w-full',
    circle: 'w-10 h-10 rounded-full',
    'table-row': 'h-12 w-full',
  };

  const variantClass = variants[variant] || variants.text;

  return (
    <div
      className={`${base} ${variantClass} ${className}`}
      style={{
        width: width || undefined,
        height: height || undefined,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * SkeletonCard — simula una tarjeta con título + N líneas de texto.
 *
 * @example
 *   <SkeletonCard />
 *   <SkeletonCard lines={5} />
 */
export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#262626] rounded-2xl p-6 shadow-sm ${className}`}>
      {/* Título simulado */}
      <div className="flex items-center gap-3 mb-5">
        <Skeleton variant="circle" className="w-10 h-10 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-3/5" />
          <Skeleton variant="text" className="w-2/5 h-3" />
        </div>
      </div>
      {/* Líneas de texto */}
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            variant="text"
            className={i === lines - 1 ? 'w-4/6' : 'w-full'}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonTable — simula una tabla con N filas y M columnas.
 *
 * @example
 *   <SkeletonTable rows={5} cols={4} />
 *   <SkeletonTable />
 */
export function SkeletonTable({ rows = 5, cols = 5, className = '' }) {
  // Anchos pseudo-aleatorios para dar aspecto natural
  const colWidths = Array.from({ length: cols }, (_, i) =>
    i === 0 ? 'w-48' : `${40 + ((i * 7) % 30)}`
  );

  return (
    <div className={`bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#333] rounded-2xl overflow-hidden shadow-sm ${className}`}>
      {/* Header simulado */}
      <div className="bg-purple-100/50 dark:bg-[#0f1115] border-b border-purple-300 dark:border-[#333] px-6 py-4">
        <div className="flex gap-6">
          {colWidths.map((w, i) => (
            <Skeleton key={i} variant="text" className={w} />
          ))}
        </div>
      </div>
      {/* Filas */}
      <div className="divide-y divide-pink-100 dark:divide-[#262626]">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-6 px-6 py-5">
            {colWidths.map((w, colIdx) => (
              <Skeleton key={colIdx} variant="text" className={w} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}





