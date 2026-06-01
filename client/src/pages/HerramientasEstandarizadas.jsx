import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Search, Users } from 'lucide-react';
import { CATEGORIAS_TESTS } from '../data/testsEstandarizados';
import TestModal from '../components/TestModal';

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50 dark:bg-blue-900/10',   border: 'border-blue-200 dark:border-blue-800/40',   badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',   title: 'text-blue-700 dark:text-blue-300',   dot: 'bg-blue-500' },
  green:  { bg: 'bg-green-50 dark:bg-green-900/10', border: 'border-green-200 dark:border-green-800/40', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', title: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/10',border: 'border-purple-200 dark:border-purple-800/40',badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',title: 'text-purple-700 dark:text-purple-300',dot: 'bg-purple-500' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/10',border: 'border-orange-200 dark:border-orange-800/40',badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',title: 'text-orange-700 dark:text-orange-300',dot: 'bg-orange-500' },
  red:    { bg: 'bg-red-50 dark:bg-red-900/10',     border: 'border-red-200 dark:border-red-800/40',     badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',     title: 'text-red-700 dark:text-red-300',     dot: 'bg-red-500' },
  pink:   { bg: 'bg-pink-50 dark:bg-pink-900/10',   border: 'border-pink-200 dark:border-pink-800/40',   badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',   title: 'text-pink-700 dark:text-pink-300',   dot: 'bg-pink-500' },
  teal:   { bg: 'bg-teal-50 dark:bg-teal-900/10',   border: 'border-teal-200 dark:border-teal-800/40',   badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',   title: 'text-teal-700 dark:text-teal-300',   dot: 'bg-teal-500' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/10', border: 'border-yellow-200 dark:border-yellow-800/40', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', title: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/10', border: 'border-indigo-200 dark:border-indigo-800/40', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300', title: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
};

function edadLabel(min, max) {
  const fmt = (v) => {
    if (v === 0) return '0';
    if (Number.isInteger(v)) return `${v} a`;
    return `${v} a`;
  };
  if (max >= 80) return `${fmt(min)}+`;
  return `${fmt(min)} – ${fmt(max)} a`;
}

function TestCard({ test, colorKey, onOpen }) {
  const c = COLOR_MAP[colorKey];
  return (
    <button
      onClick={() => onOpen(test, colorKey)}
      className={`w-full text-left rounded-xl border ${c.border} ${c.bg} p-4 space-y-2 hover:shadow-md hover:scale-[1.01] transition-all duration-150 cursor-pointer`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`font-bold text-sm ${c.title}`}>{test.nombre}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{test.nombreCompleto}</p>
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${c.badge} flex items-center gap-1`}>
          <Users size={11} />
          {edadLabel(test.edadMin, test.edadMax)}
        </span>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">{test.descripcion}</p>
      <p className={`text-xs font-semibold ${c.title} opacity-70`}>Ver detalle →</p>
    </button>
  );
}

function CategoriaSection({ categoria, defaultOpen, onOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const c = COLOR_MAP[categoria.color];

  return (
    <div className={`rounded-2xl border ${c.border} overflow-hidden`}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-5 py-4 ${c.bg} transition-colors`}
      >
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${c.dot} shrink-0`} />
          <span className={`font-bold text-sm ${c.title}`}>{categoria.label}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
            {categoria.tests.length} test{categoria.tests.length !== 1 ? 's' : ''}
          </span>
        </div>
        {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
      </button>
      {open && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-white dark:bg-slate-950/50">
          {categoria.tests.map(t => (
            <TestCard key={t.id} test={t} colorKey={categoria.color} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HerramientasEstandarizadas() {
  const [query, setQuery] = useState('');
  const [modalTest, setModalTest] = useState(null);
  const [modalColor, setModalColor] = useState('blue');

  const totalTests = CATEGORIAS_TESTS.reduce((acc, c) => acc + c.tests.length, 0);

  const categoriasFiltradas = query.trim()
    ? CATEGORIAS_TESTS.map(cat => ({
        ...cat,
        tests: cat.tests.filter(t =>
          t.nombre.toLowerCase().includes(query.toLowerCase()) ||
          t.nombreCompleto.toLowerCase().includes(query.toLowerCase()) ||
          t.descripcion.toLowerCase().includes(query.toLowerCase())
        ),
      })).filter(cat => cat.tests.length > 0)
    : CATEGORIAS_TESTS;

  function handleOpen(test, colorKey) {
    setModalTest(test);
    setModalColor(colorKey);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-pink-100 dark:bg-teal-500/10 p-2.5 rounded-xl">
            <BookOpen size={22} className="text-pink-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Herramientas Estandarizadas</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{totalTests} tests psicopedagógicos en {CATEGORIAS_TESTS.length} categorías</p>
          </div>
        </div>
        {/* Buscador */}
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar test..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-pink-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none focus:border-pink-400 dark:focus:border-teal-500"
          />
        </div>
      </div>

      {/* Categorías */}
      {categoriasFiltradas.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-600">
          <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No se encontraron tests para "{query}"</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categoriasFiltradas.map((cat, i) => (
            <CategoriaSection
              key={cat.id}
              categoria={cat}
              defaultOpen={i === 0 || !!query.trim()}
              onOpen={handleOpen}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalTest && (
        <TestModal
          test={modalTest}
          colorKey={modalColor}
          onClose={() => setModalTest(null)}
        />
      )}
    </div>
  );
}
