import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, CalendarDays, FileText, CreditCard, Bell, BarChart3, CheckCircle2, ArrowRight } from 'lucide-react';

/* ─── ORGANIC ANCHOR ───────────────────────────────────────────────
   Surface:    sand #E8DCC7  /  oat #D4B895  /  terracotta #C66B3D
               sage #8B9D83  /  clay #B08B6E  /  moss #606C38
   Typography: Fraunces (display, italic allowed — ONLY this anchor)
               Epilogue (body, labels, nav)
   Corners:    18–28 px
   Texture:    SVG grain on hero + section dividers
   Motion:     ease 300–400 ms, translateY(-3px) max
   BREAKS IF:  cold grey, pure white, pure black, hard rectangles
──────────────────────────────────────────────────────────────────── */

const FEATURES = [
  { icon: Users,       title: 'Gestión de Pacientes',    desc: 'Fichas completas con datos, obra social, entrevista de admisión, sesiones y evaluaciones.' },
  { icon: CalendarDays,title: 'Agenda de Turnos',         desc: 'Calendario visual por consultorio. Vista día, semana o mes de un vistazo.' },
  { icon: FileText,    title: 'Sesiones & Evaluaciones',  desc: 'Historial clínico completo con acceso inmediato a cada sesión y evaluación.' },
  { icon: CreditCard,  title: 'Control de Pagos',         desc: 'Registro de cobros, obras sociales y deudas. Sabés siempre cuánto facturaste.' },
  { icon: Bell,        title: 'Recordatorios WhatsApp',   desc: 'Recordatorios automáticos de turno con mensaje y formato personalizable.' },
  { icon: BarChart3,   title: 'Informes & Reportes',      desc: 'Reportes por paciente, obra social o período. Decisiones basadas en datos reales.' },
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

/* inline SVG grain — baked as data URI so no extra request */
const GRAIN_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`;

const f = {
  display: "'Fraunces', Georgia, serif",
  body:    "'Epilogue', system-ui, sans-serif",
};

const c = {
  sand:        '#E8DCC7',
  oat:         '#D4B895',
  clay:        '#B08B6E',
  terracotta:  '#C66B3D',
  sage:        '#8B9D83',
  moss:        '#606C38',
  dark:        '#2A1A0A',
  mid:         '#5C3D1E',
  light:       '#F5EDE0',
};

export default function Landing() {
  return (
    <div style={{ fontFamily: f.body, background: c.sand, color: c.dark, minHeight: '100vh' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: c.sand,
        borderBottom: `1px solid ${c.oat}`,
      }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          <span style={{ fontFamily: f.display, fontWeight: 900, fontSize: 20, letterSpacing: '-0.02em', color: c.dark }}>
            Agenda<span style={{ color: c.terracotta }}>Psicope</span>
          </span>

          <div style={{ display: 'flex', gap: 40 }}>
            <a href="#features"     style={{ fontFamily: f.body, fontSize: 14, color: c.mid, textDecoration: 'none', fontWeight: 500 }}>Características</a>
            <a href="#testimonials" style={{ fontFamily: f.body, fontSize: 14, color: c.mid, textDecoration: 'none', fontWeight: 500 }}>Testimonios</a>
          </div>

          <Link to="/login" style={{
            fontFamily: f.body, fontSize: 13, fontWeight: 700,
            background: c.terracotta, color: c.sand,
            padding: '9px 22px', borderRadius: 99,
            textDecoration: 'none',
            border: 'none',
          }}>
            Ingresar
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        background: c.terracotta,
        backgroundImage: GRAIN_BG,
        backgroundRepeat: 'repeat',
        padding: '100px 32px 88px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* big decorative circle */}
        <div style={{
          position: 'absolute', right: -140, top: -140,
          width: 560, height: 560, borderRadius: '50%',
          background: 'rgba(232,220,199,0.09)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <p style={{
            fontFamily: f.body, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'rgba(232,220,199,0.7)', marginBottom: 24,
          }}>
            Sistema de gestión para psicopedagogas
          </p>

          <h1 style={{
            fontFamily: f.display,
            fontSize: 'clamp(3.2rem, 7vw, 6rem)',
            fontWeight: 900, fontStyle: 'italic',
            lineHeight: 1.0, letterSpacing: '-0.03em',
            color: c.sand,
            marginBottom: 28,
          }}>
            Tu práctica,<br />
            <span style={{ color: c.oat }}>organizada.</span>
          </h1>

          <p style={{
            fontFamily: f.body, fontSize: 17,
            color: 'rgba(232,220,199,0.82)',
            maxWidth: 460, margin: '0 auto 44px',
            lineHeight: 1.8,
          }}>
            Gestioná pacientes, turnos, sesiones y pagos desde un solo lugar. Pensado para la práctica psicopedagógica argentina.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" style={{
              fontFamily: f.body, fontSize: 15, fontWeight: 700,
              background: c.sand, color: c.terracotta,
              padding: '14px 32px', borderRadius: 99,
              textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              transition: 'background 0.3s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = c.light}
              onMouseLeave={e => e.currentTarget.style.background = c.sand}>
              Acceder al sistema <ArrowRight size={15} />
            </Link>
            <a href="#features" style={{
              fontFamily: f.body, fontSize: 15, fontWeight: 600,
              color: c.sand,
              padding: '14px 32px', borderRadius: 99,
              textDecoration: 'none',
              border: `1.5px solid rgba(232,220,199,0.4)`,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              transition: 'border-color 0.3s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(232,220,199,0.8)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(232,220,199,0.4)'}>
              Ver características
            </a>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{
        background: c.clay,
        backgroundImage: GRAIN_BG,
        backgroundRepeat: 'repeat',
        padding: '52px 32px',
        borderBottom: `1px solid ${c.oat}`,
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, textAlign: 'center' }}>
          {[
            { v: '100%', l: 'Online, sin instalar nada' },
            { v: '5 min', l: 'Para empezar a usarlo' },
            { v: '24/7',  l: 'Acceso desde cualquier lugar' },
            { v: '∞',     l: 'Pacientes y sesiones' },
          ].map(s => (
            <div key={s.l}>
              <div style={{ fontFamily: f.display, fontSize: 38, fontWeight: 900, fontStyle: 'italic', color: c.sand, lineHeight: 1, marginBottom: 6 }}>{s.v}</div>
              <div style={{ fontFamily: f.body, fontSize: 13, color: 'rgba(232,220,199,0.75)', fontWeight: 500 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ background: c.sand, padding: '96px 32px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ marginBottom: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 28, height: 3, background: c.terracotta, borderRadius: 2 }} />
              <span style={{ fontFamily: f.body, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: c.terracotta }}>Características</span>
            </div>
            <h2 style={{ fontFamily: f.display, fontSize: 'clamp(2.2rem,4vw,3.4rem)', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.025em', lineHeight: 1.05, color: c.dark, marginBottom: 14 }}>
              Todo lo que necesitás,<br />en un solo sistema.
            </h2>
            <p style={{ fontFamily: f.body, fontSize: 16, color: c.mid, maxWidth: 440, lineHeight: 1.75 }}>
              Sin funciones innecesarias. Sin curva de aprendizaje.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 18 }}>
            {FEATURES.map(feat => <FeatureCard key={feat.title} feat={feat} />)}
          </div>
        </div>
      </section>

      {/* ── SPLIT ── */}
      <section style={{
        background: c.oat,
        backgroundImage: GRAIN_BG, backgroundRepeat: 'repeat',
        borderTop: `1px solid ${c.clay}`, borderBottom: `1px solid ${c.clay}`,
        padding: '96px 32px',
      }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 28, height: 3, background: c.sage, borderRadius: 2 }} />
              <span style={{ fontFamily: f.body, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: c.sage }}>Por qué AgendaPsicope</span>
            </div>
            <h2 style={{ fontFamily: f.display, fontSize: 'clamp(2rem,3.5vw,2.8rem)', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.025em', lineHeight: 1.08, color: c.dark, marginBottom: 18 }}>
              Pensado para vos,<br /><span style={{ color: c.terracotta }}>psicopedagoga.</span>
            </h2>
            <p style={{ fontFamily: f.body, fontSize: 16, color: c.mid, lineHeight: 1.8, marginBottom: 36 }}>
              No es un sistema genérico adaptado. Fue construido desde cero para las necesidades reales de una práctica psicopedagógica en Argentina.
            </p>
            <Link to="/login" style={{
              fontFamily: f.body, fontSize: 14, fontWeight: 700,
              background: c.moss, color: c.sand,
              padding: '12px 28px', borderRadius: 99,
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
              transition: 'background 0.3s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = c.sage}
              onMouseLeave={e => e.currentTarget.style.background = c.moss}>
              Empezar ahora <ArrowRight size={14} />
            </Link>
          </div>

          <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: 0 }}>
            {BENEFITS.map(b => (
              <li key={b} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: c.sand, border: `1px solid ${c.clay}`,
                borderRadius: 18, padding: '13px 18px',
              }}>
                <CheckCircle2 size={16} style={{ color: c.sage, flexShrink: 0 }} />
                <span style={{ fontFamily: f.body, fontSize: 14, fontWeight: 500, color: c.dark }}>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" style={{ background: c.sand, padding: '96px 32px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 28, height: 3, background: c.terracotta, borderRadius: 2 }} />
              <span style={{ fontFamily: f.body, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: c.terracotta }}>Testimonios</span>
              <div style={{ width: 28, height: 3, background: c.terracotta, borderRadius: 2 }} />
            </div>
            <h2 style={{ fontFamily: f.display, fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.025em', color: c.dark }}>
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
        background: c.moss,
        backgroundImage: GRAIN_BG, backgroundRepeat: 'repeat',
        padding: '96px 32px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', bottom: -100, left: -100,
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(232,220,199,0.06)', pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative' }}>
          <h2 style={{ fontFamily: f.display, fontSize: 'clamp(2.4rem,5vw,4rem)', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.03em', color: c.sand, marginBottom: 16, lineHeight: 1.0 }}>
            Organizá tu práctica hoy.
          </h2>
          <p style={{ fontFamily: f.body, fontSize: 17, color: 'rgba(232,220,199,0.78)', marginBottom: 44, lineHeight: 1.75 }}>
            Accedé al sistema y gestioná tu práctica de manera profesional.
          </p>
          <Link to="/login" style={{
            fontFamily: f.body, fontSize: 16, fontWeight: 700,
            background: c.sand, color: c.moss,
            padding: '16px 40px', borderRadius: 99,
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9,
            transition: 'background 0.3s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = c.light}
            onMouseLeave={e => e.currentTarget.style.background = c.sand}>
            Ingresar al sistema <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: c.dark,
        backgroundImage: GRAIN_BG, backgroundRepeat: 'repeat',
        borderTop: `1px solid rgba(90,55,20,0.4)`, padding: '26px 32px',
      }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontFamily: f.display, fontWeight: 900, fontSize: 16, color: c.oat }}>
            Agenda<span style={{ color: c.terracotta }}>Psicope</span>
          </span>
          <span style={{ fontFamily: f.body, fontSize: 12, color: c.clay }}>
            Sistema de gestión para psicopedagogas · {new Date().getFullYear()}
          </span>
          <Link to="/login" style={{ fontFamily: f.body, fontSize: 13, color: c.terracotta, textDecoration: 'none', fontWeight: 600 }}>
            Ingresar →
          </Link>
        </div>
      </footer>

    </div>
  );
}

function FeatureCard({ feat: f_ }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? c.oat : '#DDD0B8',
        border: `1px solid ${hov ? c.terracotta : c.clay}`,
        borderRadius: 22, padding: '28px 26px',
        transition: 'transform 0.3s ease, background 0.3s, border-color 0.3s',
        transform: hov ? 'translateY(-4px)' : 'none',
        cursor: 'default',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        background: hov ? c.terracotta : c.clay,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 18, transition: 'background 0.3s',
      }}>
        <f_.icon size={20} style={{ color: c.sand }} />
      </div>
      <h3 style={{ fontFamily: f.display, fontSize: 18, fontWeight: 700, color: c.dark, marginBottom: 10, letterSpacing: '-0.01em' }}>{f_.title}</h3>
      <p  style={{ fontFamily: f.body,    fontSize: 14, color: c.mid, lineHeight: 1.7 }}>{f_.desc}</p>
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
        background: hov ? c.oat : '#DDD0B8',
        border: `1px solid ${hov ? c.sage : c.clay}`,
        borderRadius: 22, padding: '26px 24px',
        transition: 'transform 0.3s ease, background 0.3s, border-color 0.3s',
        transform: hov ? 'translateY(-3px)' : 'none',
      }}
    >
      <blockquote style={{ fontFamily: f.display, fontSize: 16, fontStyle: 'italic', color: c.dark, lineHeight: 1.8, marginBottom: 22 }}>
        "{t.text}"
      </blockquote>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 18, borderTop: `1px solid ${c.clay}` }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: c.sage, color: c.sand,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, fontFamily: f.body, flexShrink: 0,
        }}>
          {t.initials}
        </div>
        <div>
          <div style={{ fontFamily: f.display, fontSize: 14, fontWeight: 700, color: c.dark }}>{t.name}</div>
          <div style={{ fontFamily: f.body,    fontSize: 12, color: c.clay }}>{t.role}</div>
        </div>
      </div>
    </div>
  );
}
