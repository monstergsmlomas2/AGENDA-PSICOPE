import { useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../services/authService.js';
import { Brain, Eye, EyeOff, Loader2, AlertCircle, CalendarDays, Users, FileText, Bell, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

const FEATURES = [
  { icon: Users, label: 'Gestión de pacientes' },
  { icon: CalendarDays, label: 'Agenda de turnos' },
  { icon: FileText, label: 'Sesiones y evaluaciones' },
  { icon: Bell, label: 'Recordatorios por WhatsApp' },
];

export default function Register() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!nombre || !email || !password || !confirmPassword) {
      setError('Completá todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: nombre } },
      });

      if (signUpError) {
        if (signUpError.message?.includes('User already registered')) {
          setError('Ya existe una cuenta con ese email');
        } else if (signUpError.message?.includes('Password should be at least 6 characters')) {
          setError('La contraseña debe tener al menos 8 caracteres');
        } else {
          setError('Error al crear la cuenta. Intentalo de nuevo');
        }
        setIsSubmitting(false);
        return;
      }

      if (data?.user) {
        setSuccess(true);
      }
    } catch {
      setError('Error al crear la cuenta. Intentalo de nuevo');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Estado de éxito ───
  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter','Segoe UI',sans-serif" }}>

        {/* PANEL IZQUIERDO */}
        <div style={{
          display: 'none',
          width: '50%',
          position: 'relative',
          overflow: 'hidden',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 48,
          background: 'linear-gradient(150deg, #fdf4ff 0%, #fce7f3 40%, #ede9fe 100%)',
        }}
          className="lg-panel-register"
        >
          <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,114,182,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '45%', left: '60%', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,181,253,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed, #be185d)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
                <Brain size={20} color="white" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1e1b4b', letterSpacing: '-0.02em' }}>AgendaPsicope</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sistema de Gestión</div>
              </div>
            </Link>
          </div>

          <div style={{ position: 'relative' }}>
            <h2 style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#1e1b4b', marginBottom: 16 }}>
              Comenzá gratis,{' '}
              <span style={{ background: 'linear-gradient(135deg, #7c3aed, #be185d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                hoy.
              </span>
            </h2>
            <p style={{ fontSize: 15, color: '#6d28d9', lineHeight: 1.7, marginBottom: 32, opacity: 0.75 }}>
              Creá tu cuenta y gestioná tu agenda psicopedagógica desde el primer día.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FEATURES.map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 12, padding: '12px 16px' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(190,24,93,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <f.icon size={16} style={{ color: '#7c3aed' }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#3b0764' }}>{f.label}</span>
                  <CheckCircle2 size={14} style={{ color: '#a78bfa', marginLeft: 'auto' }} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <p style={{ fontSize: 12, color: '#7c3aed', opacity: 0.6 }}>AgendaPsicope v1.0 · {new Date().getFullYear()}</p>
          </div>
        </div>

        {/* PANEL DERECHO — éxito */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', background: '#f8fafc' }}>
          <div style={{ width: '100%', maxWidth: 400, marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #be185d)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={16} color="white" />
              </div>
              <span style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>
                Agenda<span style={{ color: '#7c3aed' }}>Psicope</span>
              </span>
            </div>
          </div>

          <div style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ background: 'white', borderRadius: 18, border: '1px solid #e2e8f0', padding: 48, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <div style={{ marginBottom: 20 }}>
                <CheckCircle2 size={64} style={{ color: '#7c3aed' }} />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.025em', color: '#0f172a', marginBottom: 12 }}>
                ¡Cuenta creada!
              </h1>
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28, lineHeight: 1.6 }}>
                Tu cuenta fue creada. Ya podés ingresar al sistema.
              </p>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px 28px', borderRadius: 11, border: '1.5px solid #7c3aed',
                  fontSize: 14, fontWeight: 700, color: '#7c3aed', background: 'transparent',
                  textDecoration: 'none', cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7c3aed'; }}
              >
                Ir a iniciar sesión <ArrowRight size={16} />
              </Link>
            </div>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
                <ArrowLeft size={13} /> Volver al inicio
              </Link>
              <p style={{ marginTop: 8, fontSize: 11, color: '#cbd5e1' }}>AgendaPsicope v1.0 © {new Date().getFullYear()}</p>
            </div>
          </div>
        </div>

        <style>{`
          @media (min-width: 1024px) {
            .lg-panel-register { display: flex !important; }
          }
        `}</style>
      </div>
    );
  }

  // ─── Estado normal — formulario ───
  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* ── PANEL IZQUIERDO ── */}
      <div style={{
        display: 'none',
        width: '50%',
        position: 'relative',
        overflow: 'hidden',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 48,
        background: 'linear-gradient(150deg, #fdf4ff 0%, #fce7f3 40%, #ede9fe 100%)',
      }}
        className="lg-panel-register"
      >
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,114,182,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '45%', left: '60%', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,181,253,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed, #be185d)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
              <Brain size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1e1b4b', letterSpacing: '-0.02em' }}>AgendaPsicope</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sistema de Gestión</div>
            </div>
          </Link>
        </div>

        <div style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#1e1b4b', marginBottom: 16 }}>
            Comenzá gratis,{' '}
            <span style={{ background: 'linear-gradient(135deg, #7c3aed, #be185d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              hoy.
            </span>
          </h2>
          <p style={{ fontSize: 15, color: '#6d28d9', lineHeight: 1.7, marginBottom: 32, opacity: 0.75 }}>
            Creá tu cuenta y gestioná tu agenda psicopedagógica desde el primer día.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FEATURES.map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 12, padding: '12px 16px' }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(190,24,93,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <f.icon size={16} style={{ color: '#7c3aed' }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#3b0764' }}>{f.label}</span>
                <CheckCircle2 size={14} style={{ color: '#a78bfa', marginLeft: 'auto' }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <p style={{ fontSize: 12, color: '#7c3aed', opacity: 0.6 }}>AgendaPsicope v1.0 · {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* ── PANEL DERECHO — formulario ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', background: '#f8fafc' }}>

        {/* Logo mobile */}
        <div style={{ width: '100%', maxWidth: 400, marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #be185d)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={16} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>
              Agenda<span style={{ color: '#7c3aed' }}>Psicope</span>
            </span>
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: 400 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.025em', color: '#0f172a', marginBottom: 6 }}>
            Creá tu cuenta
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>
            Ingresá tus datos para empezar
          </p>

          {/* Card formulario */}
          <div style={{ background: 'white', borderRadius: 18, border: '1px solid #e2e8f0', padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', marginBottom: 20, color: '#dc2626', fontSize: 14 }}>
                <AlertCircle size={15} style={{ marginTop: 1, flexShrink: 0 }} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Nombre completo */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                  Nombre completo
                </label>
                <InputField
                  id="nombre" type="text" value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Tu nombre" autoComplete="name" autoFocus
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                  Email
                </label>
                <InputField
                  id="email" type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com" autoComplete="email"
                />
              </div>

              {/* Contraseña */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <InputField
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 0 }}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Confirmar contraseña */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                  Confirmar contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <InputField
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repetí tu contraseña"
                    autoComplete="new-password"
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    tabIndex={-1}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 0 }}
                  >
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <SubmitButton isSubmitting={isSubmitting} />
            </form>
          </div>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
              onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
              <ArrowLeft size={13} /> Volver al inicio
            </Link>
            <p style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>
              ¿Ya tenés cuenta?{' '}
              <Link to="/login" style={{ color: '#7c3aed', fontWeight: 700, textDecoration: 'none' }}>
                Ingresá
              </Link>
            </p>
            <p style={{ marginTop: 8, fontSize: 11, color: '#cbd5e1' }}>AgendaPsicope v1.0 © {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .lg-panel-register { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

function InputField({ id, type, value, onChange, placeholder, autoComplete, autoFocus, style: extraStyle }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      id={id} type={type} value={value} onChange={onChange}
      placeholder={placeholder} autoComplete={autoComplete} autoFocus={autoFocus}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        width: '100%', display: 'block',
        padding: '12px 16px', borderRadius: 10, fontSize: 14,
        background: '#f8fafc', color: '#0f172a',
        border: `1.5px solid ${focused ? '#7c3aed' : '#e2e8f0'}`,
        boxShadow: focused ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
        outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
        boxSizing: 'border-box',
        ...extraStyle,
      }}
    />
  );
}

function SubmitButton({ isSubmitting }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '14px', borderRadius: 11, border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
        fontSize: 15, fontWeight: 700, color: 'white',
        background: 'linear-gradient(135deg, #7c3aed, #be185d)',
        boxShadow: hovered && !isSubmitting ? '0 8px 28px rgba(124,58,237,0.4)' : '0 4px 16px rgba(124,58,237,0.25)',
        transform: hovered && !isSubmitting ? 'translateY(-1px)' : 'none',
        transition: 'transform 0.2s, box-shadow 0.2s',
        opacity: isSubmitting ? 0.7 : 1,
      }}
    >
      {isSubmitting ? (
        <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Creando cuenta…</>
      ) : (
        <><span>Crear cuenta</span><ArrowRight size={16} /></>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
