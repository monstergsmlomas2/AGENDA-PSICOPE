import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, Building, ShieldCheck,
  FileText, DollarSign, Brain, Settings, Sun, Moon,
} from 'lucide-react';

const navItems = [
  {
    label: 'Dashboard',
    to: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Pacientes',
    to: '/pacientes',
    icon: Users,
  },
  {
    label: 'Turnos',
    to: '/turnos',
    icon: Calendar,
  },
];

const gestionItems = [
  {
    label: 'Obras Sociales',
    to: '/obras-sociales',
    icon: ShieldCheck,
  },
  {
    label: 'Consultorios',
    to: '/consultorios',
    icon: Building,
  },
  {
    label: 'Pagos',
    to: '/pagos',
    icon: DollarSign,
  },
  {
    label: 'Informes',
    to: '/informes',
    icon: FileText,
  },
];

function NavItem({ item }) {
  const Icono = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        `group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
          isActive
            ? 'bg-pink-300 text-black shadow-sm shadow-pink-300/30 dark:bg-teal-500/10 dark:text-teal-400 dark:shadow-teal-500/5'
            : 'text-slate-900 hover:text-black hover:bg-pink-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Indicador activo */}
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-pink-500 rounded-full shadow-sm shadow-pink-500/50 dark:bg-teal-400 dark:shadow-teal-400/50" />
          )}

          <span
            className={`shrink-0 transition-all duration-200 ${
              isActive
                ? 'text-pink-600 dark:text-teal-400'
                : 'text-slate-900 group-hover:text-pink-600 dark:text-slate-500 dark:group-hover:text-slate-300'
            }`}
          >
            <Icono size={17} />
          </span>

          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ darkMode, toggleDarkMode }) {
  return (
    <aside className="w-52 flex flex-col h-screen shrink-0 bg-purple-100 dark:bg-slate-950 border-r border-pink-200 dark:border-slate-800 transition-colors duration-300">
      {/* ─── Logo ─── */}
      <div className="p-4 border-b border-pink-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="bg-pink-300/40 dark:bg-teal-500/15 p-1.5 rounded-xl shadow-sm shadow-pink-300/20 dark:shadow-teal-500/10">
            <Brain size={22} className="text-pink-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight leading-tight">
              <span className="text-black dark:text-white">Agenda</span>
              <span className="text-pink-600 dark:text-teal-400">Psicope</span>
            </h1>
            <p className="text-[9px] font-medium text-slate-900 uppercase tracking-widest mt-0.5">
              Sistema de Gestión
            </p>
          </div>
        </div>
      </div>

      {/* ─── Navegación ─── */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar">
        {/* Menú Principal */}
        <div className="mb-1">
          <p className="px-3 py-1.5 text-[10px] font-bold text-slate-900 uppercase tracking-[0.15em]">
            Menú Principal
          </p>
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </div>
        </div>

        {/* Divisor */}
        <div className="my-3 border-t border-purple-300 dark:border-slate-800" />

        {/* Gestión */}
        <div>
          <p className="px-3 py-1.5 text-[10px] font-bold text-slate-900 uppercase tracking-[0.15em]">
            Gestión
          </p>
          <div className="space-y-0.5">
            {gestionItems.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </div>
        </div>

        {/* Separador antes de Configuración */}
        <div className="my-3 border-t border-purple-300 dark:border-slate-800" />

        {/* Configuración */}
        <div>
          <p className="px-3 py-1.5 text-[10px] font-bold text-slate-900 uppercase tracking-[0.15em]">
            Sistema
          </p>
          <div className="space-y-0.5">
            <NavItem item={{ label: 'Configuración', to: '/configuracion', icon: Settings }} />
          </div>
        </div>
      </nav>

      {/* ─── Toggle Theme ─── */}
      <div className="px-3 py-2 border-t border-purple-300 dark:border-slate-800">
        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 text-slate-900 hover:text-black hover:bg-pink-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50"
        >
          <span className="shrink-0">
            {darkMode ? <Sun size={17} /> : <Moon size={17} />}
          </span>
          <span>{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
        </button>
      </div>

      {/* ─── Footer ─── */}
      <div className="p-3 border-t border-purple-300 dark:border-slate-800">
        <p className="text-[11px] text-slate-900 dark:text-slate-600 text-center font-medium">
          v1.0 &copy; {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
}






