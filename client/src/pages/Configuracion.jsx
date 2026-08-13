import { useState, useEffect, useRef } from 'react';
import {
  Settings, MessageCircle, Save, Loader2, Smartphone, History,
  CheckCircle, XCircle, HardDrive, Wifi, WifiOff, RefreshCw,
  LogOut, Send, User, Sun, Moon, Shield, Bell, Plug,
  QrCode, AlertCircle, FolderOpen, CloudOff, Cloud, Lock, KeyRound,
  Calendar, ToggleLeft, ToggleRight, RefreshCcw, ChevronDown,
} from 'lucide-react';
import { getDriveStatus, getDriveAuthUrl, disconnectDrive } from '../services/driveService';
import { getCalendarStatus, getCalendarios, updateCalendarConfig, sincronizarTodos } from '../services/calendarService';
import apiFetch from '../services/api';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { apiPost } from '../services/api.js';
import {
  getConfiguracion,
  getConfiguracionNotificaciones,
  updateConfiguracionNotificaciones,
  getHistorialWhatsApp,
  updateConfiguracionPerfil,
  updatePlantillasNotificaciones,
} from '../services/configuracionService';
import TimePicker from '../components/ui/TimePicker';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../context/useAuth.js';
import supabase from '../services/authService.js';

// ─── Primitivos UI ──────────────────────────────────────────────────────────

