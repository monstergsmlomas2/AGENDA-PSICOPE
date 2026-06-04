import { Link } from 'react-router-dom';
import {
  Brain,
  CalendarDays,
  Users,
  FileText,
  CreditCard,
  Bell,
  ChevronRight,
  CheckCircle2,
  Star,
  Shield,
  Smartphone,
  MessageCircle,
  BarChart3,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Users,
    title: 'Gestión de Pacientes',
    desc: 'Fichas completas con datos, obra social, entrevista de admisión, sesiones y evaluaciones.',
  },
  {
    icon: CalendarDays,
    title: 'Agenda de Turnos',
    desc: 'Calendario visual por consultorio. Vista día, semana o mes de un vistazo.',
  },
  {
    icon: FileText,
    title: 'Sesiones & Evaluaciones',
    desc: 'Historial clínico completo con acceso inmediato a cada sesión y evaluación.',
  },
  {
    icon: CreditCard,
    title: 'Control de Pagos',
    desc: 'Registro de cobros, obras sociales y deudas. Sabé siempre cuánto facturaste.',
  },
  {
    icon: Bell,
    title: 'Recordatorios WhatsApp',
    desc: 'Recordatorios automáticos de turno con formato y mensaje personalizable.',
  },
  {
    icon: BarChart3,
    title: 'Informes & Reportes',
    desc: 'Reportes por paciente, obra social o período. Decisiones basadas en datos reales.',
  },
];

const TESTIMONIALS = [
  {
    initials: 'MG',
    name: 'María González',
    role: 'Psicopedagoga · Buenos Aires',
    text: 'Antes llevaba todo en papel y Excel. Ahora tengo pacientes, turnos y pagos en un solo lugar. No puedo creer que tardé tanto en usarlo.',
  },
  {
    initials: 'LC',
    name: 'Laura Cáceres',
    role: 'Psicopedagoga · Córdoba',
    text: 'Los recordatorios por WhatsApp me cambiaron la vida. Casi no hay inasistencias. La agenda es super intuitiva y fácil de usar.',
  },
  {
    initials: 'VR',
    name: 'Valentina Ríos',
    role: 'Psicopedagoga · Rosario',
    text: 'El historial de sesiones por paciente es exactamente lo que necesitaba. Ahora puedo concentrarme en lo que realmente importa.',
  },
];

