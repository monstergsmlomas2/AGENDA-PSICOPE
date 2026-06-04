import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, CalendarDays, Users, FileText, CreditCard, Bell, BarChart3, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

const FEATURES = [
  { icon: Users,        title: 'Gestión de Pacientes',   desc: 'Fichas completas con datos, obra social, entrevista de admisión, sesiones y evaluaciones.' },
  { icon: CalendarDays, title: 'Agenda de Turnos',        desc: 'Calendario visual por consultorio. Vista día, semana o mes de un vistazo.' },
  { icon: FileText,     title: 'Sesiones & Evaluaciones', desc: 'Historial clínico completo con acceso inmediato a cada sesión y evaluación.' },
  { icon: CreditCard,   title: 'Control de Pagos',        desc: 'Registro de cobros, obras sociales y deudas. Sabés siempre cuánto facturaste.' },
  { icon: Bell,         title: 'Recordatorios WhatsApp',  desc: 'Recordatorios automáticos de turno con mensaje y formato personalizable.' },
  { icon: BarChart3,    title: 'Informes & Reportes',     desc: 'Reportes por paciente, obra social o período. Decisiones basadas en datos reales.' },
];

const TESTIMONIALS = [
  { initials: 'MG', name: 'María González',  role: 'Psicopedagoga · Bs. As.',  text: 'Antes llevaba todo en papel y Excel. Ahora tengo todo organizado en un solo lugar.' },
  { initials: 'LC', name: 'Laura Cáceres',   role: 'Psicopedagoga · Córdoba',  text: 'Los recordatorios por WhatsApp me cambiaron la vida. Casi no hay más inasistencias.' },
  { initials: 'VR', name: 'Valentina Ríos',  role: 'Psicopedagoga · Rosario',  text: 'El historial de sesiones por paciente es exactamente lo que necesitaba.' },
];

const BENEFITS = [
  'Sin instalación — funciona desde el navegador',
  'Acceso desde cualquier dispositivo',
  'Datos seguros en la nube',
  'Modo oscuro y claro incluidos',
  'Diseñado para psicopedagogas argentinas',
  'Actualizaciones automáticas sin costo extra',
];

const c = {
  bg:        '#fdf4ff',   // fondo general — blanco ligeramente lila
  bgAlt:     '#fce7f3',   // secciones alternadas — rosa muy suave
  hero:      '#ede9fe',   // hero — lila muy suave
  heroDark:  '#ddd6fe',   // acento hero
  lila:      '#a78bfa',   // lila suave (accent principal)
  lilaDark:  '#7c3aed',   // lila más oscuro para hover
  rosa:      '#f9a8d4',   // rosa suave
  rosaDark:  '#be185d',   // rosa más oscuro para hover
  dark:      '#1e1b4b',   // texto principal
  mid:       '#6d28d9',   // texto secundario
  muted:     '#7c3aed88', // texto tenue
  border:    '#ddd6fe',   // bordes
  borderAlt: '#fbcfe8',   // bordes rosa
  white:     '#ffffff',
};

const grad = `linear-gradient(135deg, ${c.lila} 0%, ${c.rosa} 100%)`;
const gradDark = `linear-gradient(135deg, ${c.lilaDark} 0%, ${c.rosaDark} 100%)`;

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E")`;

const F = {
  display: "'Fraunces', Georgia, serif",
  body:    "'Epilogue', 'Inter', system-ui, sans-serif",
};

