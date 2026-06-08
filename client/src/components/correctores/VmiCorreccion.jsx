import { useState, useCallback } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, AlertCircle, Info } from 'lucide-react';
import { calcularVMI, generarParagrafoVMI } from '../../data/vmiCalculator.js';
import { SUBPRUEBAS } from '../../data/vmiNormas.js';

// ─── Subcomponentes ────────────────────────────────────────────────────────────

function NumInput({ label, id, max, value, onChange, desc }) {
  const val = value === '' ? '' : Number(value);
  const invalid = val !== '' && (val < 0 || val > max);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
        {label}
        <span className="ml-1 font-normal text-slate-400 normal-case tracking-normal">/{max}</span>
      </label>
      {desc && <p className="text-xs text-slate-400 dark:text-slate-500 -mt-0.5">{desc}</p>}
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={e => onChange(id, e.target.value)}
        placeholder="—"
        className={`w-full px-3 py-2 rounded-lg border text-sm font-mono text-center bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 transition-colors
          ${invalid
            ? 'border-red-400 focus:ring-red-400'
            : 'border-pink-200 dark:border-slate-600 focus:ring-pink-400 dark:focus:ring-teal-500'}`}
      />
      {invalid && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={11} /> Máx. {max}
        </p>
      )}
    </div>
  );
}

function GaugePE({ pe }) {
  if (pe == null) return null;
  // Semicírculo: PE 40–160, centro=100
  const pct = Math.min(Math.max((pe - 40) / 120, 0), 1);
  const angle = -180 + pct * 180; // -180° (izq) a 0° (der)
  const rad = (angle * Math.PI) / 180;
  const cx = 80, cy = 70, r = 55;
  const nx = cx + r * Math.cos(rad);
  const ny = cy + r * Math.sin(rad);

  // color del arco
  const color = pe >= 115 ? '#10b981' : pe >= 85 ? '#3b82f6' : pe >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <svg viewBox="0 0 160 80" className="w-full max-w-[200px] mx-auto">
      {/* Fondo */}
      <path d="M 10 70 A 70 70 0 0 1 150 70" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
      {/* Relleno */}
      <path
        d={`M 10 70 A 70 70 0 0 1 ${nx} ${ny}`}
        fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
      />
      {/* Aguja */}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="4" fill={color} />
      {/* PE */}
      <text x={cx} y={cy - 10} textAnchor="middle" className="text-xl font-black" fontSize="18" fontWeight="900" fill="currentColor">
        {pe}
      </text>
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="8" fill="#94a3b8">PE</text>
      {/* Labels */}
      <text x="8" y="80" fontSize="7" fill="#94a3b8">40</text>
      <text x="72" y="18" fontSize="7" fill="#94a3b8" textAnchor="middle">100</text>
      <text x="148" y="80" fontSize="7" fill="#94a3b8" textAnchor="end">160</text>
    </svg>
  );
}

function ResultadoCard({ sub, resultado }) {
  if (!resultado) return null;
  const { pd, max, pe, percentil, clasificacion } = resultado;
  const label = SUBPRUEBAS.find(s => s.id === sub)?.label || sub;

  return (
    <div className={`rounded-xl p-4 border ${clasificacion.bg} ${clasificacion.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${clasificacion.color}`}>PE {pe}</span>
            {percentil != null && (
              <span className="text-sm font-semibold text-slate-500">Pc {percentil}</span>
            )}
          </div>
          <p className={`text-sm font-semibold mt-0.5 ${clasificacion.color}`}>{clasificacion.label}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">PD</p>
          <p className="text-lg font-black text-slate-600 dark:text-slate-300">{pd}<span className="text-xs font-normal">/{max}</span></p>
        </div>
      </div>
      {sub === 'VMI' && <GaugePE pe={pe} />}
    </div>
  );
}

