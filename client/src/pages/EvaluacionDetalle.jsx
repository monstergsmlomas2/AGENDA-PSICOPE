import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPacienteById } from '../services/pacientesService';
import { getEvaluaciones, eliminarEvaluacion } from '../services/evaluacionesService';
import { ArrowLeft, Edit, Trash2, Calendar, Star, ClipboardCheck } from 'lucide-react';
import { useToast } from '../components/ui';
import { useConfirm } from '../hooks/useConfirm';

const tiposTest = [
  { value: 'bender', label: 'Test de Bender (visomotriz)' },
  { value: 'wisc', label: 'WISC-IV / WISC-V (inteligencia)' },
  { value: 'htp', label: 'HTP / Figura Humana (proyectivos)' },
  { value: 'ple', label: 'Prueba de Lectura y Escritura (PLE)' },
  { value: 'raven', label: 'Test de Raven (matrices progresivas)' },
  { value: 'dictado', label: 'Dictado / Copia / Escritura espontÃ¡nea' },
  { value: 'ludica', label: 'Entrevista lÃºdica diagnÃ³stica' },
  { value: 'otro', label: 'Otro' },
];

export default function EvaluacionDetalle() {
  const { id, evalId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm, ConfirmModal } = useConfirm();

  const [evaluacion, setEvaluacion] = useState(null);
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const [evals, pac] = await Promise.all([getEvaluaciones(id), getPacienteById(id)]);
        const ev = evals.find(e => String(e.id) === String(evalId));
        setEvaluacion(ev ?? null);
        setPaciente(pac);
      } catch {
        toast.error('Error', 'No se pudo cargar la evaluaciÃ³n.');
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, [id, evalId]);

  const handleEliminar = async () => {
    const ok = await confirm({
      title: 'Eliminar evaluaciÃ³n',
      message: 'Â¿EstÃ¡s seguro de que querÃ©s eliminar esta evaluaciÃ³n?',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await eliminarEvaluacion(evalId);
      toast.success('EvaluaciÃ³n eliminada', 'La evaluaciÃ³n fue eliminada correctamente.');
      navigate(`/pacientes/${id}`);
    } catch {
      toast.error('Error', 'No se pudo eliminar la evaluaciÃ³n.');
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

  if (!evaluacion) {
    return (
      <div className="text-center py-20 text-slate-900 dark:text-slate-400">
        <p className="text-lg font-bold">EvaluaciÃ³n no encontrada</p>
        <button onClick={() => navigate(`/pacientes/${id}`)} className="mt-4 text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 hover:underline font-medium">Volver al paciente</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-200 animate-fade-in">
      <ConfirmModal />

      <button onClick={() => navigate(`/pacientes/${id}`)}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-slate-700 dark:text-white transition-colors">
        <ArrowLeft size={18} /> Volver a {paciente ? `${paciente.nombre} ${paciente.apellido}` : 'Paciente'}
      </button>

      <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="bg-purple-100/50 dark:bg-slate-950 border-b border-purple-300 dark:border-slate-800 px-8 py-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 mb-1">
              <ClipboardCheck size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">EvaluaciÃ³n</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {tiposTest.find(t => t.value === evaluacion.tipo_test)?.label || evaluacion.tipo_test}
            </h1>
            {paciente && <p className="text-sm text-slate-900 mt-1 capitalize">{paciente.nombre} {paciente.apellido}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate(`/pacientes/${id}/evaluaciones/${evalId}/editar`)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-teal-500/10 text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 border border-teal-500/30 hover:bg-teal-500/20 transition-colors">
              <Edit size={14} /> Editar
            </button>
            <button onClick={handleEliminar}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors">
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6 text-sm">
          {evaluacion.fecha_administracion && (
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 p-1.5 rounded-lg text-slate-900"><Calendar size={14} /></div>
              <span className="font-medium text-slate-300">
                {new Date((evaluacion.fecha_administracion || '').split('T')[0] + 'T12:00:00Z').toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}
          {evaluacion.puntaje_obtenido && (
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 p-1.5 rounded-lg text-slate-900"><Star size={14} /></div>
              <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-lg text-xs font-bold border border-blue-500/30">
                {evaluacion.puntaje_obtenido}
              </span>
            </div>
          )}
          {evaluacion.resultados && (
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-slate-900 mb-3">Resultados</p>
              <p className="leading-relaxed whitespace-pre-wrap text-slate-300">{evaluacion.resultados}</p>
            </div>
          )}
          {evaluacion.observaciones && (
            <div className="border border-purple-300 dark:bg-slate-950 dark:border-slate-800 rounded-xl p-5">
              <p className="text-xs uppercase tracking-wider font-bold text-slate-900 mb-3">Observaciones</p>
              <p className="leading-relaxed whitespace-pre-wrap text-slate-300">{evaluacion.observaciones}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}








