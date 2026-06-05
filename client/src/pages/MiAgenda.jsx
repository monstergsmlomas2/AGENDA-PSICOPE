import { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, List, Plus, Clock, Trash2, Check, X, ChevronLeft, ChevronRight, AlertCircle, Bell } from 'lucide-react';
import { getEventos, crearEvento, actualizarEvento, eliminarEvento, completarEvento } from '../services/agendaService';
import { useToast, SkeletonTable, ErrorState, EmptyState, Button } from '../components/ui';
import { useConfirm } from '../hooks/useConfirm';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../calendar-overrides.css';

moment.locale('es');
const localizer = momentLocalizer(moment);

const recordatorioOptions = [
  { value: 15, label: '15 min antes' },
  { value: 30, label: '30 min antes' },
  { value: 60, label: '1 hora antes' },
  { value: 120, label: '2 horas antes' },
];

const estadoConfig = {
  pendiente:   { label: 'Pendiente',   bg: '#0d9488' },
  completado:  { label: 'Completado',  bg: '#6b7280' },
  cancelado:   { label: 'Cancelado',   bg: '#ef4444' },
};

const eventColors = {
  pendiente:  '#0d9488',
  completado: '#6b7280',
  cancelado:  '#ef4444',
};

const inputClass = `bg-white dark:bg-slate-800 border border-pink-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-teal-500 w-full`;

