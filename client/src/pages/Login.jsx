import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Brain,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CalendarDays,
  Users,
  FileText,
  Bell,
  ArrowLeft,
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

    if (!email || !password) {
      setError('Completá todos los campos');
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Error de login:', err);
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
    <div className="min-h-screen flex dark:bg-[var(--bg-base)] transition-colors duration-300">
      {/* ── Panel izquierdo decorativo ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-pink-500 flex-col justify-between p-12">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full bg-purple-900/30 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-pink-400/10 blur-2xl" />
        </div>

        {/* Logo */}
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="bg-white/20 p-2 rounded-xl group-hover:bg-white/30 transition-colors">
              <Brain size={24} className="text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white tracking-tight">AgendaPsicope</span>
              <p className="text-xs text-pink-200 font-medium uppercase tracking-widest">Sistema de Gestión</p>
            </div>
          </Link>
        </div>

        {/* Contenido central */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
              Tu práctica,<br />
              <span className="text-pink-200">organizada</span><br />
              y simple.
            </h2>
            <p className="text-pink-100 text-base leading-relaxed max-w-xs">
              Gestioná pacientes, turnos, sesiones y pagos desde un solo lugar. Pensado para la práctica psicopedagógica.
            </p>
          </div>

          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/15">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <f.icon size={16} className="text-white" />
                </div>
                <span className="text-sm font-medium text-white/90">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer del panel */}
        <div className="relative">
          <p className="text-pink-200 text-xs">
            AgendaPsicope v1.0 · {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* ── Panel derecho (formulario) ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-purple-50 dark:bg-[var(--bg-base)]">
        {/* Volver (mobile y tablet) */}
        <div className="lg:hidden w-full max-w-md mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-pink-600 transition-colors"
          >
            <ArrowLeft size={15} />
            Volver
          </Link>
        </div>

        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-2">
              <div className="bg-pink-100 p-2 rounded-xl">
                <Brain size={24} className="text-pink-600" />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold">
                  <span className="text-slate-900">Agenda</span>
                  <span className="text-pink-600">Psicope</span>
                </h1>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">Sistema de Gestión</p>
              </div>
            </div>
          </div>

          {/* Encabezado del formulario */}
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">
              Bienvenida de vuelta
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ingresá tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Card formulario */}
          <div className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-pink-100 dark:border-[var(--border-default)] shadow-xl shadow-pink-100/50 p-8">

            {/* Error */}
            {error && (
              <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-[var(--danger-light)] border border-red-200 dark:border-[var(--danger-border)] text-red-700 dark:text-red-400 text-sm">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700 dark:text-[var(--text-secondary)] mb-1.5"
                >
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
                  className="w-full px-4 py-3 rounded-xl bg-purple-50 dark:bg-[var(--bg-elevated)] border border-pink-100 dark:border-[var(--border-default)] text-slate-900 dark:text-[var(--text-primary)] placeholder:text-slate-400 dark:placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-teal-500/50 focus:border-transparent transition-all text-sm"
                />
              </div>

              {/* Contraseña */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700 dark:text-[var(--text-secondary)] mb-1.5"
                >
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
                    className="w-full px-4 py-3 pr-11 rounded-xl bg-purple-50 dark:bg-[var(--bg-elevated)] border border-pink-100 dark:border-[var(--border-default)] text-slate-900 dark:text-[var(--text-primary)] placeholder:text-slate-400 dark:placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-teal-500/50 focus:border-transparent transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 dark:from-teal-600 dark:to-teal-500 dark:hover:from-teal-500 dark:hover:to-teal-400 shadow-md shadow-pink-400/30 dark:shadow-teal-500/20 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Ingresando…
                  </>
                ) : (
                  'Ingresar al sistema'
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="hidden lg:inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-pink-500 transition-colors"
            >
              <ArrowLeft size={13} />
              Volver a la página principal
            </Link>
            <p className="text-xs text-slate-400 dark:text-slate-600 mt-2">
              AgendaPsicope v1.0 &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
