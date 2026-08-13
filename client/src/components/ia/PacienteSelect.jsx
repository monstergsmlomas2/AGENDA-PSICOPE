import { ChevronDown } from 'lucide-react';

/**
 * Selector de paciente usado por las herramientas del Panel de IA.
 */
export default function PacienteSelect({ pacientes, value, onChange, placeholder = 'Seleccioná un paciente' }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none bg-white dark:bg-slate-900 border border-pink-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-teal-500 pr-10"
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
