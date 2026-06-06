import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, Building, ShieldCheck,
  DollarSign, Brain, Settings, LogOut, X, Search, BookOpen, Sparkles, CalendarDays, UserCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useEffect, useState } from 'react';
import { apiGet } from '../services/api.js';

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
  {
    label: 'Mi Agenda',
    to: '/mi-agenda',
    icon: CalendarDays,
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
];

function NavItem({ item, onClick }) {
  const Icono = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
          isActive
            ? 'bg-pink-300 text-black shadow-sm shadow-pink-300/30 dark:bg-teal-500/10 dark:text-teal-400 dark:shadow-teal-500/5'
            : 'text-slate-900 hover:text-black hover:bg-pink-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-pink-500 rounded-full shadow-sm shadow-pink-500/50 dark:bg-teal-400 dark:shadow-teal-400/50" />
          )}
          <span
            className={`shrink-0 transition-all duration-200 ${
              isActive
                ? 'text-pink-600 dark:text-teal-400'
                : 'text-slate-900 group-hover:text-pink-600 dark:text-slate-500 dark:group-hover:text-slate-300'
            }`}
          >
            <Icono size={16} />
          </span>
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [nombreProfesional, setNombreProfesional] = useState('');

  useEffect(() => {
    apiGet('/configuracion').then(data => {
      if (data?.nombre_profesional) setNombreProfesional(data.nombre_profesional);
    }).catch(() => {});
  }, []);

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
        {/* ─── Header ─── */}
        <div className="px-3 py-3 border-b border-pink-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-pink-300/40 dark:bg-teal-500/15 p-1 rounded-lg shadow-sm shadow-pink-300/20 dark:shadow-teal-500/10">
              <Brain size={18} className="text-pink-600 dark:text-teal-400" />
            </div>
            <h1 className="text-sm font-bold tracking-tight leading-tight">
              <span className="text-black dark:text-white">Agenda</span>
              <span className="text-pink-600 dark:text-teal-400">Psicope</span>
            </h1>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-pink-200 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-400 transition-colors md:hidden"
          >
            <X size={16} />
          </button>
        </div>

        {/* ─── Navegación ─── */}
        <nav className="flex-1 p-2 flex flex-col gap-px overflow-y-auto">
          {/* Búsqueda rápida */}
          <button
            onClick={() =>
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
            }
            className="group flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 text-slate-900 hover:text-black hover:bg-pink-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50 mb-1"
          >
            <span className="shrink-0 text-slate-900 group-hover:text-pink-600 dark:text-slate-500 dark:group-hover:text-slate-300">
              <Search size={16} />
            </span>
            <span className="truncate flex-1 text-left">Buscar</span>
            <span className="text-[10px] text-slate-400 font-medium bg-slate-200/60 dark:bg-slate-800 px-1 rounded">
              {navigator.platform.toUpperCase().includes('MAC') ? '⌘K' : 'Ctrl+K'}
            </span>
          </button>

          <div className="border-t border-purple-300 dark:border-slate-800 my-0.5" />

          <p className="px-3 pt-1 pb-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">Principal</p>
          {navItems.map((item) => (
            <NavItem key={item.to} item={item} onClick={handleNavClick} />
          ))}

          <div className="border-t border-purple-300 dark:border-slate-800 my-0.5" />

          <p className="px-3 pt-1 pb-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">Gestión</p>
          {gestionItems.map((item) => (
            <NavItem key={item.to} item={item} onClick={handleNavClick} />
          ))}

          <div className="border-t border-purple-300 dark:border-slate-800 my-0.5" />

          <p className="px-3 pt-1 pb-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">Herramientas</p>
          <NavItem item={{ label: 'Tests Estandarizados', to: '/herramientas', icon: BookOpen }} onClick={handleNavClick} />
          <NavItem item={{ label: 'Panel de IA', to: '/ia', icon: Sparkles }} onClick={handleNavClick} />

          <div className="border-t border-purple-300 dark:border-slate-800 my-0.5" />

          <p className="px-3 pt-1 pb-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">Sistema</p>
          <NavItem item={{ label: 'Configuración', to: '/configuracion', icon: Settings }} onClick={handleNavClick} />
        </nav>

        {/* ─── Footer: nombre profesional + cerrar sesión ─── */}
        <div className="p-2 border-t border-pink-200 dark:border-slate-800">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-pink-50 dark:bg-slate-900/50">
            <UserCircle size={28} className="shrink-0 text-pink-400 dark:text-teal-500" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {nombreProfesional || user?.email?.split('@')[0] || 'Usuario'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || ''}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="shrink-0 p-1.5 rounded-lg hover:bg-pink-200 dark:hover:bg-slate-800 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
