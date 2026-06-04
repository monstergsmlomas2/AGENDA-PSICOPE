import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Brain, Eye, EyeOff, Loader2, AlertCircle,
  CalendarDays, Users, FileText, Bell, ArrowLeft, ArrowRight,
} from 'lucide-react';

const FEATURES = [
  { icon: Users, label: 'Gestión de pacientes' },
  { icon: CalendarDays, label: 'Agenda de turnos' },
  { icon: FileText, label: 'Sesiones y evaluaciones' },
  { icon: Bell, label: 'Recordatorios por WhatsApp' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Completá todos los campos'); return; }
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.message?.includes('Invalid login credentials')) {
        setError('Email o contraseña incorrectos');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Email no confirmado. Revisá tu bandeja de entrada');
      } else {
        setError('Error al iniciar sesión. Intentalo de nuevo');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-[var(--bg-base)]">

      {/* ── Panel izquierdo ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12 bg-slate-950">
        {/* Grid sutil */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
        {/* Glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-20%', left: '-10%',
            width: '600px', height: '600px',
            background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 60%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '-15%', right: '-10%',
            width: '400px', height: '400px',
            background: 'radial-gradient(circle, rgba(219,39,119,0.15) 0%, transparent 60%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Logo */}
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}
            >
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-tight">AgendaPsicope</span>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Sistema de Gestión</p>
            </div>
          </Link>
        </div>

        {/* Copy central */}
        <div className="relative space-y-10">
          <div>
            <h2 className="text-5xl font-black text-white leading-[1.05] tracking-tight mb-5">
              Tu práctica,{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #a78bfa, #f472b6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                organizada
              </span>
              <br />y simple.
            </h2>
            <p className="text-slate-400 text-base leading-relaxed max-w-xs">
              Gestioná pacientes, turnos, sesiones y pagos desde un solo lugar.
            </p>
          </div>

          <ul className="space-y-2.5">
            {FEATURES.map((f) => (
              <li
                key={f.label}
                className="flex items-center gap-3 rounded-xl px-4 py-3 border border-slate-800 bg-slate-900/60 backdrop-blur-sm"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(124,58,237,0.15)' }}
                >
                  <f.icon size={15} style={{ color: '#a78bfa' }} />
                </div>
                <span className="text-sm font-medium text-slate-300">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <p className="text-slate-600 text-xs">AgendaPsicope v1.0 · {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* ── Panel derecho (formulario) ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-slate-50 dark:bg-[var(--bg-base)]">

        {/* Volver mobile */}
        <div className="lg:hidden w-full max-w-sm mb-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={14} />
            Volver
          </Link>
        </div>

        <div className="w-full max-w-sm">

          {/* Logo mobile */}
          <div className="lg:hidden mb-8">
            <div className="flex items-center gap-2.5 mb-1">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
              >
                <Brain size={18} className="text-white" />
              </div>
              <div>
                <span className="text-base font-bold text-slate-900">Agenda<span style={{ color: '#7c3aed' }}>Psicope</span></span>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Sistema de Gestión</p>
              </div>
            </div>
          </div>

          {/* Encabezado */}
          <div className="mb-8">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
              Bienvenida de vuelta
            </h1>
            <p className="text-sm text-slate-500">
              Ingresá tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Card */}
          <div
            className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-200 dark:border-[var(--border-default)] p-7"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
          >
            {error && (
              <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  autoComplete="email"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-elevated)] border border-slate-200 dark:border-[var(--border-default)] text-slate-900 dark:text-[var(--text-primary)] placeholder:text-slate-400 text-sm transition-all"
                  style={{ outline: 'none' }}
                  onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'}
                  onBlur={e => e.target.style.boxShadow = 'none'}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-11 rounded-xl bg-slate-50 dark:bg-[var(--bg-elevated)] border border-slate-200 dark:border-[var(--border-default)] text-slate-900 dark:text-[var(--text-primary)] placeholder:text-slate-400 text-sm transition-all"
                    style={{ outline: 'none' }}
                    onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'}
                    onBlur={e => e.target.style.boxShadow = 'none'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #db2777)',
                  boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
                }}
                onMouseEnter={e => !isSubmitting && (e.currentTarget.style.boxShadow = '0 6px 24px rgba(124,58,237,0.4)')}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(124,58,237,0.3)'}
              >
                {isSubmitting ? (
                  <><Loader2 size={17} className="animate-spin" /> Ingresando…</>
                ) : (
                  <><span>Ingresar al sistema</span><ArrowRight size={16} /></>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center space-y-2">
            <Link
              to="/"
              className="hidden lg:inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft size={12} />
              Volver a la página principal
            </Link>
            <p className="text-xs text-slate-400 dark:text-slate-600">
              AgendaPsicope v1.0 &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
