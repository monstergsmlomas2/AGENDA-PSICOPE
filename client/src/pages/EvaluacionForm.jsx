import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPacienteById } from '../services/pacientesService';
import { getEvaluaciones, crearEvaluacion, actualizarEvaluacion } from '../services/evaluacionesService';
import { ArrowLeft, Save, Loader2, ClipboardCheck } from 'lucide-react';
import { useToast } from '../components/ui';

const tiposTest = [
  { value: 'bender', label: 'Test de Bender (visomotriz)' },
  { value: 'wisc', label: 'WISC-IV / WISC-V (inteligencia)' },
  { value: 'htp', label: 'HTP / Figura Humana (proyectivos)' },
  { value: 'ple', label: 'Prueba de Lectura y Escritura (PLE)' },
  { value: 'raven', label: 'Test de Raven (matrices progresivas)' },
  { value: 'dictado', label: 'Dictado / Copia / Escritura espontánea' },
  { value: 'ludica', label: 'Entrevista lúdica diagnóstica' },
  { value: 'otro', label: 'Otro' },
];

export default function EvaluacionForm() {
  const { id, evalId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [paciente, setPaciente] = useState(null);
  const [tipoTest, setTipoTest] = useState('bender');
  const [fechaAdmin, setFechaAdmin] = useState(new Date().toISOString().split('T')[0]);
  const [resultados, setResultados] = useState('');
  const [puntaje, setPuntaje] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(!!evalId);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function cargar() {
      try {
        const pac = await getPacienteById(id);
        setPaciente(pac);
        if (evalId) {
          const evals = await getEvaluaciones(id);
          const ev = evals.find(e => String(e.id) === String(evalId));
          if (ev) {
            setTipoTest(ev.tipo_test || 'bender');
            setFechaAdmin((ev.fecha_administracion || '').split('T')[0] || new Date().toISOString().split('T')[0]);
            setResultados(ev.resultados || '');
            setPuntaje(ev.puntaje_obtenido || '');
            setObservaciones(ev.observaciones || '');
          }
        }
      } catch {
        toast.error('Error', 'No se pudo cargar la evaluación.');
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, [id, evalId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        paciente_id: Number(id),
        tipo_test: tipoTest,
        fecha_administracion: fechaAdmin,
        resultados,
        puntaje_obtenido: puntaje,
        observaciones,
      };
      if (evalId) {
        await actualizarEvaluacion(evalId, data);
        toast.success('Evaluación actualizada', 'Los cambios se guardaron correctamente.');
        navigate(`/pacientes/${id}/evaluaciones/${evalId}`);
      } else {
        await crearEvaluacion(data);
        toast.success('Evaluación creada', 'La evaluación fue registrada correctamente.');
        navigate(`/pacientes/${id}`);
      }
    } catch (err) {
      toast.error('Error', err?.message || 'No se pudo guardar la evaluación.');
    } finally {
      setSubmitting(false);
    }
  };

  const volverPath = evalId ? `/pacientes/${id}/evaluaciones/${evalId}` : `/pacientes/${id}`;

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
        <ArrowLeft size={18} /> {evalId ? 'Volver a la evaluación' : `Volver a ${paciente ? `${paciente.nombre} ${paciente.apellido}` : 'Paciente'}`}
      </button>

      <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="bg-purple-100/50 dark:bg-slate-950 border-b border-purple-300 dark:border-slate-800 px-8 py-6">
          <div className="flex items-center gap-2 text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 mb-1">
            <ClipboardCheck size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">
              {evalId ? 'Editar Evaluación' : 'Nueva Evaluación'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {evalId ? 'Editar Evaluación' : 'Registrar nueva evaluación'}
          </h1>
          {paciente && (
            <p className="text-sm text-slate-900 mt-1 capitalize">
              {paciente.nombre} {paciente.apellido}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 text-sm">
          <div>
            <label className="block mb-2 text-xs font-bold text-slate-900 uppercase tracking-wider">Tipo de Test *</label>
            <select value={tipoTest} onChange={(e) => setTipoTest(e.target.value)} required
              className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-800 bg-slate-950 text-slate-900 dark:text-white focus:border-pink-500 dark:focus:border-teal-500 font-medium">
              {tiposTest.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-xs font-bold text-slate-900 uppercase tracking-wider">Fecha de Administración</label>
            <input type="date" value={fechaAdmin} onChange={(e) => setFechaAdmin(e.target.value)}
              className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-800 bg-slate-950 text-slate-900 dark:text-white focus:border-pink-500 dark:focus:border-teal-500 dark:[&::-webkit-calendar-picker-indicator]:invert" />
          </div>

          <div>
            <label className="block mb-2 text-xs font-bold text-slate-900 uppercase tracking-wider">Resultados (descripción cualitativa)</label>
            <textarea value={resultados} onChange={(e) => setResultados(e.target.value)} rows="5"
              placeholder="Describí los resultados obtenidos..."
              className="w-full rounded-xl p-3.5 outline-none transition-colors resize-none border border-slate-800 bg-slate-950 text-slate-900 dark:text-white focus:border-pink-500 dark:focus:border-teal-500" />
          </div>

          <div>
            <label className="block mb-2 text-xs font-bold text-slate-900 uppercase tracking-wider">Puntaje Obtenido</label>
            <input type="text" value={puntaje} onChange={(e) => setPuntaje(e.target.value)}
              placeholder="Ej: CI: 95, Percentil 37"
              className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-800 bg-slate-950 text-slate-900 dark:text-white focus:border-pink-500 dark:focus:border-teal-500" />
          </div>

          <div>
            <label className="block mb-2 text-xs font-bold text-slate-900 uppercase tracking-wider">Observaciones</label>
            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows="4"
              placeholder="Notas adicionales..."
              className="w-full rounded-xl p-3.5 outline-none transition-colors resize-none border border-slate-800 bg-slate-950 text-slate-900 dark:text-white focus:border-pink-500 dark:focus:border-teal-500" />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
            <button type="button" onClick={() => navigate(volverPath)} disabled={submitting}
              className="px-5 py-2.5 text-sm font-bold rounded-xl text-slate-900 hover:text-slate-700 dark:text-white hover:bg-slate-800 transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl bg-pink-500 dark:bg-teal-600 hover:bg-pink-400 dark:hover:bg-teal-500 text-slate-900 dark:text-white transition-colors disabled:opacity-50 shadow-lg shadow-pink-500/20 dark:shadow-teal-500/20">
              {submitting && <Loader2 size={14} className="animate-spin" />}
              <Save size={14} />
              {evalId ? 'Guardar Cambios' : 'Crear Evaluación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}







