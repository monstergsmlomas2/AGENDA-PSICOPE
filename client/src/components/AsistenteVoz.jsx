import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, X, Loader2, MessageSquare, Stethoscope, Send } from 'lucide-react';
import { apiPost } from '../services/api.js';
import { useToast } from '../hooks/useToast.js';

// ─── Bordes animados tipo Siri ───────────────────────────────────────────────
function SiriBorder({ activo }) {
  if (!activo) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-[9998]" aria-hidden>
      {/* Borde superior */}
      <div className="absolute inset-x-0 top-0 h-1.5 rounded-none
        bg-gradient-to-r from-pink-500 via-purple-400 via-blue-400 to-pink-500
        dark:from-teal-400 dark:via-blue-400 dark:via-purple-500 dark:to-teal-400
        animate-siri-border"
        style={{ backgroundSize: '200% 100%' }}
      />
      {/* Borde inferior */}
      <div className="absolute inset-x-0 bottom-0 h-1.5
        bg-gradient-to-r from-pink-500 via-purple-400 via-blue-400 to-pink-500
        dark:from-teal-400 dark:via-blue-400 dark:via-purple-500 dark:to-teal-400
        animate-siri-border-reverse"
        style={{ backgroundSize: '200% 100%' }}
      />
      {/* Borde izquierdo */}
      <div className="absolute inset-y-0 left-0 w-1.5
        bg-gradient-to-b from-pink-500 via-purple-400 to-blue-400
        dark:from-teal-400 dark:via-blue-400 dark:to-purple-500
        animate-siri-border-v"
        style={{ backgroundSize: '100% 200%' }}
      />
      {/* Borde derecho */}
      <div className="absolute inset-y-0 right-0 w-1.5
        bg-gradient-to-b from-blue-400 via-purple-400 to-pink-500
        dark:from-purple-500 dark:via-blue-400 dark:to-teal-400
        animate-siri-border-v-reverse"
        style={{ backgroundSize: '100% 200%' }}
      />
    </div>
  );
}

