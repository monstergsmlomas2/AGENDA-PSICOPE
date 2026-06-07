import { useState, useCallback } from 'react';
import {
  Calculator, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle, Copy, Check, RotateCcw, Info,
} from 'lucide-react';
import {
  calcularCPM, calcularSPM, calcularAPM,
  escalaRecomendada, generarParagrafoClinico,
} from '../../data/ravenCalculator';

// ---------------------------------------------------------------------------
// Helpers UI
// ---------------------------------------------------------------------------

function NumInput({ label, value, onChange, min = 0, max, small }) {
  return (
    <div className={`flex flex-col gap-1 ${small ? 'w-20' : 'w-full'}`}>
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-tight">
        {label}
        {max !== undefined && <span className="font-normal text-slate-400"> / {max}</span>}
      </label>
      <input
        type="number"
        min={min}
        max={max}
        value={value === '' ? '' : value}
        onChange={e => {
          const v = e.target.value === '' ? '' : Math.min(max ?? 999, Math.max(min, parseInt(e.target.value) || 0));
          onChange(v);
        }}
        className="w-full px-3 py-2 rounded-lg border border-pink-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none focus:border-pink-400 dark:focus:border-teal-500 focus:ring-2 focus:ring-pink-200 dark:focus:ring-teal-900 text-center font-bold"
      />
    </div>
  );
}

function EdadInput({ anios, meses, onAnios, onMeses }) {
  return (
    <div className="flex gap-3 items-end">
      <NumInput label="Edad — años" value={anios} onChange={onAnios} min={0} max={99} />
      <NumInput label="Meses" value={meses} onChange={onMeses} min={0} max={11} />
    </div>
  );
}