export default function Landing() {
  return (
    <div style={{ fontFamily: F.body, background: c.bg, color: c.dark, minHeight: '100vh' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(253,244,255,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${c.border}`,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 28px', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${c.lila}55` }}>
              <Brain size={19} color="white" />
            </div>
            <span style={{ fontFamily: F.display, fontWeight: 900, fontSize: 18, letterSpacing: '-0.02em', color: c.dark }}>
              Agenda<span style={{ color: c.lila }}>Psicope</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 36 }}>
            <a href="#features"     style={{ fontFamily: F.body, fontSize: 14, color: c.mid, textDecoration: 'none', fontWeight: 500 }}>Características</a>
            <a href="#testimonials" style={{ fontFamily: F.body, fontSize: 14, color: c.mid, textDecoration: 'none', fontWeight: 500 }}>Testimonios</a>
          </div>
          <Link to="/login" style={{
            fontFamily: F.body, fontSize: 13, fontWeight: 700,
            background: c.dark, color: 'white',
            padding: '10px 22px', borderRadius: 99,
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            Ingresar <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: c.hero,
        backgroundImage: GRAIN, backgroundRepeat: 'repeat',
        padding: '108px 28px 96px', textAlign: 'center',
      }}>
        {/* círculos decorativos suaves */}
        <div style={{ position: 'absolute', top: -120, right: -120, width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${c.lila}22 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 360, height: 360, borderRadius: '50%', background: `radial-gradient(circle, ${c.rosa}22 0%, transparent 70%)`, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'white', border: `1px solid ${c.border}`, color: c.mid, fontSize: 11, fontWeight: 700, padding: '6px 16px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 32 }}>
            <Sparkles size={11} /> Sistema de gestión para psicopedagogas
          </div>

          <h1 style={{
            fontFamily: F.display,
            fontSize: 'clamp(3rem, 6.5vw, 5.2rem)',
            fontWeight: 900, fontStyle: 'italic',
            lineHeight: 1.02, letterSpacing: '-0.03em',
            color: c.dark, marginBottom: 26,
          }}>
            Tu práctica,{' '}
            <span style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              organizada
            </span>
            <br />y profesional.
          </h1>

          <p style={{ fontFamily: F.body, fontSize: 18, color: c.mid, maxWidth: 480, margin: '0 auto 44px', lineHeight: 1.75, opacity: 0.85 }}>
            Gestioná pacientes, turnos, sesiones y pagos desde un solo lugar. Pensado para la práctica psicopedagógica argentina.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: grad, color: 'white', padding: '15px 32px', borderRadius: 99, fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: `0 8px 32px ${c.lila}44`, transition: 'transform 0.25s, box-shadow 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 16px 48px ${c.lila}66`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 8px 32px ${c.lila}44`; }}>
              Acceder al sistema <ArrowRight size={16} />
            </Link>
            <a href="#features"
              style={{ display: 'inline-flex', alignItems: 'center', background: 'white', color: c.mid, padding: '15px 32px', borderRadius: 99, fontSize: 15, fontWeight: 600, textDecoration: 'none', border: `1.5px solid ${c.border}`, transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = c.lila}
              onMouseLeave={e => e.currentTarget.style.borderColor = c.border}>
              Ver características
            </a>
          </div>
        </div>

        {/* App mockup */}
        <div style={{ position: 'relative', maxWidth: 860, margin: '72px auto 0' }}>
          <div style={{ borderRadius: 22, overflow: 'hidden', border: `1px solid ${c.border}`, boxShadow: `0 40px 100px ${c.lila}22, 0 0 0 1px ${c.border}` }}>
            <div style={{ background: c.heroDark, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${c.border}` }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#fc5c65', display: 'inline-block' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#fed330', display: 'inline-block' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#26de81', display: 'inline-block' }} />
              <span style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <span style={{ background: 'white', border: `1px solid ${c.border}`, borderRadius: 8, padding: '4px 16px', fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>agendapsicope.vercel.app/dashboard</span>
              </span>
            </div>
            <div style={{ background: '#faf5ff', padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
                {[
                  { label: 'Pacientes activos',   val: '24',    col: c.lila },
                  { label: 'Turnos esta semana',  val: '12',    col: c.rosa },
                  { label: 'Cobros del mes',      val: '$186k', col: c.lila },
                  { label: 'Sin sesión reciente', val: '3',     col: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'white', borderRadius: 14, border: `1px solid ${c.border}`, padding: '14px 16px' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: s.col + '22', marginBottom: 8 }} />
                    <div style={{ fontSize: 20, fontWeight: 900, color: c.dark }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, fontWeight: 500 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {['Próximos turnos','Últimas sesiones','Pagos pendientes'].map(t => (
                  <div key={t} style={{ background: 'white', borderRadius: 14, border: `1px solid ${c.border}`, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 10 }}>{t}</div>
                    {[90,65,45].map((w,i) => <div key={i} style={{ height: 7, borderRadius: 4, background: c.hero, width: w+'%', marginBottom: 6 }} />)}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: -24, left: '50%', transform: 'translateX(-50%)', width: '60%', height: 40, background: `radial-gradient(ellipse, ${c.lila}44 0%, transparent 70%)`, filter: 'blur(12px)', pointerEvents: 'none' }} />
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: 'white', borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`, padding: '52px 28px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32, textAlign: 'center' }}>
          {[
            { v: '100%', l: 'Online, sin instalar nada' },
            { v: '5 min', l: 'Para empezar a usarlo' },
            { v: '24/7',  l: 'Acceso desde cualquier lugar' },
            { v: '∞',     l: 'Pacientes y sesiones' },
          ].map(s => (
            <div key={s.l}>
              <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.04em', background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1, marginBottom: 6 }}>{s.v}</div>
              <div style={{ fontFamily: F.body, fontSize: 13, color: '#64748b', fontWeight: 500 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ background: c.bg, padding: '96px 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 28, height: 3, background: grad, borderRadius: 2 }} />
              <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: c.lila }}>Características</span>
            </div>
            <h2 style={{ fontFamily: F.display, fontSize: 'clamp(2.2rem,4vw,3.2rem)', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.025em', lineHeight: 1.08, color: c.dark, marginBottom: 14 }}>
              Todo lo que necesitás,<br />en un solo sistema.
            </h2>
            <p style={{ fontFamily: F.body, fontSize: 16, color: c.mid, maxWidth: 440, lineHeight: 1.75, opacity: 0.8 }}>
              Sin funciones innecesarias. Sin curva de aprendizaje.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
            {FEATURES.map(feat => <FeatureCard key={feat.title} feat={feat} />)}
          </div>
        </div>
      </section>

      {/* ── SPLIT ── */}
      <section style={{
        background: c.bgAlt,
        backgroundImage: GRAIN, backgroundRepeat: 'repeat',
        borderTop: `1px solid ${c.borderAlt}`, borderBottom: `1px solid ${c.borderAlt}`,
        padding: '96px 28px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 28, height: 3, background: grad, borderRadius: 2 }} />
              <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: c.rosa }}>Por qué AgendaPsicope</span>
            </div>
            <h2 style={{ fontFamily: F.display, fontSize: 'clamp(2rem,3.5vw,2.8rem)', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.025em', lineHeight: 1.08, color: c.dark, marginBottom: 18 }}>
              Pensado para vos,{' '}
              <span style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                psicopedagoga.
              </span>
            </h2>
            <p style={{ fontFamily: F.body, fontSize: 16, color: c.mid, lineHeight: 1.8, marginBottom: 36, opacity: 0.85 }}>
              No es un sistema genérico adaptado. Fue construido desde cero para las necesidades reales de una práctica psicopedagógica en Argentina.
            </p>
            <Link to="/login"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: grad, color: 'white', padding: '13px 28px', borderRadius: 99, fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: `0 4px 20px ${c.rosa}44`, transition: 'transform 0.25s, box-shadow 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${c.rosa}55`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 4px 20px ${c.rosa}44`; }}>
              Empezar ahora <ArrowRight size={14} />
            </Link>
          </div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: 0 }}>
            {BENEFITS.map(b => (
              <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'white', border: `1px solid ${c.borderAlt}`, borderRadius: 18, padding: '13px 18px' }}>
                <CheckCircle2 size={16} style={{ color: c.rosa, flexShrink: 0 }} />
                <span style={{ fontFamily: F.body, fontSize: 14, fontWeight: 500, color: c.dark }}>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" style={{ background: c.bg, padding: '96px 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 28, height: 3, background: grad, borderRadius: 2 }} />
              <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: c.lila }}>Testimonios</span>
              <div style={{ width: 28, height: 3, background: grad, borderRadius: 2 }} />
            </div>
            <h2 style={{ fontFamily: F.display, fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.025em', color: c.dark }}>
              Lo que dicen las profesionales
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
            {TESTIMONIALS.map(t => <TestimonialCard key={t.name} t={t} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: c.hero,
        backgroundImage: GRAIN, backgroundRepeat: 'repeat',
        padding: '96px 28px', textAlign: 'center',
        borderTop: `1px solid ${c.border}`,
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${c.rosa}18 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 580, margin: '0 auto', position: 'relative' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: `0 12px 40px ${c.lila}44` }}>
            <Brain size={28} color="white" />
          </div>
          <h2 style={{ fontFamily: F.display, fontSize: 'clamp(2.2rem,4.5vw,3.6rem)', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.03em', color: c.dark, marginBottom: 16, lineHeight: 1.02 }}>
            Organizá tu práctica hoy.
          </h2>
          <p style={{ fontFamily: F.body, fontSize: 17, color: c.mid, marginBottom: 44, lineHeight: 1.75, opacity: 0.8 }}>
            Accedé al sistema y gestioná tu práctica de manera profesional.
          </p>
          <Link to="/login"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: grad, color: 'white', padding: '17px 40px', borderRadius: 99, fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: `0 8px 32px ${c.lila}44`, transition: 'transform 0.25s, box-shadow 0.25s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 16px 48px ${c.lila}66`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 8px 32px ${c.lila}44`; }}>
            Ingresar al sistema <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: c.dark, borderTop: '1px solid #2e2a5e', padding: '28px 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={15} color="white" />
            </div>
            <span style={{ fontFamily: F.display, fontWeight: 900, fontSize: 16, color: '#e0e7ff' }}>
              Agenda<span style={{ color: c.lila }}>Psicope</span>
            </span>
          </div>
          <span style={{ fontFamily: F.body, fontSize: 12, color: '#6366f1aa' }}>Sistema de gestión para psicopedagogas · {new Date().getFullYear()}</span>
          <Link to="/login" style={{ fontFamily: F.body, fontSize: 13, color: c.lila, textDecoration: 'none', fontWeight: 600 }}>Ingresar →</Link>
        </div>
      </footer>

    </div>
  );
}

function FeatureCard({ feat }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', overflow: 'visible',
        background: hov ? '#faf5ff' : 'white',
        border: `1px solid ${hov ? c.lila : c.border}`,
        borderRadius: 22, padding: '26px 24px',
        transition: 'transform 0.3s, border-color 0.3s, background 0.3s',
        transform: hov ? 'translateY(-5px)' : 'none',
        boxShadow: hov ? `0 20px 48px ${c.lila}18` : `0 1px 4px rgba(0,0,0,0.04)`,
        cursor: 'default',
      }}
    >
      <div style={{ position: 'absolute', bottom: -14, left: '50%', transform: 'translateX(-50%)', width: '65%', height: 32, background: `radial-gradient(ellipse, ${c.lila}44 0%, transparent 70%)`, filter: 'blur(10px)', opacity: hov ? 1 : 0, transition: 'opacity 0.3s', pointerEvents: 'none' }} />
      <div style={{ width: 46, height: 46, borderRadius: 14, background: hov ? grad : `linear-gradient(135deg, ${c.lila}22, ${c.rosa}15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, transition: 'background 0.3s' }}>
        <feat.icon size={20} style={{ color: hov ? 'white' : c.lila }} />
      </div>
      <h3 style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: c.dark, marginBottom: 10 }}>{feat.title}</h3>
      <p  style={{ fontFamily: F.body,    fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>{feat.desc}</p>
    </div>
  );
}

function TestimonialCard({ t }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? '#faf5ff' : 'white',
        border: `1px solid ${hov ? c.rosa : c.border}`,
        borderRadius: 22, padding: '26px 24px',
        transition: 'transform 0.3s, border-color 0.3s, background 0.3s',
        transform: hov ? 'translateY(-4px)' : 'none',
        boxShadow: hov ? `0 20px 48px ${c.rosa}18` : `0 1px 4px rgba(0,0,0,0.04)`,
      }}
    >
      <blockquote style={{ fontFamily: F.display, fontSize: 15, fontStyle: 'italic', color: c.dark, lineHeight: 1.8, marginBottom: 22 }}>
        "{t.text}"
      </blockquote>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 18, borderTop: `1px solid ${c.border}` }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: F.body, flexShrink: 0 }}>
          {t.initials}
        </div>
        <div>
          <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: c.dark }}>{t.name}</div>
          <div style={{ fontFamily: F.body,    fontSize: 12, color: '#94a3b8' }}>{t.role}</div>
        </div>
      </div>
    </div>
  );
}
