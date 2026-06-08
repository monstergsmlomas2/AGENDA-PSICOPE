import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Edit, Trash2, X, Filter, Printer, Download, CheckCircle, Clock, Eye, ArrowLeft, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { useVoiceDictation } from '../hooks/useVoiceDictation';
import { getInformes, getInforme, getInformesProximosVencer, crearInforme, actualizarInforme, eliminarInforme } from '../services/informesService';
import { getPacientes } from '../services/pacientesService';
import { generarInforme as generarInformeIA } from '../services/iaService';
import { consultorio } from '../config/consultorio';
import { useToast, SkeletonTable, ErrorState, EmptyState, Button } from '../components/ui';
import { useConfirm } from '../hooks/useConfirm';

const tiposInforme = [
  { value: 'diagnostico', label: 'Informe Diagnóstico Psicopedagógico' },
  { value: 'evolucion', label: 'Informe de Evolución (periódico)' },
  { value: 'escolar', label: 'Informe Escolar (para docentes/directivos)' },
  { value: 'obra_social', label: 'Informe para Obra Social' },
  { value: 'derivacion', label: 'Derivación a otro profesional' },
  { value: 'asistencia', label: 'Certificado de Asistencia' },
];

const seccionesPorTipo = {
  diagnostico: [
    { key: 'motivo_consulta', label: 'Motivo de Consulta' },
    { key: 'tecnicas_administradas', label: 'Técnicas Administradas' },
    { key: 'resultados_obtenidos', label: 'Resultados Obtenidos' },
    { key: 'diagnostico_presuntivo', label: 'Diagnóstico Presuntivo' },
    { key: 'orientaciones', label: 'Orientaciones y Sugerencias' },
  ],
  evolucion: [
    { key: 'periodo', label: 'Período' },
    { key: 'objetivos_trabajados', label: 'Objetivos Trabajados' },
    { key: 'logros_alcanzados', label: 'Logros Alcanzados' },
    { key: 'aspectos_continuar', label: 'Aspectos a Continuar Trabajando' },
    { key: 'conclusiones', label: 'Conclusiones' },
  ],
  escolar: [
    { key: 'datos_institucionales', label: 'Datos del Alumno y la Institución (escuela, dirección, año, turno, teléfono)' },
    { key: 'logico_matematico', label: '1. Lógico-Matemático (descripción de dificultades, logros alcanzados, etc.)' },
    { key: 'lengua_oral_escrita', label: '2. Lengua Oral y Escrita (descripción de dificultades en la lectoescritura y expresión oral, logros alcanzados, etc.)' },
    { key: 'ciencias_naturales_sociales', label: '3. Ciencias Naturales y Ciencias Sociales (descripción de dificultades, logros alcanzados, etc.)' },
    { key: 'educacion_fisica', label: '4. Educación Física (descripción de dificultades, logros alcanzados, etc.)' },
    { key: 'artistica', label: '5. Artística (descripción de dificultades, logros alcanzados, etc.)' },
    { key: 'idioma_otra', label: '6. Idioma / Otra' },
    { key: 'estrategias_docente', label: '7. Estrategias Implementadas por la Docente ante las Dificultades de Aprendizaje' },
    { key: 'relacion_pares_docentes', label: '8. Relación con sus Pares y Docentes' },
    { key: 'participacion_familiar', label: '9. Participación Familiar en la Escuela' },
    { key: 'intervencion_eoe', label: '10. Intervención del E.O.E.' },
    { key: 'otras_consideraciones', label: '11. Otras Consideraciones' },
  ],
  obra_social: [
    { key: 'diagnostico', label: 'Diagnóstico / CIE' },
    { key: 'justificacion', label: 'Justificación de Sesiones' },
    { key: 'frecuencia', label: 'Frecuencia y Duración' },
    { key: 'objetivos_terapeuticos', label: 'Objetivos Terapéuticos' },
  ],
  derivacion: [
    { key: 'motivo_derivacion', label: 'Motivo de Derivación' },
    { key: 'profesional_sugerido', label: 'Profesional Sugerido' },
    { key: 'antecedentes', label: 'Antecedentes Relevantes' },
  ],
  asistencia: [
    { key: 'periodo_asistencia', label: 'Período de Asistencia' },
    { key: 'frecuencia_asistencia', label: 'Frecuencia' },
    { key: 'observaciones_asistencia', label: 'Observaciones' },
  ],
};

function TextareaConVoz({ label, value, onChange, rows = 4, placeholder }) {
  const { VoiceButton } = useVoiceDictation((texto) =>
    onChange(value ? `${value} ${texto}` : texto)
  );
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <label className="font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">{label}</label>
        <VoiceButton />
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-xl p-3.5 outline-none transition-colors resize-none border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium"
      />
    </div>
  );
}

