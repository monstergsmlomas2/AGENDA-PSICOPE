import { Link } from 'react-router-dom';
import { Brain, CalendarDays, Users, FileText, CreditCard, Bell, BarChart3, CheckCircle2, Star, ArrowRight, Sparkles } from 'lucide-react';

const FEATURES = [
  { icon: Users, title: 'Gestión de Pacientes', desc: 'Fichas completas con datos, obra social, entrevista de admisión, sesiones y evaluaciones.' },
  { icon: CalendarDays, title: 'Agenda de Turnos', desc: 'Calendario visual por consultorio. Vista día, semana o mes de un vistazo.' },
  { icon: FileText, title: 'Sesiones & Evaluaciones', desc: 'Historial clínico completo con acceso inmediato a cada sesión y evaluación.' },
  { icon: CreditCard, title: 'Control de Pagos', desc: 'Registro de cobros, obras sociales y deudas. Sabé siempre cuánto facturaste.' },
  { icon: Bell, title: 'Recordatorios WhatsApp', desc: 'Recordatorios automáticos de turno con mensaje y formato personalizable.' },
  { icon: BarChart3, title: 'Informes & Reportes', desc: 'Reportes por paciente, obra social o período. Decisiones basadas en datos reales.' },
];

const TESTIMONIALS = [
  { initials: 'MG', name: 'María González', role: 'Psicopedagoga · Bs. As.', text: 'Antes llevaba todo en papel y Excel. Ahora tengo todo organizado en un solo lugar.' },
  { initials: 'LC', name: 'Laura Cáceres', role: 'Psicopedagoga · Córdoba', text: 'Los recordatorios por WhatsApp me cambiaron la vida. Casi no hay más inasistencias.' },
  { initials: 'VR', name: 'Valentina Ríos', role: 'Psicopedagoga · Rosario', text: 'El historial de sesiones por paciente es exactamente lo que necesitaba.' },
];

const BENEFITS = [
  'Sin instalación — funciona desde el navegador',
  'Acceso desde cualquier dispositivo',
  'Datos seguros en la nube',
  'Modo oscuro y claro incluidos',
  'Diseñado para psicopedagogas argentinas',
  'Actualizaciones automáticas sin costo extra',
];

const grad = 'linear-gradient(135deg, #7c3aed 0%, #be185d 100%)';

