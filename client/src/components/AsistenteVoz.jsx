import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, X, Loader2, MessageSquare, Stethoscope, Send, Keyboard } from 'lucide-react';
import { apiPost } from '../services/api.js';
import { useToast } from '../hooks/useToast.js';
import API_URL from '../config/api.js';

// ─── Bordes animados tipo Siri ───────────────────────────────────────────────
function SiriBorder({ activo }) {
  if (!activo) return null;

  const baseStyle = { backgroundSize: '300% 100%' };
  const baseStyleV = { backgroundSize: '100% 300%' };

  return (
    <div className="fixed inset-0 pointer-events-none z-[9998]" aria-hidden>
      <div className="absolute inset-x-0 top-0 h-[6px] animate-siri-border"
        style={{ ...baseStyle, background: 'linear-gradient(90deg, #ec4899, #a855f7, #3b82f6, #06b6d4, #a855f7, #ec4899)' }} />
      <div className="absolute inset-x-0 top-0 h-[40px] animate-siri-border"
        style={{ ...baseStyle, background: 'linear-gradient(90deg, #ec4899, #a855f7, #3b82f6, #06b6d4, #a855f7, #ec4899)', opacity: 0.35, filter: 'blur(12px)' }} />
      <div className="absolute inset-x-0 bottom-0 h-[6px] animate-siri-border-reverse"
        style={{ ...baseStyle, background: 'linear-gradient(90deg, #06b6d4, #a855f7, #ec4899, #a855f7, #3b82f6, #06b6d4)' }} />
      <div className="absolute inset-x-0 bottom-0 h-[40px] animate-siri-border-reverse"
        style={{ ...baseStyle, background: 'linear-gradient(90deg, #06b6d4, #a855f7, #ec4899, #a855f7, #3b82f6, #06b6d4)', opacity: 0.35, filter: 'blur(12px)' }} />
      <div className="absolute inset-y-0 left-0 w-[6px] animate-siri-border-v"
        style={{ ...baseStyleV, background: 'linear-gradient(180deg, #ec4899, #a855f7, #3b82f6, #06b6d4, #a855f7, #ec4899)' }} />
      <div className="absolute inset-y-0 left-0 w-[40px] animate-siri-border-v"
        style={{ ...baseStyleV, background: 'linear-gradient(180deg, #ec4899, #a855f7, #3b82f6, #06b6d4, #a855f7, #ec4899)', opacity: 0.35, filter: 'blur(12px)' }} />
      <div className="absolute inset-y-0 right-0 w-[6px] animate-siri-border-v-reverse"
        style={{ ...baseStyleV, background: 'linear-gradient(180deg, #06b6d4, #a855f7, #ec4899, #a855f7, #3b82f6, #06b6d4)' }} />
      <div className="absolute inset-y-0 right-0 w-[40px] animate-siri-border-v-reverse"
        style={{ ...baseStyleV, background: 'linear-gradient(180deg, #06b6d4, #a855f7, #ec4899, #a855f7, #3b82f6, #06b6d4)', opacity: 0.35, filter: 'blur(12px)' }} />
    </div>
  );
}

