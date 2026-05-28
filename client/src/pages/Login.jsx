import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Brain, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

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
      navigate('/', { replace: true });
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
    <div className="min-h-screen flex items-center justify-center bg-purple-200 dark:bg-[var(--bg-base)] transition-colors duration-300">
      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="bg-pink-300/40 dark:bg-teal-500/15 p-3 rounded-2xl shadow-sm shadow-pink-300/20 dark:shadow-teal-500/10">
              <Brain size={32} className="text-pink-600 dark:text-teal-400" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="text-black dark:text-white">Agenda</span>
                <span className="text-pink-600 dark:text-teal-400">Psicope</span>
              </h1>
              <p className="text-xs font-medium text-slate-900 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                Sistema de Gestión
              </p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/70 dark:bg-[var(--bg-surface)] backdrop-blur-sm rounded-2xl border border-pink-200 dark:border-[var(--border-default)] shadow-lg p-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-[var(--text-primary)] mb-1">
            Iniciar sesión
          </h2>
          <p className="text-sm text-slate-600 dark:text-[var(--text-muted)] mb-6">
            Ingresá tus credenciales para acceder al sistema
          </p>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-[var(--danger-light)] border border-red-200 dark:border-[var(--danger-border)] text-red-700 dark:text-red-400 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-900 dark:text-[var(--text-secondary)] mb-1.5"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[var(--bg-elevated)] border border-pink-200 dark:border-[var(--border-default)] text-slate-900 dark:text-[var(--text-primary)] placeholder:text-slate-400 dark:placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-teal-500/50 focus:border-transparent transition-all text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-900 dark:text-[var(--text-secondary)] mb-1.5"
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
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white dark:bg-[var(--bg-elevated)] border border-pink-200 dark:border-[var(--border-default)] text-slate-900 dark:text-[var(--text-primary)] placeholder:text-slate-400 dark:placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-teal-500/50 focus:border-transparent transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
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
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 dark:from-teal-600 dark:to-teal-500 dark:hover:from-teal-500 dark:hover:to-teal-400 shadow-md shadow-pink-500/20 dark:shadow-teal-500/20 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Ingresando…
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-600 mt-6 font-medium">
          AgendaPsicope v1.0 &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
