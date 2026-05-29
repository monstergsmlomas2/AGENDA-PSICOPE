import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar as CalendarIcon, List, Plus, Clock, MapPin, Trash2, ChevronLeft, ChevronRight, User, ShieldCheck, Check, X, AlertTriangle, Bell, AlertCircle, Pencil, MessageCircle } from 'lucide-react';
import { getTurnos, crearTurno, eliminarTurno, actualizarEstadoTurno, actualizarTurno, enviarRecordatorio } from '../services/turnosService';
import { getPacientes } from '../services/pacientesService';
import { getConsultorios } from '../services/consultoriosService';
import { useToast, SkeletonTable, ErrorState, EmptyState, Button } from '../components/ui';
import { useConfirm } from '../hooks/useConfirm';
import TimePicker from '../components/ui/TimePicker';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../calendar-overrides.css';

moment.locale('es');
const localizer = momentLocalizer(moment);

const estadoConfig = {
  pendiente:   { label: 'Pendiente',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',   icon: Clock, bg: '#3b82f6' },
  confirmado:  { label: 'Confirmado',  color: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-200 dark:border-green-500/30', icon: Check, bg: '#22c55e' },
  cancelado:   { label: 'Cancelado',   color: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/30',           icon: X,     bg: '#ef4444' },
  inasistencia:{ label: 'Inasistencia',color: 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/30', icon: X,     bg: '#6b7280' },
};

export default function Turnos() {
  const location = useLocation();
  const [turnos, setTurnos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [consultorios, setConsultorios] = useState([]);
  const [viewMode, setViewMode] = useState('calendar');
  const [showModal, setShowModal] = useState(false);
  const [editingTurno, setEditingTurno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [enviandoRecordatorio, setEnviandoRecordatorio] = useState(null);

  // Filtros para vista Lista
  const [filtroMes, setFiltroMes] = useState(() => new Date().toISOString().slice(0, 7));
  const [filtroEstado, setFiltroEstado] = useState("");

  // Estados del Calendario
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');

  // Estados del Popover
  const [popoverTurno, setPopoverTurno] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });

  // Panel lateral de turnos del día
  const [diaPanel, setDiaPanel] = useState(null); // { fecha, turnos }

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
    obs.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // Estados del Formulario
  const [pacienteId, setPacienteId] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [consultorio, setConsultorio] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [estado, setEstado] = useState("pendiente");
  const [recurrencia, setRecurrencia] = useState("");

  const { confirm, ConfirmModal } = useConfirm();

  const cargarData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dataTurnos, dataPacientes, dataConsultorios] = await Promise.all([
        getTurnos(),
        getPacientes(),
        getConsultorios(),
      ]);
      setTurnos(Array.isArray(dataTurnos) ? dataTurnos : []);
      setPacientes(Array.isArray(dataPacientes) ? dataPacientes : []);
      setConsultorios(Array.isArray(dataConsultorios) ? dataConsultorios : []);
    } catch {
      setError('No se pudieron cargar los turnos. Verificá tu conexión e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarData();
  }, []);

  // Pre-seleccionar paciente si viene desde modal de Pacientes
  useEffect(() => {
    if (location.state?.pacienteId) {
      setPacienteId(String(location.state.pacienteId));
      setShowModal(true);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  // Cerrar popover al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverTurno && !e.target.closest('.turno-popover') && !e.target.closest('.turno-card')) {
        setPopoverTurno(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popoverTurno]);

  // Cerrar panel de día con Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') { setDiaPanel(null); setPopoverTurno(null); } };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const pacienteSeleccionado = pacientes.find(p => p.id === Number(pacienteId));

  const validateTurnoForm = () => {
    const errors = {};
    if (!pacienteId) errors.pacienteId = 'Debés seleccionar un paciente.';
    if (!fecha) errors.fecha = 'La fecha es obligatoria.';
    else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(fecha + 'T12:00:00Z');
      if (selectedDate < today) errors.fecha = 'La fecha no puede ser anterior a hoy.';
    }
    if (!hora) errors.hora = 'La hora es obligatoria.';
    if (!consultorio) errors.consultorio = 'Debés seleccionar un consultorio.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const inputClass = (field) => `
    w-full rounded-xl p-3.5 outline-none transition-colors border shadow-sm font-medium
    ${formErrors[field]
      ? 'border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-500/5 text-red-900 dark:text-red-200'
      : 'border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500'
    }
  `;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateTurnoForm()) return;
    setSubmitting(true);
    try {
      const tipo_cobertura = pacienteSeleccionado?.obra_social ? 'obra_social' : 'particular';
      if (editingTurno) {
        await actualizarTurno(editingTurno.id, { paciente_id: pacienteId, fecha, hora, consultorio, observaciones, estado, tipo_cobertura });
        toast.success('Turno actualizado', 'Los cambios se guardaron correctamente.');
      } else if (recurrencia) {
        const meses = parseInt(recurrencia);
        const fechaBase = new Date(fecha + 'T12:00:00Z');
        const fechaLimite = new Date(fechaBase);
        fechaLimite.setMonth(fechaLimite.getMonth() + meses);
        const fechas = [];
        const cur = new Date(fechaBase);
        while (cur <= fechaLimite) {
          fechas.push(cur.toISOString().slice(0, 10));
          cur.setDate(cur.getDate() + 7);
        }
        await Promise.all(
          fechas.map(f => crearTurno({ paciente_id: pacienteId, fecha: f, hora, consultorio, observaciones, estado, tipo_cobertura }))
        );
        toast.success('Turnos recurrentes creados', `Se agendaron ${fechas.length} turnos semanales.`);
      } else {
        await crearTurno({ paciente_id: pacienteId, fecha, hora, consultorio, observaciones, estado, tipo_cobertura });
        toast.success('Turno agendado', 'El turno fue creado correctamente.');
      }
      setPacienteId(""); setFecha(""); setHora(""); setConsultorio(""); setObservaciones(""); setEstado("pendiente"); setRecurrencia("");
      setFormErrors({});
      setShowModal(false);
      setEditingTurno(null);
      await cargarData();
    } catch {
      toast.error('Error', editingTurno ? 'No se pudo actualizar el turno.' : 'No se pudo crear el turno.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (turno, e) => {
    if (e) e.stopPropagation();
    setEditingTurno(turno);
    setPacienteId(String(turno.paciente_id));
    setFecha(turno.fecha.slice(0, 10));
    setHora(turno.hora.slice(0, 5));
    setConsultorio(turno.consultorio);
    setObservaciones(turno.observaciones || "");
    setEstado(turno.estado);
    setRecurrencia("");
    setFormErrors({});
    setPopoverTurno(null);
    setShowModal(true);
  };

  const toast = useToast();

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    const ok = await confirm({
      title: 'Cancelar turno',
      message: '¿Estás seguro de que querés cancelar este turno?',
      confirmLabel: 'Cancelar Turno',
      variant: 'danger'
    });
    if (!ok) return;
    try {
      await eliminarTurno(id);
      await cargarData();
      toast.success('Turno cancelado', 'El turno fue cancelado correctamente.');
    } catch {
      toast.error('Error', 'No se pudo cancelar el turno.');
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado, e) => {
    if (e) e.stopPropagation();
    const estadoLabel = estadoConfig[nuevoEstado]?.label || nuevoEstado;
    const ok = await confirm({
      title: 'Cambiar estado del turno',
      message: `¿Estás seguro de que querés cambiar el estado a "${estadoLabel}"?`,
      confirmLabel: `Marcar como ${estadoLabel}`,
      variant: 'warning'
    });
    if (!ok) return;
    try {
      await actualizarEstadoTurno(id, nuevoEstado);
      setPopoverTurno(null);
      await cargarData();
    } catch {
      toast.error('Error', 'No se pudo cambiar el estado del turno.');
    }
  };

  const handleEnviarRecordatorio = async (turno, e) => {
    if (e) e.stopPropagation();
    setEnviandoRecordatorio(turno.id);
    try {
      await enviarRecordatorio(turno.id);
      toast.success('Recordatorio enviado', `WhatsApp enviado a ${turno.paciente_nombre}`);
    } catch {
      toast.error('Error', 'No se pudo enviar el recordatorio.');
    } finally {
      setEnviandoRecordatorio(null);
    }
  };

  const handleTurnoClick = (turno, e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverPos({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setPopoverTurno(turno);
  };

  const navigateCalendar = (direction) => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7 * direction);
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const handleDayClick = (day) => {
    const mes = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dia = String(day).padStart(2, '0');
    setFecha(`${currentDate.getFullYear()}-${mes}-${dia}`);
    setShowModal(true);
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const headerTitle = () => {
    if (view === 'month') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    if (view === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const opts = { day: 'numeric', month: 'short' };
      return `${weekStart.toLocaleDateString('es-AR', opts)} - ${weekEnd.toLocaleDateString('es-AR', { ...opts, year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const events = turnos.map(t => {
    const start = new Date(`${t.fecha.slice(0, 10)}T${t.hora.slice(0, 5)}:00`);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    return {
      id: t.id,
      title: `${t.hora.slice(0, 5)} \u00b7 ${t.paciente_apellido}`,
      start,
      end,
      turno: t,
    };
  });

  const eventPropGetter = useCallback((event) => {
    const estado = event.turno.estado;
    return { className: `rbc-event-estado-${estado}` };
  }, []);

  const handleSelectSlot = useCallback((slotInfo) => {
    const date = slotInfo.start;
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    setFecha(`${date.getFullYear()}-${mes}-${dia}`);
    setShowModal(true);
  }, []);

  const handleSelectEvent = useCallback((event, e) => {
    handleTurnoClick(event.turno, e);
  }, []);

  const BadgeEstado = ({ estado: est }) => {
    const config = estadoConfig[est] || estadoConfig.pendiente;
    const Icono = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${config.color}`}>
        <Icono size={10} /> {config.label}
      </span>
    );
  };

  const EventComponent = ({ event }) => (
    <div className="truncate leading-tight">
      {event.title}
    </div>
  );

  const turnosFiltrados = turnos.filter(t => {
    const matchMes = !filtroMes || (t.fecha && t.fecha.startsWith(filtroMes));
    const matchEstado = !filtroEstado || t.estado === filtroEstado;
    return matchMes && matchEstado;
  });

  if (loading) {
    return (
      <div className="space-y-6 text-slate-900 dark:text-slate-200">
        <div className="flex items-center justify-between mb-5">
          <div className="space-y-3">
            <div className="h-8 w-64 bg-pink-200 dark:bg-[#262626] rounded-lg animate-pulse" />
            <div className="h-4 w-48 bg-pink-200 dark:bg-[#262626] rounded animate-pulse" />
          </div>
          <div className="h-12 w-40 bg-pink-200 dark:bg-[#262626] rounded-xl animate-pulse" />
        </div>

        {viewMode === 'calendar' ? (
          <div className="bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#333] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-purple-300 dark:border-[#333]">
              <div className="h-8 w-48 bg-pink-200 dark:bg-[#262626] rounded-lg animate-pulse" />
              <div className="flex gap-2">
                <div className="h-10 w-10 bg-pink-200 dark:bg-[#262626] rounded-xl animate-pulse" />
                <div className="h-10 w-16 bg-pink-200 dark:bg-[#262626] rounded-xl animate-pulse" />
                <div className="h-10 w-10 bg-pink-200 dark:bg-[#262626] rounded-xl animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="min-h-[120px] p-2.5 border-b border-r border-purple-300 dark:border-[#333]">
                  <div className="h-6 w-6 bg-pink-200 dark:bg-[#262626] rounded-full animate-pulse mb-2" />
                  <div className="space-y-2">
                    <div className="h-10 bg-pink-200 dark:bg-[#262626] rounded-lg animate-pulse" />
                    <div className="h-10 bg-pink-200 dark:bg-[#262626] rounded-lg animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#333] rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-purple-300 dark:border-[#333] flex gap-4">
              <div className="h-12 w-48 bg-pink-200 dark:bg-[#262626] rounded-xl animate-pulse" />
              <div className="h-12 w-40 bg-pink-200 dark:bg-[#262626] rounded-xl animate-pulse" />
            </div>
            <SkeletonTable rows={8} cols={4} />
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorState
          title="Error al cargar turnos"
          message={error}
          onRetry={cargarData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-200">
      <style>{`
        /* ===== DARK MODE ===== */
        .rbc-wrapper-dark .rbc-calendar { font-size: 13px; background: #141414; }

        /* Cabecera días */
        .rbc-wrapper-dark .rbc-header {
          padding: 10px 4px; font-weight: 700; font-size: 11px;
          text-transform: uppercase; letter-spacing: 0.05em;
          color: #94a3b8; border-bottom: 1px solid #333; background: #0a0c0f;
          white-space: nowrap; overflow: visible;
        }
        .rbc-wrapper-dark .rbc-header + .rbc-header { border-left: 1px solid #333; }
        .rbc-wrapper-dark .rbc-header a { color: #94a3b8 !important; }

        /* Grilla mensual */
        .rbc-wrapper-dark .rbc-month-view { border: none; background: #141414; height: 100%; }
        .rbc-wrapper-dark .rbc-month-row { border-top: 1px solid #333; }
        .rbc-wrapper-dark .rbc-month-row + .rbc-month-row { border-top: 1px solid #333; }
        .rbc-wrapper-dark .rbc-day-bg { background: #141414; }
        .rbc-wrapper-dark .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #333; }
        .rbc-wrapper-dark .rbc-off-range-bg { background: #0f1115; }
        .rbc-wrapper-dark .rbc-today { background-color: rgba(20,184,166,0.08) !important; }

        /* Números de día */
        .rbc-wrapper-dark .rbc-date-cell { padding: 5px 8px; text-align: right; }
        .rbc-wrapper-dark .rbc-date-cell .rbc-button-link { color: #cbd5e1 !important; font-size: 13px; font-weight: 700; }
        .rbc-wrapper-dark .rbc-date-cell.rbc-now .rbc-button-link { color: #14b8a6 !important; }
        .rbc-wrapper-dark .rbc-date-cell.rbc-off-range .rbc-button-link { color: #475569 !important; }

        /* Eventos */
        .rbc-wrapper-dark .rbc-row-segment { padding: 1px 3px; }
        .rbc-wrapper-dark .rbc-event { padding: 2px 4px; border: none !important; outline: none !important; }
        .rbc-wrapper-dark .rbc-event:focus { outline: none !important; box-shadow: none !important; }
        .rbc-wrapper-dark .rbc-event.rbc-selected { outline: none !important; }
        .rbc-wrapper-dark .rbc-show-more {
          color: #14b8a6; font-size: 11px; font-weight: 700;
          background: rgba(20,184,166,0.1); border-radius: 4px; padding: 1px 5px;
        }

        /* Vista semana/día */
        .rbc-wrapper-dark .rbc-time-view { border: none; background: #141414; height: 100%; }
        .rbc-wrapper-dark .rbc-time-header { border-bottom: 1px solid #333; background: #0a0c0f; }
        .rbc-wrapper-dark .rbc-time-header-content { border-left: 1px solid #333; }
        .rbc-wrapper-dark .rbc-time-header-cell .rbc-header { border-bottom: none; }
        .rbc-wrapper-dark .rbc-time-content { border-top: 1px solid #333; }
        .rbc-wrapper-dark .rbc-time-content > * + * > * { border-left: 1px solid #333; }
        .rbc-wrapper-dark .rbc-timeslot-group { border-bottom: 1px solid #262626; min-height: 44px; }
        .rbc-wrapper-dark .rbc-time-gutter .rbc-label { color: #64748b; font-size: 11px; font-weight: 600; padding: 0 10px; }
        .rbc-wrapper-dark .rbc-day-slot .rbc-time-slot { border-top: 1px solid #1e2028; }
        .rbc-wrapper-dark .rbc-day-slot .rbc-event { border: none; }
        .rbc-wrapper-dark .rbc-time-column { background: #141414; }
        .rbc-wrapper-dark .rbc-allday-cell { border-bottom: 1px solid #333; }
        .rbc-wrapper-dark .rbc-current-time-indicator { background-color: #14b8a6; height: 2px; }

        /* ===== LIGHT MODE ===== */
        .rbc-wrapper-light .rbc-calendar { font-size: 13px; background: #fff; }

        /* Cabecera días */
        .rbc-wrapper-light .rbc-header {
          padding: 10px 4px; font-weight: 700; font-size: 11px;
          text-transform: uppercase; letter-spacing: 0.05em;
          color: #7c3aed; border-bottom: 1px solid #e9d5ff; background: #faf5ff;
          white-space: nowrap; overflow: visible;
        }
        .rbc-wrapper-light .rbc-header + .rbc-header { border-left: 1px solid #e9d5ff; }
        .rbc-wrapper-light .rbc-header a { color: #7c3aed !important; }

        /* Grilla mensual */
        .rbc-wrapper-light .rbc-month-view { border: none; background: #fff; height: 100%; }
        .rbc-wrapper-light .rbc-month-row { border-top: 1px solid #d8b4fe; }
        .rbc-wrapper-light .rbc-month-row + .rbc-month-row { border-top: 1px solid #d8b4fe; }
        .rbc-wrapper-light .rbc-day-bg { background: #fff; }
        .rbc-wrapper-light .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #d8b4fe; }
        .rbc-wrapper-light .rbc-off-range-bg { background: #fdf4ff; }
        .rbc-wrapper-light .rbc-today { background-color: rgba(236,72,153,0.06) !important; }

        /* Números de día */
        .rbc-wrapper-light .rbc-date-cell { padding: 5px 8px; text-align: right; }
        .rbc-wrapper-light .rbc-date-cell .rbc-button-link { color: #374151 !important; font-size: 13px; font-weight: 700; }
        .rbc-wrapper-light .rbc-date-cell.rbc-now .rbc-button-link { color: #ec4899 !important; }
        .rbc-wrapper-light .rbc-date-cell.rbc-off-range .rbc-button-link { color: #d1d5db !important; }

        /* Eventos */
        .rbc-wrapper-light .rbc-row-segment { padding: 1px 3px; }
        .rbc-wrapper-light .rbc-event { padding: 2px 4px; border: none !important; outline: none !important; }
        .rbc-wrapper-light .rbc-event:focus { outline: none !important; box-shadow: none !important; }
        .rbc-wrapper-light .rbc-event.rbc-selected { outline: none !important; }
        .rbc-wrapper-light .rbc-show-more {
          color: #ec4899; font-size: 11px; font-weight: 700;
          background: rgba(236,72,153,0.1); border-radius: 4px; padding: 1px 5px;
        }

        /* Vista semana/día */
        .rbc-wrapper-light .rbc-time-view { border: none; background: #fff; height: 100%; }
        .rbc-wrapper-light .rbc-time-header { border-bottom: 1px solid #d8b4fe; background: #faf5ff; }
        .rbc-wrapper-light .rbc-time-header-content { border-left: 1px solid #d8b4fe; }
        .rbc-wrapper-light .rbc-time-header-cell .rbc-header { border-bottom: none; }
        .rbc-wrapper-light .rbc-time-content { border-top: 1px solid #d8b4fe; }
        .rbc-wrapper-light .rbc-time-content > * + * > * { border-left: 1px solid #d8b4fe; }
        .rbc-wrapper-light .rbc-timeslot-group { border-bottom: 1px solid #e9d5ff; min-height: 44px; }
        .rbc-wrapper-light .rbc-time-gutter .rbc-label { color: #374151; font-size: 11px; font-weight: 600; padding: 0 10px; }
        .rbc-wrapper-light .rbc-day-slot .rbc-time-slot { border-top: 1px solid #f3e8ff; }
        .rbc-wrapper-light .rbc-day-slot .rbc-event { border: none; }
        .rbc-wrapper-light .rbc-time-column { background: #fff; }
        .rbc-wrapper-light .rbc-allday-cell { border-bottom: 1px solid #fce7f3; }
        .rbc-wrapper-light .rbc-current-time-indicator { background-color: #ec4899; height: 2px; }

        /* quitar outline al seleccionar */
        .rbc-event:focus, .rbc-event.rbc-selected { outline: none !important; box-shadow: none !important; }
      `}</style>

      <ConfirmModal />

      {/* CABECERA PREMIUM */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 text-slate-900 dark:text-white tracking-tight">
            <span className="bg-pink-100 text-slate-900 font-bold dark:text-pink-600 dark:bg-teal-500/10 dark:text-teal-400 p-2.5 rounded-xl border border-teal-500/20 shadow-inner">
              <CalendarIcon size={24}/>
            </span>
            Agenda de Turnos
          </h1>
          <p className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 mt-2 font-medium">Gestioná tus horarios y citas de manera visual.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-pink-100 dark:bg-[#0f1115] border border-purple-300 dark:border-[#262626] rounded-xl overflow-hidden p-1 shadow-inner">
            <button onClick={() => setViewMode('calendar')} className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold transition-all duration-200 ${viewMode === 'calendar' ? 'bg-white dark:bg-[#1a1c23] text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 shadow-sm border border-purple-300 dark:border-[#333]' : 'text-slate-900 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'}`}>
              <CalendarIcon size={18} /> Mes
            </button>
            <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold transition-all duration-200 ${viewMode === 'list' ? 'bg-white dark:bg-[#1a1c23] text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 shadow-sm border border-purple-300 dark:border-[#333]' : 'text-slate-900 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'}`}>
              <List size={18} /> Lista
            </button>
          </div>

          <button onClick={() => { setEditingTurno(null); setPacienteId(""); setFecha(""); setHora(""); setConsultorio(""); setObservaciones(""); setEstado("pendiente"); setFormErrors({}); setShowModal(true); }} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-6 py-2.5 rounded-xl transition-all font-bold shadow-lg shadow-teal-500/20 hover:-translate-y-0.5">
            <Plus size={20} /> Nuevo Turno
          </button>
        </div>
      </div>

      {/* ============================== */}
      {/* VISTA 1: CALENDARIO PREMIUM   */}
      {/* ============================== */}
      {viewMode === 'calendar' && (
        <div className={`bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#333] rounded-2xl shadow-xl flex flex-col ${isDark ? 'rbc-wrapper-dark' : 'rbc-wrapper-light'}`}>

          {/* Header del Calendario */}
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
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${
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

          {/* Calendario */}
          <div style={{ height: view === 'month' ? 650 : 720 }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={setView}
              date={currentDate}
              onNavigate={(date) => setCurrentDate(date)}
              toolbar={false}
              popup
              selectable
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              eventPropGetter={eventPropGetter}
              components={{
                event: EventComponent,
              }}
              messages={{
                showMore: (total) => `+${total} más`,
                allDay: 'Todo el día',
                noEventsInRange: 'No hay turnos en este rango.',
              }}
              formats={{
                dayFormat: (date) => moment(date).locale('es').format('ddd D'),
                weekdayFormat: (date) => moment(date).locale('es').format('ddd'),
                timeGutterFormat: 'HH:mm',
                eventTimeRangeFormat: () => '',
                dayRangeHeaderFormat: ({ start, end }) =>
                  `${moment(start).locale('es').format('D MMM')} – ${moment(end).locale('es').format('D MMM YYYY')}`,
                dayHeaderFormat: (date) => moment(date).locale('es').format('dddd D [de] MMMM [de] YYYY'),
              }}
              className="h-full"
            />
          </div>
        </div>
      )}

      {/* ============================== */}
      {/* PANEL LATERAL: DÍA COMPLETO   */}
      {/* ============================== */}
      {diaPanel && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setDiaPanel(null)} />
          <div className="fixed right-0 top-0 h-full w-80 z-50 bg-white dark:bg-[#141414] border-l border-purple-300 dark:border-[#333] shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-purple-300 dark:border-[#262626] bg-purple-100/50 dark:bg-[#0f1115] flex items-center justify-between shrink-0">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-pink-500 dark:text-slate-500 mb-0.5">Turnos del día</p>
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  {new Date(diaPanel.fecha + 'T12:00:00Z').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
              </div>
              <button onClick={() => setDiaPanel(null)} className="p-2 rounded-xl border border-purple-300 dark:border-[#333] bg-white dark:bg-[#1a1c23] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 transition-colors text-sm font-bold">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {diaPanel.turnos.map(turno => {
                const estConfig = estadoConfig[turno.estado] || estadoConfig.pendiente;
                return (
                  <div
                    key={turno.id}
                    className="rounded-xl p-3.5 cursor-pointer hover:brightness-105 transition-all shadow-sm border"
                    style={{ backgroundColor: estConfig.bg + '15', borderColor: estConfig.bg + '40' }}
                    onClick={(e) => { setDiaPanel(null); handleTurnoClick(turno, e); }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-black text-slate-900 dark:text-white text-sm">{turno.hora.slice(0, 5)} hs</span>
                      <BadgeEstado estado={turno.estado} />
                    </div>
                    <p className="font-bold text-slate-900 dark:text-slate-200 text-sm truncate">{turno.paciente_apellido}, {turno.paciente_nombre}</p>
                    <p className="text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 text-xs mt-0.5 flex items-center gap-1"><MapPin size={10} /> {turno.consultorio}</p>
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-3 border-t border-purple-300 dark:border-[#262626] shrink-0">
              <button
                onClick={() => { setDiaPanel(null); handleDayClick(Number(diaPanel.fecha.slice(8, 10))); }}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
              >
                <Plus size={16} /> Nuevo turno este día
              </button>
            </div>
          </div>
        </>
      )}

      {/* ============================== */}
      {/* POPOVER DE ACCIÃ“N RÁPIDA      */}
      {/* ============================== */}
      {popoverTurno && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setPopoverTurno(null)} />

          <div
            className="turno-popover fixed z-50 bg-white dark:bg-[#1a1c23] border border-purple-300 dark:border-[#333] rounded-2xl shadow-2xl p-5 w-72"
            style={{
              left: Math.max(16, Math.min(popoverPos.x - 144, window.innerWidth - 304)),
              top: Math.max(16, popoverPos.y - 220)
            }}
          >
            <div className="border-b border-slate-100 dark:border-[#262626] pb-3 mb-3">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="bg-teal-100 dark:bg-teal-500/10 p-1.5 rounded-lg text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400">
                  <User size={14} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                  {popoverTurno.paciente_apellido}, {popoverTurno.paciente_nombre}
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 font-medium ml-9">
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {popoverTurno.hora.slice(0, 5)} hs
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={11} /> {popoverTurno.consultorio}
                </span>
              </div>
            </div>

            <div className="mb-3 text-center">
              <BadgeEstado estado={popoverTurno.estado} />
            </div>

            <button
              onClick={(e) => handleEdit(popoverTurno, e)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-purple-300 dark:border-[#333] bg-slate-50 dark:bg-[#262626] text-slate-900 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#333] transition-all mb-3"
            >
              <Pencil size={14} /> Editar turno
            </button>

            <p className="text-[10px] uppercase tracking-widest font-bold text-pink-500 dark:text-slate-500 mb-2 text-center">
              Cambiar estado a:
            </p>
            <div className="flex flex-col gap-1.5">
              {Object.entries(estadoConfig).map(([key, cfg]) => {
                if (key === popoverTurno.estado) return null;
                const IconBtn = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={(e) => handleCambiarEstado(popoverTurno.id, key, e)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all hover:scale-[1.02] active:scale-95"
                    style={{
                      backgroundColor: cfg.bg + '15',
                      borderColor: cfg.bg + '40',
                      color: cfg.bg
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = cfg.bg + '25'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = cfg.bg + '15'}
                  >
                    <IconBtn size={14} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ============================== */}
      {/* VISTA 2: LISTA DE TARJETAS    */}
      {/* ============================== */}
      {viewMode === 'list' && (
        <>
          {/* FILTROS */}
          <div className="flex gap-4 mb-6">
            <input
              type="month"
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-slate-200 rounded-xl py-3 px-4 text-sm outline-none focus:border-teal-500 dark:focus:border-teal-500 transition-shadow shadow-sm dark:[&::-webkit-calendar-picker-indicator]:invert"
            />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-slate-200 rounded-xl py-3 px-4 text-sm outline-none focus:border-teal-500 dark:focus:border-teal-500 transition-shadow shadow-sm"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="inasistencia">Inasistencia</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {turnosFiltrados.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={CalendarIcon}
                title={filtroMes || filtroEstado ? 'Sin resultados' : 'No hay turnos agendados'}
                description={filtroMes || filtroEstado ? 'No hay turnos que coincidan con los filtros seleccionados.' : 'Hacé clic en "Nuevo Turno" para empezar.'}
                action={!filtroMes && !filtroEstado ? { label: 'Nuevo Turno', onClick: () => { setFecha(""); setFormErrors({}); setShowModal(true); } } : undefined}
              />
            </div>
          )}
          {turnosFiltrados.map((t, idx) => {
            const estConfig = estadoConfig[t.estado] || estadoConfig.pendiente;
            return (
              <div key={t.id} className={`stagger-${Math.min(idx + 1, 12)} animate-fade-in-up bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#262626] rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-pink-500/50 dark:hover:border-teal-500/50 shadow-sm group relative ${
                t.estado === 'inasistencia' ? 'opacity-60' : ''
              }`}>
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={(e) => handleEdit(t, e)} className="text-slate-900 hover:text-teal-500 bg-slate-50 dark:bg-[#1a1c23] p-2 rounded-lg border border-transparent dark:hover:border-[#333]">
                    <Pencil size={16} />
                  </button>
                  {(t.estado === 'pendiente' || t.estado === 'confirmado') && (
                    <button
                      onClick={(e) => handleEnviarRecordatorio(t, e)}
                      disabled={enviandoRecordatorio === t.id}
                      className="text-slate-900 hover:text-green-500 bg-slate-50 dark:bg-[#1a1c23] p-2 rounded-lg border border-transparent dark:hover:border-[#333] disabled:opacity-50"
                    >
                      <MessageCircle size={16} className={enviandoRecordatorio === t.id ? 'animate-pulse' : ''} />
                    </button>
                  )}
                  <button onClick={(e) => handleDelete(t.id, e)} className="text-slate-900 hover:text-red-500 bg-slate-50 dark:bg-[#1a1c23] p-2 rounded-lg border border-transparent dark:hover:border-[#333]">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mb-5 border-b border-slate-100 dark:border-[#262626] pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-xl capitalize text-slate-900 dark:text-white pr-8 truncate">
                      {t.paciente_apellido}, {t.paciente_nombre}
                    </h3>
                    <BadgeEstado estado={t.estado} />
                  </div>
                </div>

                <div className="space-y-3.5 text-sm text-slate-900 dark:text-slate-300 font-medium">
                  <div className="flex items-center gap-3">
                    <div className="bg-teal-50 dark:bg-teal-500/10 p-2 rounded-lg text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400"><CalendarIcon size={16} /></div>
                    <span>{new Date(t.fecha + 'T12:00:00Z').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-teal-50 dark:bg-teal-500/10 p-2 rounded-lg text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400"><Clock size={16} /></div>
                    <span className="font-bold text-slate-900 dark:text-white">{t.hora.substring(0, 5)} hs</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-teal-50 dark:bg-teal-500/10 p-2 rounded-lg text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400"><MapPin size={16} /></div>
                    <span className="capitalize">{t.consultorio || 'Sin asignar'}</span>
                  </div>
                  {t.paciente_obra_social && (
                    <div className="flex items-center gap-3">
                      <div className="bg-teal-50 dark:bg-teal-500/10 p-2 rounded-lg text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400"><ShieldCheck size={16} /></div>
                      <span className="capitalize text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400">{t.paciente_obra_social}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#262626] flex flex-wrap gap-1.5">
                  {Object.entries(estadoConfig).map(([key, cfg]) => {
                    if (key === t.estado) return null;
                    const IconBtn = cfg.icon;
                    return (
                      <button
                        key={key}
                        onClick={(e) => handleCambiarEstado(t.id, key, e)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all hover:scale-105 ${cfg.color} opacity-70 hover:opacity-100`}
                      >
                        <IconBtn size={10} /> {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        </>
      )}

      {/* ============================== */}
      {/* MODAL: NUEVO TURNO PREMIUM    */}
      {/* ============================== */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-[#141414] w-full max-w-lg mx-auto max-h-screen sm:max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-300 dark:border-[#333]">

            <div className="border-b border-purple-300 dark:border-[#262626] bg-purple-100/50 dark:bg-[#0f1115] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0 gap-2">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{editingTurno ? 'Editar Turno' : 'Nuevo Turno'}</h2>
                <p className="text-sm mt-1 text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 font-medium">{editingTurno ? 'Modificá los datos del turno.' : 'Asigná fecha, hora y consultorio al paciente.'}</p>
              </div>
              <button onClick={() => { setShowModal(false); setEditingTurno(null); }} className="p-2.5 rounded-xl border border-purple-300 dark:border-[#333] bg-white dark:bg-[#1a1c23] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-900 dark:text-slate-400 transition-colors shadow-sm">✕</button>
            </div>

            <div className="p-5 text-sm overflow-y-auto flex-1 custom-scrollbar">
              <form id="turnoForm" onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block mb-2 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Paciente *</label>
                  <select
                    value={pacienteId}
                    onChange={(e) => { setPacienteId(e.target.value); setFormErrors(prev => ({ ...prev, pacienteId: '' })); }}
                    onBlur={() => {
                      if (!pacienteId) setFormErrors(prev => ({ ...prev, pacienteId: 'Debés seleccionar un paciente.' }));
                      else setFormErrors(prev => ({ ...prev, pacienteId: '' }));
                    }}
                    className={inputClass('pacienteId')}
                  >
                    <option value="">Seleccionar Paciente...</option>
                    {pacientes.map(p => (
                      <option key={p.id} value={p.id}>{p.apellido}, {p.nombre} (DNI: {p.dni})</option>
                    ))}
                  </select>
                  {formErrors.pacienteId && (
                    <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1 font-medium">
                      <AlertCircle size={12} /> {formErrors.pacienteId}
                    </p>
                  )}
                </div>

                {pacienteSeleccionado && (
                  <div className="bg-purple-100/50 dark:bg-[#0f1115] border border-purple-300 dark:border-[#333] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={18} className="text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400" />
                      <div>
                        <p className="text-xs uppercase tracking-wider font-bold text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400">Cobertura</p>
                        <p className="font-bold text-slate-900 dark:text-slate-200 capitalize mt-0.5">
                          {pacienteSeleccionado.obra_social || 'Particular'}
                          {pacienteSeleccionado.obra_social && <span className="text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 text-xs ml-2 font-medium">(Obra Social)</span>}
                          {!pacienteSeleccionado.obra_social && <span className="text-slate-900 text-xs ml-2 font-medium">(Particular)</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block mb-2 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Fecha *</label>
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => { setFecha(e.target.value); setFormErrors(prev => ({ ...prev, fecha: '' })); }}
                      onBlur={() => {
                        if (!fecha) setFormErrors(prev => ({ ...prev, fecha: 'La fecha es obligatoria.' }));
                        else {
                          const today = new Date(); today.setHours(0, 0, 0, 0);
                          const selected = new Date(fecha + 'T12:00:00Z');
                          if (selected < today) setFormErrors(prev => ({ ...prev, fecha: 'La fecha no puede ser anterior a hoy.' }));
                          else setFormErrors(prev => ({ ...prev, fecha: '' }));
                        }
                      }}
                      className={inputClass('fecha')}
                    />
                    {formErrors.fecha && (
                      <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1 font-medium">
                        <AlertCircle size={12} /> {formErrors.fecha}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-2 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Hora *</label>
                    <TimePicker
                      value={hora}
                      onChange={(val) => { setHora(val); setFormErrors(prev => ({ ...prev, hora: '' })); }}
                      className={inputClass('hora')}
                    />
                    {formErrors.hora && (
                      <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1 font-medium">
                        <AlertCircle size={12} /> {formErrors.hora}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Consultorio *</label>
                  <select
                    value={consultorio}
                    onChange={(e) => { setConsultorio(e.target.value); setFormErrors(prev => ({ ...prev, consultorio: '' })); }}
                    onBlur={() => {
                      if (!consultorio) setFormErrors(prev => ({ ...prev, consultorio: 'Debés seleccionar un consultorio.' }));
                      else setFormErrors(prev => ({ ...prev, consultorio: '' }));
                    }}
                    className={inputClass('consultorio')}
                  >
                    <option value="">Seleccionar Consultorio...</option>
                    {consultorios.map(c => (
                      <option key={c.id} value={c.nombre}>{c.nombre}</option>
                    ))}
                  </select>
                  {formErrors.consultorio && (
                    <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1 font-medium">
                      <AlertCircle size={12} /> {formErrors.consultorio}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Estado</label>
                  <select value={estado} onChange={(e)=>setEstado(e.target.value)} className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium">
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="inasistencia">Inasistencia</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Observaciones Breves</label>
                  <textarea value={observaciones} onChange={(e)=>setObservaciones(e.target.value)} rows="2" className="w-full rounded-xl p-3.5 outline-none transition-colors resize-none border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium"></textarea>
                </div>

                {!editingTurno && (
                  <div className="border border-teal-500/30 dark:border-teal-500/20 bg-teal-50/50 dark:bg-teal-500/5 rounded-xl p-4 space-y-2">
                    <label className="block font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider text-xs">Repetir semanalmente</label>
                    <p className="text-xs text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400">Se creará un turno por semana, el mismo día y horario, durante el período elegido.</p>
                    <select
                      value={recurrencia}
                      onChange={(e) => setRecurrencia(e.target.value)}
                      className="w-full rounded-xl p-3.5 outline-none transition-colors border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0f1115] text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-teal-500 shadow-sm font-medium"
                    >
                      <option value="">Sin repetición (turno único)</option>
                      <option value="1">Durante 1 mes</option>
                      <option value="2">Durante 2 meses</option>
                      <option value="3">Durante 3 meses</option>
                      <option value="4">Durante 4 meses</option>
                    </select>
                  </div>
                )}
              </form>
            </div>

            <div className="border-t border-purple-300 dark:border-[#262626] bg-purple-100/50 dark:bg-[#0f1115] px-4 sm:px-6 py-4 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => { setShowModal(false); setEditingTurno(null); }} disabled={submitting} className="px-5 py-2 font-bold rounded-xl transition-colors text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white disabled:opacity-50">Cancelar</button>
              <Button type="submit" form="turnoForm" loading={submitting}>
                {editingTurno ? 'Guardar Cambios' : 'Agendar Turno'}
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
