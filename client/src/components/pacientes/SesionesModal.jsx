import { useState, useEffect } from 'react';
import { ClipboardList, Plus, X, Calendar } from 'lucide-react';
import { getSesiones } from '../../services/pacientesService';

export default function SesionesModal({ paciente, onClose, onSave }) {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [fechaSesion, setFechaSesion] = useState(new Date().toISOString().split('T')[0]);
  const [actividades, setActividades] = useState("");
  const [observaciones, setObservaciones] = useState("");

  if (!paciente) return null;

  const cargarSesiones = async () => {
    setLoading(true);
    const data = await getSesiones(paciente.id);
    setSesiones(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    cargarSesiones();
  }, [paciente.id]);

  const resetForm = () => {
    setFechaSesion(new Date().toISOString().split('T')[0]);
    setActividades("");
    setObservaciones("");
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave({ fecha: fechaSesion, actividades_realizadas: actividades, observaciones });
      resetForm();
      await cargarSesiones();
    } catch {
      // error manejado por el padre
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-950 w-full max-w-2xl max-h-[85vh] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 flex items-center gap-3">
              <ClipboardList size={26} /> Sesiones
            </h2>
            <p className="text-slate-900 dark:text-white text-sm mt-1">
              Paciente: <span className="capitalize font-semibold">{paciente.nombre} {paciente.apellido}</span>
              <span className="ml-3 text-xs text-slate-900">({sesiones.length} sesión{sesiones.length !== 1 ? 'es' : ''})</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white px-4 py-2 rounded-xl transition-all text-sm font-bold shadow-md shadow-teal-500/20"
              >
                <Plus size={16} /> Nueva Sesión
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors shadow-sm">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 text-sm">

          {/* Formulario de nueva sesión */}
          {showForm && (
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar size={18} className="text-teal-600 dark:text-teal-400" />
                  Registrar nueva sesión
                </h3>
                <button onClick={resetForm} className="text-xs text-slate-900 hover:text-slate-700 dark:text-white dark:hover:text-white font-medium transition-colors">
                  Cancelar
                </button>
              </div>
              <form id="sesionForm" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-1.5 font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Fecha de la Sesión</label>
                  <input
                    type="date"
                    value={fechaSesion}
                    onChange={(e) => setFechaSesion(e.target.value)}
                    required
                    className="w-full rounded-xl p-3 outline-none transition-colors border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 dark:[&::-webkit-calendar-picker-indicator]:invert shadow-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Actividades Realizadas</label>
                  <textarea
                    value={actividades}
                    onChange={(e) => setActividades(e.target.value)}
                    rows="3"
                    placeholder="Juegos, tests administrados, técnicas..."
                    required
                    className="w-full rounded-xl p-3 outline-none transition-colors resize-none border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium"
                  ></textarea>
                </div>
                <div>
                  <label className="block mb-1.5 font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Observaciones / Evolución</label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows="3"
                    placeholder="Comportamiento, logros, aspectos a reforzar..."
                    className="w-full rounded-xl p-3 outline-none transition-colors resize-none border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium"
                  ></textarea>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    form="sesionForm"
                    disabled={submitting}
                    className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-teal-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {submitting ? 'Guardando...' : 'Guardar Sesión'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Historial de sesiones */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-2">
              <ClipboardList size={18} className="text-teal-600 dark:text-teal-400" />
              Historial de Sesiones
            </h3>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-slate-100 dark:bg-slate-900 rounded-xl p-5 animate-pulse">
                    <div className="h-5 w-36 bg-slate-300 dark:bg-slate-800 rounded mb-3" />
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded mb-2" />
                    <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                ))}
              </div>
            ) : sesiones.length === 0 ? (
              <div className="text-center py-10 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <ClipboardList size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-slate-900 dark:text-white font-medium">No hay sesiones registradas aún.</p>
                {!showForm && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-3 text-teal-600 dark:text-teal-400 font-bold text-sm hover:underline"
                  >
                    + Registrar primera sesión
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {sesiones.map((s) => (
                  <div
                    key={s.id}
                    className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-teal-500/50 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-teal-600 dark:text-teal-400">
                        {new Date(s.fecha + 'T12:00:00Z').toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {s.actividades_realizadas && (
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">Actividades:</span>
                          <p className="text-slate-900 dark:text-white mt-0.5 leading-relaxed">{s.actividades_realizadas}</p>
                        </div>
                      )}
                      {s.observaciones && (
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">Observaciones:</span>
                          <p className="text-slate-900 dark:text-white mt-0.5 leading-relaxed">{s.observaciones}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-8 py-4 flex justify-end shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 text-slate-900 hover:text-slate-700 dark:text-white dark:hover:text-white font-bold transition-colors rounded-xl">
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}