export default function Informes() {
  const [informes, setInformes] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [proximosVencer, setProximosVencer] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [generandoIA, setGenerandoIA] = useState(false);

  // Form states
  const [pacienteId, setPacienteId] = useState("");
  const [tipo, setTipo] = useState("diagnostico");
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [contenido, setContenido] = useState({});
  const [estadoInforme, setEstadoInforme] = useState("borrador");

  const { confirm, ConfirmModal } = useConfirm();

  const cargarData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dataInformes, dataPacientes, dataProximos] = await Promise.all([
        getInformes(),
        getPacientes(),
        getInformesProximosVencer(),
      ]);
      setInformes(Array.isArray(dataInformes) ? dataInformes : []);
      setPacientes(Array.isArray(dataPacientes) ? dataPacientes : []);
      setProximosVencer(Array.isArray(dataProximos) ? dataProximos : []);
    } catch {
      setError('No se pudieron cargar los informes. Verificá tu conexión e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarData(); }, []);

  const resetForm = () => {
    setPacienteId(""); setTipo("diagnostico");
    setFecha(new Date().toISOString().split('T')[0]);
    setContenido({}); setEstadoInforme("borrador");
    setEditing(null);
  };

  const openEdit = async (inf) => {
    const completo = await getInforme(inf.id);
    if (!completo) return;
    setEditing(inf.id);
    setPacienteId(inf.paciente_id);
    setTipo(inf.tipo);
    setFecha(inf.fecha);
    setContenido(typeof inf.contenido === 'object' ? inf.contenido : {});
    setEstadoInforme(inf.estado);
    setShowModal(true);
  };

  const openView = async (inf) => {
    const completo = inf.contenido && typeof inf.contenido === 'object'
      ? inf
      : await getInforme(inf.id);
    setViewing(completo);
  };

  const handleContenidoChange = (key, value) => {
    setContenido(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerarConIA = async () => {
    if (!pacienteId) { toast.error('Seleccioná un paciente primero', ''); return; }
    setGenerandoIA(true);
    try {
      const tipoLabel = tiposInforme.find(t => t.value === tipo)?.label || tipo;
      const data = await generarInformeIA(Number(pacienteId), tipoLabel);
      const secciones = seccionesPorTipo[tipo] || [];
      if (secciones.length > 0) {
        setContenido({ [secciones[0].key]: data.informe });
      }
      toast.success('Informe generado con IA', 'El texto fue insertado. Revisá y ajustá antes de guardar.');
    } catch (e) {
      toast.error('Error IA', e.message || 'No se pudo generar el informe.');
    } finally { setGenerandoIA(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = { paciente_id: Number(pacienteId), tipo, fecha, contenido, estado: estadoInforme };

      if (editing) {
        await actualizarInforme(editing, data);
      } else {
        await crearInforme(data);
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
      title: 'Eliminar informe',
      message: '¿Estás seguro de que querés eliminar este informe? Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      variant: 'danger'
    });
    if (!ok) return;
    try {
      await eliminarInforme(id);
      await cargarData();
      toast.success('Informe eliminado', 'El informe fue eliminado correctamente.');
    } catch {
      toast.error('Error', 'No se pudo eliminar el informe.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const informesFiltrados = informes.filter(inf => {
    const matchSearch = !searchTerm ||
      `${inf.paciente_nombre} ${inf.paciente_apellido}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = !filtroTipo || inf.tipo === filtroTipo;
    const matchEstado = !filtroEstado || inf.estado === filtroEstado;
    return matchSearch && matchTipo && matchEstado;
  });

  const getTipoLabel = (val) => tiposInforme.find(t => t.value === val)?.label || val;

  const seccionesActuales = seccionesPorTipo[tipo] || seccionesPorTipo.diagnostico;

  if (loading && !viewing) {
    return (
      <div className="space-y-6 text-slate-900 dark:text-slate-200">
        <div className="flex items-center justify-between mb-5">
          <div className="space-y-3">
            <div className="h-8 w-48 bg-pink-200 dark:bg-[#262626] rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-pink-200 dark:bg-[#262626] rounded animate-pulse" />
          </div>
          <div className="h-12 w-40 bg-pink-200 dark:bg-[#262626] rounded-xl animate-pulse" />
        </div>

        <div className="bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#333] rounded-2xl overflow-hidden">
          <SkeletonTable rows={6} cols={4} />
        </div>
      </div>
    );
  }

  if (error && !viewing) {
    return (
      <div className="space-y-6">
        <ErrorState
          title="Error al cargar informes"
          message={error}
          onRetry={cargarData}
        />
      </div>
    );
  }

  // Vista de detalle del informe
  if (viewing) {
    const seccionesView = seccionesPorTipo[viewing.tipo] || [];
    return (
      <div className="space-y-6 text-slate-900 dark:text-slate-200">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <button onClick={() => setViewing(null)} className="text-slate-900 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 transition-colors">
              <ArrowLeft size={26} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{getTipoLabel(viewing.tipo)}</h1>
              <p className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 capitalize">{viewing.paciente_nombre} {viewing.paciente_apellido}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 hover:border-teal-500 text-slate-900 dark:text-slate-200 px-5 py-2.5 rounded-xl transition-all font-medium shadow-sm">
              <Printer size={18} className="text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400" /> Imprimir / PDF
            </button>
            <button onClick={() => { setViewing(null); openEdit(viewing); }} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-xl transition-all font-bold shadow-lg shadow-teal-500/20">
              <Edit size={18} /> Editar
            </button>
          </div>
        </div>

        {/* Vista previa del informe */}
        <div id="informe-print" className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl p-10 shadow-sm">
          <div className="text-center mb-8 border-b border-purple-300 dark:border-slate-800 pb-6">
            <h2 className="text-2xl font-bold text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400">{consultorio.nombre}</h2>
            <p className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 mt-1">{consultorio.especialidad}</p>
            {consultorio.profesional && (
              <p className="text-slate-900 dark:text-slate-300 font-semibold mt-1">{consultorio.profesional}</p>
            )}
            {consultorio.matricula && (
              <p className="text-pink-500 dark:text-slate-500 text-sm mt-0.5">Mat. {consultorio.matricula}</p>
            )}
            {(consultorio.domicilio || consultorio.telefono) && (
              <p className="text-pink-500 dark:text-slate-500 text-xs mt-2">
                {[consultorio.domicilio, consultorio.telefono].filter(Boolean).join(' Â· ')}
              </p>
            )}
          </div>
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{getTipoLabel(viewing.tipo)}</h3>
            <p className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 mt-1">
              <strong>Paciente:</strong> {viewing.paciente_nombre} {viewing.paciente_apellido}
            </p>
            <p className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400">
              <strong>Fecha:</strong> {new Date(viewing.fecha + 'T12:00:00Z').toLocaleDateString('es-AR')}
            </p>
            <p className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400">
              <strong>Estado:</strong> {viewing.estado === 'borrador' ? 'Borrador' : 'Finalizado'}
            </p>
          </div>

          <div className="space-y-6">
            {seccionesView.map(sec => {
              const valor = viewing.contenido?.[sec.key];
              if (!valor) return null;
              return (
                <div key={sec.key}>
                  <h4 className="font-bold text-slate-900 dark:text-slate-200 text-base border-b border-slate-100 dark:border-slate-800 pb-1 mb-2">{sec.label}</h4>
                  <p className="text-slate-900 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{valor}</p>
                </div>
              );
            })}
          </div>
        </div>
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
              <FileText size={24} />
            </span>
            Informes
          </h1>
          <p className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 mt-2 font-medium">Redacción y gestión de informes psicopedagógicos.</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-6 py-2.5 rounded-xl transition-all font-bold shadow-lg shadow-teal-500/20 hover:-translate-y-0.5">
          <Plus size={20} /> Nuevo Informe
        </button>
      </div>

      {/* Banner: Próximos a vencer */}
      {proximosVencer.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">
              {proximosVencer.length} informe{proximosVencer.length > 1 ? 's' : ''} próximo{proximosVencer.length > 1 ? 's' : ''} a vencer (30 días)
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {proximosVencer.map(inf => (
                <span key={inf.id} className="inline-flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg font-medium border border-amber-200 dark:border-amber-500/30">
                  {inf.paciente_nombre} {inf.paciente_apellido} — vence {new Date(inf.fecha_vencimiento + 'T12:00:00Z').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
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
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
          className="border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-300 rounded-xl py-3 px-4 text-sm outline-none focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium">
          <option value="">Todos los tipos</option>
          {tiposInforme.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
          className="border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-300 rounded-xl py-3 px-4 text-sm outline-none focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium">
          <option value="">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="finalizado">Finalizado</option>
        </select>
      </div>

      {/* Tabla */}
      {informesFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#333] rounded-2xl overflow-hidden shadow-sm">
          <EmptyState
            icon={FileText}
            title={searchTerm || filtroTipo || filtroEstado ? 'Sin resultados' : 'No hay informes registrados'}
            description={searchTerm || filtroTipo || filtroEstado ? 'No hay informes que coincidan con los filtros seleccionados.' : 'Creá el primer informe para empezar a redactar.'}
            action={!searchTerm && !filtroTipo && !filtroEstado ? { label: 'Nuevo Informe', onClick: () => { resetForm(); setShowModal(true); } } : undefined}
          />
        </div>
      ) : (
      <div className="bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#333] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-purple-100/50 dark:bg-[#0f1115] border-b border-purple-300 dark:border-[#333]">
              <tr>
                <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Paciente</th>
                <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Tipo de Informe</th>
                <th className="text-left px-6 py-4 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Fecha</th>
                <th className="text-center px-6 py-4 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Estado</th>
                <th className="text-right px-6 py-4 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-100 dark:divide-[#262626]">
              {informesFiltrados.map((inf, idx) => (
                <tr key={inf.id} className={`stagger-${Math.min(idx + 1, 12)} animate-fade-in-up hover:bg-slate-50 dark:hover:bg-[#1a1c23] transition-colors cursor-pointer`} onClick={() => openView(inf)}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="bg-teal-50 dark:bg-teal-500/10 p-2 rounded-lg text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400">
                        <FileText size={18} />
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white capitalize">{inf.paciente_nombre} {inf.paciente_apellido}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-900 dark:text-slate-400 max-w-[250px]">
                    <span className="truncate block">{getTipoLabel(inf.tipo)}</span>
                  </td>
                  <td className="px-6 py-5 text-slate-900 dark:text-slate-400">
                    {new Date(inf.fecha + 'T12:00:00Z').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                      inf.estado === 'finalizado'
                        ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-200 dark:border-green-500/30'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30'
                    }`}>
                      {inf.estado === 'finalizado' ? <CheckCircle size={12} /> : <Clock size={12} />}
                      {inf.estado === 'finalizado' ? 'Finalizado' : 'Borrador'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openView(inf)} className="p-2 rounded-lg text-slate-900 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-[#262626] transition-all" title="Ver">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => openEdit(inf)} className="p-2 rounded-lg text-slate-900 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-[#262626] transition-all" title="Editar">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(inf.id)} className="p-2 rounded-lg text-slate-900 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-[#262626] transition-all" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* MODAL: NUEVO / EDITAR INFORME */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#141414] w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-300 dark:border-[#333]">
            <div className="border-b border-purple-300 dark:border-[#262626] bg-purple-100/50 dark:bg-[#0f1115] px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{editing ? 'Editar Informe' : 'Nuevo Informe'}</h2>
                <p className="text-sm mt-1 text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 font-medium">Completá las secciones según el tipo de informe.</p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2.5 rounded-xl border border-purple-300 dark:border-[#333] bg-white dark:bg-[#1a1c23] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-900 dark:text-slate-400 transition-colors shadow-sm">✕</button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 text-sm">
              <form id="informeForm" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-5">
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
                    <label className="block mb-2 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Tipo de Informe *</label>
                    <select value={tipo} onChange={(e) => setTipo(e.target.value)} required className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium">
                      {tiposInforme.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block mb-2 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Fecha del Informe *</label>
                    <input type="date" value={fecha} onChange={(e)=>setFecha(e.target.value)} required className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 dark:[&::-webkit-calendar-picker-indicator]:invert shadow-sm font-medium" />
                  </div>
                  <div>
                    <label className="block mb-2 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Estado</label>
                    <select value={estadoInforme} onChange={(e)=>setEstadoInforme(e.target.value)} className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium">
                      <option value="borrador">Borrador</option>
                      <option value="finalizado">Finalizado</option>
                    </select>
                  </div>
                </div>

                {/* Secciones dinámicas según tipo */}
                <div className="border-t border-purple-300 dark:border-[#333] pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-teal-400">Contenido del Informe</h3>
                    <button
                      type="button"
                      onClick={handleGenerarConIA}
                      disabled={generandoIA || !pacienteId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-50 dark:bg-teal-500/10 border border-pink-200 dark:border-teal-500/30 text-pink-600 dark:text-teal-400 text-xs font-semibold hover:bg-pink-100 dark:hover:bg-teal-500/20 transition-colors disabled:opacity-50"
                    >
                      {generandoIA ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      {generandoIA ? 'Generando...' : 'Generar con IA'}
                    </button>
                  </div>
                  <div className="space-y-5">
                    {seccionesActuales.map(sec => (
                      <TextareaConVoz
                        key={sec.key}
                        label={sec.label}
                        value={contenido[sec.key] || ''}
                        onChange={(val) => handleContenidoChange(sec.key, val)}
                        rows={4}
                        placeholder={`Escribí ${sec.label.toLowerCase()}...`}
                      />
                    ))}
                  </div>
                </div>
              </form>
            </div>

            <div className="border-t border-purple-300 dark:border-[#262626] bg-purple-100/50 dark:bg-[#0f1115] px-6 py-4 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => { setShowModal(false); resetForm(); }} disabled={submitting} className="px-5 py-2 font-bold rounded-xl transition-colors text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white disabled:opacity-50">Cancelar</button>
              <Button type="submit" form="informeForm" loading={submitting}>
                {editing ? 'Guardar Cambios' : 'Crear Informe'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos para impresión */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #informe-print, #informe-print * { visibility: visible; }
          #informe-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

    </div>
  );
}








