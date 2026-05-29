import { useState, useEffect } from 'react';
import { ClipboardCheck, Plus, Search, Edit, Trash2, X, Calendar, FileText, Star, Eye, AlertTriangle } from 'lucide-react';
import { getEvaluaciones, getEvaluacionesProximasVencer, crearEvaluacion, actualizarEvaluacion, eliminarEvaluacion } from '../services/evaluacionesService';
import { getPacientes } from '../services/pacientesService';
import { useToast, ErrorState, EmptyState, Button } from '../components/ui';
import { useConfirm } from '../hooks/useConfirm';

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

export default function Evaluaciones() {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [proximasVencer, setProximasVencer] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroPaciente, setFiltroPaciente] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [pacienteId, setPacienteId] = useState("");
  const [tipoTest, setTipoTest] = useState("bender");
  const [fechaAdmin, setFechaAdmin] = useState(new Date().toISOString().split('T')[0]);
  const [resultados, setResultados] = useState("");
  const [puntajeObtenido, setPuntajeObtenido] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const { confirm, ConfirmModal } = useConfirm();

  const cargarData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dataEvals, dataPacientes, dataProximas] = await Promise.all([
        getEvaluaciones(filtroPaciente || null),
        getPacientes(),
        getEvaluacionesProximasVencer(),
      ]);
      setEvaluaciones(Array.isArray(dataEvals) ? dataEvals : []);
      setPacientes(Array.isArray(dataPacientes) ? dataPacientes : []);
      setProximasVencer(Array.isArray(dataProximas) ? dataProximas : []);
    } catch {
      setError('No se pudieron cargar las evaluaciones. Verificá tu conexión e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarData(); }, [filtroPaciente]);

  const resetForm = () => {
    setPacienteId(""); setTipoTest("bender");
    setFechaAdmin(new Date().toISOString().split('T')[0]);
    setResultados(""); setPuntajeObtenido(""); setObservaciones("");
    setEditing(null);
  };

  const openEdit = (ev) => {
    setEditing(ev.id);
    setPacienteId(ev.paciente_id);
    setTipoTest(ev.tipo_test);
    setFechaAdmin((ev.fecha_administracion || '').split('T')[0] || new Date().toISOString().split('T')[0]);
    setResultados(ev.resultados || "");
    setPuntajeObtenido(ev.puntaje_obtenido || "");
    setObservaciones(ev.observaciones || "");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        paciente_id: Number(pacienteId),
        tipo_test: tipoTest,
        fecha_administracion: fechaAdmin,
        resultados,
        puntaje_obtenido: puntajeObtenido,
        observaciones,
      };

      if (editing) {
        await actualizarEvaluacion(editing, data);
      } else {
        await crearEvaluacion(data);
      }

      resetForm();
      setShowModal(false);
      await cargarData();
    } catch {
      // Error handled by service
    } finally {
      setSubmitting(false);
    }
  };

  const toast = useToast();

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Eliminar evaluación',
      message: '¿Estás seguro de que querés eliminar esta evaluación? Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      variant: 'danger'
    });
    if (!ok) return;
    try {
      await eliminarEvaluacion(id);
      await cargarData();
      toast.success('Evaluación eliminada', 'La evaluación fue eliminada correctamente.');
    } catch {
      toast.error('Error', 'No se pudo eliminar la evaluación.');
    }
  };

  const getTipoTestLabel = (val) => tiposTest.find(t => t.value === val)?.label || val;

  const evaluacionesFiltradas = evaluaciones
    .filter(ev => !filtroTipo || ev.tipo_test === filtroTipo)
    .filter(ev => {
      if (!searchTerm) return true;
      const fullName = `${ev.paciente_nombre} ${ev.paciente_apellido}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });

  if (loading) {
    return (
      <div className="space-y-6 text-slate-900 dark:text-slate-200">
        <div className="flex items-center justify-between mb-5">
          <div className="space-y-3">
            <div className="h-8 w-56 bg-pink-200 dark:bg-[#262626] rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-pink-200 dark:bg-[#262626] rounded animate-pulse" />
          </div>
          <div className="h-12 w-44 bg-pink-200 dark:bg-[#262626] rounded-xl animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#262626] rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-pink-200 dark:bg-[#262626] rounded-xl animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 bg-pink-200 dark:bg-[#262626] rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-pink-200 dark:bg-[#262626] rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-3 border-t border-slate-100 dark:border-[#262626] pt-4">
                <div className="h-4 w-full bg-pink-200 dark:bg-[#262626] rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-pink-200 dark:bg-[#262626] rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-pink-200 dark:bg-[#262626] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorState
          title="Error al cargar evaluaciones"
          message={error}
          onRetry={cargarData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-200">

      <ConfirmModal />

      {/* Cabecera */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 text-slate-900 dark:text-white">
            <span className="bg-pink-100 text-slate-900 font-bold dark:text-pink-600 dark:bg-teal-500/10 dark:text-teal-400 p-2.5 rounded-xl border border-teal-500/20 shadow-inner">
              <ClipboardCheck size={24} />
            </span>
            Evaluaciones
          </h1>
          <p className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 mt-2 font-medium">Registro de tests y evaluaciones psicopedagógicas.</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-6 py-2.5 rounded-xl transition-all font-bold shadow-lg shadow-teal-500/20 hover:-translate-y-0.5">
          <Plus size={20} /> Nueva Evaluación
        </button>
      </div>

      {/* Banner: Próximas a vencer */}
      {proximasVencer.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">
              {proximasVencer.length} evaluación{proximasVencer.length > 1 ? 'es' : ''} próxima{proximasVencer.length > 1 ? 's' : ''} a vencer (30 días)
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {proximasVencer.map(ev => (
                <span key={ev.id} className="inline-flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg font-medium border border-amber-200 dark:border-amber-500/30">
                  {ev.paciente_nombre} {ev.paciente_apellido} — vence {new Date(ev.fecha_vencimiento + 'T12:00:00Z').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500 dark:text-slate-500" size={18} />
          <input type="text" placeholder="Buscar por paciente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-teal-500 dark:focus:border-teal-500 transition-shadow shadow-sm"
          />
        </div>
        <select value={filtroPaciente} onChange={(e) => setFiltroPaciente(e.target.value)}
          className="border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-300 rounded-xl py-3 px-4 text-sm outline-none focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium">
          <option value="">Todos los pacientes</option>
          {pacientes.map(p => (
            <option key={p.id} value={p.id}>{p.apellido}, {p.nombre}</option>
          ))}
        </select>
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
          className="border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-300 rounded-xl py-3 px-4 text-sm outline-none focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium">
          <option value="">Todos los tipos</option>
          {tiposTest.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Lista de Evaluaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {evaluaciones.length === 0 && !loading && (
          <div className="col-span-full">
            <EmptyState
              icon={ClipboardCheck}
              title="No hay evaluaciones registradas"
              description='Hacé clic en "Nueva Evaluación" para empezar.'
              action={{ label: 'Nueva Evaluación', onClick: () => { resetForm(); setShowModal(true); } }}
            />
          </div>
        )}
        {evaluacionesFiltradas.map((ev, idx) => (
            <div key={ev.id} className={`stagger-${Math.min(idx + 1, 12)} animate-fade-in-up bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#262626] rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-pink-500/50 dark:hover:border-teal-500/50 shadow-sm group relative`}>
              <button onClick={() => handleDelete(ev.id)} className="absolute top-4 right-4 text-slate-900 hover:text-red-500 bg-slate-50 dark:bg-[#1a1c23] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-transparent dark:hover:border-[#333]">
                <Trash2 size={16} />
              </button>

              <div className="flex items-start gap-4 mb-4">
                <div className="bg-teal-50 dark:bg-teal-500/10 p-3 rounded-xl text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 shrink-0">
                  <ClipboardCheck size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg capitalize text-slate-900 dark:text-white truncate">
                    {ev.paciente_nombre} {ev.paciente_apellido}
                  </h3>
                  <p className="text-sm text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 font-medium mt-0.5">
                    {getTipoTestLabel(ev.tipo_test)}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-slate-900 dark:text-slate-300 font-medium border-t border-slate-100 dark:border-[#262626] pt-4">
                {ev.fecha_administracion && (
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400">
                      <Calendar size={14} />
                    </div>
                    <span>{new Date((ev.fecha_administracion || '').split('T')[0] + 'T12:00:00Z').toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
                {ev.puntaje_obtenido && (
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400">
                      <Star size={14} />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">{ev.puntaje_obtenido}</span>
                  </div>
                )}
                {ev.resultados && (
                  <p className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs leading-relaxed line-clamp-3 mt-1">
                    {ev.resultados}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#262626] flex justify-between items-center">
                <button onClick={() => setViewing(ev)} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  <Eye size={14} /> Ver detalle
                </button>
                <button onClick={() => openEdit(ev)} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
                  <Edit size={14} /> Editar
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* MODAL: NUEVA / EDITAR EVALUACIÃ“N */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#141414] w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-300 dark:border-[#333]">
            <div className="border-b border-purple-300 dark:border-[#262626] bg-purple-100/50 dark:bg-[#0f1115] px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{editing ? 'Editar Evaluación' : 'Nueva Evaluación'}</h2>
                <p className="text-sm mt-1 text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 font-medium">Registrá un test o evaluación administrada.</p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2.5 rounded-xl border border-purple-300 dark:border-[#333] bg-white dark:bg-[#1a1c23] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-900 dark:text-slate-400 transition-colors shadow-sm">✕</button>
            </div>

            <div className="p-5 text-sm overflow-y-auto flex-1 custom-scrollbar">
              <form id="evalForm" onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block mb-2 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Paciente *</label>
                  <select value={pacienteId} onChange={(e)=>setPacienteId(e.target.value)} required className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium">
                    <option value="">Seleccionar paciente...</option>
                    {pacientes.map(p => (
                      <option key={p.id} value={p.id}>{p.apellido}, {p.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Tipo de Test *</label>
                  <select value={tipoTest} onChange={(e)=>setTipoTest(e.target.value)} required className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium">
                    {tiposTest.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Fecha de Administración</label>
                  <input type="date" value={fechaAdmin} onChange={(e)=>setFechaAdmin(e.target.value)} className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 dark:[&::-webkit-calendar-picker-indicator]:invert shadow-sm font-medium" />
                </div>

                <div>
                  <label className="block mb-2 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Resultados (descripción cualitativa)</label>
                  <textarea value={resultados} onChange={(e)=>setResultados(e.target.value)} rows="4" className="w-full rounded-xl p-3.5 outline-none transition-colors resize-none border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium" placeholder="Describí los resultados obtenidos..."></textarea>
                </div>

                <div>
                  <label className="block mb-2 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Puntaje Obtenido</label>
                  <input type="text" value={puntajeObtenido} onChange={(e)=>setPuntajeObtenido(e.target.value)} className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium" placeholder="Ej: CI: 95, Percentil 37" />
                </div>

                <div>
                  <label className="block mb-2 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Observaciones</label>
                  <textarea value={observaciones} onChange={(e)=>setObservaciones(e.target.value)} rows="3" className="w-full rounded-xl p-3.5 outline-none transition-colors resize-none border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium" placeholder="Notas adicionales..."></textarea>
                </div>
              </form>
            </div>

            <div className="border-t border-purple-300 dark:border-[#262626] bg-purple-100/50 dark:bg-[#0f1115] px-6 py-4 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => { setShowModal(false); resetForm(); }} disabled={submitting} className="px-5 py-2 font-bold rounded-xl transition-colors text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white disabled:opacity-50">Cancelar</button>
              <Button type="submit" form="evalForm" loading={submitting}>
                {editing ? 'Guardar Cambios' : 'Crear Evaluación'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETALLE DE EVALUACIÃ“N (solo lectura) */}
      {viewing && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#141414] w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-300 dark:border-[#333]">
            <div className="border-b border-purple-300 dark:border-[#262626] bg-purple-100/50 dark:bg-[#0f1115] px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{getTipoTestLabel(viewing.tipo_test)}</h2>
                <p className="text-sm mt-1 text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 font-medium capitalize">
                  {viewing.paciente_nombre} {viewing.paciente_apellido}
                </p>
              </div>
              <button onClick={() => setViewing(null)} className="p-2.5 rounded-xl border border-purple-300 dark:border-[#333] bg-white dark:bg-[#1a1c23] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-900 dark:text-slate-400 transition-colors shadow-sm">✕</button>
            </div>

            <div className="p-5 space-y-4 text-sm overflow-y-auto flex-1 custom-scrollbar">
              {viewing.fecha_administracion && (
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400">
                    <Calendar size={14} />
                  </div>
                  <span className="font-medium text-slate-900 dark:text-slate-300">
                    {new Date((viewing.fecha_administracion || '').split('T')[0] + 'T12:00:00Z').toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              )}

              {viewing.puntaje_obtenido && (
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400">
                    <Star size={14} />
                  </div>
                  <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-lg text-xs font-bold border border-blue-200 dark:border-blue-500/30">
                    {viewing.puntaje_obtenido}
                  </span>
                </div>
              )}

              {viewing.resultados && (
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 mb-2">Resultados</p>
                  <p className="leading-relaxed whitespace-pre-wrap text-sm text-slate-900 dark:text-slate-400">
                    {viewing.resultados}
                  </p>
                </div>
              )}

              {viewing.observaciones && (
                <div className="bg-purple-100/50 dark:bg-[#0f1115] border border-purple-300 dark:border-[#262626] rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 mb-2">Observaciones</p>
                  <p className="leading-relaxed whitespace-pre-wrap text-sm text-slate-900 dark:text-slate-400">
                    {viewing.observaciones}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-purple-300 dark:border-[#262626] bg-purple-100/50 dark:bg-[#0f1115] px-6 py-4 flex justify-end gap-3 shrink-0">
              <button onClick={() => setViewing(null)} className="px-6 py-3 font-bold rounded-xl transition-colors text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white">
                Cerrar
              </button>
              <button onClick={() => { openEdit(viewing); setViewing(null); }} className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-teal-500/20 transition-all hover:-translate-y-0.5">
                <Edit size={16} /> Editar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}








