import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, CalendarDays, FileText, CreditCard, Bell, BarChart3, CheckCircle2, ArrowRight } from 'lucide-react';

const FEATURES = [
  { icon: Users, title: 'Gestión de Pacientes', desc: 'Fichas completas con datos, obra social, entrevista de admisión, sesiones y evaluaciones.' },
  { icon: CalendarDays, title: 'Agenda de Turnos', desc: 'Calendario visual por consultorio. Vista día, semana o mes de un vistazo.' },
  { icon: FileText, title: 'Sesiones & Evaluaciones', desc: 'Historial clínico completo con acceso inmediato a cada sesión y evaluación.' },
  { icon: CreditCard, title: 'Control de Pagos', desc: 'Registro de cobros, obras sociales y deudas. Sabés siempre cuánto facturaste.' },
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

// SVG grain filter — Organic anchor texture
const GrainFilter = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }}>
    <defs>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
        <feBlend in="SourceGraphic" mode="multiply" />
      </filter>
    </defs>
  </svg>
);

const grainOverlay = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'repeat',
  backgroundSize: '128px 128px',
  opacity: 0.6,
  zIndex: 1,
};

export default function Landing() {
  return (
    <div style={{
      fontFamily: "'Epilogue', 'Georgia', serif",
      background: '#E8DCC7',
      color: '#2C1A0E',
      minHeight: '100vh',
      position: 'relative',
    }}>
      <GrainFilter />

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(232,220,199,0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #C8B89A',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 28px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: '#C66B3D',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#E8DCC7', fontSize: 18, fontWeight: 700, fontFamily: "'Fraunces', 'Georgia', serif" }}>A</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 17, fontFamily: "'Fraunces', 'Georgia', serif", letterSpacing: '-0.01em', color: '#2C1A0E' }}>
              Agenda<span style={{ color: '#8B9D83' }}>Psicope</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 36 }}>
            <a href="#features" style={{ fontSize: 14, color: '#6B5240', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}>Características</a>
            <a href="#testimonials" style={{ fontSize: 14, color: '#6B5240', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}>Testimonios</a>
          </div>
          <Link to="/login" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#C66B3D', color: '#E8DCC7',
            padding: '10px 20px', borderRadius: 20,
            fontSize: 13, fontWeight: 700, textDecoration: 'none',
            transition: 'background 0.25s, transform 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#A85530'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#C66B3D'; e.currentTarget.style.transform = 'none'; }}>
            Ingresar <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(150deg, #C66B3D 0%, #B08B6E 35%, #8B9D83 100%)',
        padding: '112px 28px 96px',
      }}>
        <div style={grainOverlay} />
        {/* Círculo decorativo */}
        <div style={{
          position: 'absolute', top: -120, right: -120,
          width: 520, height: 520,
          borderRadius: '50%',
          background: 'rgba(232,220,199,0.08)',
          pointerEvents: 'none',
          zIndex: 1,
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -60,
          width: 320, height: 320,
          borderRadius: '50%',
          background: 'rgba(44,26,14,0.06)',
          pointerEvents: 'none',
          zIndex: 1,
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <p style={{
            display: 'inline-block',
            fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: '#E8DCC7', opacity: 0.8,
            marginBottom: 28,
            fontFamily: "'Epilogue', sans-serif",
          }}>
            Sistema de gestión para psicopedagogas
          </p>

          <h1 style={{
            fontFamily: "'Fraunces', 'Georgia', serif",
            fontSize: 'clamp(3rem, 7vw, 5.5rem)',
            fontWeight: 900,
            lineHeight: 1.02,
            letterSpacing: '-0.03em',
            color: '#E8DCC7',
            marginBottom: 28,
          }}>
            Tu práctica,<br />
            <span style={{ color: '#F5E6D0', fontStyle: 'italic' }}>cuidada</span> y organizada.
          </h1>

          <p style={{
            fontSize: 18, color: 'rgba(232,220,199,0.85)',
            maxWidth: 480, margin: '0 auto 44px',
            lineHeight: 1.75,
            fontFamily: "'Epilogue', sans-serif",
          }}>
            Gestioná pacientes, turnos, sesiones y pagos desde un solo lugar. Pensado para la práctica psicopedagógica argentina.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#E8DCC7', color: '#2C1A0E',
              padding: '15px 30px', borderRadius: 24,
              fontSize: 15, fontWeight: 700, textDecoration: 'none',
              transition: 'transform 0.25s, background 0.2s',
              fontFamily: "'Epilogue', sans-serif",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#F5EDE0'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#E8DCC7'; }}>
              Acceder al sistema <ArrowRight size={15} />
            </Link>
            <a href="#features" style={{
              display: 'inline-flex', alignItems: 'center',
              border: '1.5px solid rgba(232,220,199,0.45)', color: '#E8DCC7',
              padding: '15px 30px', borderRadius: 24,
              fontSize: 15, fontWeight: 600, textDecoration: 'none',
              transition: 'border-color 0.2s, background 0.2s',
              fontFamily: "'Epilogue', sans-serif",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(232,220,199,0.1)'; e.currentTarget.style.borderColor = 'rgba(232,220,199,0.7)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(232,220,199,0.45)'; }}>
              Ver características
            </a>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: '#D4C4AD', borderBottom: '1px solid #C8B89A', padding: '52px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={grainOverlay} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 28, textAlign: 'center' }}>
          {[
            { v: '100%', l: 'Online, sin instalar nada' },
            { v: '5 min', l: 'Para empezar a usarlo' },
            { v: '24/7', l: 'Acceso desde cualquier lugar' },
            { v: '∞', l: 'Pacientes y sesiones' },
          ].map(s => (
            <div key={s.l}>
              <div style={{
                fontFamily: "'Fraunces', 'Georgia', serif",
                fontSize: 36, fontWeight: 900, letterSpacing: '-0.04em',
                color: '#C66B3D',
                lineHeight: 1,
                marginBottom: 6,
              }}>{s.v}</div>
              <div style={{ fontSize: 13, color: '#6B5240', fontWeight: 500, fontFamily: "'Epilogue', sans-serif" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ background: '#E8DCC7', padding: '100px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={grainOverlay} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 60 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 32, height: 3, background: '#C66B3D', borderRadius: 2 }} />
              <span style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
                color: '#C66B3D', fontFamily: "'Epilogue', sans-serif",
              }}>Características</span>
            </div>
            <h2 style={{
              fontFamily: "'Fraunces', 'Georgia', serif",
              fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
              fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.1,
              color: '#2C1A0E', marginBottom: 16,
            }}>
              Todo lo que necesitás,<br />en un solo sistema.
            </h2>
            <p style={{ fontSize: 16, color: '#6B5240', maxWidth: 460, lineHeight: 1.75, fontFamily: "'Epilogue', sans-serif" }}>
              Sin funciones innecesarias. Sin curva de aprendizaje. Diseñado para la práctica psicopedagógica.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {FEATURES.map(f => <FeatureCard key={f.title} feature={f} />)}
          </div>
        </div>
      </section>

      {/* SPLIT — Por qué */}
      <section style={{ background: '#D4C4AD', borderTop: '1px solid #C8B89A', borderBottom: '1px solid #C8B89A', padding: '100px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={grainOverlay} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 32, height: 3, background: '#8B9D83', borderRadius: 2 }} />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8B9D83', fontFamily: "'Epilogue', sans-serif" }}>Por qué AgendaPsicope</span>
            </div>
            <h2 style={{
              fontFamily: "'Fraunces', 'Georgia', serif",
              fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
              fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.1,
              color: '#2C1A0E', marginBottom: 20,
            }}>
              Pensado para vos,{' '}
              <span style={{ color: '#C66B3D', fontStyle: 'italic' }}>psicopedagoga.</span>
            </h2>
            <p style={{ fontSize: 16, color: '#6B5240', lineHeight: 1.8, marginBottom: 36, fontFamily: "'Epilogue', sans-serif" }}>
              No es un sistema genérico adaptado. Fue construido desde cero para las necesidades reales de una práctica psicopedagógica en Argentina.
            </p>
            <Link to="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#C66B3D', color: '#E8DCC7',
              padding: '13px 26px', borderRadius: 20,
              fontSize: 14, fontWeight: 700, textDecoration: 'none',
              transition: 'background 0.25s, transform 0.2s',
              fontFamily: "'Epilogue', sans-serif",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#A85530'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#C66B3D'; e.currentTarget.style.transform = 'none'; }}>
              Empezar ahora <ArrowRight size={14} />
            </Link>
          </div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {BENEFITS.map(b => (
              <li key={b} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: '#E8DCC7', border: '1px solid #C8B89A',
                borderRadius: 18, padding: '14px 20px',
              }}>
                <CheckCircle2 size={16} style={{ color: '#8B9D83', flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: '#2C1A0E', fontFamily: "'Epilogue', sans-serif" }}>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" style={{ background: '#E8DCC7', padding: '100px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={grainOverlay} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 32, height: 3, background: '#C66B3D', borderRadius: 2 }} />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C66B3D', fontFamily: "'Epilogue', sans-serif" }}>Testimonios</span>
              <div style={{ width: 32, height: 3, background: '#C66B3D', borderRadius: 2 }} />
            </div>
            <h2 style={{
              fontFamily: "'Fraunces', 'Georgia', serif",
              fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
              fontWeight: 900, letterSpacing: '-0.025em',
              color: '#2C1A0E',
            }}>
              Lo que dicen las profesionales
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {TESTIMONIALS.map(t => <TestimonialCard key={t.name} t={t} />)}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #606C38 0%, #8B9D83 50%, #C08E3A 100%)',
        padding: '100px 28px', textAlign: 'center',
      }}>
        <div style={grainOverlay} />
        <div style={{
          position: 'absolute', top: -60, right: '20%',
          width: 280, height: 280, borderRadius: '50%',
          background: 'rgba(232,220,199,0.07)', pointerEvents: 'none', zIndex: 1,
        }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 580, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: "'Fraunces', 'Georgia', serif",
            fontSize: 'clamp(2.2rem, 4.5vw, 3.6rem)',
            fontWeight: 900, letterSpacing: '-0.03em',
            color: '#E8DCC7', marginBottom: 18, lineHeight: 1.05,
          }}>
            Organizá tu práctica hoy.
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(232,220,199,0.8)', marginBottom: 44, lineHeight: 1.75, fontFamily: "'Epilogue', sans-serif" }}>
            Accedé al sistema y gestioná tu práctica de manera profesional.
          </p>
          <Link to="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 9,
            background: '#E8DCC7', color: '#2C1A0E',
            padding: '17px 38px', borderRadius: 28,
            fontSize: 16, fontWeight: 700, textDecoration: 'none',
            transition: 'transform 0.25s, background 0.2s',
            fontFamily: "'Epilogue', sans-serif",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#F5EDE0'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#E8DCC7'; }}>
            Ingresar al sistema <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#2C1A0E', borderTop: '1px solid #4A2E1A', padding: '28px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={grainOverlay} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: '#C66B3D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#E8DCC7', fontSize: 15, fontWeight: 700, fontFamily: "'Fraunces', serif" }}>A</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#E8DCC7', fontFamily: "'Fraunces', serif" }}>
              Agenda<span style={{ color: '#8B9D83' }}>Psicope</span>
            </span>
          </div>
          <span style={{ fontSize: 12, color: '#6B5240', fontFamily: "'Epilogue', sans-serif" }}>
            Sistema de gestión para psicopedagogas · {new Date().getFullYear()}
          </span>
          <Link to="/login" style={{ fontSize: 13, color: '#C66B3D', textDecoration: 'none', fontWeight: 600, fontFamily: "'Epilogue', sans-serif" }}>
            Ingresar →
          </Link>
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
        position: 'relative', overflow: 'hidden',
        background: hovered ? '#F0E6D4' : '#DDD0B8',
        border: `1px solid ${hovered ? '#C66B3D' : '#C8B89A'}`,
        borderRadius: 22, padding: 28,
        cursor: 'default',
        transition: 'transform 0.3s, border-color 0.3s, background 0.3s',
        transform: hovered ? 'translateY(-5px)' : 'none',
      }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: 14,
        background: hovered ? '#C66B3D' : '#B08B6E',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 18,
        transition: 'background 0.3s',
      }}>
        <f.icon size={20} style={{ color: '#E8DCC7' }} />
      </div>
      <h3 style={{
        fontFamily: "'Fraunces', 'Georgia', serif",
        fontSize: 17, fontWeight: 700, color: '#2C1A0E', marginBottom: 10,
      }}>{f.title}</h3>
      <p style={{ fontSize: 14, color: '#6B5240', lineHeight: 1.7, fontFamily: "'Epilogue', sans-serif" }}>{f.desc}</p>
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
        background: hovered ? '#F0E6D4' : '#DDD0B8',
        border: `1px solid ${hovered ? '#8B9D83' : '#C8B89A'}`,
        borderRadius: 22, padding: 28,
        transition: 'transform 0.3s, border-color 0.3s, background 0.3s',
        transform: hovered ? 'translateY(-4px)' : 'none',
      }}
    >
      <blockquote style={{
        fontFamily: "'Fraunces', 'Georgia', serif",
        fontSize: 16, color: '#2C1A0E', lineHeight: 1.8,
        fontStyle: 'italic', marginBottom: 22,
      }}>
        "{t.text}"
      </blockquote>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 18, borderTop: '1px solid #C8B89A' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: '#8B9D83',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#E8DCC7', fontSize: 13, fontWeight: 700, flexShrink: 0,
          fontFamily: "'Epilogue', sans-serif",
        }}>
          {t.initials}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', fontFamily: "'Fraunces', serif" }}>{t.name}</div>
          <div style={{ fontSize: 12, color: '#8B9D83', fontFamily: "'Epilogue', sans-serif" }}>{t.role}</div>
        </div>
      </div>
    </div>
  );
}
