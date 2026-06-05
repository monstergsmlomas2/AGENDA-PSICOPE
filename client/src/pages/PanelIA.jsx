import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, FileText, Target, UserX, TrendingDown, Mic, Search, Loader2, ChevronDown, Copy, Check, AlertTriangle, MicOff, Upload, StopCircle } from 'lucide-react';
import { getPacientes } from '../services/pacientesService.js';
import {
  resumirSesion,
  generarInforme,
  sugerirObjetivos,
  detectarAbandonos,
  alertasEstancamiento,
  buscarEnHistoria,
  transcribirAudio,
} from '../services/iaService.js';
import { useToast } from '../hooks/useToast.js';

const HERRAMIENTAS = [
  { id: 'resumen', label: 'Resumen de Sesión', icon: Sparkles, desc: 'Transforma notas crudas en un resumen clínico estructurado' },
  { id: 'informe', label: 'Generar Informe', icon: FileText, desc: 'Genera un informe psicopedagógico completo del paciente' },
  { id: 'objetivos', label: 'Sugerir Objetivos', icon: Target, desc: 'Sugiere objetivos terapéuticos basados en la historia del paciente' },
  { id: 'abandonos', label: 'Detectar Abandonos', icon: UserX, desc: 'Identifica pacientes en riesgo de abandonar el tratamiento' },
  { id: 'estancamiento', label: 'Alertas de Evolución', icon: TrendingDown, desc: 'Detecta estancamiento terapéutico en la evolución del paciente' },
  { id: 'transcripcion', label: 'Transcribir Audio', icon: Mic, desc: 'Convierte grabaciones de sesiones a texto (gratis con Groq Whisper)' },
  { id: 'busqueda', label: 'Buscar en Historia', icon: Search, desc: 'Búsqueda inteligente en toda la historia clínica del paciente' },
];

const TIPOS_INFORME = [
  'Informe psicopedagógico general',
  'Informe de evaluación cognitiva',
  'Informe de proceso terapéutico',
  'Informe de alta',
  'Informe para institución educativa',
  'Informe para obra social',
];

