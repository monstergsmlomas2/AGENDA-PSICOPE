import { useState, useEffect } from 'react';
import { Plus, Clock, Trash2, Check, Bell, BookOpen, AlertCircle, Pencil, X, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { getEventos, crearEvento, actualizarEvento, eliminarEvento, completarEvento } from '../services/agendaService';
import { useToast, ErrorState, EmptyState, Button } from '../components/ui';
import { useConfirm } from '../hooks/useConfirm';

const RECORDATORIO_OPTIONS = [
  { value: 10,   label: '10 min antes' },
  { value: 15,   label: '15 min antes' },
  { value: 30,   label: '30 min antes' },
  { value: 60,   label: '1 hora antes' },
  { value: 120,  label: '2 horas antes' },
  { value: 360,  label: '6 horas antes' },
  { value: 720,  label: '12 horas antes' },
  { value: 1440, label: '24 horas antes' },
  { value: 2880, label: '2 días antes' },
];

function labelRecordatorio(minutos) {
  return RECORDATORIO_OPTIONS.find(o => o.value === minutos)?.label
    ?? (minutos >= 1440
        ? `${Math.round(minutos / 1440)} día(s) antes`
        : minutos >= 60
        ? `${Math.round(minutos / 60)}h antes`
        : `${minutos} min antes`);
}

const estadoConfig = {
  pendiente:  { label: 'Pendiente',  color: 'text-pink-600 dark:text-teal-400',  bg: 'bg-pink-50 dark:bg-teal-500/10',  border: 'border-pink-200 dark:border-teal-500/30',  dot: 'bg-pink-500 dark:bg-teal-400' },
  completado: { label: 'Completado', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10', border: 'border-green-200 dark:border-green-500/30', dot: 'bg-green-500 dark:bg-green-400' },
  cancelado:  { label: 'Cancelado',  color: 'text-red-500 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-500/10',    border: 'border-red-200 dark:border-red-500/30',    dot: 'bg-red-500 dark:bg-red-400' },
};

const inputClass = `bg-white dark:bg-slate-800 border border-pink-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-teal-500 w-full text-slate-900 dark:text-white`;

function agruparEventos(eventos) {
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1);
  const finSemana = new Date(hoy); finSemana.setDate(hoy.getDate() + 7);

  const grupos = { vencidos: [], hoy: [], manana: [], semana: [], proximos: [], completados: [], cancelados: [] };

  for (const e of eventos) {
    const d = new Date(e.fecha_hora);
    const dia = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (e.estado === 'completado') { grupos.completados.push(e); continue; }
    if (e.estado === 'cancelado')  { grupos.cancelados.push(e);  continue; }

    if (dia < hoy)                              grupos.vencidos.push(e);
    else if (dia.getTime() === hoy.getTime())   grupos.hoy.push(e);
    else if (dia.getTime() === manana.getTime()) grupos.manana.push(e);
    else if (dia < finSemana)                   grupos.semana.push(e);
    else                                         grupos.proximos.push(e);
  }

  for (const k of Object.keys(grupos)) {
    grupos[k].sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
  }

  return grupos;
}

function formatFecha(fechaHora) {
  return new Date(fechaHora).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatHora(fechaHora) {
  return new Date(fechaHora).toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false });
}