export default function Landing() {
  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", background: '#fafafa', color: '#0f172a', minHeight: '100vh' }}>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={18} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>
              <span style={{ color: '#0f172a' }}>Agenda</span>
              <span style={{ color: '#7c3aed' }}>Psicope</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 32 }}>
            <a href="#features" style={{ fontSize: 14, color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>Características</a>
            <a href="#testimonials" style={{ fontSize: 14, color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>Testimonios</a>
          </div>
          <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0f172a', color: 'white', padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Ingresar <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: 'relative', overflow: 'hidden', background: '#ffffff', padding: '96px 24px 80px', textAlign: 'center' }}>
        {/* Grid background */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 0%, black 30%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 0%, black 30%, transparent 100%)',
          opacity: 0.5,
        }} />
        {/* Glow */}
        <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 900, height: 500, pointerEvents: 'none', background: 'radial-gradient(ellipse at center top, rgba(124,58,237,0.1) 0%, rgba(190,24,93,0.06) 40%, transparent 70%)' }} />

        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#6d28d9', fontSize: 11, fontWeight: 700, padding: '6px 14px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 32 }}>
            <Sparkles size={11} /> Sistema de gestión para psicopedagogas
          </div>

          <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.035em', color: '#0f172a', marginBottom: 24 }}>
            Tu práctica,{' '}
            <span style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              organizada
            </span>
            <br />y profesional.
          </h1>

          <p style={{ fontSize: 18, color: '#64748b', maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Gestioná pacientes, turnos, sesiones y pagos desde un solo lugar. Pensado para la práctica psicopedagógica argentina.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: grad, color: 'white', padding: '14px 28px', borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 32px rgba(124,58,237,0.3)', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(124,58,237,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,0.3)'; }}>
              Acceder al sistema <ArrowRight size={16} />
            </Link>
            <a href="#features" style={{ display: 'inline-flex', alignItems: 'center', background: '#f8fafc', color: '#475569', padding: '14px 28px', borderRadius: 12, fontSize: 15, fontWeight: 600, textDecoration: 'none', border: '1px solid #e2e8f0', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}>
              Ver características
            </a>
          </div>
        </div>

        {/* App mockup */}
        <div style={{ position: 'relative', maxWidth: 860, margin: '64px auto 0' }}>
          <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 40px 100px rgba(15,23,42,0.15), 0 0 0 1px rgba(15,23,42,0.03)' }}>
            <div style={{ background: '#f1f5f9', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#fc5c65', display: 'inline-block' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#fed330', display: 'inline-block' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#26de81', display: 'inline-block' }} />
              <span style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <span style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 16px', fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                  entrerizospsicope.vercel.app/dashboard
                </span>
              </span>
            </div>
            <div style={{ background: '#f8fafc', padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
                {[
                  { label: 'Pacientes activos', val: '24', c: '#7c3aed' },
                  { label: 'Turnos esta semana', val: '12', c: '#be185d' },
                  { label: 'Cobros del mes', val: '$186k', c: '#7c3aed' },
                  { label: 'Sin sesión reciente', val: '3', c: '#d97706' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: s.c + '22', marginBottom: 8 }} />
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, fontWeight: 500 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {['Próximos turnos', 'Últimas sesiones', 'Pagos pendientes'].map(t => (
                  <div key={t} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 10 }}>{t}</div>
                    {[90, 65, 45].map((w, i) => <div key={i} style={{ height: 7, borderRadius: 4, background: '#f1f5f9', width: w + '%', marginBottom: 6 }} />)}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* shadow glow */}
          <div style={{ position: 'absolute', bottom: -24, left: '50%', transform: 'translateX(-50%)', width: '60%', height: 40, background: 'radial-gradient(ellipse, rgba(124,58,237,0.2) 0%, transparent 70%)', filter: 'blur(12px)', pointerEvents: 'none' }} />
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: 'white', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '48px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, textAlign: 'center' }}>
          {[
            { v: '100%', l: 'Online, sin instalar nada' },
            { v: '5 min', l: 'Para empezar a usarlo' },
            { v: '24/7', l: 'Acceso desde cualquier lugar' },
            { v: '∞', l: 'Pacientes y sesiones' },
          ].map(s => (
            <div key={s.l}>
              <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.04em', background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.v}</div>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ background: '#fafafa', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 24, height: 2, background: grad, borderRadius: 2 }} />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7c3aed' }}>Características</span>
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#0f172a', marginBottom: 16 }}>
              Todo lo que necesitás,<br />en un solo sistema.
            </h2>
            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 480, lineHeight: 1.7 }}>
              Sin funciones innecesarias. Sin curva de aprendizaje. Diseñado para la práctica psicopedagógica.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {FEATURES.map(f => (
              <FeatureCard key={f.title} feature={f} />
            ))}
          </div>
        </div>
      </section>

      {/* SPLIT — Por qué */}
      <section style={{ background: 'white', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 24, height: 2, background: grad, borderRadius: 2 }} />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7c3aed' }}>Por qué AgendaPsicope</span>
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#0f172a', marginBottom: 20 }}>
              Pensado para vos,{' '}
              <span style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                psicopedagoga.
              </span>
            </h2>
            <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.75, marginBottom: 32 }}>
              No es un sistema genérico adaptado. Fue construido desde cero para las necesidades reales de una práctica psicopedagógica en Argentina.
            </p>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: grad, color: 'white', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(124,58,237,0.25)', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.25)'; }}>
              Empezar ahora <ArrowRight size={15} />
            </Link>
          </div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {BENEFITS.map(b => (
              <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <CheckCircle2 size={16} style={{ color: '#7c3aed', flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: '#334155' }}>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" style={{ background: '#fafafa', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 24, height: 2, background: grad, borderRadius: 2 }} />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7c3aed' }}>Testimonios</span>
              <div style={{ width: 24, height: 2, background: grad, borderRadius: 2 }} />
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.03em', color: '#0f172a' }}>
              Lo que dicen las profesionales
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {TESTIMONIALS.map(t => (
              <TestimonialCard key={t.name} t={t} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ background: '#0f172a', padding: '96px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: '0 12px 40px rgba(124,58,237,0.4)' }}>
            <Brain size={28} color="white" />
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', color: 'white', marginBottom: 16 }}>
            Organizá tu práctica hoy.
          </h2>
          <p style={{ fontSize: 17, color: '#94a3b8', marginBottom: 40, lineHeight: 1.7 }}>
            Accedé al sistema y gestioná tu práctica de manera profesional.
          </p>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: grad, color: 'white', padding: '16px 36px', borderRadius: 14, fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 32px rgba(124,58,237,0.35)', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 56px rgba(124,58,237,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,0.35)'; }}>
            Ingresar al sistema <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#020617', borderTop: '1px solid #1e293b', padding: '28px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={14} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 14, color: '#e2e8f0' }}>Agenda<span style={{ color: '#a78bfa' }}>Psicope</span></span>
          </div>
          <span style={{ fontSize: 12, color: '#475569' }}>Sistema de gestión para psicopedagogas · {new Date().getFullYear()}</span>
          <Link to="/login" style={{ fontSize: 13, color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>Ingresar →</Link>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ feature: f }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: 'white',
        border: `1px solid ${hovered ? '#c4b5fd' : '#e2e8f0'}`,
        borderRadius: 16,
        padding: 24,
        cursor: 'default',
        transition: 'transform 0.25s, border-color 0.25s',
        transform: hovered ? 'translateY(-6px) scale(1.02)' : 'none',
        boxShadow: hovered ? '0 20px 48px rgba(124,58,237,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
        overflow: 'visible',
      }}
    >
      {/* Glow debajo */}
      <div style={{
        position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)',
        width: '70%', height: 32, pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(124,58,237,0.4) 0%, rgba(190,24,93,0.2) 50%, transparent 70%)',
        filter: 'blur(10px)',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.3s',
      }} />
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(190,24,93,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <f.icon size={20} style={{ color: '#7c3aed' }} />
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{f.title}</h3>
      <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65 }}>{f.desc}</p>
    </div>
  );
}

function TestimonialCard({ t }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: 'white',
        border: `1px solid ${hovered ? '#ddd6fe' : '#e2e8f0'}`,
        borderRadius: 16,
        padding: 24,
        transition: 'transform 0.25s, border-color 0.25s',
        transform: hovered ? 'translateY(-5px) scale(1.02)' : 'none',
        boxShadow: hovered ? '0 20px 48px rgba(124,58,237,0.1)' : '0 1px 4px rgba(0,0,0,0.05)',
        overflow: 'visible',
      }}
    >
      {/* Glow debajo */}
      <div style={{
        position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)',
        width: '70%', height: 28, pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(190,24,93,0.35) 0%, rgba(124,58,237,0.2) 50%, transparent 70%)',
        filter: 'blur(10px)',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.3s',
      }} />
      <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
        {[...Array(5)].map((_, i) => <Star key={i} size={14} style={{ fill: '#fbbf24', color: '#fbbf24' }} />)}
      </div>
      <blockquote style={{ fontSize: 14, color: '#475569', lineHeight: 1.75, fontStyle: 'italic', marginBottom: 20 }}>
        "{t.text}"
      </blockquote>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: '1px solid #f8fafc' }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
          {t.initials}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{t.name}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.role}</div>
        </div>
      </div>
    </div>
  );
}

// necesario para los componentes con estado
import { useState } from 'react';
