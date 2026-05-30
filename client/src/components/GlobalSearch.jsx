import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPacientes } from '../services/pacientesService';

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pacientes, setPacientes] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cargado, setCargado] = useState(false);

  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Cargar pacientes una sola vez al abrir el modal
  useEffect(() => {
    if (open && !cargado) {
      getPacientes().then((data) => {
        setPacientes(Array.isArray(data) ? data : []);
        setCargado(true);
      });
    }
  }, [open, cargado]);

  // Resetear índice y query al abrir
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      // Foco en el input después de que se renderice
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Listener global para Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Filtrar pacientes en cliente
  const resultados = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return pacientes.filter((p) => {
      const nombre = `${p.nombre} ${p.apellido}`.toLowerCase();
      const apellidoNombre = `${p.apellido} ${p.nombre}`.toLowerCase();
      const dni = (p.dni || '').toLowerCase();
      const telefono = (p.telefono || '').toLowerCase();
      return (
        nombre.includes(q) ||
        apellidoNombre.includes(q) ||
        dni.includes(q) ||
        telefono.includes(q)
      );
    }).slice(0, 8);
  }, [query, pacientes]);

  const handleSelect = (id) => {
    setOpen(false);
    navigate(`/pacientes/${id}`);
  };

  const handleKeyDown = (e) => {
    if (resultados.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % resultados.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + resultados.length) % resultados.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const seleccionado = resultados[selectedIndex];
      if (seleccionado) handleSelect(seleccionado.id);
    }
  };

  // Mantener selectedIndex en rango cuando cambian los resultados
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  const isMac = navigator.platform.toUpperCase().includes('MAC');

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full mx-auto mt-20 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Input ─── */}
        <div className="flex items-center gap-3 px-4 border-b border-pink-200 dark:border-slate-700">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar paciente por nombre, DNI o teléfono…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full py-3 text-base bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg hover:bg-pink-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── Shortcut hint ─── */}
        {!query.trim() && (
          <div className="px-4 py-3 text-xs text-slate-400 text-center">
            Escribí para buscar.{' '}
            <span className="font-semibold text-slate-500 dark:text-slate-500">
              {isMac ? '⌘K' : 'Ctrl+K'} para abrir / cerrar
            </span>
          </div>
        )}

        {/* ─── Resultados ─── */}
        {query.trim() && (
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {resultados.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-500 dark:text-slate-400 font-medium">
                Sin resultados para <span className="font-bold">'{query}'</span>
              </div>
            ) : (
              resultados.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-left ${
                    i === selectedIndex
                      ? 'bg-pink-100 dark:bg-teal-500/10 border border-pink-400 dark:border-teal-500/50'
                      : 'border border-transparent hover:bg-pink-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-white text-sm capitalize truncate">
                      {p.apellido}, {p.nombre}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {p.dni && <span>DNI: {p.dni}</span>}
                      {p.dni && p.obra_social_nombre && <span> • </span>}
                      {p.obra_social_nombre && <span>{p.obra_social_nombre}</span>}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
