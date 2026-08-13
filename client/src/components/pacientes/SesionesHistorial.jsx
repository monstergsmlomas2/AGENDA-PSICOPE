import { ClipboardList } from 'lucide-react';

export default function SesionesHistorial({ sesiones, onNuevaSesion }) {
  if (sesiones.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <ClipboardList size={22} className="text-teal-600 dark:text-teal-400"/> Historial de Sesiones
          </h3>
          <button onClick={onNuevaSesion} className="border border-teal-600 text-teal-600 hover:bg-teal-50 dark:border-teal-500 dark:text-teal-400 dark:hover:bg-teal-950/30 px-5 py-2.5 rounded-xl transition-colors text-sm font-semibold">
            + Nueva Sesión
          </button>
        </div>
        <div className="text-center py-12 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-slate-900 dark:text-white font-medium">No hay sesiones registradas aún.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
          <ClipboardList size={22} className="text-teal-600 dark:text-teal-400"/> Historial de Sesiones
        </h3>
        <button onClick={onNuevaSesion} className="border border-teal-600 text-teal-600 hover:bg-teal-50 dark:border-teal-500 dark:text-teal-400 dark:hover:bg-teal-950/30 px-5 py-2.5 rounded-xl transition-colors text-sm font-semibold">
          + Nueva Sesión
        </button>
      </div>

      <div className="space-y-4">
        {sesiones.map(s => (
          <div key={s.id} className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:border-teal-500/50 transition-colors">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-teal-600 dark:text-teal-400 text-lg">
                {new Date(s.fecha + 'T12:00:00Z').toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="space-y-3 text-sm">
              {s.actividades_realizadas && (
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Actividades:</span>
                  <p className="text-slate-900 dark:text-white mt-1 leading-relaxed">{s.actividades_realizadas}</p>
                </div>
              )}
              {s.observaciones && (
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Observaciones:</span>
                  <p className="text-slate-900 dark:text-white mt-1 leading-relaxed">{s.observaciones}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}





