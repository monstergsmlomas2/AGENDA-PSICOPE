import { useState, useCallback } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, AlertCircle, Info } from 'lucide-react';
import { calcularWISC, generarParagrafoWISC } from '../../data/wiscCalculator.js';
import { SUBTESTS_PRINCIPALES, INDICES } from '../../data/wiscNormas.js';

// ─── Subcomponentes ────────────────────────────────────────────────────────────

function NumInput({ label, id, max, value, onChange, desc }) {
  const val = value === '' ? '' : Number(value);
  const invalid = val !== '' && (val < 0 || val > max);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide leading-tight">
        {label}
        <span className="ml-1 font-normal text-slate-400 normal-case tracking-normal">/{max}</span>
      </label>
      {desc && <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight">{desc}</p>}
      <input
        type="number" min={0} max={max} value={value}
        onChange={e => onChange(id, e.target.value)}
        placeholder="—"
        className={`w-full px-3 py-2 rounded-lg border text-sm font-mono text-center bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 transition-colors
          ${invalid ? 'border-red-400 focus:ring-red-400' : 'border-pink-200 dark:border-slate-600 focus:ring-pink-400 dark:focus:ring-teal-500'}`}
      />
      {invalid && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} /> Máx. {max}</p>}
    </div>
  );
}

const COLOR_INDICE = {
  blue:   'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400',
  purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-400',
  green:  'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-400',
  orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-400',
  red:    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-400',
};