function ResultadoBox({ texto, onCopy, copiado }) {
  if (!texto) return null;
  return (
    <div className="mt-4 relative">
      <div className="bg-purple-50 dark:bg-slate-950 border border-pink-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
        {texto}
      </div>
      <button
        onClick={onCopy}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-pink-200 dark:border-slate-700 hover:bg-pink-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
        title="Copiar resultado"
      >
        {copiado ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
      </button>
    </div>
  );
}

function PacienteSelect({ pacientes, value, onChange, placeholder = 'Seleccioná un paciente' }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none bg-white dark:bg-slate-900 border border-pink-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-teal-500 pr-10"
      >
        <option value="">{placeholder}</option>
        {pacientes.map(p => (
          <option key={p.id} value={p.id}>{p.apellido}, {p.nombre}</option>
        ))}
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}

// ─── HERRAMIENTA: Resumen de Sesión ───
function ResumenSesion({ pacientes }) {
  const [pacienteId, setPacienteId] = useState('');
  const [notas, setNotas] = useState('');
  const [nroSesion, setNroSesion] = useState('');
  const [resultado, setResultado] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const { showToast } = useToast();

  const handleGenerar = async () => {
    if (!pacienteId || !notas.trim()) {
      showToast('Seleccioná un paciente e ingresá las notas', 'error'); return;
    }
    setLoading(true);
    try {
      const data = await resumirSesion(Number(pacienteId), notas, nroSesion || undefined);
      setResultado(data.resumen);
    } catch (e) {
      showToast(e.message || 'Error al generar resumen', 'error');
    } finally { setLoading(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <PacienteSelect pacientes={pacientes} value={pacienteId} onChange={setPacienteId} />
        <input
          type="text"
          placeholder="Nº de sesión (opcional)"
          value={nroSesion}
          onChange={e => setNroSesion(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-pink-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-teal-500"
        />
      </div>
      <textarea
        rows={6}
        placeholder="Pegá o escribí las notas crudas de la sesión aquí... Podés escribir en forma libre, puntos, frases cortas, lo que sea."
        value={notas}
        onChange={e => setNotas(e.target.value)}
        className="w-full bg-white dark:bg-slate-900 border border-pink-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-teal-500 resize-none"
      />
      <button
        onClick={handleGenerar}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-pink-500 dark:bg-teal-600 hover:bg-pink-600 dark:hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {loading ? <><Loader2 size={15} className="animate-spin" /> Generando...</> : <><Sparkles size={15} /> Generar Resumen</>}
      </button>
      <ResultadoBox texto={resultado} onCopy={handleCopy} copiado={copiado} />
    </div>
  );
}

// ─── HERRAMIENTA: Generar Informe ───
function GenerarInforme({ pacientes }) {
  const [pacienteId, setPacienteId] = useState('');
  const [tipoInforme, setTipoInforme] = useState(TIPOS_INFORME[0]);
  const [resultado, setResultado] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const { showToast } = useToast();

  const handleGenerar = async () => {
    if (!pacienteId) { showToast('Seleccioná un paciente', 'error'); return; }
    setLoading(true);
    try {
      const data = await generarInforme(Number(pacienteId), tipoInforme);
      setResultado(data.informe);
    } catch (e) {
      showToast(e.message || 'Error al generar informe', 'error');
    } finally { setLoading(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="space-y-4">
      <PacienteSelect pacientes={pacientes} value={pacienteId} onChange={setPacienteId} />
      <div className="relative">
        <select
          value={tipoInforme}
          onChange={e => setTipoInforme(e.target.value)}
          className="w-full appearance-none bg-white dark:bg-slate-900 border border-pink-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-teal-500 pr-10"
        >
          {TIPOS_INFORME.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 bg-purple-50 dark:bg-slate-950 border border-pink-100 dark:border-slate-800 rounded-lg px-3 py-2">
        La IA usará las sesiones y evaluaciones registradas del paciente para generar el informe.
      </p>
      <button
        onClick={handleGenerar}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-pink-500 dark:bg-teal-600 hover:bg-pink-600 dark:hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {loading ? <><Loader2 size={15} className="animate-spin" /> Generando informe...</> : <><FileText size={15} /> Generar Informe</>}
      </button>
      <ResultadoBox texto={resultado} onCopy={handleCopy} copiado={copiado} />
    </div>
  );
}

// ─── HERRAMIENTA: Sugerir Objetivos ───
function SugerirObjetivos({ pacientes }) {
  const [pacienteId, setPacienteId] = useState('');
  const [resultado, setResultado] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const { showToast } = useToast();

  const handleGenerar = async () => {
    if (!pacienteId) { showToast('Seleccioná un paciente', 'error'); return; }
    setLoading(true);
    try {
      const data = await sugerirObjetivos(Number(pacienteId));
      setResultado(data.objetivos);
    } catch (e) {
      showToast(e.message || 'Error al sugerir objetivos', 'error');
    } finally { setLoading(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="space-y-4">
      <PacienteSelect pacientes={pacientes} value={pacienteId} onChange={setPacienteId} />
      <p className="text-xs text-slate-500 dark:text-slate-400 bg-purple-50 dark:bg-slate-950 border border-pink-100 dark:border-slate-800 rounded-lg px-3 py-2">
        La IA analizará la entrevista de admisión, el diagnóstico y las sesiones recientes para sugerir objetivos.
      </p>
      <button
        onClick={handleGenerar}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-pink-500 dark:bg-teal-600 hover:bg-pink-600 dark:hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {loading ? <><Loader2 size={15} className="animate-spin" /> Analizando...</> : <><Target size={15} /> Sugerir Objetivos</>}
      </button>
      <ResultadoBox texto={resultado} onCopy={handleCopy} copiado={copiado} />
    </div>
  );
}

// ─── HERRAMIENTA: Detectar Abandonos ───
function DetectarAbandonos() {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analizado, setAnalizado] = useState(false);
  const { showToast } = useToast();

  const RIESGO_COLORS = {
    alto: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    medio: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
    bajo: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  };

  const handleAnalizar = async () => {
    setLoading(true);
    try {
      const data = await detectarAbandonos();
      setPacientes(data.pacientes || []);
      setAnalizado(true);
    } catch (e) {
      showToast(e.message || 'Error al analizar abandonos', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 bg-purple-50 dark:bg-slate-950 border border-pink-100 dark:border-slate-800 rounded-lg px-3 py-2">
        Analiza todos los pacientes con más de 15 días sin sesión y clasifica el riesgo de abandono con IA.
      </p>
      <button
        onClick={handleAnalizar}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-pink-500 dark:bg-teal-600 hover:bg-pink-600 dark:hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {loading ? <><Loader2 size={15} className="animate-spin" /> Analizando...</> : <><UserX size={15} /> Analizar Ahora</>}
      </button>
      {analizado && pacientes.length === 0 && (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
          ¡Excelente! No hay pacientes en riesgo de abandono.
        </div>
      )}
      {pacientes.length > 0 && (
        <div className="space-y-2">
          {pacientes.map(p => (
            <div key={p.id} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 border border-pink-100 dark:border-slate-800 rounded-xl">
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold border uppercase ${RIESGO_COLORS[p.riesgo] || RIESGO_COLORS.medio}`}>
                {p.riesgo}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{p.apellido}, {p.nombre}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {p.ultima_sesion ? `Última sesión hace ${p.dias_desde_ultima_sesion} días` : 'Sin sesiones registradas'}
                </p>
                {p.motivo && <p className="text-xs text-slate-500 dark:text-slate-400">{p.motivo}</p>}
                {p.recomendacion && <p className="text-xs text-pink-600 dark:text-teal-400 mt-1 font-medium">{p.recomendacion}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── HERRAMIENTA: Alertas de Estancamiento ───
function AlertasEstancamiento({ pacientes }) {
  const [pacienteId, setPacienteId] = useState('');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const NIVEL_COLORS = {
    leve: 'text-yellow-600 dark:text-yellow-400',
    moderado: 'text-orange-600 dark:text-orange-400',
    severo: 'text-red-600 dark:text-red-400',
    sin_estancamiento: 'text-green-600 dark:text-green-400',
  };

  const handleAnalizar = async () => {
    if (!pacienteId) { showToast('Seleccioná un paciente', 'error'); return; }
    setLoading(true);
    try {
      const data = await alertasEstancamiento(Number(pacienteId));
      setResultado(data);
    } catch (e) {
      showToast(e.message || 'Error al analizar estancamiento', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <PacienteSelect pacientes={pacientes} value={pacienteId} onChange={setPacienteId} />
      <p className="text-xs text-slate-500 dark:text-slate-400 bg-purple-50 dark:bg-slate-950 border border-pink-100 dark:border-slate-800 rounded-lg px-3 py-2">
        Requiere al menos 3 sesiones registradas para el análisis.
      </p>
      <button
        onClick={handleAnalizar}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-pink-500 dark:bg-teal-600 hover:bg-pink-600 dark:hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {loading ? <><Loader2 size={15} className="animate-spin" /> Analizando...</> : <><TrendingDown size={15} /> Analizar Evolución</>}
      </button>
      {resultado && (
        <div className="bg-white dark:bg-slate-900 border border-pink-100 dark:border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            {resultado.estancado
              ? <AlertTriangle size={18} className={NIVEL_COLORS[resultado.nivel] || 'text-yellow-500'} />
              : <Check size={18} className="text-green-500" />}
            <span className={`text-sm font-bold ${NIVEL_COLORS[resultado.nivel] || ''}`}>
              {resultado.estancado
                ? `Estancamiento ${resultado.nivel}`
                : 'Sin señales de estancamiento'}
            </span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">{resultado.mensaje}</p>
          {resultado.sugerencias?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Sugerencias:</p>
              <ul className="space-y-1">
                {resultado.sugerencias.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="shrink-0 w-4 h-4 rounded-full bg-pink-100 dark:bg-teal-900/30 text-pink-600 dark:text-teal-400 text-xs flex items-center justify-center font-bold mt-0.5">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── HERRAMIENTA: Transcripción de Audio ───
function TranscripcionAudio() {
  const [transcripcion, setTranscripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [grabando, setGrabando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [tiempoGrabacion, setTiempoGrabacion] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => () => {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
  }, []);

  const procesarAudio = useCallback(async (blob) => {
    setLoading(true);
    try {
      const archivo = new File([blob], 'grabacion.webm', { type: blob.type || 'audio/webm' });
      const data = await transcribirAudio(archivo);
      setTranscripcion(data.transcripcion);
    } catch (e) {
      showToast(e.message || 'Error al transcribir', 'error');
    } finally { setLoading(false); }
  }, [showToast]);

  const iniciarGrabacion = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        procesarAudio(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setGrabando(true);
      setTiempoGrabacion(0);
      timerRef.current = setInterval(() => setTiempoGrabacion(t => t + 1), 1000);
    } catch {
      showToast('No se pudo acceder al micrófono', 'error');
    }
  };

  const detenerGrabacion = () => {
    mediaRecorderRef.current?.stop();
    setGrabando(false);
    clearInterval(timerRef.current);
  };

  const handleArchivoSubido = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    setLoading(true);
    try {
      const data = await transcribirAudio(archivo);
      setTranscripcion(data.transcripcion);
    } catch (er) {
      showToast(er.message || 'Error al transcribir', 'error');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const formatTiempo = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(transcripcion);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 bg-purple-50 dark:bg-slate-950 border border-pink-100 dark:border-slate-800 rounded-lg px-3 py-2">
        Usa Groq Whisper (gratis). Soporta MP3, MP4, M4A, WAV, WebM. Máximo 25 MB por archivo.
      </p>

      <div className="flex gap-3 flex-wrap">
        {!grabando ? (
          <button
            onClick={iniciarGrabacion}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-pink-500 dark:bg-teal-600 hover:bg-pink-600 dark:hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
          >
            <Mic size={15} /> Grabar ahora
          </button>
        ) : (
          <button
            onClick={detenerGrabacion}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors animate-pulse"
          >
            <StopCircle size={15} /> Detener ({formatTiempo(tiempoGrabacion)})
          </button>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading || grabando}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-pink-300 dark:border-slate-700 hover:bg-pink-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
        >
          <Upload size={15} /> Subir archivo
        </button>
        <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleArchivoSubido} />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 size={15} className="animate-spin" /> Transcribiendo audio...
        </div>
      )}

      <ResultadoBox texto={transcripcion} onCopy={handleCopy} copiado={copiado} />
    </div>
  );
}

// ─── HERRAMIENTA: Búsqueda en Historia ───
function BusquedaHistoria({ pacientes }) {
  const [pacienteId, setPacienteId] = useState('');
  const [consulta, setConsulta] = useState('');
  const [resultado, setResultado] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const { showToast } = useToast();

  const handleBuscar = async () => {
    if (!pacienteId || !consulta.trim()) {
      showToast('Seleccioná un paciente e ingresá una consulta', 'error'); return;
    }
    setLoading(true);
    try {
      const data = await buscarEnHistoria(Number(pacienteId), consulta);
      setResultado(data.respuesta);
    } catch (e) {
      showToast(e.message || 'Error en la búsqueda', 'error');
    } finally { setLoading(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="space-y-4">
      <PacienteSelect pacientes={pacientes} value={pacienteId} onChange={setPacienteId} />
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Ej: ¿Cuándo mejoró la lectura? ¿Qué técnicas se usaron?"
          value={consulta}
          onChange={e => setConsulta(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleBuscar()}
          className="flex-1 bg-white dark:bg-slate-900 border border-pink-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-teal-500"
        />
        <button
          onClick={handleBuscar}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-pink-500 dark:bg-teal-600 hover:bg-pink-600 dark:hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 shrink-0"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
        </button>
      </div>
      <ResultadoBox texto={resultado} onCopy={handleCopy} copiado={copiado} />
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ───
export default function PanelIA() {
  const [tabActivo, setTabActivo] = useState('resumen');
  const [pacientes, setPacientes] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    getPacientes()
      .then(setPacientes)
      .catch(() => showToast('No se pudieron cargar los pacientes', 'error'));
  }, []);

  const herramienta = HERRAMIENTAS.find(h => h.id === tabActivo);

  const renderContenido = () => {
    switch (tabActivo) {
      case 'resumen': return <ResumenSesion pacientes={pacientes} />;
      case 'informe': return <GenerarInforme pacientes={pacientes} />;
      case 'objetivos': return <SugerirObjetivos pacientes={pacientes} />;
      case 'abandonos': return <DetectarAbandonos />;
      case 'estancamiento': return <AlertasEstancamiento pacientes={pacientes} />;
      case 'transcripcion': return <TranscripcionAudio />;
      case 'busqueda': return <BusquedaHistoria pacientes={pacientes} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-purple-200 dark:bg-[#141414] p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-500 dark:bg-teal-500/20 flex items-center justify-center shrink-0">
            <Sparkles size={20} className="text-white dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Panel de IA</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Herramientas de inteligencia artificial para tu práctica clínica</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">

          {/* Sidebar de herramientas */}
          <div className="bg-white dark:bg-slate-900 border border-pink-200 dark:border-slate-800 rounded-2xl p-2 h-fit lg:sticky lg:top-4">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide px-3 py-2">Herramientas</p>
            <nav className="space-y-0.5">
              {HERRAMIENTAS.map(h => {
                const Icono = h.icon;
                const activo = tabActivo === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => setTabActivo(h.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                      activo
                        ? 'bg-pink-100 dark:bg-teal-500/10 text-pink-700 dark:text-teal-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-pink-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icono size={16} className={activo ? 'text-pink-500 dark:text-teal-400' : 'text-slate-400'} />
                    {h.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Panel activo */}
          <div className="bg-white dark:bg-slate-900 border border-pink-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-5 pb-4 border-b border-pink-100 dark:border-slate-800">
              {herramienta && (
                <>
                  <div className="w-9 h-9 rounded-xl bg-pink-50 dark:bg-teal-500/10 flex items-center justify-center shrink-0">
                    <herramienta.icon size={18} className="text-pink-500 dark:text-teal-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{herramienta.label}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{herramienta.desc}</p>
                  </div>
                </>
              )}
            </div>
            {renderContenido()}
          </div>
        </div>
      </div>
    </div>
  );
}
