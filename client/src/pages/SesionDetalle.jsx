import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSesiones, eliminarSesion } from '../services/pacientesService';
import { getPacienteById } from '../services/pacientesService';
import { ArrowLeft, Edit, Trash2, Calendar, ClipboardList } from 'lucide-react';
import { useToast } from '../components/ui';
import { useConfirm } from '../hooks/useConfirm';

export default function SesionDetalle() {
  const { id, sesionId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm, ConfirmModal } = useConfirm();

  const [sesion, setSesion] = useState(null);
  const [sesionIdx, setSesionIdx] = useState(null);
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      setLoading(true);
      try {
        const [sesiones, pac] = await Promise.all([
          getSesiones(id),
          getPacienteById(id),
        ]);
        const idx = sesiones.findIndex(s => String(s.id) === String(sesionId));
        setSesion(sesiones[idx] ?? null);
        setSesionIdx(idx);
        setPaciente(pac);
      } catch {
        toast.error('Error', 'No se pudo cargar la sesiÃ³n.');
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, [id, sesionId]);

  const handleEliminar = async () => {
    const ok = await confirm({
      title: 'Eliminar sesiÃ³n',
      message: `Â¿EstÃ¡s seguro de que querÃ©s eliminar esta sesiÃ³n?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await eliminarSesion(id, sesionId);
      toast.success('SesiÃ³n eliminada', 'La sesiÃ³n fue eliminada correctamente.');
      navigate(`/pacientes/${id}`);
    } catch {
      toast.error('Error', 'No se pudo eliminar la sesiÃ³n.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-40 bg-pink-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-64 bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (!sesion) {
    return (
      <div className="text-center py-20 text-slate-900 dark:text-slate-400">
        <p className="text-lg font-bold">SesiÃ³n no encontrada</p>
        <button onClick={() => navigate(`/pacientes/${id}`)} className="mt-4 text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 hover:underline font-medium">
          Volver al paciente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-200 animate-fade-in w-full">
      <ConfirmModal />

      <button
        onClick={() => navigate(`/pacientes/${id}`)}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-slate-700 dark:text-white transition-colors"
      >
        <ArrowLeft size={18} />
        Volver a {paciente ? `${paciente.nombre} ${paciente.apellido}` : 'Paciente'}
      </button>

      <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="bg-purple-100/50 dark:bg-slate-950 border-b border-purple-300 dark:border-slate-800 px-8 py-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <ClipboardList size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">
                {sesionIdx !== null && sesionIdx >= 0 ? `SesiÃ³n #${sesionIdx + 1}` : 'SesiÃ³n'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Calendar size={20} className="text-slate-900" />
              {new Date((sesion.fecha || '').split('T')[0] + 'T12:00:00Z').toLocaleDateString('es-AR', {
                weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
              })}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/pacientes/${id}/sesiones/${sesionId}/editar`)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
            >
              <Edit size={14} /> Editar
            </button>
            <button
              onClick={handleEliminar}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6 text-sm">
          {sesion.actividades_realizadas ? (
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-slate-900 mb-3">Actividades Realizadas</p>
              <p className="leading-relaxed text-slate-300 whitespace-pre-wrap">{sesion.actividades_realizadas}</p>
            </div>
          ) : (
            <p className="text-slate-900 italic">Sin actividades registradas.</p>
          )}

          {sesion.observaciones && (
            <div className="border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-xl p-5">
              <p className="text-xs uppercase tracking-wider font-bold text-slate-900 mb-3">Observaciones / EvoluciÃ³n</p>
              <p className="leading-relaxed text-slate-300 whitespace-pre-wrap">{sesion.observaciones}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}








