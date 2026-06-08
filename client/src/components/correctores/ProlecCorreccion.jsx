import { useState, useCallback } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { calcularProlec, analizarProcesos, generarParagrafoClinico } from '../../data/prolecCalculator.js';
import { CURSOS, PD_MAX, PROCESOS } from '../../data/prolecNormas.js';

// ─── Subcomponentes ────────────────────────────────────────────────────────────

function NumInput({ label, id, max, value, onChange, descripcion }) {
  const val = value === '' ? '' : Number(value);
  const invalid = val !== '' && (val < 0 || val > max);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
        {label}
        <span className="ml-1 font-normal text-slate-400 normal-case tracking-normal">/{max}</span>
      </label>
      {descripcion && (
        <p className="text-xs text-slate-400 dark:text-slate-500 -mt-0.5">{descripcion}</p>
      )}
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

function CategoriaChip({ categoria }) {
  if (!categoria) return null;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${categoria.bg} ${categoria.color} ${categoria.border}`}>
      {categoria.label}
    </span>
  );
}

function BarraSubtest({ label, resultado }) {
  if (!resultado) return null;
  const { pd, max, porcentaje, categoria } = resultado;
  const colors = {
    NA: 'bg-emerald-500',
    N:  'bg-blue-500',
    DL: 'bg-amber-400',
    D:  'bg-red-500',
  };
  const barColor = colors[resultado.categoriaId] || 'bg-slate-400';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600 dark:text-slate-300">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-500">{pd}/{max}</span>
          <CategoriaChip categoria={categoria} />
        </div>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}

function IndiceGlobal({ indiceGlobal, indiceGlobalId }) {
  if (!indiceGlobal) return null;
  const iconColor = {
    NA: '🟢', N: '🔵', DL: '🟡', D: '🔴',
  }[indiceGlobalId] || '⚪';

  return (
    <div className={`rounded-xl p-4 border ${indiceGlobal.bg} ${indiceGlobal.border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
            Índice Lector Global
          </p>
          <p className={`text-xl font-black ${indiceGlobal.color}`}>
            {iconColor} {indiceGlobal.label}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight max-w-[160px]">
            Basado en perfil<br />de los 7 subtests
          </p>
        </div>
      </div>
    </div>
  );
}

function PanelProcesos({ resultados }) {
  const procesos = analizarProcesos(resultados);
  if (procesos.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        Perfil por Proceso Lector
      </p>
      {procesos.map(proc => (
        <div key={proc.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${proc.categoria.bg} ${proc.categoria.border}`}>
          <span className={`text-sm font-semibold ${proc.categoria.color}`}>{proc.label}</span>
          <CategoriaChip categoria={proc.categoria} />
        </div>
      ))}
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
        <span className="text-sm font-bold text-green-700 dark:text-green-400">
          Párrafo para informe
        </span>
        {expandido ? <ChevronUp size={15} className="text-green-500" /> : <ChevronDown size={15} className="text-green-500" />}
      </button>
      {expandido && (
        <div className="px-4 py-3 bg-white dark:bg-slate-900 space-y-3">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {texto}
          </p>
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

const SUBTESTS_INFO = [
  { id: 'NC',  label: 'NC — Nombre/Sonido de Letras',      desc: 'Identificar letra y decir su nombre o sonido' },
  { id: 'IG',  label: 'IG — Igual-Diferente',              desc: 'Decidir si dos cadenas de letras son iguales o diferentes' },
  { id: 'LP',  label: 'LP — Lectura de Palabras',          desc: 'Leer en voz alta una lista de palabras' },
  { id: 'PS',  label: 'PS — Lectura de Pseudopalabras',    desc: 'Leer en voz alta pseudopalabras (no palabras reales)' },
  { id: 'EST', label: 'EST — Estructuras Sintácticas',     desc: 'Comprender estructuras gramaticales complejas' },
  { id: 'SIG', label: 'SIG — Signos de Puntuación',        desc: 'Respetar los signos de puntuación al leer' },
  { id: 'CO',  label: 'CO — Comprensión Oral',             desc: 'Responder preguntas sobre textos escuchados' },
];

export default function ProlecCorreccion({ nombrePaciente }) {
  const [grado, setGrado] = useState('');
  const [scores, setScores] = useState({ NC: '', IG: '', LP: '', PS: '', EST: '', SIG: '', CO: '' });
  const [resultado, setResultado] = useState(null);

  const setScore = useCallback((id, val) => {
    setScores(prev => ({ ...prev, [id]: val }));
    setResultado(null);
  }, []);

  const calcular = () => {
    if (!grado) return;
    const calc = calcularProlec({ grado: parseInt(grado), ...scores });
    const cursoLabel = CURSOS.find(c => c.id === grado)?.label || '';
    const paragrafo = generarParagrafoClinico(calc, nombrePaciente, cursoLabel);
    setResultado({ ...calc, paragrafo, cursoLabel });
  };

  const limpiar = () => {
    setScores({ NC: '', IG: '', LP: '', PS: '', EST: '', SIG: '', CO: '' });
    setResultado(null);
    setGrado('');
  };

  const tieneScores = Object.values(scores).some(v => v !== '');
  const gradoValido = !!grado;

  return (
    <div className="space-y-5">
      {/* Selector de curso */}
      <div>
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-2">
          Curso escolar
        </label>
        <select
          value={grado}
          onChange={e => { setGrado(e.target.value); setResultado(null); }}
          className="w-full px-3 py-2 rounded-lg border border-pink-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-teal-500"
        >
          <option value="">Seleccionar curso…</option>
          {CURSOS.map(c => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Grid de subtests */}
      <div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Puntuaciones directas (aciertos)
        </p>
        <div className="grid grid-cols-2 gap-3">
          {SUBTESTS_INFO.map(s => (
            <NumInput
              key={s.id}
              id={s.id}
              label={s.label}
              max={PD_MAX[s.id]}
              value={scores[s.id]}
              onChange={setScore}
              descripcion={s.desc}
            />
          ))}
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-2">
        <button
          onClick={calcular}
          disabled={!gradoValido || !tieneScores}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
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
        <div className="space-y-4 pt-1">
          <IndiceGlobal
            indiceGlobal={resultado.indiceGlobal}
            indiceGlobalId={resultado.indiceGlobalId}
          />

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Resultados por subtest
            </p>
            {SUBTESTS_INFO.map(s => (
              resultado.resultados[s.id] && (
                <BarraSubtest
                  key={s.id}
                  label={s.label}
                  resultado={resultado.resultados[s.id]}
                />
              )
            ))}
          </div>

          <PanelProcesos resultados={resultado.resultados} />

          <ParagrafoClinico texto={resultado.paragrafo} />
        </div>
      )}

      {resultado && Object.keys(resultado.resultados).length === 0 && (
        <p className="text-sm text-center text-slate-400 py-4">
          Ingresá al menos un subtest para ver resultados.
        </p>
      )}
    </div>
  );
}
