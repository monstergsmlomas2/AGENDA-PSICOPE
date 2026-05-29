import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, DollarSign, Settings,
} from 'lucide-react';

const bottomItems = [
  { label: 'Inicio',     to: '/',            icon: LayoutDashboard, end: true },
  { label: 'Pacientes',  to: '/pacientes',   icon: Users },
  { label: 'Turnos',     to: '/turnos',      icon: Calendar },
  { label: 'Pagos',      to: '/pagos',       icon: DollarSign },
  { label: 'Config',     to: '/configuracion', icon: Settings },
];

export default function BottomNav() {
  return (
    <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-purple-100 dark:bg-slate-950 border-t border-pink-200 dark:border-slate-800">
      {bottomItems.map(({ label, to, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors duration-200 ${
              isActive
                ? 'text-pink-600 dark:text-teal-400'
                : 'text-slate-400 dark:text-slate-500'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className="relative">
                <Icon size={22} />
                {isActive && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-pink-500 dark:bg-teal-400" />
                )}
              </span>
              <span className="text-[10px] font-medium">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