// ─── Modal de opinión clínica ────────────────────────────────────────────────
function ModalOpinionClinica({ datos, onClose }) {
  const [respuesta, setRespuesta] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    apiPost('/ia/buscar-historia', { pacienteId: datos.pacienteId, consulta: datos.consulta })
      .then(res => { if (!cancelado) setRespuesta(res.respuesta || 'Sin respuesta.'); })
      .catch(() => { if (!cancelado) setRespuesta('No se pudo obtener la opinión clínica.'); })
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [datos]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-pink-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-pink-100 dark:border-slate-700">
          <div className="p-2 rounded-full bg-pink-100 dark:bg-teal-500/10">
            <Stethoscope size={18} className="text-pink-500 dark:text-teal-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">Opinión clínica</p>
            {datos.pacienteNombre && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{datos.pacienteNombre}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-pink-50 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 italic">"{datos.consulta}"</p>
          {cargando ? (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Analizando historia clínica…</span>
            </div>
          ) : (
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{respuesta}</p>
          )}
        </div>
        <div className="px-5 py-3 border-t border-pink-100 dark:border-slate-700 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium bg-pink-500 hover:bg-pink-600 dark:bg-teal-500 dark:hover:bg-teal-600 text-white transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de confirmación de acción ────────────────────────────────────────
function ModalConfirmacion({ datos, onConfirmar, onCancelar }) {
  const { transcripcion, intencion, params = {} } = datos;
  const p = params || {};

  const descripcion = {
    recordatorio_personal: `Agregar a tu agenda: "${p.titulo || '(sin título)'}"${p.fecha_hora ? ` — ${p.fecha_hora.replace('T', ' ').slice(0, 16)}` : ''}`,
    navegar_paciente: `Abrir ficha de ${p.pacienteNombre || 'paciente'}`,
    navegar_ruta: `Ir a ${p.ruta || 'la sección'}`,
    transcribir_sesion: 'Abrir formulario con el texto de la sesión',
    recordatorio_whatsapp: `Enviar WhatsApp a ${p.pacienteNombre || 'paciente'}`,
    opinion_clinica: `Consulta clínica sobre ${p.pacienteNombre || 'paciente'}`,
    respuesta_directa: null,
    no_entendido: null,
  }[intencion];

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-pink-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 pt-5 pb-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-pink-100 dark:bg-teal-500/10">
              <MessageSquare size={18} className="text-pink-500 dark:text-teal-400" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Asistente entendió:</p>
          </div>
          <div className="bg-pink-50 dark:bg-slate-800 rounded-xl p-3 mb-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Lo que dijiste:</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{transcripcion}"</p>
          </div>
          {intencion === 'no_entendido' ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-2">No pude entender la acción. ¿Podés repetirlo?</p>
          ) : intencion === 'respuesta_directa' ? (
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{p.respuesta}</p>
          ) : (
            <div className="bg-purple-50 dark:bg-teal-500/5 rounded-xl p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Acción:</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{descripcion}</p>
              {intencion === 'recordatorio_whatsapp' && p.mensaje && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">"{p.mensaje}"</p>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2 px-5 py-4">
          <button onClick={onCancelar} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-pink-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-pink-50 dark:hover:bg-slate-800 transition-colors">
            Cancelar
          </button>
          {intencion !== 'no_entendido' && intencion !== 'respuesta_directa' && (
            <button onClick={onConfirmar} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-pink-500 hover:bg-pink-600 dark:bg-teal-500 dark:hover:bg-teal-600 text-white transition-colors flex items-center justify-center gap-1.5">
              <Send size={14} />
              Ejecutar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modal para escribir el pedido (sin voz) ─────────────────────────────────
function ModalTexto({ onEnviar, onClose }) {
  const [texto, setTexto] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function enviar() {
    const t = texto.trim();
    if (t) onEnviar(t);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      enviar();
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-pink-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-pink-100 dark:border-slate-700">
          <div className="p-2 rounded-full bg-pink-100 dark:bg-teal-500/10">
            <MessageSquare size={18} className="text-pink-500 dark:text-teal-400" />
          </div>
          <p className="flex-1 text-sm font-semibold text-slate-900 dark:text-white">Escribí tu pedido</p>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-pink-50 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">
          <textarea
            ref={inputRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={onKeyDown}
            rows={3}
            placeholder="Ej: Recordame llamar a la mamá de Juan mañana a las 10"
            className="w-full resize-none rounded-xl border border-pink-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-teal-500"
          />
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">Ctrl + Enter para enviar</p>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-pink-100 dark:border-slate-700">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-pink-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-pink-50 dark:hover:bg-slate-800 transition-colors">
            Cancelar
          </button>
          <button
            onClick={enviar}
            disabled={!texto.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-pink-500 hover:bg-pink-600 dark:bg-teal-500 dark:hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center gap-1.5"
          >
            <Send size={14} />
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function AsistenteVoz({ onTranscripcionSesion }) {
  const [estado, setEstado] = useState('idle'); // idle | grabando | procesando
  const [modalConfirm, setModalConfirm] = useState(null);
  const [modalOpinion, setModalOpinion] = useState(null);
  const [modalTexto, setModalTexto] = useState(false); // ventana para escribir el pedido

  // Refs para acceso estable dentro de callbacks del navegador
  const estadoRef = useRef('idle');
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const watchdogRef = useRef(null);
  const navigateRef = useRef(null);
  const toastRef = useRef(null);
  const onTranscripcionRef = useRef(onTranscripcionSesion);

  const navigate = useNavigate();
  const toast = useToast();

  // Mantener refs actualizadas
  navigateRef.current = navigate;
  toastRef.current = toast;
  onTranscripcionRef.current = onTranscripcionSesion;

  const activo = estado === 'grabando' || estado === 'procesando';

  function setEstadoSync(nuevoEstado) {
    estadoRef.current = nuevoEstado;
    setEstado(nuevoEstado);
  }

  function limpiarWatchdog() {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }

  // Libera el micrófono y resetea todo el estado de grabación.
  function liberarRecursos() {
    limpiarWatchdog();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }

  function detenerGrabacion() {
    limpiarWatchdog();
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      try { mr.stop(); } catch { /* ya estaba detenido */ }
    } else {
      liberarRecursos();
      setEstadoSync('idle');
    }
  }

  function manejarRespuesta(data) {
    const intencion = data.intencion || 'no_entendido';
    const params = data.params && typeof data.params === 'object' ? data.params : {};
    setModalConfirm({ transcripcion: data.transcripcion || '', intencion, params });
  }

  // Clasifica un texto escrito (sin audio): va directo a DeepSeek vía el servidor.
  // No depende de Groq, así que funciona aunque la transcripción de audio esté caída.
  async function clasificarTexto(transcripcion) {
    const texto = (transcripcion || '').trim();
    if (!texto) return;
    setModalTexto(false);
    setEstadoSync('procesando');
    try {
      const res = await fetch(`${API_URL}/ia/clasificar-intencion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('psicope_token')}`,
        },
        body: JSON.stringify({ transcripcion: texto }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${res.status}`);
      }
      const data = await res.json();
      setEstadoSync('idle');
      manejarRespuesta({ ...data, transcripcion: texto });
    } catch (err) {
      setEstadoSync('idle');
      console.error('[AsistenteVoz] clasificarTexto:', err);
      toastRef.current.error('Error', err.message || 'No se pudo procesar el pedido. Intentá de nuevo.');
    }
  }

  // Grabación con MediaRecorder + transcripción Groq Whisper en el servidor.
  // Es la única ruta: la Web Speech API de Chrome falla de forma intermitente
  // y se cuelga sin emitir eventos en PWA instalada (modo standalone).
  async function iniciarGrabacion() {
    if (estadoRef.current !== 'idle') {
      detenerGrabacion();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toastRef.current.error('No disponible', 'Tu navegador no permite grabar audio. Probá con Chrome o Edge actualizado.');
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error('[AsistenteVoz] getUserMedia:', err);
      if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
        toastRef.current.error('Sin micrófono', 'Habilitá el acceso al micrófono en los permisos del sitio/app.');
      } else if (err.name === 'NotFoundError') {
        toastRef.current.error('Sin micrófono', 'No se detectó ningún micrófono en el dispositivo.');
      } else {
        toastRef.current.error('Error de micrófono', 'No se pudo acceder al micrófono. Intentá de nuevo.');
      }
      return;
    }

    streamRef.current = stream;

    let mediaRecorder;
    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : '';
      mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch (err) {
      console.error('[AsistenteVoz] MediaRecorder:', err);
      liberarRecursos();
      toastRef.current.error('Error', 'No se pudo iniciar la grabación. Intentá de nuevo.');
      return;
    }

    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onerror = (e) => {
      console.error('[AsistenteVoz] MediaRecorder error:', e.error);
      liberarRecursos();
      setEstadoSync('idle');
      toastRef.current.error('Error de grabación', 'Se interrumpió la grabación. Intentá de nuevo.');
    };

    mediaRecorder.onstop = async () => {
      limpiarWatchdog();
      const tipo = mediaRecorder.mimeType || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: tipo });
      liberarRecursos();

      if (blob.size < 1000) {
        setEstadoSync('idle');
        toastRef.current.warning('Audio muy corto', 'Tocá el botón, hablá un par de segundos y volvé a tocar para enviar.');
        return;
      }

      setEstadoSync('procesando');
      try {
        const formData = new FormData();
        const ext = tipo.includes('mp4') ? 'mp4' : 'webm';
        formData.append('archivo', blob, `audio.${ext}`);
        const res = await fetch(`${API_URL}/ia/asistente`, {
          method: 'POST',
          headers: { 'Accept': 'application/json', Authorization: `Bearer ${localStorage.getItem('psicope_token')}` },
          body: formData,
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Error ${res.status}`);
        }
        const data = await res.json();
        setEstadoSync('idle');
        manejarRespuesta(data);
      } catch (err) {
        setEstadoSync('idle');
        console.error('[AsistenteVoz] procesar audio:', err);
        toastRef.current.error('Error', err.message || 'No se pudo procesar el audio. Intentá de nuevo.');
      }
    };

    try {
      mediaRecorder.start();
    } catch (err) {
      console.error('[AsistenteVoz] start():', err);
      liberarRecursos();
      setEstadoSync('idle');
      toastRef.current.error('Error', 'No se pudo iniciar la grabación. Intentá de nuevo.');
      return;
    }

    setEstadoSync('grabando');

    // Watchdog: si por cualquier motivo la grabación queda colgada,
    // la cerramos automáticamente para procesar lo capturado (máx. 60s).
    limpiarWatchdog();
    watchdogRef.current = setTimeout(() => {
      if (estadoRef.current === 'grabando') detenerGrabacion();
    }, 60000);
  }

  function ejecutarAccion(intencion, rawParams) {
    const params = rawParams && typeof rawParams === 'object' ? rawParams : {};
    setModalConfirm(null);
    switch (intencion) {
      case 'navegar_paciente':
        if (params.pacienteId) navigateRef.current(`/pacientes/${params.pacienteId}`);
        else toastRef.current.warning('Paciente no encontrado', 'No pude identificar al paciente.');
        break;
      case 'navegar_ruta':
        if (params.ruta) navigateRef.current(params.ruta);
        break;
      case 'transcribir_sesion':
        if (onTranscripcionRef.current) {
          onTranscripcionRef.current(params.texto || '');
        } else {
          navigateRef.current('/pacientes', { state: { dictado: params.texto || '' } });
          toastRef.current.info('Texto listo', 'Seleccioná un paciente para usar el dictado.');
        }
        break;
      case 'recordatorio_personal':
        crearRecordatorioPersonal(params);
        break;
      case 'recordatorio_whatsapp':
        if (!params.pacienteId) {
          toastRef.current.warning('Paciente no identificado', 'No pude asociar el nombre a un paciente.');
          return;
        }
        enviarRecordatorio(params);
        break;
      case 'opinion_clinica':
        if (!params.pacienteId) {
          toastRef.current.warning('Paciente no identificado', 'Mencioná el nombre del paciente en tu consulta.');
          return;
        }
        setModalOpinion({ pacienteId: params.pacienteId, pacienteNombre: params.pacienteNombre, consulta: params.consulta || '' });
        break;
      default:
        break;
    }
  }

  async function crearRecordatorioPersonal({ titulo, descripcion, fecha_hora, recordatorio_minutos }) {
    if (!titulo) {
      toastRef.current.error('Sin título', 'No se pudo extraer el título del recordatorio.');
      return;
    }
    // Validar y normalizar fecha_hora
    let fechaFinal = fecha_hora;
    if (!fechaFinal || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(fechaFinal)) {
      // Si no tiene formato válido, usar mañana a las 9:00
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      const y = manana.getFullYear();
      const m = String(manana.getMonth() + 1).padStart(2, '0');
      const d = String(manana.getDate()).padStart(2, '0');
      fechaFinal = `${y}-${m}-${d}T09:00:00`;
    }
    try {
      const token = localStorage.getItem('psicope_token');
      const res = await fetch(`${API_URL}/agenda-personal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titulo,
          descripcion: descripcion || '',
          fecha_hora: fechaFinal,
          recordatorio_minutos: recordatorio_minutos || 30,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      toastRef.current.success('Recordatorio creado', `"${titulo}" agregado a tu agenda.`);
    } catch (err) {
      console.error('[AsistenteVoz] crearRecordatorio:', err);
      toastRef.current.error('Error', `No se pudo crear el recordatorio: ${err.message}`);
    }
  }

  async function enviarRecordatorio({ pacienteId, pacienteNombre, mensaje }) {
    try {
      const token = localStorage.getItem('psicope_token');
      const res = await fetch(`${API_URL}/whatsapp/enviar-recordatorio-individual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pacienteId, mensaje }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      toastRef.current.success('Recordatorio enviado', `WhatsApp enviado a ${pacienteNombre}.`);
    } catch (err) {
      console.error('[AsistenteVoz] enviarRecordatorio:', err);
      toastRef.current.error('Error', 'No se pudo enviar el WhatsApp. Verificá la conexión.');
    }
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && estadoRef.current === 'grabando') detenerGrabacion();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      liberarRecursos(); // liberar micrófono si el componente se desmonta grabando
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <SiriBorder activo={activo} />

      {/* Botón flotante */}
      <div className="fixed bottom-24 right-5 md:bottom-8 md:right-8 z-[9997] flex flex-col items-center gap-2">
        {/* Botón secundario: escribir el pedido (sin voz, va directo a DeepSeek) */}
        {estado === 'idle' && (
          <button
            onClick={() => setModalTexto(true)}
            aria-label="Escribir el pedido"
            title="Escribir el pedido"
            className="w-11 h-11 rounded-full shadow-lg flex items-center justify-center border-2 border-white/30 bg-white dark:bg-slate-800 text-pink-500 dark:text-teal-400 hover:scale-110 hover:shadow-xl transition-all duration-300"
          >
            <Keyboard size={18} />
          </button>
        )}
        <div className="relative">
        {estado === 'grabando' && (
          <>
            <div className="absolute inset-0 rounded-full bg-pink-400 dark:bg-teal-400 opacity-30 animate-ping" />
            <div className="absolute -inset-2 rounded-full bg-pink-300 dark:bg-teal-500 opacity-20 animate-pulse" />
          </>
        )}
        <button
          onClick={iniciarGrabacion}
          disabled={estado === 'procesando'}
          aria-label={estado === 'grabando' ? 'Detener grabación' : estado === 'procesando' ? 'Procesando…' : 'Abrir asistente de voz'}
          className={`relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 border-2
            ${estado === 'idle'
              ? 'bg-gradient-to-br from-pink-400 to-purple-500 dark:from-teal-500 dark:to-blue-500 border-white/30 hover:scale-110 hover:shadow-2xl'
              : estado === 'grabando'
              ? 'bg-gradient-to-br from-red-400 to-pink-500 dark:from-red-500 dark:to-pink-600 border-white/30 scale-110'
              : 'bg-slate-300 dark:bg-slate-700 border-slate-400/30 cursor-not-allowed'
            }`}
        >
          {estado === 'procesando' ? <Loader2 size={22} className="text-white animate-spin" />
            : estado === 'grabando' ? <MicOff size={22} className="text-white" />
            : <Mic size={22} className="text-white" />}
        </button>
        {estado !== 'idle' && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shadow
              ${estado === 'grabando' ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
              {estado === 'grabando' ? '● Grabando' : '⟳ Procesando…'}
            </span>
          </div>
        )}
        </div>
      </div>

      {modalTexto && (
        <ModalTexto
          onEnviar={clasificarTexto}
          onClose={() => setModalTexto(false)}
        />
      )}

      {modalConfirm && (
        <ModalConfirmacion
          datos={modalConfirm}
          onConfirmar={() => ejecutarAccion(modalConfirm.intencion, modalConfirm.params)}
          onCancelar={() => setModalConfirm(null)}
        />
      )}

      {modalOpinion && (
        <ModalOpinionClinica datos={modalOpinion} onClose={() => setModalOpinion(null)} />
      )}

      {/* Logo centrado mientras está activo */}
      {activo && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9996]">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-40 h-40 rounded-full bg-pink-400/20 dark:bg-teal-400/20 animate-ping" style={{ animationDuration: '1.5s' }} />
            <div className="absolute w-52 h-52 rounded-full bg-purple-400/10 dark:bg-blue-400/10 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute w-64 h-64 rounded-full bg-blue-400/5 dark:bg-purple-400/5 animate-ping" style={{ animationDuration: '2.5s' }} />
            <img src="/icon-192x192.png" alt="Psicope" className="w-24 h-24 rounded-2xl shadow-2xl shadow-pink-500/30 dark:shadow-teal-400/30 animate-pulse" style={{ animationDuration: '2s' }} />
            <div className="absolute -bottom-10 whitespace-nowrap">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {estado === 'grabando' ? 'Escuchando…' : 'Procesando…'}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
