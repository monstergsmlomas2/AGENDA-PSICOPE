import { useState } from 'react';
import { X, ExternalLink, Download, Users, BookOpen, Calculator, ArrowLeft } from 'lucide-react';
import RavenCorreccion from './correctores/RavenCorreccion';
import ProlecCorreccion from './correctores/ProlecCorreccion';
import VmiCorreccion from './correctores/VmiCorreccion';
import WiscCorreccion from './correctores/WiscCorreccion';

const CORRECTORES = {
  raven:  RavenCorreccion,
  prolec: ProlecCorreccion,
  vmi:    VmiCorreccion,
  wisc5:  WiscCorreccion,
};

function edadLabel(min, max) {
  const fmt = v => (v === 0 ? '0' : `${v}`);
  if (max >= 80) return `${fmt(min)} años en adelante`;
  return `${fmt(min)} – ${fmt(max)} años`;
}

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200 dark:border-blue-800/40', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', title: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  green:  { bg: 'bg-green-50 dark:bg-green-900/10', border: 'border-green-200 dark:border-green-800/40', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', title: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/10', border: 'border-purple-200 dark:border-purple-800/40', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', title: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/10', border: 'border-orange-200 dark:border-orange-800/40', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', title: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  red:    { bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-200 dark:border-red-800/40', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', title: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  pink:   { bg: 'bg-pink-50 dark:bg-pink-900/10', border: 'border-pink-200 dark:border-pink-800/40', badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300', title: 'text-pink-700 dark:text-pink-300', dot: 'bg-pink-500' },
  teal:   { bg: 'bg-teal-50 dark:bg-teal-900/10', border: 'border-teal-200 dark:border-teal-800/40', badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300', title: 'text-teal-700 dark:text-teal-300', dot: 'bg-teal-500' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/10', border: 'border-yellow-200 dark:border-yellow-800/40', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', title: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/10', border: 'border-indigo-200 dark:border-indigo-800/40', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300', title: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
};

export default function TestModal({ test, colorKey, onClose }) {
  const [modoCorreccion, setModoCorreccion] = useState(false);
  if (!test) return null;
  const c = COLOR_MAP[colorKey] || COLOR_MAP.blue;
  const Corrector = CORRECTORES[test.id];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header con color de categoría */}
        <div className={`${c.bg} ${c.border} border-b rounded-t-2xl px-6 py-5`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {modoCorreccion && (
                <button
                  onClick={() => setModoCorreccion(false)}
                  className="mt-0.5 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800 transition-colors shrink-0"
                  title="Volver al detalle del test"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              {!modoCorreccion && <div className={`mt-0.5 w-3 h-3 rounded-full ${c.dot} shrink-0`} />}
              <div>
                <h2 className={`text-xl font-black ${c.title}`}>{test.nombre}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {modoCorreccion ? 'Corrección automática de resultados' : test.nombreCompleto}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Rango de edad */}
          {!modoCorreccion && (
            <div className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${c.badge}`}>
              <Users size={12} />
              {edadLabel(test.edadMin, test.edadMax)}
            </div>
          )}
        </div>

        {/* Modo corrección */}
        {modoCorreccion && Corrector ? (
          <div className="px-6 py-5">
            <Corrector />
          </div>
        ) : (
        <>
        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Descripción */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={14} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Descripción</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{test.descripcion}</p>
          </div>

          {/* Corrección automática disponible */}
          {Corrector && (
            <button
              onClick={() => setModoCorreccion(true)}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${c.badge} hover:opacity-80`}
            >
              <Calculator size={15} />
              Corregir resultados y generar percentil
            </button>
          )}

          {/* Corrección automática planificada pero aún no disponible */}
          {!Corrector && test.corregible && (
            <div className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
              <Calculator size={15} />
              Corrección automática: próximamente
            </div>
          )}

          {/* Áreas que evalúa — keywords como chips */}
          {test.keywords && test.keywords.length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Áreas relacionadas</span>
              <div className="flex flex-wrap gap-1.5">
                {test.keywords.map(kw => (
                  <span key={kw} className={`text-xs px-2.5 py-1 rounded-full font-medium ${c.badge}`}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
          {test.urlDescarga ? (
            <a
              href={test.urlDescarga}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-colors"
            >
              <Download size={15} />
              Descargar materiales
            </a>
          ) : (
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 font-semibold text-sm cursor-not-allowed"
              title="No hay materiales de descarga disponibles"
            >
              <Download size={15} />
              Sin descarga disponible
            </button>
          )}

          {test.urlOficial ? (
            <a
              href={test.urlOficial}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors ${c.badge} hover:opacity-80`}
            >
              <ExternalLink size={15} />
              Web oficial
            </a>
          ) : (
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 font-semibold text-sm cursor-not-allowed"
              title="No hay web oficial registrada"
            >
              <ExternalLink size={15} />
              Sin web oficial
            </button>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
}
