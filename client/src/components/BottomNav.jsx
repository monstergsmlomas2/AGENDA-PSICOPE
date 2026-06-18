import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, DollarSign, Settings,
  ShieldCheck, Building, FileText, CalendarDays,
} from 'lucide-react';

const bottomItems = [
  { label: 'Inicio',      to: '/dashboard',       icon: LayoutDashboard, end: true },
  { label: 'Pacientes',   to: '/pacientes',        icon: Users },
  { label: 'Turnos',      to: '/turnos',           icon: Calendar },
  { label: 'Agenda',      to: '/mi-agenda',        icon: CalendarDays },
  { label: 'Obras Soc.',  to: '/obras-sociales',   icon: ShieldCheck },
  { label: 'Consult.',    to: '/consultorios',     icon: Building },
  { label: 'Pagos',       to: '/pagos',            icon: DollarSign },
  { label: 'Informes',    to: '/informes',         icon: FileText },
  { label: 'Config',      to: '/configuracion',    icon: Settings },
];

export default function BottomNav() {
  return (
    <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-purple-100 dark:bg-slate-950 border-t border-pink-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
      {bottomItems.map(({ label, to, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center shrink-0 w-16 gap-0.5 transition-colors duration-200 ${
              isActive
                ? 'text-pink-600 dark:text-teal-400'
                : 'text-slate-900 dark:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                {isActive && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-pink-500 dark:bg-teal-400" />
                )}
              </span>
              <span className="text-[9px] font-medium truncate w-full text-center px-0.5">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