const STATS = [
  { value: '100%', label: 'Online, sin instalar nada' },
  { value: '5 min', label: 'Para empezar a usarlo' },
  { value: '24/7', label: 'Acceso desde cualquier lugar' },
  { value: '∞', label: 'Pacientes y sesiones' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 antialiased">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl flex items-center justify-center shadow-sm">
              <Brain size={16} className="text-white" />
            </div>
            <span className="font-bold text-[15px] tracking-tight">
              <span className="text-slate-900">Agenda</span>
              <span className="text-violet-600">Psicope</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-7">
            <a href="#features" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">Características</a>
            <a href="#testimonials" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">Testimonios</a>
          </div>

          <Link
            to="/login"
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Ingresar
            <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-white pt-20 pb-16 px-6">
        {/* Grid sutil de fondo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, #f1f5f9 1px, transparent 1px),
              linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
          }}
        />
        {/* Glow violeta/rosa muy sutil */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center top, rgba(139,92,246,0.08) 0%, rgba(236,72,153,0.05) 40%, transparent 70%)',
          }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 text-violet-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
            <Sparkles size={12} />
            Sistema de gestión para psicopedagogas
          </div>

          <h1 className="text-[3.5rem] md:text-[4.5rem] font-black leading-[1.05] tracking-tight text-slate-900 mb-6">
            Tu práctica,{' '}
            <span
              className="inline-block"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              organizada
            </span>
            <br />y profesional.
          </h1>

          <p className="text-lg md:text-xl text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Gestioná pacientes, turnos, sesiones y pagos desde un solo lugar.
            Pensado para la práctica psicopedagógica argentina.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', boxShadow: '0 4px 24px rgba(124,58,237,0.25)' }}
            >
              Acceder al sistema
              <ArrowRight size={16} />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 bg-slate-50 text-slate-700 font-semibold text-sm px-6 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              Ver características
            </a>
          </div>

          <p className="text-xs text-slate-400 flex items-center justify-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5"><Shield size={12} /> Datos seguros</span>
            <span className="text-slate-200">|</span>
            <span className="flex items-center gap-1.5"><Smartphone size={12} /> Cualquier dispositivo</span>
            <span className="text-slate-200">|</span>
            <span className="flex items-center gap-1.5"><MessageCircle size={12} /> WhatsApp integrado</span>
          </p>
        </div>

        {/* Mock app */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <div
            className="rounded-2xl overflow-hidden border border-slate-200/80"
            style={{ boxShadow: '0 32px 80px rgba(15,23,42,0.12), 0 0 0 1px rgba(15,23,42,0.04)' }}
          >
            {/* Barra de título */}
            <div className="bg-slate-100 px-4 py-3 flex items-center gap-3 border-b border-slate-200">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <span className="text-xs text-slate-400 bg-white border border-slate-200 rounded-lg px-4 py-1 font-medium">
                  entrerizospsicope.vercel.app/dashboard
                </span>
              </div>
            </div>

            {/* Contenido */}
            <div className="bg-slate-50 p-6">
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Pacientes activos', val: '24', color: '#7c3aed' },
                  { label: 'Turnos esta semana', val: '12', color: '#db2777' },
                  { label: 'Cobros del mes', val: '$186k', color: '#7c3aed' },
                  { label: 'Sin sesión reciente', val: '3', color: '#f59e0b' },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <div className="w-6 h-6 rounded-lg mb-2" style={{ background: s.color, opacity: 0.15 }} />
                    <div className="text-xl font-black text-slate-900">{s.val}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{s.label}</div>
                  </div>
                ))}
              </div>
              {/* Cards row */}
              <div className="grid grid-cols-3 gap-3">
                {['Próximos turnos', 'Últimas sesiones', 'Pagos pendientes'].map((t, i) => (
                  <div key={t} className="bg-white rounded-xl border border-slate-100 p-4 space-y-2.5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <div className="text-xs font-bold text-slate-600">{t}</div>
                    <div className="space-y-1.5">
                      <div className="h-2 rounded-full bg-slate-100" style={{ width: '90%' }} />
                      <div className="h-2 rounded-full bg-slate-100" style={{ width: '70%' }} />
                      <div className="h-2 rounded-full bg-slate-100" style={{ width: '50%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sombra decorativa debajo */}
          <div
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(8px)' }}
          />
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 px-6 border-y border-slate-100 bg-white">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div
                className="text-3xl font-black mb-1"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
              >
                {s.value}
              </div>
              <div className="text-sm text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-16">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-violet-600 mb-4">
              <span className="w-4 h-px bg-violet-400 inline-block" />
              Características
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
              Todo lo que necesitás,<br />en un solo sistema.
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed">
              Sin funciones innecesarias. Sin curva de aprendizaje. Diseñado específicamente para la práctica psicopedagógica.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group relative bg-white border border-slate-100 rounded-2xl p-6 hover:border-violet-200 transition-all duration-300 cursor-default"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(219,39,119,0.08))' }}
                >
                  <f.icon size={18} style={{ color: '#7c3aed' }} />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPLIT SECTION ── */}
      <section className="py-24 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-violet-600 mb-4">
              <span className="w-4 h-px bg-violet-400 inline-block" />
              Por qué AgendaPsicope
            </span>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight mb-6">
              Pensado para vos,<br />
              <span style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                psicopedagoga.
              </span>
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              No es un sistema genérico adaptado. Fue construido desde cero para las necesidades reales de una práctica psicopedagógica en Argentina.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', boxShadow: '0 4px 20px rgba(124,58,237,0.2)' }}
            >
              Empezar ahora
              <ArrowRight size={15} />
            </Link>
          </div>

          <ul className="space-y-3">
            {[
              'Sin instalación — funciona desde el navegador',
              'Acceso desde cualquier dispositivo',
              'Datos seguros en la nube',
              'Modo oscuro y claro incluidos',
              'Diseñado para psicopedagogas argentinas',
              'Actualizaciones automáticas sin costo extra',
            ].map((b) => (
              <li key={b} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3.5 border border-slate-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <CheckCircle2 size={16} style={{ color: '#7c3aed', flexShrink: 0 }} />
                <span className="text-sm font-medium text-slate-700">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-violet-600 mb-4">
              <span className="w-4 h-px bg-violet-400 inline-block" />
              Testimonios
            </span>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              Lo que dicen las profesionales
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-white border border-slate-100 rounded-2xl p-6 hover:border-violet-100 transition-all"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,0.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="text-sm text-slate-600 leading-relaxed mb-6">
                  "{t.text}"
                </blockquote>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-24 px-6 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-8"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', boxShadow: '0 8px 32px rgba(124,58,237,0.4)' }}
          >
            <Brain size={26} className="text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Organizá tu práctica hoy.
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            Accedé al sistema y gestioná tu práctica de manera profesional.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-white font-bold text-base px-8 py-4 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', boxShadow: '0 4px 24px rgba(124,58,237,0.3)' }}
          >
            Ingresar al sistema
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-950 border-t border-slate-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
              <Brain size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-300">
              Agenda<span className="text-violet-400">Psicope</span>
            </span>
          </div>
          <p className="text-xs text-slate-600 text-center">
            Sistema de gestión para psicopedagogas · {new Date().getFullYear()}
          </p>
          <Link to="/login" className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium">
            Ingresar →
          </Link>
        </div>
      </footer>
    </div>
  );
}