function EventoCard({ evento, onEdit, onCompletar, onEliminar }) {
  const cfg = estadoConfig[evento.estado] || estadoConfig.pendiente;
  const hora = formatHora(evento.fecha_hora);
  const fecha = formatFecha(evento.fecha_hora);
  const recs = Array.isArray(evento.recordatorios) && evento.recordatorios.length > 0
    ? evento.recordatorios
    : evento.recordatorio_minutos ? [evento.recordatorio_minutos] : [];
  const esHoy = (() => {
    const d = new Date(evento.fecha_hora);
    const hoy = new Date();
    return d.getDate() === hoy.getDate() && d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear();
  })();

  return (
    <div className={`group relative bg-white dark:bg-[#1a1c23] border ${cfg.border} rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden hover:-translate-y-0.5`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.dot} rounded-l-2xl`} />

      <div className="pl-5 pr-4 py-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg} border ${cfg.border}`}>
            {evento.estado === 'completado'
              ? <Check size={18} className="text-green-600 dark:text-green-400" />
              : evento.estado === 'cancelado'
              ? <X size={18} className="text-red-500 dark:text-red-400" />
              : <Bell size={18} className={cfg.color} />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-bold text-slate-900 dark:text-white truncate ${evento.estado === 'completado' ? 'line-through opacity-60' : ''}`}>
                {evento.titulo}
              </h3>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.color} border ${cfg.border} shrink-0`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>

            {evento.descripcion && (
              <p className="text-xs text-slate-900 dark:text-white mt-1 line-clamp-2">{evento.descripcion}</p>
            )}

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-xs font-semibold text-slate-900 dark:text-white">
                <Clock size={12} className={cfg.color} />
                <span className={`font-bold ${cfg.color}`}>{hora} hs</span>
                {!esHoy && <span className="text-slate-900 dark:text-white font-normal capitalize"> · {fecha}</span>}
              </span>
              {recs.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-slate-900 dark:text-white">
                  <Bell size={10} />
                  {recs.map(m => labelRecordatorio(m)).join(' · ')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {evento.estado === 'pendiente' && (
            <button
              onClick={() => onCompletar(evento)}
              title="Marcar como completado"
              className="p-2 rounded-xl bg-green-50 hover:bg-green-100 dark:bg-green-500/10 dark:hover:bg-green-500/20 text-green-600 dark:text-green-400 transition-colors border border-green-200 dark:border-green-500/30"
            >
              <Check size={14} />
            </button>
          )}
          <button
            onClick={() => onEdit(evento)}
            title="Editar"
            className="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 text-pink-600 dark:text-teal-400 transition-colors border border-pink-200 dark:border-teal-500/30"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onEliminar(evento)}
            title="Eliminar"
            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-500 dark:text-red-400 transition-colors border border-red-200 dark:border-red-500/30"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function GrupoEventos({ titulo, icono: Icono, color, eventos, onEdit, onCompletar, onEliminar, defaultExpanded = true }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  if (eventos.length === 0) return null;

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-2 w-full text-left group"
      >
        <div className={`flex items-center gap-2 ${color} font-black text-sm uppercase tracking-widest`}>
          <Icono size={15} />
          {titulo}
        </div>
        <span className="ml-1 text-xs font-bold bg-pink-100 dark:bg-slate-800 text-pink-600 dark:text-slate-400 px-2 py-0.5 rounded-full border border-pink-200 dark:border-slate-700">
          {eventos.length}
        </span>
        <div className="flex-1 h-px bg-purple-200 dark:bg-[#262626]" />
        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {expanded && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {eventos.map(e => (
            <EventoCard key={e.id} evento={e} onEdit={onEdit} onCompletar={onCompletar} onEliminar={onEliminar} />
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonEventos() {
  return (
    <div className="space-y-6">
      {[1, 2].map(g => (
        <div key={g} className="space-y-3">
          <div className="h-5 w-32 bg-pink-200 dark:bg-[#262626] rounded animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-pink-100 dark:bg-[#1a1c23] border border-pink-200 dark:border-[#262626] rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Sub-componente: selector de un recordatorio ───────────────────────────────
function RecordatorioRow({ index, value, onChange, onRemove, canRemove }) {
  return (
    <div className="flex items-center gap-2">
      <Bell size={14} className="text-pink-400 dark:text-teal-400 shrink-0" />
      <select
        value={value}
        onChange={e => onChange(index, Number(e.target.value))}
        className={`${inputClass} flex-1`}
      >
        {RECORDATORIO_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0"
          title="Quitar recordatorio"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export default function MiAgenda() {
  const [eventos, setEventos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEvento, setEditingEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [recordatorios, setRecordatorios] = useState([1440, 30]); // 24h + 30 min por defecto
  const [estado, setEstado] = useState('pendiente');

  const { confirm, ConfirmModal } = useConfirm();
  const toast = useToast();

  const cargarEventos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEventos();
      setEventos(Array.isArray(data) ? data : []);
    } catch {
      setError('No se pudieron cargar los eventos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarEventos(); }, []);

  const resetForm = () => {
    setTitulo(''); setDescripcion(''); setFecha(''); setHora('');
    setRecordatorios([1440, 30]); setEstado('pendiente');
  };

  const openNew = () => {
    setEditingEvento(null);
    resetForm();
    const now = new Date();
    setFecha(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
    setHora(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    setShowModal(true);
  };

  const openEdit = (evento) => {
    setEditingEvento(evento);
    const d = new Date(evento.fecha_hora);
    setTitulo(evento.titulo);
    setDescripcion(evento.descripcion || '');
    setFecha(d.toISOString().slice(0, 10));
    setHora(d.toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false }));
    // Usar recordatorios del array nuevo, o fallback al campo legacy
    const recs = Array.isArray(evento.recordatorios) && evento.recordatorios.length > 0
      ? evento.recordatorios
      : evento.recordatorio_minutos ? [evento.recordatorio_minutos] : [1440, 30];
    setRecordatorios(recs);
    setEstado(evento.estado);
    setShowModal(true);
  };

  // Handlers de recordatorios
  const handleRecordatorioChange = (index, value) => {
    setRecordatorios(prev => prev.map((v, i) => i === index ? value : v));
  };
  const handleRecordatorioRemove = (index) => {
    setRecordatorios(prev => prev.filter((_, i) => i !== index));
  };
  const handleRecordatorioAdd = () => {
    if (recordatorios.length >= 4) return;
    setRecordatorios(prev => [...prev, 30]);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!titulo.trim() || !fecha || !hora) {
      toast.error('Campos obligatorios', 'Título, fecha y hora son requeridos.');
      return;
    }
    setSubmitting(true);
    try {
      const fecha_hora = `${fecha}T${hora}:00.000-03:00`;
      if (editingEvento) {
        await actualizarEvento(editingEvento.id, {
          titulo: titulo.trim(),
          descripcion: descripcion.trim() || null,
          fecha_hora,
          recordatorios,
          recordatorio_minutos: recordatorios[0] ?? 30,
          estado,
        });
        toast.success('Evento actualizado', 'Los cambios se guardaron.');
      } else {
        await crearEvento({
          titulo: titulo.trim(),
          descripcion: descripcion.trim() || null,
          fecha_hora,
          recordatorios,
          recordatorio_minutos: recordatorios[0] ?? 30,
        });
        toast.success('Evento creado', 'El evento fue registrado.');
      }
      setShowModal(false);
      setEditingEvento(null);
      resetForm();
      await cargarEventos();
    } catch {
      toast.error('Error', editingEvento ? 'No se pudo actualizar.' : 'No se pudo crear el evento.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompletar = async (evento) => {
    try {
      await completarEvento(evento.id);
      toast.success('Completado', '¡Bien hecho!');
      await cargarEventos();
    } catch {
      toast.error('Error', 'No se pudo completar el evento.');
    }
  };

  const handleEliminar = async (evento) => {
    const ok = await confirm({ title: 'Eliminar evento', message: `¿Eliminás "${evento.titulo}"?`, confirmLabel: 'Eliminar', variant: 'danger' });
    if (!ok) return;
    try {
      await eliminarEvento(evento.id);
      toast.success('Evento eliminado', 'El evento fue eliminado.');
      await cargarEventos();
    } catch {
      toast.error('Error', 'No se pudo eliminar el evento.');
    }
  };

  const grupos = agruparEventos(eventos);
  const totalPendientes = grupos.vencidos.length + grupos.hoy.length + grupos.manana.length + grupos.semana.length + grupos.proximos.length;
  const totalCompletados = grupos.completados.length;

  if (loading) return <SkeletonEventos />;
  if (error) return <ErrorState title="Error" message={error} onRetry={cargarEventos} />;

  return (
    <div className="space-y-8">
      <ConfirmModal />

      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 text-slate-900 dark:text-white tracking-tight">
            <span className="bg-pink-100 dark:bg-teal-500/10 p-2.5 rounded-xl border border-pink-200 dark:border-teal-500/20 shadow-inner">
              <BookOpen size={24} className="text-pink-600 dark:text-teal-400" />
            </span>
            Mi Agenda Personal
          </h1>
          <p className="text-slate-900 dark:text-white mt-2 font-medium">
            Tus recordatorios y tareas propias — independiente de los turnos de pacientes.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-6 py-2.5 rounded-xl transition-all font-bold shadow-lg shadow-pink-500/20 hover:-translate-y-0.5 shrink-0"
        >
          <Plus size={20} /> Nuevo Evento
        </button>
      </div>

      {/* Stats rápidos */}
      {eventos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Pendientes', value: totalPendientes, color: 'text-pink-600 dark:text-teal-400', bg: 'bg-pink-50 dark:bg-teal-500/10', border: 'border-pink-200 dark:border-teal-500/30' },
            { label: 'Para hoy', value: grupos.hoy.length, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/30' },
            { label: 'Completados', value: totalCompletados, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10', border: 'border-green-200 dark:border-green-500/30' },
            { label: 'Vencidos', value: grupos.vencidos.length, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/30' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl px-4 py-3 flex flex-col gap-1`}>
              <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
              <span className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Sin eventos */}
      {eventos.length === 0 && (
        <div className="bg-white dark:bg-[#141414] border border-purple-200 dark:border-[#262626] rounded-2xl py-16">
          <EmptyState
            icon={Calendar}
            title="Sin eventos personales"
            description="Creá recordatorios, tareas o notas para tu agenda profesional."
          />
        </div>
      )}

      {/* Grupos de eventos */}
      <div className="space-y-8">
        {grupos.vencidos.length > 0 && (
          <GrupoEventos titulo="Vencidos" icono={AlertCircle} color="text-red-500 dark:text-red-400" eventos={grupos.vencidos} onEdit={openEdit} onCompletar={handleCompletar} onEliminar={handleEliminar} />
        )}
        <GrupoEventos titulo="Hoy" icono={Bell} color="text-orange-600 dark:text-orange-400" eventos={grupos.hoy} onEdit={openEdit} onCompletar={handleCompletar} onEliminar={handleEliminar} />
        <GrupoEventos titulo="Mañana" icono={Clock} color="text-pink-600 dark:text-teal-400" eventos={grupos.manana} onEdit={openEdit} onCompletar={handleCompletar} onEliminar={handleEliminar} />
        <GrupoEventos titulo="Esta semana" icono={BookOpen} color="text-purple-600 dark:text-purple-400" eventos={grupos.semana} onEdit={openEdit} onCompletar={handleCompletar} onEliminar={handleEliminar} />
        <GrupoEventos titulo="Próximos" icono={Calendar} color="text-slate-600 dark:text-slate-400" eventos={grupos.proximos} onEdit={openEdit} onCompletar={handleCompletar} onEliminar={handleEliminar} defaultExpanded={false} />
        <GrupoEventos titulo="Completados" icono={Check} color="text-green-600 dark:text-green-400" eventos={grupos.completados} onEdit={openEdit} onCompletar={handleCompletar} onEliminar={handleEliminar} defaultExpanded={false} />
        <GrupoEventos titulo="Cancelados" icono={X} color="text-slate-400" eventos={grupos.cancelados} onEdit={openEdit} onCompletar={handleCompletar} onEliminar={handleEliminar} defaultExpanded={false} />
      </div>

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-[#141414] w-full max-w-lg mx-auto max-h-screen sm:max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-300 dark:border-[#333]">
            <div className="border-b border-purple-300 dark:border-[#262626] bg-purple-100/50 dark:bg-[#0f1115] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0 gap-2">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  {editingEvento ? 'Editar Evento' : 'Nuevo Evento'}
                </h2>
                <p className="text-sm mt-1 text-slate-900 dark:text-white font-medium">
                  {editingEvento ? 'Modificá los datos del evento.' : 'Creá un recordatorio o tarea personal.'}
                </p>
              </div>
              <button
                onClick={() => { setShowModal(false); setEditingEvento(null); resetForm(); }}
                className="p-2.5 rounded-xl border border-purple-300 dark:border-[#333] bg-white dark:bg-[#1a1c23] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-900 dark:text-slate-400 transition-colors shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 text-sm overflow-y-auto flex-1 custom-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block mb-1.5 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Título *</label>
                  <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej: Reunión escuela San José" className={inputClass} required />
                </div>
                <div>
                  <label className="block mb-1.5 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Descripción</label>
                  <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3} placeholder="Opcional — detalle del evento..." className={`${inputClass} resize-none`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Fecha *</label>
                    <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputClass} required />
                  </div>
                  <div>
                    <label className="block mb-1.5 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Hora *</label>
                    <input type="time" value={hora} onChange={e => setHora(e.target.value)} className={inputClass} required />
                  </div>
                </div>

                {/* Recordatorios múltiples */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                      Recordatorios WhatsApp
                    </label>
                    {recordatorios.length < 4 && (
                      <button
                        type="button"
                        onClick={handleRecordatorioAdd}
                        className="flex items-center gap-1 text-xs font-bold text-pink-600 dark:text-teal-400 hover:underline"
                      >
                        <Plus size={12} /> Agregar
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {recordatorios.map((val, idx) => (
                      <RecordatorioRow
                        key={idx}
                        index={idx}
                        value={val}
                        onChange={handleRecordatorioChange}
                        onRemove={handleRecordatorioRemove}
                        canRemove={recordatorios.length > 1}
                      />
                    ))}
                  </div>
                </div>

                {editingEvento && (
                  <div>
                    <label className="block mb-1.5 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Estado</label>
                    <select value={estado} onChange={e => setEstado(e.target.value)} className={inputClass}>
                      <option value="pendiente">Pendiente</option>
                      <option value="completado">Completado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                )}
              </form>
            </div>

            <div className="border-t border-purple-300 dark:border-[#262626] bg-purple-100/50 dark:bg-[#0f1115] px-4 sm:px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex gap-2">
                {editingEvento && editingEvento.estado === 'pendiente' && (
                  <button type="button" onClick={() => { handleCompletar(editingEvento); setShowModal(false); setEditingEvento(null); }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-green-500 text-white hover:bg-green-600 transition-colors">
                    <Check size={14} /> Completar
                  </button>
                )}
                {editingEvento && (
                  <button type="button" onClick={() => { handleEliminar(editingEvento); }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-colors">
                    <Trash2 size={14} /> Eliminar
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowModal(false); setEditingEvento(null); resetForm(); }} disabled={submitting} className="px-5 py-2 font-bold rounded-xl text-slate-900 hover:bg-slate-200 dark:text-white dark:hover:text-white transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <Button type="button" onClick={handleSubmit} loading={submitting}>
                  {editingEvento ? 'Guardar Cambios' : 'Crear Evento'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