function SwitchToggle({ valor, onChange, label, descripcion }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
        {descripcion && <p className="text-xs text-slate-900 dark:text-white mt-0.5">{descripcion}</p>}
      </div>
      <button
        onClick={() => onChange(!valor)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
          valor ? 'bg-pink-500 dark:bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${valor ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

function VariableChip({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center px-2 py-1 text-xs font-mono bg-pink-100 dark:bg-teal-500/10 text-pink-700 dark:text-teal-400 rounded-lg cursor-pointer hover:bg-pink-200 dark:hover:bg-teal-500/20 transition-colors border border-pink-200 dark:border-transparent"
    >
      {children}
    </button>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-purple-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, iconBg, iconColor, title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-purple-100 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
          {subtitle && <p className="text-xs text-slate-900 dark:text-white mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, hint, type = 'text' }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl bg-purple-50/60 dark:bg-slate-800 border border-purple-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-teal-500 focus:border-transparent transition-colors"
      />
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function SaveButton({ onClick, saving, label = 'Guardar cambios' }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-400 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
    >
      {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
      {saving ? 'Guardando...' : label}
    </button>
  );
}

function StatusBadge({ connected, labelOn = 'Conectado', labelOff = 'No conectado' }) {
  return connected ? (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      {labelOn}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      {labelOff}
    </span>
  );
}

// ─── Tab: Perfil ─────────────────────────────────────────────────────────────

function TabPerfil({ toast }) {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [form, setForm] = useState({
    nombre_profesional: '',
    especialidad: '',
    matricula: '',
    email: '',
    telefono_profesional: '',
  });

  useEffect(() => {
    getConfiguracion().then((data) => {
      if (data) {
        setForm({
          nombre_profesional: data.nombre_profesional || '',
          especialidad: data.especialidad || '',
          matricula: data.matricula || '',
          email: data.email || '',
          telefono_profesional: data.telefono_profesional || '',
        });
      }
      setLoading(false);
    });
  }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleGuardar = async () => {
    setSaving(true);
    const result = await updateConfiguracionPerfil(form);
    if (result) toast.success('Perfil guardado', 'Los datos se actualizaron correctamente.');
    else toast.error('Error', 'No se pudo guardar el perfil.');
    setSaving(false);
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('darkMode', String(next));
      if (next) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return next;
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 className="animate-spin text-pink-500" size={24} />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Datos profesionales */}
      <Card>
        <SectionHeader
          icon={User}
          iconBg="bg-pink-100 dark:bg-pink-500/10"
          iconColor="text-pink-600 dark:text-pink-400"
          title="Datos del Profesional"
          subtitle="Aparecen en informes, recibos y comunicaciones"
        />
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre completo" value={form.nombre_profesional} onChange={set('nombre_profesional')} placeholder="Lic. María García" />
            <Field label="Especialidad" value={form.especialidad} onChange={set('especialidad')} placeholder="Psicopedagogía" />
            <Field label="Matrícula" value={form.matricula} onChange={set('matricula')} placeholder="MP 12345" />
            <Field label="Email de contacto" value={form.email} onChange={set('email')} placeholder="consulta@ejemplo.com" type="email" />
            <Field
              label="Teléfono WhatsApp"
              value={form.telefono_profesional}
              onChange={set('telefono_profesional')}
              placeholder="1138057772"
              hint="Sin +54 ni 0 — solo el número local"
            />
          </div>
          <div className="flex justify-end pt-2">
            <SaveButton onClick={handleGuardar} saving={saving} label="Guardar perfil" />
          </div>
        </div>
      </Card>

      {/* Apariencia */}
      <Card>
        <SectionHeader
          icon={darkMode ? Moon : Sun}
          iconBg="bg-purple-100 dark:bg-purple-500/10"
          iconColor="text-purple-600 dark:text-purple-400"
          title="Apariencia"
          subtitle="Cambiá entre el tema claro y oscuro"
        />
        <div className="p-5">
          <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50 dark:bg-slate-800/50 border border-purple-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm">
                {darkMode ? <Moon size={17} className="text-purple-500" /> : <Sun size={17} className="text-yellow-500" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {darkMode ? 'Modo Oscuro' : 'Modo Claro'}
                </p>
                <p className="text-xs text-slate-900 dark:text-white mt-0.5">
                  {darkMode ? 'Fondo oscuro, ideal para poca luz' : 'Paleta rosa/lila, ideal para el día'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-400 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
              {darkMode ? 'Cambiar a claro' : 'Cambiar a oscuro'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Tab: Recordatorios ──────────────────────────────────────────────────────

function TabRecordatorios({ toast }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [notificacionesPacientes, setNotificacionesPacientes] = useState(true);
  const [notificacionesProfesional, setNotificacionesProfesional] = useState(true);
  const [horaEnvio, setHoraEnvio] = useState('17:00');
  const [mensajeProfesional, setMensajeProfesional] = useState('');
  const VARS_PROFESIONAL = ['{fecha}', '{cantidad}', '{lista_turnos}'];

  useEffect(() => {
    getConfiguracionNotificaciones().then((config) => {
      if (config) {
        setNotificacionesPacientes(config.notificaciones_pacientes ?? true);
        setNotificacionesProfesional(config.notificaciones_profesional ?? true);
        setHoraEnvio(config.hora_envio || '17:00');
        setMensajeProfesional(config.mensaje_profesional || '');
      }
      setLoading(false);
    });
  }, []);

  const handleGuardar = async () => {
    setSaving(true);
    const result = await updateConfiguracionNotificaciones({
      notificaciones_pacientes: notificacionesPacientes,
      notificaciones_profesional: notificacionesProfesional,
      hora_envio: horaEnvio,
      mensaje_profesional: mensajeProfesional,
    });
    if (result) toast.success('Guardado', 'Configuración de recordatorios actualizada.');
    else toast.error('Error', 'No se pudo guardar la configuración.');
    setSaving(false);
  };

  const handleEnviarProfesional = async () => {
    setEnviando(true);
    try {
      const data = await apiPost('/whatsapp/enviar-resumen-profesional');
      if (!data.waConectado) toast.error('WhatsApp no conectado', 'Conectá WhatsApp en la pestaña Integraciones primero.');
      else if (data.turnos === 0) toast.success('Sin turnos', 'No hay turnos para mañana.');
      else toast.success('Resumen enviado', 'El resumen del día fue enviado al profesional.');
    } catch (err) {
      toast.error('Error', err.message || 'No se pudo enviar el resumen.');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 className="animate-spin text-pink-500" size={24} />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Estado general */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={`p-4 rounded-2xl border-2 transition-colors ${notificacionesPacientes ? 'bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-500/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Smartphone size={16} className={notificacionesPacientes ? 'text-green-600 dark:text-green-400' : 'text-slate-400'} />
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Pacientes</span>
            </div>
            <button
              onClick={() => setNotificacionesPacientes((v) => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${notificacionesPacientes ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${notificacionesPacientes ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
            </button>
          </div>
          <p className="text-xs text-slate-900 dark:text-white">Recordatorio automático el día anterior al turno</p>
        </div>

        <div className={`p-4 rounded-2xl border-2 transition-colors ${notificacionesProfesional ? 'bg-blue-50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bell size={16} className={notificacionesProfesional ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Profesional</span>
            </div>
            <button
              onClick={() => setNotificacionesProfesional((v) => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${notificacionesProfesional ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${notificacionesProfesional ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
            </button>
          </div>
          <p className="text-xs text-slate-900 dark:text-white">Resumen diario con todos los turnos del día siguiente</p>
        </div>
      </div>

      {/* Horario */}
      <Card>
        <SectionHeader
          icon={Bell}
          iconBg="bg-pink-100 dark:bg-pink-500/10"
          iconColor="text-pink-600 dark:text-pink-400"
          title="Horario de envío"
          subtitle="Hora a la que se disparan los recordatorios automáticos"
        />
        <div className="p-5">
          <div className="flex items-center gap-4 flex-wrap">
            <TimePicker
              value={horaEnvio}
              onChange={(val) => setHoraEnvio(val)}
              className="bg-purple-50 dark:bg-slate-800 border border-purple-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-teal-500"
            />
            <p className="text-sm text-slate-900 dark:text-white">
              Aplica a pacientes y al resumen profesional. Hora actual: <strong className="text-slate-900 dark:text-white">{horaEnvio} hs</strong>
            </p>
          </div>
        </div>
      </Card>

      {/* Plantilla resumen profesional */}
      <Card>
        <SectionHeader
          icon={MessageCircle}
          iconBg="bg-blue-100 dark:bg-blue-500/10"
          iconColor="text-blue-600 dark:text-blue-400"
          title="Plantilla: Resumen al Profesional"
          subtitle="Mensaje que recibís vos con el resumen del día siguiente"
        />
        <div className="p-5 space-y-3">
          <textarea
            value={mensajeProfesional}
            onChange={(e) => setMensajeProfesional(e.target.value)}
            rows={3}
            placeholder="Recordatorio: mañana {fecha} tenés {cantidad} turno(s):{lista_turnos}"
            className="w-full px-3 py-2.5 rounded-xl bg-purple-50/60 dark:bg-slate-800 border border-purple-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-teal-500 focus:border-transparent transition-colors resize-y"
          />
          <div>
            <p className="text-xs text-slate-400 mb-2">Variables disponibles:</p>
            <div className="flex flex-wrap gap-2">
              {VARS_PROFESIONAL.map((v) => <VariableChip key={v}>{v}</VariableChip>)}
            </div>
          </div>
        </div>
      </Card>

      {/* Acciones */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={handleEnviarProfesional}
          disabled={enviando}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-sm font-semibold transition-colors disabled:opacity-40"
        >
          {enviando ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Enviar resumen ahora
        </button>
        <SaveButton onClick={handleGuardar} saving={saving} />
      </div>
    </div>
  );
}

// ─── Tab: Notificaciones ─────────────────────────────────────────────────────

function TabNotificaciones({ toast }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensajePaciente, setMensajePaciente] = useState('');
  const [plantillas, setPlantillas] = useState({
    plantilla_cancelacion: '',
    plantilla_cambio_horario: '',
    plantilla_aviso_libre: '',
  });
  const mensajeRef = useRef(null);
  const VARS = ['{nombre}', '{fecha}', '{hora}', '{consultorio}'];

  useEffect(() => {
    getConfiguracion().then((data) => {
      if (data) {
        setMensajePaciente(data.mensaje_paciente || '');
        setPlantillas({
          plantilla_cancelacion: data.plantilla_cancelacion || '',
          plantilla_cambio_horario: data.plantilla_cambio_horario || '',
          plantilla_aviso_libre: data.plantilla_aviso_libre || '',
        });
      }
      setLoading(false);
    });
  }, []);

  const set = (field) => (e) => setPlantillas((p) => ({ ...p, [field]: e.target.value }));

  const insertarVariable = (variable) => {
    if (!mensajeRef.current) return;
    const el = mensajeRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newValue = mensajePaciente.substring(0, start) + variable + mensajePaciente.substring(end);
    setMensajePaciente(newValue);
    setTimeout(() => { el.focus(); const pos = start + variable.length; el.setSelectionRange(pos, pos); }, 0);
  };

  const handleGuardar = async () => {
    setSaving(true);
    const [r1, r2] = await Promise.all([
      updateConfiguracionNotificaciones({ mensaje_paciente: mensajePaciente }),
      updatePlantillasNotificaciones(plantillas),
    ]);
    if (r1 && r2) toast.success('Plantillas guardadas', 'Las plantillas de mensajes se actualizaron.');
    else toast.error('Error', 'No se pudieron guardar las plantillas.');
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 className="animate-spin text-pink-500" size={24} />
    </div>
  );

  const plantillaDefs = [
    {
      key: 'plantilla_cancelacion',
      label: 'Cancelación de turno',
      descripcion: 'Se envía cuando cancelás un turno desde el sistema',
      placeholder: 'Hola {nombre}, te informamos que tu turno del {fecha} fue cancelado.',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-500/10',
    },
    {
      key: 'plantilla_cambio_horario',
      label: 'Cambio de horario',
      descripcion: 'Se envía cuando reprogramás un turno existente',
      placeholder: 'Hola {nombre}, tu turno fue reprogramado para el {fecha} a las {hora} en {consultorio}.',
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-500/10',
    },
    {
      key: 'plantilla_aviso_libre',
      label: 'Aviso personalizado',
      descripcion: 'Mensaje libre para cualquier comunicación puntual',
      placeholder: 'Hola {nombre}, te enviamos este mensaje desde el consultorio.',
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Recordatorio automático */}
      <Card>
        <SectionHeader
          icon={MessageCircle}
          iconBg="bg-green-100 dark:bg-green-500/10"
          iconColor="text-green-600 dark:text-green-400"
          title="Recordatorio automático a pacientes"
          subtitle="Mensaje que recibe cada paciente el día anterior a su turno"
        />
        <div className="p-5 space-y-3">
          <textarea
            ref={mensajeRef}
            value={mensajePaciente}
            onChange={(e) => setMensajePaciente(e.target.value)}
            rows={4}
            placeholder="Hola {nombre}! Te recordamos que tenés turno mañana {fecha} a las {hora} en {consultorio}."
            className="w-full px-3 py-2.5 rounded-xl bg-purple-50/60 dark:bg-slate-800 border border-purple-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-teal-500 focus:border-transparent transition-colors resize-y"
          />
          <div>
            <p className="text-xs text-slate-400 mb-2">Hacé clic en una variable para insertarla donde está el cursor:</p>
            <div className="flex flex-wrap gap-2">
              {VARS.map((v) => <VariableChip key={v} onClick={() => insertarVariable(v)}>{v}</VariableChip>)}
            </div>
          </div>
        </div>
      </Card>

      {/* Plantillas puntuales */}
      <div className="flex items-center gap-2 px-1">
        <div className="flex-1 h-px bg-purple-200 dark:bg-slate-800" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avisos puntuales</span>
        <div className="flex-1 h-px bg-purple-200 dark:bg-slate-800" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {plantillaDefs.map(({ key, label, descripcion, placeholder, color, bg }) => (
          <Card key={key}>
            <div className="px-5 py-3 border-b border-purple-100 dark:border-slate-800 flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${bg}`}>
                <MessageCircle size={14} className={color} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{descripcion}</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <textarea
                value={plantillas[key]}
                onChange={set(key)}
                rows={3}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 rounded-xl bg-purple-50/60 dark:bg-slate-800 border border-purple-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-teal-500 focus:border-transparent transition-colors resize-y"
              />
              <div className="flex flex-wrap gap-2">
                {VARS.map((v) => <VariableChip key={v}>{v}</VariableChip>)}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <SaveButton onClick={handleGuardar} saving={saving} label="Guardar plantillas" />
      </div>
    </div>
  );
}

// ─── Tab: Integraciones ──────────────────────────────────────────────────────

function TabIntegraciones({ toast, confirm }) {
  // WhatsApp state
  const [waEstado, setWaEstado] = useState('DISCONNECTED');
  const [waQR, setWaQR] = useState(null);
  const [waLoading, setWaLoading] = useState(true);
  const [waConectando, setWaConectando] = useState(false);
  const [waDesconectando, setWaDesconectando] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [historialLoading, setHistorialLoading] = useState(true);

  // Drive state
  const [driveConnected, setDriveConnected] = useState(null);
  const [driveLoading, setDriveLoading] = useState(true);
  const [driveDisconnecting, setDriveDisconnecting] = useState(false);

  // Calendar state
  const [calendarStatus, setCalendarStatus] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarios, setCalendarios] = useState([]);
  const [calendarSaving, setCalendarSaving] = useState(false);
  const [calendarSyncing, setCalendarSyncing] = useState(false);
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(true);
  const [calendarId, setCalendarId] = useState('primary');

  useEffect(() => {
    // Cargar estado WA
    apiFetch('/whatsapp/status')
      .then((res) => res.json())
      .then((data) => setWaEstado(data.estado || 'DISCONNECTED'))
      .catch(() => setWaEstado('DISCONNECTED'))
      .finally(() => setWaLoading(false));

    getHistorialWhatsApp().then((data) => {
      setHistorial(Array.isArray(data) ? data : []);
      setHistorialLoading(false);
    });

    // Cargar estado Drive
    getDriveStatus().then((s) => {
      setDriveConnected(s?.connected ?? false);
      setDriveLoading(false);
    });

    // Cargar estado Calendar
    getCalendarStatus().then((s) => {
      setCalendarStatus(s);
      setCalendarSyncEnabled(s?.sync_enabled ?? true);
      setCalendarId(s?.calendar_id || 'primary');
      setCalendarLoading(false);
      if (s?.connected) {
        getCalendarios().then((list) => setCalendarios(Array.isArray(list) ? list : []));
      }
    });
  }, []);

  // Polling QR
  useEffect(() => {
    if (!['QR_READY', 'CONNECTING', 'ERROR'].includes(waEstado)) return;
    const interval = setInterval(async () => {
      try {
        const [statusRes, qrRes] = await Promise.all([
          apiFetch('/whatsapp/status'),
          apiFetch('/whatsapp/qr'),
        ]);
        const statusData = await statusRes.json();
        const qrData = await qrRes.json();
        setWaEstado(statusData.estado || 'DISCONNECTED');
        setWaQR(qrData.qr || null);
      } catch { /* polling: ignorar errores transitorios */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [waEstado]);

  const handleConectar = async () => {
    setWaConectando(true);
    setWaEstado('CONNECTING');
    try {
      await apiFetch('/whatsapp/conectar', { method: 'POST' });
    } catch {
      toast.error('Error', 'No se pudo iniciar la conexión con WhatsApp.');
      setWaEstado('DISCONNECTED');
    } finally {
      setWaConectando(false);
    }
  };

  const handleDesconectarWa = async () => {
    const ok = await confirm({
      title: 'Cerrar sesión de WhatsApp',
      message: '¿Cerrás la sesión de WhatsApp? Tendrás que escanear el QR de nuevo para reconectar.',
      confirmLabel: 'Cerrar sesión',
      variant: 'danger',
    });
    if (!ok) return;
    setWaDesconectando(true);
    try {
      await apiFetch('/whatsapp/desconectar', { method: 'POST' });
      setWaEstado('DISCONNECTED');
      setWaQR(null);
      toast.success('Sesión cerrada', 'WhatsApp desconectado correctamente.');
    } catch {
      toast.error('Error', 'No se pudo cerrar la sesión.');
    } finally {
      setWaDesconectando(false);
    }
  };

  const handleDesconectarDrive = async () => {
    const ok = await confirm({
      title: 'Desconectar Google Drive',
      message: '¿Desconectás Google Drive? Los archivos no se eliminarán, pero no podrás acceder a ellos desde la app.',
      confirmLabel: 'Desconectar',
      variant: 'danger',
    });
    if (!ok) return;
    setDriveDisconnecting(true);
    await disconnectDrive();
    setDriveConnected(false);
    setDriveDisconnecting(false);
    toast.success('Drive desconectado', 'Los archivos ya no son accesibles desde la app.');
  };

  const handleGuardarCalendar = async () => {
    setCalendarSaving(true);
    const result = await updateCalendarConfig({ calendar_id: calendarId, sync_enabled: calendarSyncEnabled });
    if (result) toast.success('Calendar guardado', 'Configuración de sincronización actualizada.');
    else toast.error('Error', 'No se pudo guardar la configuración.');
    setCalendarSaving(false);
  };

  const handleSincronizarTodos = async () => {
    setCalendarSyncing(true);
    const result = await sincronizarTodos();
    if (result?.sincronizados != null) {
      toast.success('Sincronización completa', `${result.sincronizados} de ${result.total} turnos exportados a Google Calendar.`);
    } else {
      toast.error('Error', 'No se pudo completar la sincronización.');
    }
    setCalendarSyncing(false);
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return '';
    try {
      return new Date(fechaStr).toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return fechaStr; }
  };

  const waConectado = waEstado === 'CONNECTED';
  const waEsperandoQR = waEstado === 'QR_READY' || waEstado === 'CONNECTING';

  return (
    <div className="space-y-4">
      {/* ─ WhatsApp ─ */}
      <Card>
        <SectionHeader
          icon={MessageCircle}
          iconBg="bg-green-100 dark:bg-green-500/10"
          iconColor="text-green-600 dark:text-green-400"
          title="WhatsApp"
          subtitle="Canal principal para recordatorios y avisos automáticos"
          action={
            waLoading ? null : (
              <StatusBadge
                connected={waConectado}
                labelOn="Activo"
                labelOff={waEsperandoQR ? 'Conectando...' : 'Sin conexión'}
              />
            )
          }
        />

        <div className="p-5">
          {waLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 size={16} className="animate-spin" /> Verificando...
            </div>
          ) : waConectado ? (
            /* ── CONECTADO ── */
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/20">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                    <MessageCircle size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300">WhatsApp conectado</p>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">Los recordatorios se enviarán automáticamente a los pacientes</p>
                </div>
                <button
                  onClick={handleDesconectarWa}
                  disabled={waDesconectando}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-semibold transition-colors disabled:opacity-60 shrink-0"
                >
                  {waDesconectando ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                  Desconectar
                </button>
              </div>
            </div>
          ) : waEsperandoQR ? (
            /* ── ESPERANDO QR ── */
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-500/5 border border-yellow-200 dark:border-yellow-500/20 text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                <RefreshCw size={13} className="animate-spin" />
                {waEstado === 'CONNECTING' ? 'Iniciando conexión...' : 'Esperando que escanees el QR'}
              </div>
              {waQR ? (
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <img src={waQR} alt="QR WhatsApp" className="w-48 h-48 rounded-2xl border-2 border-purple-200 dark:border-slate-700 shadow-sm" />
                  <div className="space-y-3 text-sm text-slate-900 dark:text-white">
                    <p className="font-semibold text-slate-900 dark:text-white">Cómo vincular tu teléfono:</p>
                    <ol className="space-y-2 text-sm">
                      <li className="flex items-start gap-2"><span className="shrink-0 w-5 h-5 rounded-full bg-pink-100 dark:bg-teal-500/10 text-pink-600 dark:text-teal-400 text-xs font-bold flex items-center justify-center">1</span>Abrí WhatsApp en tu celular</li>
                      <li className="flex items-start gap-2"><span className="shrink-0 w-5 h-5 rounded-full bg-pink-100 dark:bg-teal-500/10 text-pink-600 dark:text-teal-400 text-xs font-bold flex items-center justify-center">2</span>Tocá los tres puntos → <strong>Dispositivos vinculados</strong></li>
                      <li className="flex items-start gap-2"><span className="shrink-0 w-5 h-5 rounded-full bg-pink-100 dark:bg-teal-500/10 text-pink-600 dark:text-teal-400 text-xs font-bold flex items-center justify-center">3</span>Tocá <strong>Vincular dispositivo</strong> y escaneá el código</li>
                    </ol>
                    <p className="text-xs text-slate-400">El QR se actualiza automáticamente cada pocos segundos</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 size={16} className="animate-spin" /> Generando QR...
                </div>
              )}
            </div>
          ) : (
            /* ── DESCONECTADO ── */
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <WifiOff size={18} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Sin conexión a WhatsApp</p>
                  <p className="text-xs text-slate-900 dark:text-white mt-0.5">Conectá para activar el envío automático de recordatorios</p>
                </div>
              </div>
              <button
                onClick={handleConectar}
                disabled={waConectando}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60 shadow-sm shrink-0"
              >
                {waConectando ? <Loader2 size={15} className="animate-spin" /> : <QrCode size={15} />}
                Conectar WhatsApp
              </button>
            </div>
          )}
        </div>

        {/* Historial */}
        <div className="border-t border-purple-100 dark:border-slate-800">
          <div className="px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={14} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Últimos envíos</span>
            </div>
          </div>
          <div className="px-5 pb-5">
            {historialLoading ? (
              <div className="space-y-2">
                <Skeleton variant="table-row" className="rounded-xl" />
                <Skeleton variant="table-row" className="rounded-xl" />
              </div>
            ) : historial.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Aún no hay envíos registrados.</p>
            ) : (
              <div className="space-y-1.5">
                {historial.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-50 dark:bg-slate-800/50 border border-purple-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center ${item.estado === 'error' ? 'bg-red-100 dark:bg-red-500/10' : 'bg-green-100 dark:bg-green-500/10'}`}>
                        {item.estado === 'error'
                          ? <XCircle size={12} className="text-red-500" />
                          : <CheckCircle size={12} className="text-green-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate capitalize">{item.paciente_nombre || 'Paciente'}</p>
                        <p className="text-[10px] text-slate-400">{formatFecha(item.enviado_at)}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${item.estado === 'error' ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400'}`}>
                      {item.estado === 'error' ? 'Error' : 'OK'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ─ Google Drive ─ */}
      <Card>
        <SectionHeader
          icon={HardDrive}
          iconBg="bg-blue-100 dark:bg-blue-500/10"
          iconColor="text-blue-600 dark:text-blue-400"
          title="Google Drive"
          subtitle="Almacenamiento de archivos y documentos de pacientes"
          action={
            driveLoading ? null : (
              <StatusBadge
                connected={driveConnected}
                labelOn="Conectado"
                labelOff="No conectado"
              />
            )
          }
        />
        <div className="p-5">
          {driveLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 size={16} className="animate-spin" /> Verificando...
            </div>
          ) : driveConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20">
                <div className="shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                  <Cloud size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Google Drive conectado</p>
                  <p className="text-xs text-blue-600 dark:text-blue-500 mt-0.5">Los archivos se guardan en la carpeta <strong>"Agenda Psicope"</strong> de tu Drive</p>
                </div>
                <button
                  onClick={handleDesconectarDrive}
                  disabled={driveDisconnecting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-semibold transition-colors disabled:opacity-60 shrink-0"
                >
                  {driveDisconnecting ? <Loader2 size={12} className="animate-spin" /> : <CloudOff size={12} />}
                  Desconectar
                </button>
              </div>

              {/* Info de uso */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: FolderOpen, label: 'Organización', desc: 'Una carpeta por paciente' },
                  { icon: Cloud, label: 'Almacenamiento', desc: 'Tu cuenta personal de Google' },
                  { icon: CheckCircle, label: 'Acceso', desc: 'Desde cualquier dispositivo' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="p-3 rounded-xl bg-purple-50 dark:bg-slate-800/50 border border-purple-100 dark:border-slate-800 text-center">
                    <Icon size={16} className="text-blue-500 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <CloudOff size={18} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Drive no conectado</p>
                    <p className="text-xs text-slate-900 dark:text-white mt-0.5">Conectá tu cuenta para adjuntar y acceder a archivos de pacientes</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const data = await getDriveAuthUrl();
                    if (data?.url) window.location.href = data.url;
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shrink-0"
                >
                  <HardDrive size={15} /> Conectar Google Drive
                </button>
              </div>

              {/* Qué ofrece */}
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 space-y-2">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">¿Para qué sirve?</p>
                <ul className="space-y-1.5">
                  {[
                    'Adjuntá informes, evaluaciones y documentos a cada paciente',
                    'Los archivos se organizan automáticamente por paciente',
                    'Accedé desde cualquier dispositivo con tu cuenta de Google',
                    'Los archivos son tuyos — se guardan en tu propio Drive',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-blue-600 dark:text-blue-400">
                      <CheckCircle size={12} className="shrink-0 mt-0.5 text-blue-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ─ Google Calendar ─ */}
      <Card>
        <SectionHeader
          icon={Calendar}
          iconBg="bg-indigo-100 dark:bg-indigo-500/10"
          iconColor="text-indigo-600 dark:text-indigo-400"
          title="Google Calendar"
          subtitle="Sincronizá tus turnos automáticamente con tu calendario de Google"
          action={
            calendarLoading ? null : (
              <StatusBadge
                connected={calendarStatus?.connected && calendarSyncEnabled}
                labelOn="Activo"
                labelOff={calendarStatus?.connected ? 'Desactivado' : 'No conectado'}
              />
            )
          }
        />

        <div className="p-5">
          {calendarLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 size={16} className="animate-spin" /> Verificando...
            </div>
          ) : !calendarStatus?.connected ? (
            /* ── NO CONECTADO: mismo OAuth que Drive ── */
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
                <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Para sincronizar con Google Calendar necesitás conectar Google Drive primero. Ambas integraciones usan el mismo inicio de sesión.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 space-y-2">
                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">¿Para qué sirve?</p>
                <ul className="space-y-1.5">
                  {[
                    'Los turnos se exportan automáticamente a tu Google Calendar',
                    'Cada cambio de estado o fecha se refleja en tiempo real',
                    'Accedé a tu agenda desde el celular, computadora o cualquier dispositivo',
                    'Compatible con Google Meet, recordatorios y cualquier app de calendario',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-indigo-600 dark:text-indigo-400">
                      <CheckCircle size={12} className="shrink-0 mt-0.5 text-indigo-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            /* ── CONECTADO ── */
            <div className="space-y-4">
              {/* Toggle de sincronización */}
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20">
                <SwitchToggle
                  valor={calendarSyncEnabled}
                  onChange={setCalendarSyncEnabled}
                  label="Sincronización automática"
                  descripcion="Los turnos se exportan a Google Calendar al crearlos, editarlos o eliminarlos"
                />
              </div>

              {/* Selector de calendario */}
              {calendarSyncEnabled && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                    Calendario de destino
                  </label>
                  {calendarios.length > 0 ? (
                    <div className="relative">
                      <select
                        value={calendarId}
                        onChange={(e) => setCalendarId(e.target.value)}
                        className="w-full appearance-none px-3 py-2.5 pr-8 rounded-xl bg-purple-50/60 dark:bg-slate-800 border border-purple-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 focus:border-transparent transition-colors"
                      >
                        {calendarios.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.summary}{c.primary ? ' (Principal)' : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 px-1">Cargando calendarios...</p>
                  )}
                  <p className="text-xs text-slate-400 px-1">Los nuevos turnos se agregarán a este calendario</p>
                </div>
              )}

              {/* Guardar config */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  onClick={handleSincronizarTodos}
                  disabled={calendarSyncing || !calendarSyncEnabled}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-300 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {calendarSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                  {calendarSyncing ? 'Exportando...' : 'Exportar turnos futuros'}
                </button>
                <SaveButton onClick={handleGuardarCalendar} saving={calendarSaving} label="Guardar" />
              </div>

              {/* Info */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <AlertCircle size={13} className="text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-900 dark:text-white">
                  "Exportar turnos futuros" sincroniza todos los turnos pendientes y confirmados desde hoy que aún no tienen evento en Calendar. Los cambios futuros se sincronizan en tiempo real.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── Tab: Seguridad ──────────────────────────────────────────────────────────

function TabSeguridad({ toast }) {
  const { user, logout } = useAuth();
  const [enviandoReset, setEnviandoReset] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  const handleCambiarPassword = async () => {
    if (!user?.email) return;
    setEnviandoReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      toast.success('Email enviado', `Se envió un link de recuperación a ${user.email}.`);
    } catch (err) {
      toast.error('Error', err.message || 'No se pudo enviar el email de recuperación.');
    } finally {
      setEnviandoReset(false);
    }
  };

  const handleCerrarSesion = async () => {
    setCerrando(true);
    await logout();
  };

  return (
    <div className="space-y-4">
      {/* Cuenta */}
      <Card>
        <SectionHeader
          icon={User}
          iconBg="bg-slate-100 dark:bg-slate-800"
          iconColor="text-slate-600 dark:text-slate-400"
          title="Información de cuenta"
          subtitle="Datos de tu cuenta de acceso al sistema"
        />
        <div className="p-5">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-50 dark:bg-slate-800/50 border border-purple-200 dark:border-slate-700">
            <div className="w-9 h-9 rounded-full bg-pink-100 dark:bg-teal-500/10 flex items-center justify-center shrink-0">
              <User size={16} className="text-pink-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Email de la cuenta</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.email || '—'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Seguridad */}
      <Card>
        <SectionHeader
          icon={Lock}
          iconBg="bg-yellow-100 dark:bg-yellow-500/10"
          iconColor="text-yellow-600 dark:text-yellow-400"
          title="Seguridad"
          subtitle="Gestioná tu contraseña y sesión activa"
        />
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-purple-50 dark:bg-slate-800/50 border border-purple-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <KeyRound size={16} className="text-slate-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Cambiar contraseña</p>
                <p className="text-xs text-slate-400 mt-0.5">Recibís un link de recuperación en tu email</p>
              </div>
            </div>
            <button
              onClick={handleCambiarPassword}
              disabled={enviandoReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-pink-300 dark:border-teal-500/30 text-pink-600 dark:text-teal-400 hover:bg-pink-50 dark:hover:bg-teal-500/10 text-sm font-semibold transition-colors disabled:opacity-60 shrink-0"
            >
              {enviandoReset ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
              {enviandoReset ? 'Enviando...' : 'Enviar link'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
            <div className="flex items-center gap-3">
              <LogOut size={16} className="text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Cerrar sesión</p>
                <p className="text-xs text-slate-400 mt-0.5">Cerrás tu sesión en este dispositivo</p>
              </div>
            </div>
            <button
              onClick={handleCerrarSesion}
              disabled={cerrando}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 shrink-0"
            >
              {cerrando ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
              {cerrando ? 'Cerrando...' : 'Cerrar sesión'}
            </button>
          </div>
        </div>
      </Card>

      {/* Aviso seguridad */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-500/5 border border-yellow-200 dark:border-yellow-500/20">
        <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-700 dark:text-yellow-400">
          Si sospechás que tu cuenta fue comprometida, cambiá tu contraseña inmediatamente y cerrá sesión en todos los dispositivos.
        </p>
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

const TABS = [
  { id: 'perfil',           label: 'Perfil',          icon: User },
  { id: 'recordatorios',    label: 'Recordatorios',   icon: Bell },
  { id: 'notificaciones',   label: 'Notificaciones',  icon: MessageCircle },
  { id: 'integraciones',    label: 'Integraciones',   icon: Plug },
  { id: 'seguridad',        label: 'Seguridad',       icon: Shield },
];

export default function Configuracion() {
  const toast = useToast();
  const { confirm, ConfirmModal } = useConfirm();
  const [tabActiva, setTabActiva] = useState('perfil');

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <ConfirmModal />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-pink-100 dark:bg-teal-500/15 p-2 rounded-xl">
          <Settings size={20} className="text-pink-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Configuración</h1>
          <p className="text-sm text-slate-900 dark:text-white">Preferencias del sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap bg-purple-100 dark:bg-slate-900 border border-purple-200 dark:border-slate-800 rounded-2xl p-1.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTabActiva(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
              tabActiva === id
                ? 'bg-white dark:bg-slate-800 text-pink-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-900 dark:text-white hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/50'
            }`}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tabActiva === 'perfil'         && <TabPerfil toast={toast} />}
      {tabActiva === 'recordatorios'  && <TabRecordatorios toast={toast} />}
      {tabActiva === 'notificaciones' && <TabNotificaciones toast={toast} />}
      {tabActiva === 'integraciones'  && <TabIntegraciones toast={toast} confirm={confirm} />}
      {tabActiva === 'seguridad'      && <TabSeguridad toast={toast} />}
    </div>
  );
}
