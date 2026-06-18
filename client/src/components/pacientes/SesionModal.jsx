import { ClipboardList } from 'lucide-react';

export default function SesionModal({ show, onClose, onSubmit, fechaSesion, setFechaSesion, actividades, setActividades, observaciones, setObservaciones }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-8 py-6 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Registrar Evolución</h2>
            <p className="text-sm mt-1 text-slate-900 dark:text-white">Cargá las actividades y observaciones del día.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-white transition-colors">✕</button>
        </div>
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          <form id="sesionForm" onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 font-semibold text-slate-900 dark:text-white">Fecha de la Sesión</label>
              <input type="date" value={fechaSesion} onChange={(e)=>setFechaSesion(e.target.value)} required className="w-full rounded-xl p-3 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 dark:[&::-webkit-calendar-picker-indicator]:invert" />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-slate-900 dark:text-white">Actividades Realizadas</label>
              <textarea value={actividades} onChange={(e)=>setActividades(e.target.value)} rows="3" placeholder="Juegos, tests administrados, técnicas..." required className="w-full rounded-xl p-3 outline-none transition-colors resize-none border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500"></textarea>
            </div>
            <div>
              <label className="block mb-2 font-semibold text-slate-900 dark:text-white">Observaciones / Evolución</label>
              <textarea value={observaciones} onChange={(e)=>setObservaciones(e.target.value)} rows="4" placeholder="Comportamiento, logros, cosas a reforzar..." required className="w-full rounded-xl p-3 outline-none transition-colors resize-none border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500"></textarea>
            </div>
          </form>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-8 py-5 flex justify-end gap-4 shrink-0">
          <button type="button" onClick={onClose} className="px-6 py-2.5 font-bold rounded-xl transition-colors text-slate-900 hover:bg-slate-200 dark:text-white dark:hover:bg-slate-800">Cancelar</button>
          <button type="submit" form="sesionForm" className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-teal-500/20 transition-all">Guardar Sesión</button>
        </div>
      </div>
    </div>
  );
}