// ─── Modal de opinión clínica ────────────────────────────────────────────────
function ModalOpinionClinica({ datos, onClose }) {
  const [respuesta, setRespuesta] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      try {
        const res = await apiPost('/ia/buscar-historia', {
          pacienteId: datos.pacienteId,
          consulta: datos.consulta,
        });
        if (!cancelado) setRespuesta(res.respuesta || 'Sin respuesta.');
      } catch {
        if (!cancelado) setRespuesta('No se pudo obtener la opinión clínica.');
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    cargar();
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
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              Opinión clínica
            </p>
            {datos.pacienteNombre && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{datos.pacienteNombre}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-pink-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
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
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-pink-500 hover:bg-pink-600 dark:bg-teal-500 dark:hover:bg-teal-600 text-white transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de confirmación de acción ────────────────────────────────────────
function ModalConfirmacion({ datos, onConfirmar, onCancelar }) {
  const { transcripcion, intencion, params } = datos;

  const descripcion = {
    navegar_paciente: `Abrir ficha de ${params.pacienteNombre || 'paciente'}`,
    navegar_ruta: `Ir a ${params.ruta || 'la sección'}`,
    transcribir_sesion: 'Abrir formulario con el texto de la sesión',
    recordatorio_whatsapp: `Enviar WhatsApp a ${params.pacienteNombre || 'paciente'}`,
    opinion_clinica: `Consulta clínica sobre ${params.pacienteNombre || 'paciente'}`,
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
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{params.respuesta}</p>
          ) : (
            <div className="bg-purple-50 dark:bg-teal-500/5 rounded-xl p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Acción:</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{descripcion}</p>
              {intencion === 'recordatorio_whatsapp' && params.mensaje && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">"{params.mensaje}"</p>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2 px-5 py-4">
          <button
            onClick={onCancelar}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-pink-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-pink-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          {intencion !== 'no_entendido' && intencion !== 'respuesta_directa' && (
            <button
              onClick={onConfirmar}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-pink-500 hover:bg-pink-600 dark:bg-teal-500 dark:hover:bg-teal-600 text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <Send size={14} />
              Ejecutar
            </button>
          )}
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
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const navigate = useNavigate();
  const toast = useToast();

  const activo = estado === 'grabando' || estado === 'procesando';

  const detenerGrabacion = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const iniciarGrabacion = useCallback(async () => {
    if (estado !== 'idle') {
      detenerGrabacion();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });

        if (blob.size < 1000) {
          setEstado('idle');
          toast.warning('Audio muy corto', 'Mantené presionado mientras hablás.');
          return;
        }

        setEstado('procesando');

        try {
          const formData = new FormData();
          formData.append('archivo', blob, 'audio.webm');

          const res = await fetch('/ia/asistente', {
            method: 'POST',
            headers: { Authorization: `Bearer ${localStorage.getItem('psicope_token')}` },
            body: formData,
          });

          if (!res.ok) throw new Error('Error del servidor');
          const data = await res.json();

          setEstado('idle');
          manejarRespuesta(data);
        } catch (err) {
          setEstado('idle');
          toast.error('Error', 'No se pudo procesar el audio. Intentá de nuevo.');
          console.error('[AsistenteVoz]', err);
        }
      };

      mediaRecorder.start();
      setEstado('grabando');
    } catch {
      toast.error('Sin micrófono', 'Habilitá el acceso al micrófono en el navegador.');
    }
  }, [estado, detenerGrabacion, toast]);

  function manejarRespuesta(data) {
    const { intencion, params, transcripcion } = data;

    if (intencion === 'respuesta_directa' || intencion === 'no_entendido') {
      setModalConfirm({ transcripcion, intencion, params });
      return;
    }

    setModalConfirm({ transcripcion, intencion, params });
  }

  function ejecutarAccion(intencion, params) {
    setModalConfirm(null);

    switch (intencion) {
      case 'navegar_paciente':
        if (params.pacienteId) navigate(`/pacientes/${params.pacienteId}`);
        else toast.warning('Paciente no encontrado', 'No pude identificar al paciente.');
        break;

      case 'navegar_ruta':
        if (params.ruta) navigate(params.ruta);
        break;

      case 'transcribir_sesion':
        if (onTranscripcionSesion) {
          onTranscripcionSesion(params.texto);
        } else {
          navigate('/pacientes', { state: { dictado: params.texto } });
          toast.info('Texto listo', 'Seleccioná un paciente para usar el dictado.');
        }
        break;

      case 'recordatorio_whatsapp':
        if (!params.pacienteId) {
          toast.warning('Paciente no identificado', 'No pude asociar el nombre a un paciente.');
          return;
        }
        enviarRecordatorio(params);
        break;

      case 'opinion_clinica':
        if (!params.pacienteId) {
          toast.warning('Paciente no identificado', 'Mencioná el nombre del paciente en tu consulta.');
          return;
        }
        setModalOpinion({ pacienteId: params.pacienteId, pacienteNombre: params.pacienteNombre, consulta: params.consulta });
        break;

      default:
        break;
    }
  }

  async function enviarRecordatorio({ pacienteId, pacienteNombre, mensaje }) {
    try {
      await apiPost('/whatsapp/enviar-recordatorio-individual', { pacienteId, mensaje });
      toast.success('Recordatorio enviado', `WhatsApp enviado a ${pacienteNombre}.`);
    } catch {
      toast.error('Error', 'No se pudo enviar el WhatsApp. Verificá la conexión.');
    }
  }

  // Tecla Escape para cancelar grabación
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && estado === 'grabando') detenerGrabacion();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [estado, detenerGrabacion]);

  return (
    <>
      {/* Bordes animados */}
      <SiriBorder activo={activo} />

      {/* Botón flotante */}
      <div className="fixed bottom-24 right-5 md:bottom-8 md:right-8 z-[9997]">
        {/* Anillos pulsantes cuando está grabando */}
        {estado === 'grabando' && (
          <>
            <div className="absolute inset-0 rounded-full bg-pink-400 dark:bg-teal-400 opacity-30 animate-ping" />
            <div className="absolute -inset-2 rounded-full bg-pink-300 dark:bg-teal-500 opacity-20 animate-pulse" />
          </>
        )}

        <button
          onClick={iniciarGrabacion}
          disabled={estado === 'procesando'}
          aria-label={
            estado === 'grabando' ? 'Detener grabación' :
            estado === 'procesando' ? 'Procesando…' :
            'Abrir asistente de voz'
          }
          className={`
            relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center
            transition-all duration-300 border-2
            ${estado === 'idle'
              ? 'bg-gradient-to-br from-pink-400 to-purple-500 dark:from-teal-500 dark:to-blue-500 border-white/30 hover:scale-110 hover:shadow-pink-300/50 dark:hover:shadow-teal-400/30 hover:shadow-2xl'
              : estado === 'grabando'
              ? 'bg-gradient-to-br from-red-400 to-pink-500 dark:from-red-500 dark:to-pink-600 border-white/30 scale-110'
              : 'bg-slate-300 dark:bg-slate-700 border-slate-400/30 cursor-not-allowed'
            }
          `}
        >
          {estado === 'procesando' ? (
            <Loader2 size={22} className="text-white animate-spin" />
          ) : estado === 'grabando' ? (
            <MicOff size={22} className="text-white" />
          ) : (
            <Mic size={22} className="text-white" />
          )}
        </button>

        {/* Etiqueta de estado */}
        {estado !== 'idle' && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shadow
              ${estado === 'grabando'
                ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
              {estado === 'grabando' ? '● Grabando' : '⟳ Procesando…'}
            </span>
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      {modalConfirm && (
        <ModalConfirmacion
          datos={modalConfirm}
          onConfirmar={() => ejecutarAccion(modalConfirm.intencion, modalConfirm.params)}
          onCancelar={() => setModalConfirm(null)}
        />
      )}

      {/* Modal de opinión clínica */}
      {modalOpinion && (
        <ModalOpinionClinica
          datos={modalOpinion}
          onClose={() => setModalOpinion(null)}
        />
      )}
    </>
  );
}