function PercentilGauge({ percentil, grado }) {
  const angulo = (percentil / 100) * 180 - 90; // -90° (Pc0) a 90° (Pc100)
  const colorNeedle = percentil >= 75 ? '#7c3aed' : percentil >= 25 ? '#16a34a' : '#dc2626';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-40 h-20 overflow-hidden select-none">
        {/* Semicírculo de fondo con gradiente */}
        <svg viewBox="0 0 160 80" className="w-full h-full">
          {/* Arcos de color */}
          <path d="M 10 80 A 70 70 0 0 1 30.5 27.3" fill="none" stroke="#dc2626" strokeWidth="14" strokeLinecap="butt" />
          <path d="M 30.5 27.3 A 70 70 0 0 1 60.3 10.6" fill="none" stroke="#f97316" strokeWidth="14" strokeLinecap="butt" />
          <path d="M 60.3 10.6 A 70 70 0 0 1 99.7 10.6" fill="none" stroke="#16a34a" strokeWidth="14" strokeLinecap="butt" />
          <path d="M 99.7 10.6 A 70 70 0 0 1 129.5 27.3" fill="none" stroke="#3b82f6" strokeWidth="14" strokeLinecap="butt" />
          <path d="M 129.5 27.3 A 70 70 0 0 1 150 80" fill="none" stroke="#7c3aed" strokeWidth="14" strokeLinecap="butt" />
          {/* Aguja */}
          <line
            x1="80" y1="80"
            x2={80 + 55 * Math.cos(((angulo - 90) * Math.PI) / 180)}
            y2={80 + 55 * Math.sin(((angulo - 90) * Math.PI) / 180)}
            stroke={colorNeedle}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="80" cy="80" r="5" fill={colorNeedle} />
        </svg>
      </div>
      <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">{percentil}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">Percentil</p>
      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${grado.bg} ${grado.color} ${grado.border}`}>
        Grado {grado.grado} — {grado.label}
      </span>
    </div>
  );
}

function ConjuntoBar({ nombre, pd, maxPd }) {
  const pct = maxPd > 0 ? Math.round((pd / maxPd) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 dark:text-slate-400 w-24 shrink-0">{nombre}</span>
      <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-pink-400 dark:bg-teal-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-12 text-right shrink-0">
        {pd} / {maxPd}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formulario CPM
// ---------------------------------------------------------------------------
function FormCPM({ onCalc }) {
  const [anios, setAnios] = useState('');
  const [meses, setMeses] = useState('');
  const [pdA, setPdA] = useState('');
  const [pdAb, setPdAb] = useState('');
  const [pdB, setPdB] = useState('');

  const edad = anios !== '' ? (Number(anios) + (Number(meses) || 0) / 12) : null;
  const pdTotal = (Number(pdA) || 0) + (Number(pdAb) || 0) + (Number(pdB) || 0);
  const listo = edad !== null && edad >= 4.5 && (Number(pdA) || 0) + (Number(pdAb) || 0) + (Number(pdB) || 0) > 0;

  function handleCalc() {
    if (!listo) return;
    const res = calcularCPM({ edadDecimal: edad, pdA: Number(pdA)||0, pdAb: Number(pdAb)||0, pdB: Number(pdB)||0 });
    onCalc(res, anios, meses);
  }

  return (
    <div className="space-y-5">
      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 text-xs text-blue-700 dark:text-blue-300 flex gap-2">
        <Info size={14} className="shrink-0 mt-0.5" />
        <span>CPM – 3 conjuntos (A, Ab, B), 12 ítems cada uno. Total máximo: <strong>36 puntos</strong>.</span>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Edad del niño</p>
        <EdadInput anios={anios} meses={meses} onAnios={setAnios} onMeses={setMeses} />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Puntuaciones por conjunto</p>
        <div className="grid grid-cols-3 gap-3">
          <NumInput label="Conjunto A" value={pdA} onChange={setPdA} max={12} />
          <NumInput label="Conjunto Ab" value={pdAb} onChange={setPdAb} max={12} />
          <NumInput label="Conjunto B" value={pdB} onChange={setPdB} max={12} />
        </div>
        {(Number(pdA)||0) + (Number(pdAb)||0) + (Number(pdB)||0) > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-right">
            Total: <strong className="text-slate-900 dark:text-white">{pdTotal}</strong> / 36
          </p>
        )}
      </div>
      <button
        onClick={handleCalc}
        disabled={!listo}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-pink-500 dark:bg-teal-500 text-white font-bold text-sm hover:bg-pink-600 dark:hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Calculator size={16} />
        Calcular percentil
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formulario SPM
// ---------------------------------------------------------------------------
function FormSPM({ onCalc }) {
  const [anios, setAnios] = useState('');
  const [meses, setMeses] = useState('');
  const [pdA, setPdA] = useState('');
  const [pdB, setPdB] = useState('');
  const [pdC, setPdC] = useState('');
  const [pdD, setPdD] = useState('');
  const [pdE, setPdE] = useState('');

  const edad = anios !== '' ? (Number(anios) + (Number(meses) || 0) / 12) : null;
  const pdTotal = (Number(pdA)||0)+(Number(pdB)||0)+(Number(pdC)||0)+(Number(pdD)||0)+(Number(pdE)||0);
  const listo = edad !== null && edad >= 5.5 && pdTotal > 0;

  function handleCalc() {
    if (!listo) return;
    const res = calcularSPM({
      edadDecimal: edad,
      pdA: Number(pdA)||0, pdB: Number(pdB)||0, pdC: Number(pdC)||0,
      pdD: Number(pdD)||0, pdE: Number(pdE)||0,
    });
    onCalc(res, anios, meses);
  }

  return (
    <div className="space-y-5">
      <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/40 text-xs text-green-700 dark:text-green-300 flex gap-2">
        <Info size={14} className="shrink-0 mt-0.5" />
        <span>SPM – 5 conjuntos (A–E), 12 ítems cada uno. Total máximo: <strong>60 puntos</strong>.</span>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Edad del evaluado</p>
        <EdadInput anios={anios} meses={meses} onAnios={setAnios} onMeses={setMeses} />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Puntuaciones por conjunto</p>
        <div className="grid grid-cols-5 gap-2">
          <NumInput label="A" value={pdA} onChange={setPdA} max={12} />
          <NumInput label="B" value={pdB} onChange={setPdB} max={12} />
          <NumInput label="C" value={pdC} onChange={setPdC} max={12} />
          <NumInput label="D" value={pdD} onChange={setPdD} max={12} />
          <NumInput label="E" value={pdE} onChange={setPdE} max={12} />
        </div>
        {pdTotal > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-right">
            Total: <strong className="text-slate-900 dark:text-white">{pdTotal}</strong> / 60
          </p>
        )}
      </div>
      <button
        onClick={handleCalc}
        disabled={!listo}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-pink-500 dark:bg-teal-500 text-white font-bold text-sm hover:bg-pink-600 dark:hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Calculator size={16} />
        Calcular percentil
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formulario APM
// ---------------------------------------------------------------------------
function FormAPM({ onCalc }) {
  const [anios, setAnios] = useState('');
  const [meses, setMeses] = useState('');
  const [pdSetII, setPdSetII] = useState('');

  const edad = anios !== '' ? (Number(anios) + (Number(meses) || 0) / 12) : null;
  const listo = edad !== null && edad >= 14 && Number(pdSetII) > 0;

  function handleCalc() {
    if (!listo) return;
    const res = calcularAPM({ edadDecimal: edad, pdSetII: Number(pdSetII) });
    onCalc(res, anios, meses);
  }

  return (
    <div className="space-y-5">
      <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800/40 text-xs text-violet-700 dark:text-violet-300 flex gap-2">
        <Info size={14} className="shrink-0 mt-0.5" />
        <span>APM – Se puntúa solo el <strong>Set II</strong> (36 ítems). El Set I es práctica. Para adultos de nivel intelectual superior.</span>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Edad del evaluado</p>
        <EdadInput anios={anios} meses={meses} onAnios={setAnios} onMeses={setMeses} />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Puntuación Set II</p>
        <NumInput label="Aciertos Set II" value={pdSetII} onChange={setPdSetII} max={36} />
      </div>
      <button
        onClick={handleCalc}
        disabled={!listo}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-pink-500 dark:bg-teal-500 text-white font-bold text-sm hover:bg-pink-600 dark:hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Calculator size={16} />
        Calcular percentil
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel de resultados
// ---------------------------------------------------------------------------
function PanelResultados({ resultado, nombrePaciente, onReset }) {
  const [copiado, setCopiado] = useState(false);
  const [verDiscrepancias, setVerDiscrepancias] = useState(false);

  const parrafo = generarParagrafoClinico(resultado, nombrePaciente);

  const copiar = useCallback(() => {
    navigator.clipboard.writeText(parrafo).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }, [parrafo]);

  return (
    <div className="space-y-5">
      {/* Encabezado resultado */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{resultado.escalaLabel}</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">{resultado.grupoLabel}</p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <RotateCcw size={13} />
          Nueva corrección
        </button>
      </div>

      {/* Gauge percentil */}
      <div className="flex justify-center py-2">
        <PercentilGauge percentil={resultado.percentil} grado={resultado.grado} />
      </div>

      {/* Resumen PD */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2.5">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Perfil por conjuntos</p>
        {resultado.conjuntos.map(c => (
          <ConjuntoBar key={c.nombre} nombre={c.nombre} pd={c.pd} maxPd={c.maxPd} />
        ))}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">TOTAL</span>
          <span className="text-sm font-black text-slate-900 dark:text-white">{resultado.pdTotal} / {resultado.pdMax}</span>
        </div>
      </div>

      {/* Advertencia de consistencia */}
      {!resultado.consistencia.consistente && (
        <div className="flex gap-2 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-700 text-xs text-orange-700 dark:text-orange-300">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>{resultado.consistencia.advertencia}</span>
        </div>
      )}

      {/* Discrepancias (desplegable) */}
      {resultado.discrepancias && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => setVerDiscrepancias(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              {resultado.consistencia.consistente
                ? <CheckCircle size={13} className="text-green-500" />
                : <AlertTriangle size={13} className="text-orange-500" />}
              Análisis de consistencia interna
            </span>
            {verDiscrepancias ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {verDiscrepancias && (
            <div className="p-4 space-y-2">
              <div className="grid grid-cols-4 gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
                <span>Conjunto</span><span className="text-center">Obtenido</span>
                <span className="text-center">Esperado</span><span className="text-center">Discrepancia</span>
              </div>
              {resultado.discrepancias.map(d => (
                <div key={d.conjunto} className="grid grid-cols-4 gap-1 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{d.conjunto}</span>
                  <span className="text-center">{d.obtenido}</span>
                  <span className="text-center">{d.esperado}</span>
                  <span className={`text-center font-bold ${Math.abs(d.discrepancia) > 2 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {d.discrepancia > 0 ? `+${d.discrepancia}` : d.discrepancia}
                  </span>
                </div>
              ))}
              <p className="text-xs text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                Discrepancia {'>'} 2 puntos indica posible inconsistencia (criterio Raven, 1996).
              </p>
            </div>
          )}
        </div>
      )}

      {/* Párrafo clínico */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Párrafo para informe</p>
          <button
            onClick={copiar}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${copiado ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            {copiado ? <Check size={12} /> : <Copy size={12} />}
            {copiado ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>
        <div className="relative">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            {parrafo}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal exportado
// ---------------------------------------------------------------------------

const ESCALAS = [
  { id: 'CPM', label: 'CPM – Color', sublabel: '5 a 11 años', color: 'blue' },
  { id: 'SPM', label: 'SPM – General', sublabel: '6 años en adelante', color: 'green' },
  { id: 'APM', label: 'APM – Avanzada', sublabel: '14 años / nivel superior', color: 'violet' },
];

export default function RavenCorreccion({ nombrePaciente, edadPaciente }) {
  const [escalaSeleccionada, setEscalaSeleccionada] = useState(() => {
    if (!edadPaciente) return 'SPM';
    return escalaRecomendada(edadPaciente) || 'SPM';
  });
  const [resultado, setResultado] = useState(null);

  function handleCalc(res) {
    setResultado(res);
  }

  return (
    <div className="space-y-5">
      {/* Selector de escala */}
      {!resultado && (
        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Versión del test</p>
          <div className="grid grid-cols-3 gap-2">
            {ESCALAS.map(e => (
              <button
                key={e.id}
                onClick={() => setEscalaSeleccionada(e.id)}
                className={`flex flex-col items-center text-center px-2 py-3 rounded-xl border text-xs font-semibold transition-all ${escalaSeleccionada === e.id
                  ? 'bg-pink-50 dark:bg-teal-900/20 border-pink-400 dark:border-teal-500 text-pink-700 dark:text-teal-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <span className="font-bold">{e.label}</span>
                <span className="font-normal text-slate-400 dark:text-slate-500 text-[11px] leading-tight mt-0.5">{e.sublabel}</span>
              </button>
            ))}
          </div>
          {edadPaciente && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
              <Info size={11} />
              Para {Math.floor(edadPaciente)} años se recomienda: <strong>{escalaRecomendada(edadPaciente)}</strong>
            </p>
          )}
        </div>
      )}

      {/* Formulario según escala */}
      {!resultado && escalaSeleccionada === 'CPM' && <FormCPM onCalc={handleCalc} />}
      {!resultado && escalaSeleccionada === 'SPM' && <FormSPM onCalc={handleCalc} />}
      {!resultado && escalaSeleccionada === 'APM' && <FormAPM onCalc={handleCalc} />}

      {/* Resultado */}
      {resultado && (
        <PanelResultados
          resultado={resultado}
          nombrePaciente={nombrePaciente}
          onReset={() => setResultado(null)}
        />
      )}
    </div>
  );
}
