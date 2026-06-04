import { useState, useEffect, useRef } from 'react';
import {
  Settings, MessageCircle, Save, Loader2, Smartphone, History,
  CheckCircle, XCircle, HardDrive, Wifi, WifiOff, RefreshCw,
  LogOut, Send, User, Sun, Moon, Shield, Bell, ChevronRight,
} from 'lucide-react';
import { getDriveStatus, getDriveAuthUrl, disconnectDrive } from '../services/driveService';
import apiFetch from '../services/api';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { apiPost } from '../services/api.js';
import {
  getConfiguracion,
  getConfiguracionNotificaciones,
  updateConfiguracionNotificaciones,
  updateConfiguracionWhatsApp,
  getHistorialWhatsApp,
  updateConfiguracionPerfil,
  updatePlantillasNotificaciones,
} from '../services/configuracionService';
import TimePicker from '../components/ui/TimePicker';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext.jsx';
import supabase from '../services/authService.js';

// ─── Shared UI primitives ───────────────────────────────────────────────────

function SwitchToggle({ valor, onChange, label, descripcion }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
        {descripcion && <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{descripcion}</p>}
      </div>
      <button
        onClick={() => onChange(!valor)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
          valor ? 'bg-pink-500 dark:bg-blue-600' : 'bg-gray-400 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            valor ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function PillToggle({ valor, onChange }) {
  return (
    <button
      onClick={() => onChange(!valor)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${
        valor ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md ${
          valor ? 'translate-x-[26px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
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
    <div className={`bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ icon: Icon, iconBg, iconColor, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 border-b border-purple-200 dark:border-slate-800">
      <div className={`p-2.5 rounded-xl ${iconBg}`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function CardFooter({ children }) {
  return (
    <div className="px-6 py-4 bg-purple-50/80 dark:bg-slate-950/50 border-t border-purple-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
      {children}
    </div>
  );
}

// ─── Tab: Perfil Profesional ─────────────────────────────────────────────────

function TabPerfil({ toast }) {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
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
    if (result) {
      toast.success('Perfil guardado', 'Los datos del profesional se actualizaron correctamente.');
    } else {
      toast.error('Error', 'No se pudo guardar el perfil.');
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-pink-500" size={24} /></div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          icon={User}
          iconBg="bg-pink-100 dark:bg-pink-500/10"
          iconColor="text-pink-600 dark:text-pink-400"
          title="Datos del Profesional"
          subtitle="Información que aparece en informes y recibos"
        />
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre completo" value={form.nombre_profesional} onChange={set('nombre_profesional')} placeholder="Ej: Lic. María García" />
            <Field label="Especialidad" value={form.especialidad} onChange={set('especialidad')} placeholder="Ej: Psicopedagogía" />
            <Field label="Matrícula" value={form.matricula} onChange={set('matricula')} placeholder="Ej: MP 12345" />
            <Field label="Email de contacto" value={form.email} onChange={set('email')} placeholder="Ej: consulta@ejemplo.com" type="email" />
            <Field
              label="Teléfono (para WhatsApp)"
              value={form.telefono_profesional}
              onChange={set('telefono_profesional')}
              placeholder="Ej: 1138057772 (sin +54)"
              hint="Sin código de país, solo el número argentino"
            />
          </div>
        </div>
        <CardFooter>
          <span />
          <button
            onClick={handleGuardar}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-400 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Guardando...' : 'Guardar perfil'}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, hint, type = 'text' }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-900 dark:text-white">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-pink-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-teal-500 focus:border-transparent transition-colors"
      />
      {hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

// ─── Tab: Apariencia ─────────────────────────────────────────────────────────

function TabApariencia({ toast }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  const toggle = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('darkMode', String(next));
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  return (
    <Card>
      <CardHeader
        icon={darkMode ? Sun : Moon}
        iconBg="bg-purple-100 dark:bg-purple-500/10"
        iconColor="text-purple-600 dark:text-purple-400"
        title="Apariencia"
        subtitle="Personalizá el aspecto visual del sistema"
      />
      <div className="p-6">
        <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50 dark:bg-slate-800/50 border border-purple-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm">
              {darkMode ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-slate-600 dark:text-slate-300" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {darkMode ? 'Modo Oscuro activado' : 'Modo Claro activado'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {darkMode ? 'Interfaz con fondo oscuro para entornos con poca luz' : 'Interfaz con fondo claro, paleta rosa/lila'}
              </p>
            </div>
          </div>
          <button
            onClick={toggle}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-400 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold transition-colors"
          >
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            {darkMode ? 'Cambiar a claro' : 'Cambiar a oscuro'}
          </button>
        </div>
      </div>
    </Card>
  );
}

// ─── Tab: Conexión WhatsApp ──────────────────────────────────────────────────

function TabWhatsApp({ toast, confirm }) {
  const [waEstado, setWaEstado] = useState('DISCONNECTED');
  const [waQR, setWaQR] = useState(null);
  const [waLoading, setWaLoading] = useState(true);
  const [waConectando, setWaConectando] = useState(false);
  const [waDesconectando, setWaDesconectando] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [historialLoading, setHistorialLoading] = useState(true);

  useEffect(() => {
    const cargarEstado = async () => {
      try {
        const res = await apiFetch('/whatsapp/status');
        const data = await res.json();
        setWaEstado(data.estado || 'DISCONNECTED');
      } catch {
        setWaEstado('DISCONNECTED');
      } finally {
        setWaLoading(false);
      }
    };
    cargarEstado();

    getHistorialWhatsApp().then((data) => {
      setHistorial(Array.isArray(data) ? data : []);
      setHistorialLoading(false);
    });
  }, []);

  useEffect(() => {
    if (waEstado !== 'QR_READY' && waEstado !== 'CONNECTING') return;
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
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [waEstado]);

  const handleConectar = async () => {
    setWaConectando(true);
    setWaEstado('CONNECTING');
    try {
      await apiFetch('/whatsapp/conectar', { method: 'POST' });
      setWaEstado('QR_READY');
    } catch {
      toast.error('Error', 'No se pudo iniciar la conexión con WhatsApp.');
      setWaEstado('DISCONNECTED');
    } finally {
      setWaConectando(false);
    }
  };

  const handleDesconectar = async () => {
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

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return '';
    try {
      return new Date(fechaStr).toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return fechaStr; }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          icon={MessageCircle}
          iconBg="bg-green-100 dark:bg-green-500/10"
          iconColor="text-green-600 dark:text-green-400"
          title="Conexión WhatsApp"
          subtitle="Conectá WhatsApp para enviar recordatorios automáticos"
        />
        <div className="p-6">
          {waLoading ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Verificando conexión...</span>
            </div>
          ) : waEstado === 'CONNECTED' ? (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30">
                  <Wifi size={13} /> Conectado
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">Los recordatorios se enviarán por WhatsApp</span>
              </div>
              <button
                onClick={handleDesconectar}
                disabled={waDesconectando}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-60"
              >
                {waDesconectando ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                Cerrar sesión
              </button>
            </div>
          ) : waEstado === 'QR_READY' || waEstado === 'CONNECTING' ? (
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30">
                <RefreshCw size={13} className="animate-spin" />
                {waEstado === 'CONNECTING' ? 'Iniciando...' : 'Esperando escaneo'}
              </span>
              {waQR ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
                    Abrí WhatsApp → <strong>Dispositivos vinculados</strong> → <strong>Vincular dispositivo</strong> y escaneá este código:
                  </p>
                  <img src={waQR} alt="QR WhatsApp" className="w-52 h-52 rounded-xl border border-purple-200 dark:border-slate-700" />
                  <p className="text-xs text-slate-400">El QR se actualiza automáticamente</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Generando QR...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  <WifiOff size={13} /> No conectado
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">Conectá para activar el envío de recordatorios</span>
              </div>
              <button
                onClick={handleConectar}
                disabled={waConectando}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors disabled:opacity-60"
              >
                {waConectando ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
                Conectar WhatsApp
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Historial */}
      <Card>
        <CardHeader
          icon={History}
          iconBg="bg-slate-100 dark:bg-slate-800"
          iconColor="text-slate-600 dark:text-slate-400"
          title="Historial de envíos recientes"
          subtitle="Últimos 10 mensajes enviados"
        />
        <div className="p-6">
          {historialLoading ? (
            <div className="space-y-3">
              <Skeleton variant="table-row" className="rounded-xl" />
              <Skeleton variant="table-row" className="rounded-xl" />
              <Skeleton variant="table-row" className="rounded-xl" />
            </div>
          ) : historial.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">No hay envíos registrados aún.</p>
          ) : (
            <div className="space-y-2">
              {historial.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-purple-50 dark:bg-slate-950/50 border border-purple-200 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">
                      {item.estado === 'error' ? (
                        <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
                          <XCircle size={14} className="text-red-500" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-500/10 flex items-center justify-center">
                          <CheckCircle size={14} className="text-green-500" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate capitalize">
                        {item.paciente_nombre || 'Paciente'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatFecha(item.enviado_at)}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                    item.estado === 'error'
                      ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                      : 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                  }`}>
                    {item.estado === 'error' ? 'Error' : 'Enviado'}
                  </span>
                </div>
              ))}
            </div>
          )}
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
  const [mensajePaciente, setMensajePaciente] = useState('');
  const [mensajeProfesional, setMensajeProfesional] = useState('');
  const mensajeRef = useRef(null);

  const VARS_PACIENTE = ['{nombre}', '{fecha}', '{hora}', '{consultorio}'];
  const VARS_PROFESIONAL = ['{fecha}', '{cantidad}', '{lista_turnos}'];

  useEffect(() => {
    getConfiguracionNotificaciones().then((config) => {
      if (config) {
        setNotificacionesPacientes(config.notificaciones_pacientes ?? true);
        setNotificacionesProfesional(config.notificaciones_profesional ?? true);
        setHoraEnvio(config.hora_envio || '17:00');
        setMensajePaciente(config.mensaje_paciente || '');
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
      mensaje_paciente: mensajePaciente,
      mensaje_profesional: mensajeProfesional,
    });
    if (result) {
      toast.success('Guardado', 'La configuración de recordatorios se actualizó.');
    } else {
      toast.error('Error', 'No se pudo guardar la configuración.');
    }
    setSaving(false);
  };

  const handleEnviarPacientes = async () => {
    setEnviando(true);
    try {
      const data = await apiPost('/whatsapp/enviar-recordatorios');
      if (!data.waConectado) {
        toast.error('WhatsApp no conectado', 'Conectá WhatsApp en la pestaña de Conexión primero.');
      } else if (data.turnos === 0) {
        toast.success('Sin turnos', 'No hay turnos pendientes para mañana.');
      } else {
        toast.success('Enviado', data.mensaje);
      }
    } catch (err) {
      toast.error('Error', err.message || 'No se pudieron enviar los recordatorios.');
    } finally {
      setEnviando(false);
    }
  };

  const handleEnviarProfesional = async () => {
    setEnviando(true);
    try {
      const data = await apiPost('/whatsapp/enviar-resumen-profesional');
      if (!data.waConectado) {
        toast.error('WhatsApp no conectado', 'Conectá WhatsApp en la pestaña de Conexión primero.');
      } else if (data.turnos === 0) {
        toast.success('Sin turnos', 'No hay turnos para mañana.');
      } else {
        toast.success('Resumen enviado', 'El resumen del día fue enviado al profesional.');
      }
    } catch (err) {
      toast.error('Error', err.message || 'No se pudo enviar el resumen.');
    } finally {
      setEnviando(false);
    }
  };

  const insertarVariable = (variable) => {
    if (!mensajeRef.current) return;
    const textarea = mensajeRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = mensajePaciente.substring(0, start) + variable + mensajePaciente.substring(end);
    setMensajePaciente(newValue);
    setTimeout(() => {
      textarea.focus();
      const pos = start + variable.length;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  };

  if (loading) return <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-pink-500" size={24} /></div>;

  return (
    <div className="space-y-4">
      {/* Ajustes generales */}
      <Card>
        <CardHeader
          icon={Smartphone}
          iconBg="bg-blue-100 dark:bg-blue-500/10"
          iconColor="text-blue-600 dark:text-blue-400"
          title="Configuración de Recordatorios"
          subtitle="Controlá qué se envía y cuándo"
        />
        <div className="p-6 space-y-5">
          <SwitchToggle
            valor={notificacionesPacientes}
            onChange={setNotificacionesPacientes}
            label="Recordatorios a pacientes"
            descripcion="Los pacientes reciben un mensaje el día anterior al turno"
          />
          <div className="border-t border-purple-100 dark:border-slate-800" />
          <SwitchToggle
            valor={notificacionesProfesional}
            onChange={setNotificacionesProfesional}
            label="Resumen diario al profesional"
            descripcion="Se envía un resumen con todos los turnos del día siguiente"
          />
          <div className="border-t border-purple-100 dark:border-slate-800" />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900 dark:text-white">Horario de envío automático</label>
            <TimePicker
              value={horaEnvio}
              onChange={(val) => setHoraEnvio(val)}
              className="bg-pink-50 dark:bg-slate-800 border border-pink-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-teal-500 w-fit"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">Aplica tanto a pacientes como al profesional. Actualmente: <strong>{horaEnvio} hs</strong></p>
          </div>
        </div>
        <CardFooter>
          <div className="flex gap-2">
            <button
              onClick={handleEnviarPacientes}
              disabled={enviando}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-40"
            >
              {enviando ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Enviar a pacientes ahora
            </button>
            <button
              onClick={handleEnviarProfesional}
              disabled={enviando}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 text-sm font-semibold transition-colors disabled:opacity-40"
            >
              {enviando ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Enviar resumen ahora
            </button>
          </div>
          <button
            onClick={handleGuardar}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-400 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </CardFooter>
      </Card>

      {/* Plantilla mensaje paciente */}
      <Card>
        <CardHeader
          icon={MessageCircle}
          iconBg="bg-green-100 dark:bg-green-500/10"
          iconColor="text-green-600 dark:text-green-400"
          title="Plantilla: Mensaje a Pacientes"
          subtitle="Texto que recibe cada paciente en su recordatorio"
        />
        <div className="p-6 space-y-3">
          <textarea
            ref={mensajeRef}
            value={mensajePaciente}
            onChange={(e) => setMensajePaciente(e.target.value)}
            rows={4}
            placeholder="Hola {nombre}! Te recordamos que tenés turno mañana {fecha} a las {hora} en {consultorio}."
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-pink-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-teal-500 focus:border-transparent transition-colors resize-y"
          />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Variables disponibles — hacé clic para insertar:</p>
            <div className="flex flex-wrap gap-2">
              {VARS_PACIENTE.map((v) => (
                <VariableChip key={v} onClick={() => insertarVariable(v)}>{v}</VariableChip>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Plantilla resumen profesional */}
      <Card>
        <CardHeader
          icon={MessageCircle}
          iconBg="bg-blue-100 dark:bg-blue-500/10"
          iconColor="text-blue-600 dark:text-blue-400"
          title="Plantilla: Resumen al Profesional"
          subtitle="Texto del resumen diario que recibe el profesional"
        />
        <div className="p-6 space-y-3">
          <textarea
            value={mensajeProfesional}
            onChange={(e) => setMensajeProfesional(e.target.value)}
            rows={3}
            placeholder="Recordatorio: mañana {fecha} tenés {cantidad} turno(s):{lista_turnos}"
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-pink-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-teal-500 focus:border-transparent transition-colors resize-y"
          />
          <div className="flex flex-wrap gap-2">
            {VARS_PROFESIONAL.map((v) => (
              <VariableChip key={v}>{v}</VariableChip>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Tab: Notificaciones a Pacientes ─────────────────────────────────────────

function TabNotificaciones({ toast }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plantillas, setPlantillas] = useState({
    plantilla_cancelacion: '',
    plantilla_cambio_horario: '',
    plantilla_aviso_libre: '',
  });

  const VARS = ['{nombre}', '{fecha}', '{hora}', '{consultorio}'];

  useEffect(() => {
    getConfiguracion().then((data) => {
      if (data) {
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

  const handleGuardar = async () => {
    setSaving(true);
    const result = await updatePlantillasNotificaciones(plantillas);
    if (result) {
      toast.success('Plantillas guardadas', 'Las plantillas de avisos se actualizaron.');
    } else {
      toast.error('Error', 'No se pudieron guardar las plantillas.');
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-pink-500" size={24} /></div>;

  const plantillaDefs = [
    {
      key: 'plantilla_cancelacion',
      label: 'Aviso de Cancelación',
      subtitle: 'Se usa cuando se cancela un turno',
      placeholder: 'Hola {nombre}, te informamos que tu turno del {fecha} fue cancelado.',
    },
    {
      key: 'plantilla_cambio_horario',
      label: 'Cambio de Horario',
      subtitle: 'Se usa cuando se reprograma un turno',
      placeholder: 'Hola {nombre}, tu turno fue reprogramado para el {fecha} a las {hora} en {consultorio}.',
    },
    {
      key: 'plantilla_aviso_libre',
      label: 'Aviso Libre',
      subtitle: 'Mensaje personalizable para cualquier comunicación',
      placeholder: 'Hola {nombre}, te enviamos este mensaje desde el consultorio.',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 text-sm text-blue-700 dark:text-blue-300">
        Estas plantillas se usan para avisos puntuales a pacientes individuales, distintos a los recordatorios automáticos. Podés enviarlos manualmente desde el perfil de cada paciente.
      </div>

      {plantillaDefs.map(({ key, label, subtitle, placeholder }) => (
        <Card key={key}>
          <CardHeader
            icon={Bell}
            iconBg="bg-pink-100 dark:bg-pink-500/10"
            iconColor="text-pink-600 dark:text-pink-400"
            title={label}
            subtitle={subtitle}
          />
          <div className="p-6 space-y-3">
            <textarea
              value={plantillas[key]}
              onChange={set(key)}
              rows={3}
              placeholder={placeholder}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-pink-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-teal-500 focus:border-transparent transition-colors resize-y"
            />
            <div className="flex flex-wrap gap-2">
              {VARS.map((v) => <VariableChip key={v}>{v}</VariableChip>)}
            </div>
          </div>
        </Card>
      ))}

      <div className="flex justify-end">
        <button
          onClick={handleGuardar}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-400 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Guardando...' : 'Guardar plantillas'}
        </button>
      </div>
    </div>
  );
}

// ─── Tab: Google Drive ───────────────────────────────────────────────────────

function TabDrive({ toast, confirm }) {
  const [driveConnected, setDriveConnected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    getDriveStatus().then((s) => {
      setDriveConnected(s?.connected ?? false);
      setLoading(false);
    });
  }, []);

  const handleDesconectar = async () => {
    const ok = await confirm({
      title: 'Desconectar Google Drive',
      message: '¿Desconectás Google Drive? Los archivos no se eliminarán, pero no podrás acceder a ellos desde la app.',
      confirmLabel: 'Desconectar',
      variant: 'danger',
    });
    if (!ok) return;
    setDisconnecting(true);
    await disconnectDrive();
    setDriveConnected(false);
    setDisconnecting(false);
    toast.success('Drive desconectado', 'Los archivos ya no son accesibles desde la app.');
  };

  return (
    <Card>
      <CardHeader
        icon={HardDrive}
        iconBg="bg-blue-100 dark:bg-blue-500/10"
        iconColor="text-blue-600 dark:text-blue-400"
        title="Google Drive"
        subtitle="Adjuntos de pacientes guardados en tu Drive personal"
      />
      <div className="p-6">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Verificando conexión...</span>
          </div>
        ) : driveConnected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30">
                  <CheckCircle size={13} /> Conectado
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">Los archivos se guardan en "Agenda Psicope" en tu Drive</span>
              </div>
              <button
                onClick={handleDesconectar}
                disabled={disconnecting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-60"
              >
                {disconnecting ? <Loader2 size={14} className="animate-spin" /> : null}
                Desconectar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                No conectado
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">Conectá tu cuenta para adjuntar archivos a los pacientes</span>
            </div>
            <button
              onClick={async () => {
                const data = await getDriveAuthUrl();
                if (data?.url) window.location.href = data.url;
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
            >
              <HardDrive size={14} /> Conectar Google Drive
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Tab: Seguridad / Cuenta ─────────────────────────────────────────────────

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
      toast.success('Email enviado', `Se envió un link para cambiar la contraseña a ${user.email}.`);
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
      <Card>
        <CardHeader
          icon={Shield}
          iconBg="bg-slate-100 dark:bg-slate-800"
          iconColor="text-slate-600 dark:text-slate-400"
          title="Cuenta"
          subtitle="Información de tu cuenta de acceso"
        />
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Email de la cuenta</label>
            <p className="text-sm font-medium text-slate-900 dark:text-white px-3 py-2 rounded-lg bg-purple-50 dark:bg-slate-800 border border-purple-200 dark:border-slate-700">
              {user?.email || '—'}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          icon={Shield}
          iconBg="bg-yellow-100 dark:bg-yellow-500/10"
          iconColor="text-yellow-600 dark:text-yellow-400"
          title="Seguridad"
          subtitle="Gestioná tu contraseña y sesión"
        />
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50 dark:bg-slate-800/50 border border-purple-200 dark:border-slate-700">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Cambiar contraseña</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Te enviamos un link de recuperación a tu email</p>
            </div>
            <button
              onClick={handleCambiarPassword}
              disabled={enviandoReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-pink-300 dark:border-teal-500/30 text-pink-600 dark:text-teal-400 hover:bg-pink-50 dark:hover:bg-teal-500/10 text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {enviandoReset ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
              {enviandoReset ? 'Enviando...' : 'Enviar link'}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Cerrar sesión</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Cerrá tu sesión en este dispositivo</p>
            </div>
            <button
              onClick={handleCerrarSesion}
              disabled={cerrando}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {cerrando ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
              {cerrando ? 'Cerrando...' : 'Cerrar sesión'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

const TABS = [
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'apariencia', label: 'Apariencia', icon: Sun },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'recordatorios', label: 'Recordatorios', icon: Smartphone },
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
  { id: 'drive', label: 'Google Drive', icon: HardDrive },
  { id: 'seguridad', label: 'Seguridad', icon: Shield },
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
          <Settings size={22} className="text-pink-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Configuración</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400">Administrá las preferencias del sistema</p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 flex-wrap bg-purple-100 dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl p-1.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTabActiva(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
              tabActiva === id
                ? 'bg-white dark:bg-slate-800 text-pink-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/50'
            }`}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tabActiva === 'perfil' && <TabPerfil toast={toast} />}
      {tabActiva === 'apariencia' && <TabApariencia toast={toast} />}
      {tabActiva === 'whatsapp' && <TabWhatsApp toast={toast} confirm={confirm} />}
      {tabActiva === 'recordatorios' && <TabRecordatorios toast={toast} />}
      {tabActiva === 'notificaciones' && <TabNotificaciones toast={toast} />}
      {tabActiva === 'drive' && <TabDrive toast={toast} confirm={confirm} />}
      {tabActiva === 'seguridad' && <TabSeguridad toast={toast} />}
    </div>
  );
}
