import { useState, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import API_URL from '../config/api.js';

const tieneSpeechAPI =
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

/**
 * Hook para dictar texto en cualquier textarea.
 * Devuelve { VoiceButton, grabando } donde VoiceButton es un componente
 * que se coloca junto al label del campo.
 *
 * Uso:
 *   const { VoiceButton } = useVoiceDictation((texto) => setActividades(prev => prev ? prev + ' ' + texto : texto));
 *   <VoiceButton />
 */
export function useVoiceDictation(onTranscripcion) {
  const [estado, setEstado] = useState('idle'); // idle | grabando | procesando
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const estadoRef = useRef('idle');
  const onTranscripcionRef = useRef(onTranscripcion);
  onTranscripcionRef.current = onTranscripcion;

  function setEstadoSync(s) {
    estadoRef.current = s;
    setEstado(s);
  }

  function detener() {
    const rec = recognitionRef.current;
    if (rec) {
      recognitionRef.current = null;
      try { rec.abort(); } catch { /* ya cerrado */ }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setEstadoSync('idle');
  }

  async function iniciar() {
    if (estadoRef.current !== 'idle') { detener(); return; }

    // ── Web Speech API (Chrome/Edge/Safari) ──
    if (tieneSpeechAPI) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'es-AR';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (e) => {
        const texto = e.results[0][0].transcript;
        setEstadoSync('idle');
        onTranscripcionRef.current(texto);
      };

      recognition.onerror = (e) => {
        if (e.error === 'aborted') return;
        setEstadoSync('idle');
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        if (estadoRef.current === 'grabando') setEstadoSync('idle');
      };

      try {
        recognition.start();
        setEstadoSync('grabando');
      } catch {
        recognitionRef.current = null;
        setEstadoSync('idle');
      }
      return;
    }

    // ── Fallback: Groq Whisper vía servidor ──
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size < 1000) { setEstadoSync('idle'); return; }

        setEstadoSync('procesando');
        try {
          const formData = new FormData();
          formData.append('archivo', blob, 'audio.webm');
          const res = await fetch(`${API_URL}/ia/transcribir-audio`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${localStorage.getItem('psicope_token')}`,
            },
            body: formData,
          });
          if (!res.ok) throw new Error(`${res.status}`);
          const data = await res.json();
          setEstadoSync('idle');
          if (data.transcripcion) onTranscripcionRef.current(data.transcripcion);
        } catch {
          setEstadoSync('idle');
        }
      };

      mediaRecorder.start();
      setEstadoSync('grabando');
    } catch {
      setEstadoSync('idle');
    }
  }

  function VoiceButton({ className = '' }) {
    const idle = estado === 'idle';
    const grabando = estado === 'grabando';
    const procesando = estado === 'procesando';

    return (
      <button
        type="button"
        onClick={iniciar}
        disabled={procesando}
        title={grabando ? 'Detener dictado' : 'Dictar por voz'}
        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all
          ${grabando
            ? 'bg-red-100 dark:bg-red-500/20 text-red-500 dark:text-red-400 animate-pulse ring-2 ring-red-300 dark:ring-red-500/40'
            : procesando
            ? 'bg-pink-50 dark:bg-slate-700 text-pink-400 dark:text-slate-400 cursor-not-allowed'
            : 'bg-pink-50 dark:bg-slate-800 text-pink-400 dark:text-slate-400 hover:bg-pink-100 dark:hover:bg-slate-700 hover:text-pink-500 dark:hover:text-teal-400'
          } ${className}`}
      >
        {procesando
          ? <Loader2 size={13} className="animate-spin" />
          : grabando
          ? <MicOff size={13} />
          : <Mic size={13} />}
      </button>
    );
  }

  return { VoiceButton, grabando: estado === 'grabando', procesando: estado === 'procesando' };
}
