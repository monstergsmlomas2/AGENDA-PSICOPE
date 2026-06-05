import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, Building, ShieldCheck,
  FileText, DollarSign, Brain, Settings, LogOut, X, Search, BookOpen, Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  {
    label: 'Dashboard',
    to: '/dashboard',
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

function NavItem({ item, onClick }) {
  const Icono = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onClick}
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

export default function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Overlay oscuro semitransparente — solo visible en móvil cuando está abierto */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          /* Mobile: fixed drawer con transición */
          fixed md:static inset-y-0 left-0 z-50
          w-52 flex flex-col h-screen shrink-0
          bg-purple-100 dark:bg-slate-950
          border-r border-pink-200 dark:border-slate-800
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* ─── Header con botón cerrar en móvil ─── */}
        <div className="p-4 border-b border-pink-200 dark:border-slate-800 flex items-center justify-between">
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
          {/* Botón cerrar — solo en móvil */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-pink-200 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-400 transition-colors md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── Navegación ─── */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar">
          {/* Búsqueda rápida */}
          <div className="mb-2">
            <button
              onClick={() =>
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
              }
              className="group relative flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 text-slate-900 hover:text-black hover:bg-pink-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50"
            >
              <span className="shrink-0 text-slate-900 group-hover:text-pink-600 dark:text-slate-500 dark:group-hover:text-slate-300">
                <Search size={17} />
              </span>
              <span className="truncate flex-1 text-left">Buscar paciente</span>
              <span className="text-xs text-slate-400 font-medium">
                {navigator.platform.toUpperCase().includes('MAC') ? '⌘K' : 'Ctrl+K'}
              </span>
            </button>
          </div>

          {/* Menú Principal */}
          <div className="mb-1">
            <p className="px-3 py-1.5 text-[10px] font-bold text-slate-900 uppercase tracking-[0.15em]">
              Menú Principal
            </p>
            <div className="space-y-0.5">
              {navItems.map((item) => (
                <NavItem key={item.to} item={item} onClick={handleNavClick} />
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
                <NavItem key={item.to} item={item} onClick={handleNavClick} />
              ))}
            </div>
          </div>

          {/* Separador antes de Herramientas */}
          <div className="my-3 border-t border-purple-300 dark:border-slate-800" />

          {/* Herramientas Clínicas */}
          <div>
            <p className="px-3 py-1.5 text-[10px] font-bold text-slate-900 uppercase tracking-[0.15em]">
              Herramientas
            </p>
            <div className="space-y-0.5">
              <NavItem item={{ label: 'Tests Estandarizados', to: '/herramientas', icon: BookOpen }} onClick={handleNavClick} />
              <NavItem item={{ label: 'Panel de IA', to: '/ia', icon: Sparkles }} onClick={handleNavClick} />
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
              <NavItem item={{ label: 'Configuración', to: '/configuracion', icon: Settings }} onClick={handleNavClick} />
              {/* Cerrar sesión */}
              <button
                onClick={handleLogout}
                className="group relative flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 text-slate-900 hover:text-black hover:bg-pink-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50"
              >
                <span className="shrink-0 text-slate-900 group-hover:text-pink-600 dark:text-slate-500 dark:group-hover:text-slate-300">
                  <LogOut size={17} />
                </span>
                <span className="truncate">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </nav>

        {/* ─── Footer ─── */}
        <div className="p-3 border-t border-purple-300 dark:border-slate-800">
          <p className="text-[11px] text-slate-900 dark:text-slate-600 text-center font-medium">
            v1.0 &copy; {new Date().getFullYear()}
          </p>
        </div>
      </aside>
    </>
  );
}