export default function MiAgenda() {
  const [eventos, setEventos] = useState([]);
  const [viewMode, setViewMode] = useState('calendar');
  const [showModal, setShowModal] = useState(false);
  const [editingEvento, setEditingEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Estados del calendario
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');

  // Estados del formulario
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [recordatorioMinutos, setRecordatorioMinutos] = useState(30);
  const [estado, setEstado] = useState('pendiente');

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
    obs.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

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

  useEffect(() => {
    cargarEventos();
  }, []);

  const resetForm = () => {
    setTitulo('');
    setDescripcion('');
    setFecha('');
    setHora('');
    setRecordatorioMinutos(30);
    setEstado('pendiente');
  };

  const openNewModal = (fechaPrecargada, horaPrecargada) => {
    setEditingEvento(null);
    resetForm();
    if (fechaPrecargada) setFecha(fechaPrecargada);
    if (horaPrecargada) setHora(horaPrecargada);
    setShowModal(true);
  };

  const openEditModal = (evento) => {
    setEditingEvento(evento);
    const d = new Date(evento.fecha_hora);
    setTitulo(evento.titulo);
    setDescripcion(evento.descripcion || '');
    setFecha(d.toISOString().slice(0, 10));
    setHora(d.toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false }));
    setRecordatorioMinutos(evento.recordatorio_minutos || 30);
    setEstado(evento.estado);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
          recordatorio_minutos: recordatorioMinutos,
          estado,
        });
        toast.success('Evento actualizado', 'Los cambios se guardaron.');
      } else {
        await crearEvento({
          titulo: titulo.trim(),
          descripcion: descripcion.trim() || null,
          fecha_hora,
          recordatorio_minutos: recordatorioMinutos,
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

  const handleCompletar = async () => {
    if (!editingEvento) return;
    try {
      await completarEvento(editingEvento.id);
      toast.success('Evento completado', '¡Bien hecho!');
      setShowModal(false);
      setEditingEvento(null);
      await cargarEventos();
    } catch {
      toast.error('Error', 'No se pudo completar el evento.');
    }
  };

  const handleDelete = async () => {
    if (!editingEvento) return;
    const ok = await confirm({
      title: 'Eliminar evento',
      message: '¿Estás seguro de que querés eliminar este evento personal?',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await eliminarEvento(editingEvento.id);
      toast.success('Evento eliminado', 'El evento fue eliminado.');
      setShowModal(false);
      setEditingEvento(null);
      await cargarEventos();
    } catch {
      toast.error('Error', 'No se pudo eliminar el evento.');
    }
  };

  // Mapear eventos al formato react-big-calendar
  const events = eventos.map(e => {
    const start = new Date(e.fecha_hora);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return {
      id: e.id,
      title: `${start.toTimeString().slice(0, 5)} · ${e.titulo}`,
      start,
      end,
      resource: e,
    };
  });

  const eventPropGetter = useCallback((event) => {
    const est = event.resource.estado;
    return {
      style: {
        backgroundColor: eventColors[est] || '#0d9488',
        border: 'none',
        borderRadius: '4px',
        color: '#fff',
        fontSize: '12px',
        padding: '2px 4px',
      },
    };
  }, []);

  const handleSelectSlot = useCallback((slotInfo) => {
    const d = slotInfo.start;
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    const fechaStr = `${d.getFullYear()}-${mes}-${dia}`;
    const horaStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    openNewModal(fechaStr, horaStr);
  }, []);

  const handleSelectEvent = useCallback((event) => {
    openEditModal(event.resource);
  }, []);

  const BadgeEstado = ({ estado: est }) => {
    const cfg = estadoConfig[est] || estadoConfig.pendiente;
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white"
        style={{ backgroundColor: cfg.bg }}
      >
        {cfg.label}
      </span>
    );
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const headerTitle = () => {
    if (view === 'month') return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (view === 'week') {
      const ws = new Date(currentDate);
      ws.setDate(ws.getDate() - ws.getDay());
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      return `${ws.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} - ${we.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const navigateCalendar = (dir) => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + dir);
    else if (view === 'week') d.setDate(d.getDate() + 7 * dir);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-5">
          <div className="space-y-3">
            <div className="h-8 w-64 bg-pink-200 dark:bg-[#262626] rounded-lg animate-pulse" />
            <div className="h-4 w-48 bg-pink-200 dark:bg-[#262626] rounded animate-pulse" />
          </div>
          <div className="h-12 w-40 bg-pink-200 dark:bg-[#262626] rounded-xl animate-pulse" />
        </div>
        <SkeletonTable rows={6} cols={4} />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Error" message={error} onRetry={cargarEventos} />;
  }

  return (
    <div className="space-y-6">
      <ConfirmModal />

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 text-slate-900 dark:text-white tracking-tight">
            <span className="bg-pink-100 dark:bg-teal-500/10 dark:text-teal-400 p-2.5 rounded-xl border border-teal-500/20 shadow-inner">
              <CalendarIcon size={24} className="text-pink-600 dark:text-teal-400" />
            </span>
            Mi Agenda Personal
          </h1>
          <p className="text-slate-900 dark:text-slate-400 mt-2 font-medium">Tus recordatorios y eventos personales.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-pink-100 dark:bg-[#0f1115] border border-purple-300 dark:border-[#262626] rounded-xl overflow-hidden p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-[#1a1c23] text-slate-900 dark:text-teal-400 shadow-sm border border-purple-300 dark:border-[#333]'
                  : 'text-slate-900 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
              }`}
            >
              <CalendarIcon size={18} /> Calendario
            </button>
            <button
              onClick={() => setViewMode('lista')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold transition-all ${
                viewMode === 'lista'
                  ? 'bg-white dark:bg-[#1a1c23] text-slate-900 dark:text-teal-400 shadow-sm border border-purple-300 dark:border-[#333]'
                  : 'text-slate-900 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
              }`}
            >
              <List size={18} /> Lista
            </button>
          </div>
          <button
            onClick={() => openNewModal('', '')}
            className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-6 py-2.5 rounded-xl transition-all font-bold shadow-lg shadow-pink-500/20 hover:-translate-y-0.5"
          >
            <Plus size={20} /> Nuevo Evento
          </button>
        </div>
      </div>

      {/* Vista Calendario */}
      {viewMode === 'calendar' && (
        <div className={`bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#333] rounded-2xl shadow-xl flex flex-col ${isDark ? 'rbc-wrapper-dark' : 'rbc-wrapper-light'}`}>
          {/* Header del calendario */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-purple-300 dark:border-[#333] bg-slate-50/50 dark:bg-[#0f1115] rounded-t-2xl">
            <h2 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white capitalize tracking-tight">
              {headerTitle()}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-[#262626] rounded-lg p-0.5 gap-0.5">
                {[['month','Mensual'],['week','Semanal'],['day','Diaria']].map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                      view === v
                        ? 'bg-pink-200 text-pink-700 dark:bg-teal-500/20 dark:text-teal-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 ml-2">
                <button onClick={() => navigateCalendar(-1)} className="p-2 rounded-xl bg-white dark:bg-[#1a1c23] border border-purple-300 dark:border-[#333] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-900 dark:text-slate-300 transition-colors shadow-sm">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => setCurrentDate(new Date())} className="px-5 py-2 font-bold rounded-xl bg-white dark:bg-[#1a1c23] border border-purple-300 dark:border-[#333] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-900 dark:text-slate-300 transition-colors shadow-sm">
                  Hoy
                </button>
                <button onClick={() => navigateCalendar(1)} className="p-2 rounded-xl bg-white dark:bg-[#1a1c23] border border-purple-300 dark:border-[#333] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-900 dark:text-slate-300 transition-colors shadow-sm">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          <div style={{ height: view === 'month' ? 650 : 720 }}>
            <Calendar
              localizer={localizer}
              culture="es"
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={setView}
              date={currentDate}
              onNavigate={(d) => setCurrentDate(d)}
              toolbar={false}
              popup
              selectable
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              eventPropGetter={eventPropGetter}
              messages={{
                showMore: (total) => `+${total} más`,
                noEventsInRange: 'No hay eventos en este rango.',
              }}
              formats={{
                dayFormat: (date, culture, loc) => loc.format(date, 'ddd D', culture),
                weekdayFormat: (date) => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()],
                monthHeaderFormat: (date, culture, loc) => loc.format(date, 'MMMM YYYY', culture),
                timeGutterFormat: 'HH:mm',
                eventTimeRangeFormat: () => '',
                dayRangeHeaderFormat: ({ start, end }, culture, loc) =>
                  `${loc.format(start, 'D MMM', culture)} – ${loc.format(end, 'D MMM YYYY', culture)}`,
                dayHeaderFormat: (date, culture, loc) => loc.format(date, 'dddd D [de] MMMM [de] YYYY', culture),
              }}
              className="h-full"
            />
          </div>
        </div>
      )}

      {/* Vista Lista */}
      {viewMode === 'lista' && (
        <div className="bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#333] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-purple-300 dark:border-[#262626] bg-purple-100/50 dark:bg-[#0f1115]">
                  <th className="text-left px-5 py-4 font-bold text-slate-900 dark:text-slate-300 text-xs uppercase tracking-wider">Título</th>
                  <th className="text-left px-5 py-4 font-bold text-slate-900 dark:text-slate-300 text-xs uppercase tracking-wider">Fecha y hora</th>
                  <th className="text-left px-5 py-4 font-bold text-slate-900 dark:text-slate-300 text-xs uppercase tracking-wider">Recordatorio</th>
                  <th className="text-left px-5 py-4 font-bold text-slate-900 dark:text-slate-300 text-xs uppercase tracking-wider">Estado</th>
                  <th className="text-right px-5 py-4 font-bold text-slate-900 dark:text-slate-300 text-xs uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody>
                {eventos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <EmptyState icon={CalendarIcon} title="Sin eventos" description="No hay eventos en tu agenda personal. ¡Creá uno nuevo!" />
                    </td>
                  </tr>
                )}
                {eventos
                  .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
                  .map((e) => {
                    const d = new Date(e.fecha_hora);
                    const fechaStr = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
                    const horaStr = d.toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false });
                    const recordLabel = recordatorioOptions.find(r => r.value === e.recordatorio_minutos)?.label || `${e.recordatorio_minutos} min`;
                    return (
                      <tr key={e.id} className="border-b border-purple-200 dark:border-[#262626] hover:bg-purple-50 dark:hover:bg-[#1a1c23] transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Bell size={14} className="text-pink-500 dark:text-teal-400 shrink-0" />
                            <span className="font-semibold text-slate-900 dark:text-white">{e.titulo}</span>
                          </div>
                          {e.descripcion && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-6 truncate max-w-xs">{e.descripcion}</p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-slate-900 dark:text-slate-200">{fechaStr}</span>
                          <span className="ml-2 font-bold text-pink-600 dark:text-teal-400">{horaStr} hs</span>
                        </td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{recordLabel}</td>
                        <td className="px-5 py-4">
                          <BadgeEstado estado={e.estado} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          {e.estado === 'pendiente' && (
                            <button
                              onClick={async () => {
                                await completarEvento(e.id);
                                await cargarEventos();
                                toast.success('Completado', 'Evento marcado como completado.');
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-500 text-white hover:bg-teal-600 transition-colors"
                            >
                              <Check size={12} /> Completar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de creación/edición */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-[#141414] w-full max-w-lg mx-auto max-h-screen sm:max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-300 dark:border-[#333]">
            <div className="border-b border-purple-300 dark:border-[#262626] bg-purple-100/50 dark:bg-[#0f1115] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0 gap-2">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  {editingEvento ? 'Editar Evento' : 'Nuevo Evento'}
                </h2>
                <p className="text-sm mt-1 text-slate-900 dark:text-slate-400 font-medium">
                  {editingEvento ? 'Modificá los datos del evento personal.' : 'Creá un recordatorio o evento personal.'}
                </p>
              </div>
              <button
                onClick={() => { setShowModal(false); setEditingEvento(null); resetForm(); }}
                className="p-2.5 rounded-xl border border-purple-300 dark:border-[#333] bg-white dark:bg-[#1a1c23] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-900 dark:text-slate-400 transition-colors shadow-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 text-sm overflow-y-auto flex-1 custom-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block mb-1.5 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Título *</label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ej: Revisar informes"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Descripción</label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={3}
                    placeholder="Opcional — detalle del evento..."
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Fecha *</label>
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Hora *</label>
                    <input
                      type="time"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      className={inputClass}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Recordatorio</label>
                  <select
                    value={recordatorioMinutos}
                    onChange={(e) => setRecordatorioMinutos(Number(e.target.value))}
                    className={inputClass}
                  >
                    {recordatorioOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {editingEvento && (
                  <div>
                    <label className="block mb-1.5 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Estado</label>
                    <select
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      className={inputClass}
                    >
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
                {editingEvento && editingEvento.estado !== 'completado' && (
                  <button
                    type="button"
                    onClick={handleCompletar}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 text-white hover:bg-teal-600 transition-colors"
                  >
                    <Check size={14} /> Completar
                  </button>
                )}
                {editingEvento && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingEvento(null); resetForm(); }}
                  disabled={submitting}
                  className="px-5 py-2 font-bold rounded-xl text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white transition-colors disabled:opacity-50"
                >
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
