import { useState, useEffect, useRef } from 'react';
import { Settings, MessageCircle, ChevronDown, ChevronUp, Save, Loader2, Smartphone, History, CheckCircle, XCircle, HardDrive, Wifi, WifiOff, RefreshCw, LogOut, Send } from 'lucide-react';
import { getDriveStatus, getDriveAuthUrl, disconnectDrive } from '../services/driveService';
import apiFetch from '../services/api';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { apiPost } from '../services/api.js';
import {
  getConfiguracionNotificaciones,
  updateConfiguracionNotificaciones,
  updateConfiguracionWhatsApp,
  getHistorialWhatsApp,
} from '../services/configuracionService';
import TimePicker from '../components/ui/TimePicker';
import Skeleton from '../components/ui/Skeleton';

function SwitchToggle({ valor, onChange, label, descripcion }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
        <p className="text-xs text-slate-900 dark:text-gray-400 mt-0.5">{descripcion}</p>
      </div>
      <button
        onClick={() => onChange(!valor)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
          valor ? 'bg-pink-500 dark:bg-blue-600' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-purple-100 transition-transform ${
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

export default function Configuracion() {
  const toast = useToast();
  const { confirm, ConfirmModal } = useConfirm();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plantillasAbiertas, setPlantillasAbiertas] = useState(false);

  // Estado del formulario
  const [notificacionesPacientes, setNotificacionesPacientes] = useState(true);
  const [notificacionesProfesional, setNotificacionesProfesional] = useState(true);
  const [telefonoProfesional, setTelefonoProfesional] = useState('');
  const [horaEnvio, setHoraEnvio] = useState('17:00');
  const [mensajePaciente, setMensajePaciente] = useState(
    'Hola {nombre}! Te recordamos que tenés turno mañana {fecha} a las {hora} en {consultorio}. Ante cualquier cambio comunicate con nosotros. ¡Hasta mañana!'
  );
  const [mensajeProfesional, setMensajeProfesional] = useState(
    'Recordatorio: mañana {fecha} tenés {cantidad} turno(s):\n{lista_turnos}'
  );


  // --- Estado sección Recordatorios por WhatsApp ---
  const [savingWhatsApp, setSavingWhatsApp] = useState(false);
  const mensajeRef = useRef(null);
  const MENSAJE_POR_DEFECTO = 'Hola {nombre}! Te recordamos que tenés turno mañana {fecha} a las {hora} en {consultorio}. Ante cualquier cambio comunicate con nosotros. ¡Hasta mañana!';
  const VARIABLES_DISPONIBLES = ['{nombre}', '{fecha}', '{hora}', '{consultorio}'];

  // --- Estado historial ---
  const [historial, setHistorial] = useState([]);
  const [historialLoading, setHistorialLoading] = useState(true);

  // --- Estado Google Drive ---
  const [driveConnected, setDriveConnected] = useState(null);
  const [loadingDrive, setLoadingDrive] = useState(true);
  const [disconnectingDrive, setDisconnectingDrive] = useState(false);

  // --- Estado WhatsApp Baileys ---
  const [waEstado, setWaEstado] = useState('DISCONNECTED'); // DISCONNECTED | CONNECTING | QR_READY | CONNECTED | ERROR
  const [waQR, setWaQR] = useState(null);
  const [waLoading, setWaLoading] = useState(true);
  const [waConectando, setWaConectando] = useState(false);
  const [waDesconectando, setWaDesconectando] = useState(false);
  const [enviandoRecordatorios, setEnviandoRecordatorios] = useState(false);


  // --- Cargar historial de envíos ---
  const cargarHistorial = async () => {
    setHistorialLoading(true);
    try {
      const data = await getHistorialWhatsApp();
      setHistorial(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar historial:', error);
      setHistorial([]);
    } finally {
      setHistorialLoading(false);
    }
  };

  // Cargar configuración al montar
  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const config = await getConfiguracionNotificaciones();
        if (config) {
          setNotificacionesPacientes(config.notificaciones_pacientes ?? true);
          setNotificacionesProfesional(config.notificaciones_profesional ?? true);
          setTelefonoProfesional(config.telefono_profesional || '');
          setHoraEnvio(config.hora_envio || '17:00');
          setMensajePaciente(
            config.mensaje_paciente ||
              'Hola {nombre}! Te recordamos que tenés turno mañana {fecha} a las {hora} en {consultorio}. Ante cualquier cambio comunicate con nosotros. ¡Hasta mañana!'
          );
          setMensajeProfesional(
            config.mensaje_profesional ||
              'Recordatorio: mañana {fecha} tenés {cantidad} turno(s):\n{lista_turnos}'
          );

        }
      } catch (error) {
        console.error('Error al cargar configuración:', error);
        toast.error('Error', 'No se pudo cargar la configuración');
      } finally {
        setLoading(false);
      }
    };

    cargarConfig();
    cargarHistorial();
    getDriveStatus().then(s => {
      setDriveConnected(s?.connected ?? false);
      setLoadingDrive(false);
    });

    // Cargar estado WhatsApp inicial
    const cargarEstadoWA = async () => {
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
    cargarEstadoWA();
  }, []);

  // Polling cada 3s cuando está esperando QR o conectando
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

  // --- Handlers ---

  const handleConectarWA = async () => {
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

  const handleDesconectarWA = async () => {
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

  const handleEnviarRecordatorios = async () => {
    setEnviandoRecordatorios(true);
    try {
      const data = await apiPost('/whatsapp/enviar-recordatorios');
      if (!data.waConectado) {
        toast.error('WhatsApp no conectado', `Conectá WhatsApp primero (estado: ${data.mensaje})`);
      } else if (data.turnos === 0) {
        toast.success('Sin turnos', 'No hay turnos pendientes para mañana.');
      } else {
        toast.success('Recordatorios enviados', `${data.mensaje}`);
      }
    } catch (err) {
      toast.error('Error', err.message || 'No se pudieron enviar los recordatorios.');
    } finally {
      setEnviandoRecordatorios(false);
    }
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      const result = await updateConfiguracionNotificaciones({
        notificaciones_pacientes: notificacionesPacientes,
        notificaciones_profesional: notificacionesProfesional,
        telefono_profesional: telefonoProfesional,
        hora_envio: horaEnvio,
        mensaje_paciente: mensajePaciente,
        mensaje_profesional: mensajeProfesional,
      });

      if (result) {
        toast.success('Configuración guardada', 'Los cambios se aplicaron correctamente.');
      } else {
        toast.error('Error', 'No se pudo guardar la configuración');
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      toast.error('Error', 'No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };


  const handleGuardarWhatsApp = async () => {
    setSavingWhatsApp(true);
    try {
      const result = await updateConfiguracionWhatsApp({
        notificaciones_pacientes: notificacionesPacientes,
        mensaje_paciente: mensajePaciente,
      });
      if (result) {
        toast.success('Configuración guardada', 'Los cambios en recordatorios se aplicaron correctamente.');
      } else {
        toast.error('Error', 'No se pudo guardar la configuración de recordatorios.');
      }
    } catch (err) {
      toast.error('Error', err.message || 'No se pudo guardar la configuración.');
    } finally {
      setSavingWhatsApp(false);
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

  const formatearFechaEnvio = (fechaStr) => {
    if (!fechaStr) return '';
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return fechaStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* â"€â"€â"€ Header â"€â"€â"€ */}
      <div className="flex items-center gap-3">
        <div className="bg-pink-100 dark:bg-teal-500/15 p-2 rounded-xl">
          <Settings size={22} className="text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Configuración</h1>
          <p className="text-sm text-slate-900 dark:text-gray-400">Administrá las preferencias del sistema</p>
        </div>
      </div>

      {/* ─── SECCIÓN WHATSAPP CONEXIÓN ─── */}
      <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-green-100 dark:bg-green-500/10 p-2.5 rounded-xl">
            <MessageCircle size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Conexión WhatsApp</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Conectá WhatsApp para enviar recordatorios automáticos</p>
          </div>
        </div>

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
              onClick={handleDesconectarWA}
              disabled={waDesconectando}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-60"
            >
              {waDesconectando ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
              Cerrar sesión
            </button>
          </div>
        ) : waEstado === 'QR_READY' || waEstado === 'CONNECTING' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30">
                <RefreshCw size={13} className="animate-spin" />
                {waEstado === 'CONNECTING' ? 'Iniciando...' : 'Esperando escaneo'}
              </span>
            </div>
            {waQR ? (
              <div className="flex flex-col items-center gap-3 py-2">
                <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
                  Abrí WhatsApp en tu teléfono → <strong>Dispositivos vinculados</strong> → <strong>Vincular dispositivo</strong> y escaneá este código:
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
              onClick={handleConectarWA}
              disabled={waConectando}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors disabled:opacity-60"
            >
              {waConectando ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
              Conectar WhatsApp
            </button>
          </div>
        )}
      </div>

      {/* ─── SECCIÓN GOOGLE DRIVE ─── */}
      <ConfirmModal />
      <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-blue-100 dark:bg-blue-500/10 p-2.5 rounded-xl">
            <HardDrive size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Google Drive</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Adjuntos de pacientes guardados en tu Drive personal</p>
          </div>
        </div>

        {loadingDrive ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Verificando conexión...</span>
          </div>
        ) : driveConnected ? (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30">
                <CheckCircle size={13} /> Conectado
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">Los archivos se guardan en "Agenda Psicope" en tu Drive</span>
            </div>
            <button
              onClick={async () => {
                const ok = await confirm({
                  title: 'Desconectar Google Drive',
                  message: '¿Desconectás Google Drive? Los archivos no se eliminarán, pero no podrás acceder a ellos desde la app.',
                  confirmLabel: 'Desconectar',
                  variant: 'danger',
                });
                if (!ok) return;
                setDisconnectingDrive(true);
                await disconnectDrive();
                setDriveConnected(false);
                setDisconnectingDrive(false);
                toast.success('Drive desconectado', 'Ya no se pueden acceder a los archivos desde la app.');
              }}
              disabled={disconnectingDrive}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-60"
            >
              {disconnectingDrive ? <Loader2 size={14} className="animate-spin" /> : null}
              Desconectar
            </button>
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

      {/* â"€â"€â"€ Sección: Notificaciones WhatsApp â"€â"€â"€ */}
      <div className="bg-white dark:bg-gray-900 border border-purple-300 dark:border-gray-700 rounded-2xl overflow-hidden">
        {/* Título de sección */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-purple-300 dark:border-gray-700">
          <MessageCircle size={20} className="text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notificaciones WhatsApp</h2>
        </div>

        <div className="p-6 space-y-6">

          {/* â"€â"€â"€ Switch: Recordatorios al profesional â"€â"€â"€ */}
          <SwitchToggle
            valor={notificacionesProfesional}
            onChange={setNotificacionesProfesional}
            label="Recibir resumen diario de turnos"
            descripcion="Se envía un resumen con todos los turnos del día siguiente"
          />

          {/* â"€â"€â"€ Teléfono del profesional â"€â"€â"€ */}
          <div className="space-y-2 pl-0">
            <label className="block text-sm font-medium text-slate-900 dark:text-white">
              Teléfono del profesional
            </label>
            <input
              type="text"
              value={telefonoProfesional}
              onChange={(e) => setTelefonoProfesional(e.target.value)}
              placeholder="Ej: 1138057772 (sin +54)"
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-pink-300 dark:border-gray-600 text-slate-900 dark:text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-teal-500 focus:border-transparent transition-colors"
            />
            <p className="text-xs text-slate-900 dark:text-gray-400">
              Sin código de país, solo el número argentino
            </p>
          </div>

          {/* â"€â"€â"€ Horario de envío â"€â"€â"€ */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-900 dark:text-white">Horario de envío</h3>
            <p className="text-xs text-slate-900 dark:text-gray-400">
              Los recordatorios se envían a las:
            </p>
            <TimePicker
              value={horaEnvio}
              onChange={(val) => setHoraEnvio(val)}
              className="bg-pink-100 dark:bg-gray-700 border border-pink-300 dark:border-gray-600 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-teal-500 focus:border-transparent transition-colors w-fit"
            />
            <p className="text-xs text-slate-900 dark:text-gray-400">
              Aplicado tanto a pacientes como al profesional
            </p>
            <p className="text-xs text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400">
              Actualmente configurado: {horaEnvio} hs
            </p>
          </div>

          {/* â"€â"€â"€ Divisor â"€â"€â"€ */}
          <div className="border-t border-purple-300 dark:border-gray-700" />

          {/* â"€â"€â"€ Plantillas de mensajes (colapsable) â"€â"€â"€ */}
          <div>
            <button
              onClick={() => setPlantillasAbiertas(!plantillasAbiertas)}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="text-sm font-medium text-slate-900 dark:text-white">Personalizar mensajes</span>
              {plantillasAbiertas ? (
                <ChevronUp size={18} className="text-slate-900 dark:text-gray-400" />
              ) : (
                <ChevronDown size={18} className="text-slate-900 dark:text-gray-400" />
              )}
            </button>

            {plantillasAbiertas && (
              <div className="mt-4 space-y-5">
                {/* Mensaje a pacientes */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-900 dark:text-white">
                    Mensaje para pacientes
                  </label>
                  <textarea
                    value={mensajePaciente}
                    onChange={(e) => setMensajePaciente(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-pink-300 dark:border-gray-600 text-slate-900 dark:text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-teal-500 focus:border-transparent transition-colors resize-y"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    <VariableChip>{'{nombre}'}</VariableChip>
                    <VariableChip>{'{fecha}'}</VariableChip>
                    <VariableChip>{'{hora}'}</VariableChip>
                    <VariableChip>{'{consultorio}'}</VariableChip>
                  </div>
                </div>

                {/* Mensaje al profesional */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-900 dark:text-white">
                    Mensaje para el profesional
                  </label>
                  <textarea
                    value={mensajeProfesional}
                    onChange={(e) => setMensajeProfesional(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-pink-300 dark:border-gray-600 text-slate-900 dark:text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-teal-500 focus:border-transparent transition-colors resize-y"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    <VariableChip>{'{fecha}'}</VariableChip>
                    <VariableChip>{'{cantidad}'}</VariableChip>
                    <VariableChip>{'{lista_turnos}'}</VariableChip>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* â"€â"€â"€ Footer con botón guardar â"€â"€â"€ */}
        <div className="px-6 py-4 bg-purple-100/50 dark:bg-gray-950/50 border-t border-purple-300 dark:border-gray-700 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={handleEnviarRecordatorios}
              disabled={enviandoRecordatorios}
              title="Enviar recordatorios para los turnos de mañana"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {enviandoRecordatorios ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {enviandoRecordatorios ? 'Enviando...' : 'Enviar recordatorios ahora'}
            </button>
          </div>
          <button
            onClick={handleGuardar}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-500 dark:bg-teal-600 hover:bg-pink-400 dark:hover:bg-teal-500 text-slate-900 dark:text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </div>

      {/* ─── Sección: Recordatorios por WhatsApp ─── */}
      <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-purple-300 dark:border-slate-700">
          <Smartphone size={20} className="text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recordatorios por WhatsApp</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Mensaje personalizado */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white">
                Mensaje personalizado
              </label>
              <p className="text-xs text-slate-900 dark:text-gray-400 mt-1">
                Personalizá el mensaje que reciben tus pacientes. Si dejás vacío, se usará el mensaje por defecto.
              </p>
            </div>
            <textarea
              ref={mensajeRef}
              value={mensajePaciente}
              onChange={(e) => setMensajePaciente(e.target.value)}
              placeholder={MENSAJE_POR_DEFECTO}
              rows={4}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-pink-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-teal-500 focus:border-transparent transition-colors resize-y"
            />
            <div>
              <p className="text-xs text-slate-900 dark:text-gray-400 mb-2">
                Variables disponibles — hacé clic para insertar:
              </p>
              <div className="flex flex-wrap gap-2">
                {VARIABLES_DISPONIBLES.map((varText) => (
                  <VariableChip key={varText} onClick={() => insertarVariable(varText)}>
                    {varText}
                  </VariableChip>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-purple-100/50 dark:bg-slate-950/50 border-t border-purple-300 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={handleEnviarRecordatorios}
            disabled={enviandoRecordatorios}
            title={waEstado !== 'CONNECTED' ? 'Conectá WhatsApp primero' : 'Enviar recordatorios de mañana ahora'}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {enviandoRecordatorios ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {enviandoRecordatorios ? 'Enviando...' : 'Enviar recordatorios ahora'}
          </button>
          <button
            onClick={handleGuardarWhatsApp}
            disabled={savingWhatsApp}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-500 dark:bg-teal-600 hover:bg-pink-400 dark:hover:bg-teal-500 text-slate-900 dark:text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingWhatsApp ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {savingWhatsApp ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* ─── Sección: Historial de envíos recientes ─── */}
      <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-purple-300 dark:border-slate-700">
          <History size={20} className="text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Historial de envíos recientes</h2>
        </div>

        <div className="p-6">
          {historialLoading ? (
            <div className="space-y-3">
              <Skeleton variant="table-row" className="rounded-xl" />
              <Skeleton variant="table-row" className="rounded-xl" />
              <Skeleton variant="table-row" className="rounded-xl" />
            </div>
          ) : historial.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">No hay envíos registrados aún.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {historial.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-purple-100/50 dark:bg-slate-950/50 border border-purple-300 dark:border-slate-800"
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
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatearFechaEnvio(item.enviado_at)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                      item.estado === 'error'
                        ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                        : 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                    }`}
                  >
                    {item.estado === 'error' ? 'Error' : 'Enviado'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}





