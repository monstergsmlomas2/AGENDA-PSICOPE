import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSesiones, crearSesion, actualizarSesion } from '../services/pacientesService';
import { getPacienteById } from '../services/pacientesService';
import { ArrowLeft, Save, Loader2, ClipboardList } from 'lucide-react';
import { useToast } from '../components/ui';

export default function SesionForm() {
  const { id, sesionId } = useParams(); // sesionId presente solo al editar
  const navigate = useNavigate();
  const toast = useToast();

  const [paciente, setPaciente] = useState(null);
  const [fecha, setFecha] = useState(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  });
  const [actividades, setActividades] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(!!sesionId);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function cargar() {
      try {
        const pac = await getPacienteById(id);
        setPaciente(pac);
        if (sesionId) {
          const sesiones = await getSesiones(id);
          const s = sesiones.find(s => String(s.id) === String(sesionId));
          if (s) {
            setFecha(s.fecha ? s.fecha.split('T')[0] : new Date().toISOString().split('T')[0]);
            setActividades(s.actividades_realizadas || '');
            setObservaciones(s.observaciones || '');
          }
        }
      } catch {
        toast.error('Error', 'No se pudo cargar la sesiÃ³n.');
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, [id, sesionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = { fecha, actividades_realizadas: actividades, observaciones };
      if (sesionId) {
        await actualizarSesion(id, sesionId, data);
        toast.success('SesiÃ³n actualizada', 'Los cambios se guardaron correctamente.');
        navigate(`/pacientes/${id}/sesiones/${sesionId}`);
      } else {
        await crearSesion(id, data);
        toast.success('SesiÃ³n guardada', 'La sesiÃ³n fue registrada correctamente.');
        navigate(`/pacientes/${id}`);
      }
    } catch (err) {
      toast.error('Error', err?.message || 'No se pudo guardar la sesiÃ³n.');
    } finally {
      setSubmitting(false);
    }
  };

  const volverLabel = sesionId
    ? 'Volver a la sesiÃ³n'
    : `Volver a ${paciente ? `${paciente.nombre} ${paciente.apellido}` : 'Paciente'}`;

  const volverPath = sesionId
    ? `/pacientes/${id}/sesiones/${sesionId}`
    : `/pacientes/${id}`;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse w-full">
        <div className="h-8 w-40 bg-pink-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-96 bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-200 animate-fade-in w-full">
      <button
        onClick={() => navigate(volverPath)}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-slate-700 dark:text-white transition-colors"
      >
        <ArrowLeft size={18} /> {volverLabel}
      </button>

      <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="bg-purple-100/50 dark:bg-slate-950 border-b border-purple-300 dark:border-slate-800 px-8 py-6">
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <ClipboardList size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">
              {sesionId ? 'Editar SesiÃ³n' : 'Nueva SesiÃ³n'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {sesionId ? 'Editar SesiÃ³n' : 'Registrar nueva sesiÃ³n'}
          </h1>
          {paciente && (
            <p className="text-sm text-slate-900 mt-1 capitalize">
              {paciente.nombre} {paciente.apellido}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 text-sm">
          <div>
            <label className="block mb-2 text-xs font-bold text-slate-900 uppercase tracking-wider">Fecha *</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-800 bg-slate-950 text-slate-900 dark:text-white focus:border-blue-500 dark:[&::-webkit-calendar-picker-indicator]:invert"
            />
          </div>

          <div>
            <label className="block mb-2 text-xs font-bold text-slate-900 uppercase tracking-wider">Actividades Realizadas *</label>
            <textarea
              value={actividades}
              onChange={(e) => setActividades(e.target.value)}
              rows="5"
              required
              placeholder="Juegos, tests administrados, tÃ©cnicas utilizadas..."
              className="w-full rounded-xl p-3.5 outline-none transition-colors resize-none border border-slate-800 bg-slate-950 text-slate-900 dark:text-white focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block mb-2 text-xs font-bold text-slate-900 uppercase tracking-wider">Observaciones / EvoluciÃ³n</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows="5"
              placeholder="Comportamiento, logros, cosas a reforzar..."
              className="w-full rounded-xl p-3.5 outline-none transition-colors resize-none border border-slate-800 bg-slate-950 text-slate-900 dark:text-white focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => navigate(volverPath)}
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-bold rounded-xl text-slate-900 hover:text-slate-700 dark:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl bg-pink-500 dark:bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/20"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              <Save size={14} />
              {sesionId ? 'Guardar Cambios' : 'Guardar SesiÃ³n'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}