function ParagrafoClinico({ texto }) {
  const [copiado, setCopiado] = useState(false);
  const [expandido, setExpandido] = useState(true);

  const copiar = useCallback(() => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }, [texto]);

  return (
    <div className="border border-green-200 dark:border-green-800/40 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpandido(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-green-50 dark:bg-green-900/20 text-left"
      >
        <span className="text-sm font-bold text-green-700 dark:text-green-400">Párrafo para informe</span>
        {expandido ? <ChevronUp size={15} className="text-green-500" /> : <ChevronDown size={15} className="text-green-500" />}
      </button>
      {expandido && (
        <div className="px-4 py-3 bg-white dark:bg-slate-900 space-y-3">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{texto}</p>
          <button
            onClick={copiar}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
              ${copiado
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            {copiado ? <Check size={13} /> : <Copy size={13} />}
            {copiado ? 'Copiado' : 'Copiar párrafo'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function VmiCorreccion({ nombrePaciente }) {
  const [edadAnios,  setEdadAnios]  = useState('');
  const [edadMeses,  setEdadMeses]  = useState('');
  const [scores, setScores] = useState({ VMI: '', VP: '', MC: '' });
  const [resultado, setResultado] = useState(null);

  const setScore = useCallback((id, val) => {
    setScores(prev => ({ ...prev, [id]: val }));
    setResultado(null);
  }, []);

  const calcular = () => {
    const calc = calcularVMI({ edadAnios, edadMeses, ...scores });
    if (!calc) return;
    const paragrafo = generarParagrafoVMI(calc, nombrePaciente);
    setResultado({ ...calc, paragrafo });
  };

  const limpiar = () => {
    setEdadAnios(''); setEdadMeses('');
    setScores({ VMI: '', VP: '', MC: '' });
    setResultado(null);
  };

  const edadValida = edadAnios !== '' && parseInt(edadAnios) >= 2;
  const tieneScores = Object.values(scores).some(v => v !== '');

  return (
    <div className="space-y-5">
      {/* Nota sobre subpruebas */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40">
        <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-snug">
          VMI es obligatorio. VP y MC son subpruebas opcionales (se administran a partir de los 5 años).
        </p>
      </div>

      {/* Edad */}
      <div>
        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-2">
          Edad del niño/a
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Años</label>
            <input
              type="number" min={2} max={18} value={edadAnios}
              onChange={e => { setEdadAnios(e.target.value); setResultado(null); }}
              placeholder="ej: 7"
              className="w-full px-3 py-2 rounded-lg border border-pink-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-center font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-teal-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Meses (opcional)</label>
            <input
              type="number" min={0} max={11} value={edadMeses}
              onChange={e => { setEdadMeses(e.target.value); setResultado(null); }}
              placeholder="ej: 6"
              className="w-full px-3 py-2 rounded-lg border border-pink-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-center font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Subpruebas */}
      <div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Puntuaciones directas (aciertos)
        </p>
        <div className="space-y-3">
          {SUBPRUEBAS.map(s => (
            <NumInput
              key={s.id}
              id={s.id}
              label={s.label}
              max={s.max}
              value={scores[s.id]}
              onChange={setScore}
              desc={s.desc}
            />
          ))}
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-2">
        <button
          onClick={calcular}
          disabled={!edadValida || !tieneScores}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-purple-500 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
        >
          Calcular y generar informe
        </button>
        {(tieneScores || resultado) && (
          <button
            onClick={limpiar}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Resultados */}
      {resultado && Object.keys(resultado.resultados).length > 0 && (
        <div className="space-y-3 pt-1">
          {['VMI', 'VP', 'MC'].map(sub =>
            resultado.resultados[sub] ? (
              <ResultadoCard key={sub} sub={sub} resultado={resultado.resultados[sub]} />
            ) : null
          )}
          <ParagrafoClinico texto={resultado.paragrafo} />
        </div>
      )}

      {resultado && Object.keys(resultado.resultados).length === 0 && (
        <p className="text-sm text-center text-slate-400 py-4">
          Ingresá al menos una puntuación para ver resultados.
        </p>
      )}
    </div>
  );
}