function BarraSubtest({ sub, resultado }) {
  if (!resultado) return null;
  const { pe, percentil } = resultado;
  const pct = ((pe - 1) / 18) * 100;
  const barColor = pe >= 12 ? 'bg-blue-500' : pe >= 8 ? 'bg-green-500' : pe >= 5 ? 'bg-amber-400' : 'bg-red-500';
  const info = SUBTESTS_PRINCIPALES.find(s => s.id === sub);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs gap-2">
        <span className="font-medium text-slate-600 dark:text-slate-300 truncate">{info?.label || sub}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-mono text-slate-500 text-xs">PE {pe}</span>
          {percentil != null && <span className="text-slate-400 text-xs">Pc {percentil}</span>}
        </div>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function IndiceCard({ idxDef, resultado }) {
  if (!resultado) return null;
  const { pc, percentil, clasificacion } = resultado;
  const colorClass = COLOR_INDICE[idxDef.color] || COLOR_INDICE.blue;

  return (
    <div className={`rounded-xl p-3 border ${clasificacion.bg} ${clasificacion.border}`}>
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 leading-tight">{idxDef.label}</p>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-black ${clasificacion.color}`}>{pc}</span>
        <span className="text-sm font-semibold text-slate-400">Pc {percentil}</span>
      </div>
      <p className={`text-xs font-semibold mt-0.5 ${clasificacion.color}`}>{clasificacion.label}</p>
    </div>
  );
}

function CITCard({ cit }) {
  if (!cit) return null;
  const { pc, percentil, clasificacion } = cit;
  return (
    <div className={`rounded-xl p-4 border-2 ${clasificacion.bg} ${clasificacion.border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
            CIT — Coeficiente Intelectual Total
          </p>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black ${clasificacion.color}`}>{pc}</span>
            <span className="text-base font-semibold text-slate-400">Pc {percentil}</span>
          </div>
          <p className={`text-sm font-bold mt-0.5 ${clasificacion.color}`}>{clasificacion.label}</p>
        </div>
        <div className="text-5xl opacity-20 select-none">🧠</div>
      </div>
    </div>
  );
}

function ParagrafoClinico({ texto }) {
  const [copiado, setCopiado] = useState(false);
  const [expandido, setExpandido] = useState(true);
  const copiar = useCallback(() => {
    navigator.clipboard.writeText(texto).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); });
  }, [texto]);
  return (
    <div className="border border-green-200 dark:border-green-800/40 rounded-xl overflow-hidden">
      <button onClick={() => setExpandido(v => !v)} className="w-full flex items-center justify-between px-4 py-3 bg-green-50 dark:bg-green-900/20 text-left">
        <span className="text-sm font-bold text-green-700 dark:text-green-400">Párrafo para informe</span>
        {expandido ? <ChevronUp size={15} className="text-green-500" /> : <ChevronDown size={15} className="text-green-500" />}
      </button>
      {expandido && (
        <div className="px-4 py-3 bg-white dark:bg-slate-900 space-y-3">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{texto}</p>
          <button onClick={copiar} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${copiado ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
            {copiado ? <Check size={13} /> : <Copy size={13} />}
            {copiado ? 'Copiado' : 'Copiar párrafo'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Tabs por índice ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'ICV', label: 'Comp. Verbal' },
  { id: 'IVE', label: 'Visoespacial' },
  { id: 'IRF', label: 'Raz. Fluido' },
  { id: 'IMT', label: 'Mem. Trabajo' },
  { id: 'IVP', label: 'Vel. Proc.' },
];

// ─── Componente principal ──────────────────────────────────────────────────────

const SCORES_INIT = Object.fromEntries(SUBTESTS_PRINCIPALES.map(s => [s.id, '']));

export default function WiscCorreccion({ nombrePaciente }) {
  const [anios,    setAnios]    = useState('');
  const [meses,    setMeses]    = useState('');
  const [scores,   setScores]   = useState(SCORES_INIT);
  const [tabActivo, setTabActivo] = useState('ICV');
  const [resultado, setResultado] = useState(null);

  const setScore = useCallback((id, val) => {
    setScores(prev => ({ ...prev, [id]: val }));
    setResultado(null);
  }, []);

  const calcular = () => {
    const calc = calcularWISC({ anios, meses, scores });
    if (!calc) return;
    const paragrafo = generarParagrafoWISC(calc, nombrePaciente);
    setResultado({ ...calc, paragrafo });
  };

  const limpiar = () => {
    setAnios(''); setMeses('');
    setScores(SCORES_INIT);
    setResultado(null);
  };

  const edadValida = anios !== '' && parseInt(anios) >= 6 && parseInt(anios) <= 16;
  const subtestsActivos = INDICES.find(i => i.id === tabActivo)?.subtests || [];
  const tieneScores = Object.values(scores).some(v => v !== '');

  // Cuántos subtests del tab activo ya tienen valor
  const completadosTab = subtestsActivos.filter(s => scores[s] !== '').length;

  return (
    <div className="space-y-5">
      {/* Nota */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40">
        <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-snug">
          Ingresá las PD de los 10 subtests principales para obtener el CIT. Podés calcular índices parciales si solo tenés algunos subtests.
        </p>
      </div>

      {/* Edad */}
      <div>
        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-2">Edad del niño/a</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Años (6–16)</label>
            <input type="number" min={6} max={16} value={anios}
              onChange={e => { setAnios(e.target.value); setResultado(null); }}
              placeholder="ej: 9"
              className="w-full px-3 py-2 rounded-lg border border-pink-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-center font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-teal-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Meses (0–11)</label>
            <input type="number" min={0} max={11} value={meses}
              onChange={e => { setMeses(e.target.value); setResultado(null); }}
              placeholder="ej: 4"
              className="w-full px-3 py-2 rounded-lg border border-pink-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-center font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-teal-500" />
          </div>
        </div>
      </div>

      {/* Tabs de índice */}
      <div>
        <div className="flex gap-1 overflow-x-auto pb-1 mb-3">
          {TABS.map(t => {
            const subs = INDICES.find(i => i.id === t.id)?.subtests || [];
            const done = subs.filter(s => scores[s] !== '').length;
            return (
              <button key={t.id}
                onClick={() => setTabActivo(t.id)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap
                  ${tabActivo === t.id
                    ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                {t.label}
                {done > 0 && (
                  <span className={`ml-1.5 text-xs ${done === 2 ? 'text-green-400' : 'text-amber-400'}`}>
                    {done}/2
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Subtests del tab activo */}
        <div className="grid grid-cols-1 gap-3">
          {subtestsActivos.map(subId => {
            const info = SUBTESTS_PRINCIPALES.find(s => s.id === subId);
            return (
              <NumInput
                key={subId}
                id={subId}
                label={info?.label || subId}
                max={info?.max || 99}
                value={scores[subId]}
                onChange={setScore}
                desc={info?.desc}
              />
            );
          })}
        </div>
      </div>

      {/* Progreso global */}
      {tieneScores && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${(Object.values(scores).filter(v => v !== '').length / 10) * 100}%` }}
            />
          </div>
          <span>{Object.values(scores).filter(v => v !== '').length}/10 subtests</span>
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-2">
        <button
          onClick={calcular}
          disabled={!edadValida || !tieneScores}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
        >
          Calcular y generar informe
        </button>
        {(tieneScores || resultado) && (
          <button onClick={limpiar} className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
            Limpiar
          </button>
        )}
      </div>

      {/* Resultados */}
      {resultado && (
        <div className="space-y-4 pt-1">
          {/* CIT */}
          {resultado.cit && <CITCard cit={resultado.cit} />}

          {!resultado.cit && (
            <div className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-xs text-amber-700 dark:text-amber-400">
              CIT no disponible — se necesitan los 10 subtests principales completos.
            </div>
          )}

          {/* Índices */}
          {Object.keys(resultado.resultadosIndices).length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Índices Primarios</p>
              <div className="grid grid-cols-2 gap-2">
                {INDICES.map(idx =>
                  resultado.resultadosIndices[idx.id] ? (
                    <IndiceCard key={idx.id} idxDef={idx} resultado={resultado.resultadosIndices[idx.id]} />
                  ) : null
                )}
              </div>
            </div>
          )}

          {/* Subtests */}
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Puntuaciones Escalares por Subtest</p>
            <div className="space-y-2">
              {SUBTESTS_PRINCIPALES.map(s =>
                resultado.resultadosSubtest[s.id] ? (
                  <BarraSubtest key={s.id} sub={s.id} resultado={resultado.resultadosSubtest[s.id]} />
                ) : null
              )}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              PE ≥ 12 = fortaleza · PE 8–11 = promedio · PE ≤ 7 = dificultad relativa
            </p>
          </div>

          <ParagrafoClinico texto={resultado.paragrafo} />
        </div>
      )}
    </div>
  );
}
