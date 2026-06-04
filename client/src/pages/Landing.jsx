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
  BarChart3,
  MessageCircle,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Users,
    title: 'Gestión de Pacientes',
    desc: 'Fichas completas con datos personales, obra social, entrevista de admisión, sesiones y evaluaciones en un solo lugar.',
    tag: 'Organización total',
  },
  {
    icon: CalendarDays,
    title: 'Agenda de Turnos',
    desc: 'Calendario visual para gestionar turnos por consultorio. Visualizá el día, la semana o el mes de un vistazo.',
    tag: 'Calendario integrado',
  },
  {
    icon: FileText,
    title: 'Sesiones & Evaluaciones',
    desc: 'Registrá el contenido de cada sesión y las evaluaciones con historial completo y acceso inmediato.',
    tag: 'Historial clínico',
  },
  {
    icon: CreditCard,
    title: 'Control de Pagos',
    desc: 'Llevá el registro de cobros, obras sociales y deudas pendientes. Sabé siempre cuánto facturaste.',
    tag: 'Finanzas claras',
  },
  {
    icon: Bell,
    title: 'Recordatorios por WhatsApp',
    desc: 'Enviá recordatorios automáticos de turno a tus pacientes por WhatsApp, con formato personalizable.',
    tag: 'Automatización',
  },
  {
    icon: BarChart3,
    title: 'Informes & Reportes',
    desc: 'Generá informes por paciente, obra social o período. Tomá decisiones basadas en datos reales de tu práctica.',
    tag: 'Análisis de datos',
  },
];

const BENEFITS = [
  'Sin instalación — funciona desde el navegador',
  'Acceso desde cualquier dispositivo',
  'Datos seguros en la nube (Supabase)',
  'Modo oscuro y claro incluidos',
  'Diseñado para psicopedagogas argentinas',
  'Actualizaciones automáticas sin costo extra',
];

const TESTIMONIALS = [
  {
    initials: 'MG',
    name: 'María González',
    role: 'Psicopedagoga — Buenos Aires',
    text: 'Antes llevaba todo en papel y Excel. Con AgendaPsicope organicé mis pacientes, turnos y pagos en un solo lugar. No puedo creer que tardé tanto en usarlo.',
  },
  {
    initials: 'LC',
    name: 'Laura Cáceres',
    role: 'Psicopedagoga — Córdoba',
    text: 'Los recordatorios por WhatsApp me cambiaron la vida. Casi no hay inasistencias y mis pacientes lo agradecen. La agenda es super intuitiva.',
  },
  {
    initials: 'VR',
    name: 'Valentina Ríos',
    role: 'Psicopedagoga — Rosario',
    text: 'El historial de sesiones y evaluaciones por paciente es exactamente lo que necesitaba. Ahora tengo todo organizado y puedo concentrarme en lo que importa.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-pink-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-pink-100 p-1.5 rounded-xl">
              <Brain size={22} className="text-pink-600" />
            </div>
            <span className="font-bold text-lg">
              <span className="text-slate-900">Agenda</span>
              <span className="text-pink-600">Psicope</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-500 hover:text-pink-600 transition-colors">
              Características
            </a>
            <a href="#testimonials" className="text-sm font-medium text-slate-500 hover:text-pink-600 transition-colors">
              Testimonios
            </a>
            <a href="#beneficios" className="text-sm font-medium text-slate-500 hover:text-pink-600 transition-colors">
              Beneficios
            </a>
          </div>
          <Link
            to="/login"
            className="flex items-center gap-1.5 bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-pink-300/40"
          >
            Ingresar al sistema
            <ChevronRight size={15} />
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-white pt-24 pb-20 px-6 text-center">
        {/* decoración de fondo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 bg-pink-100 text-pink-700 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full border border-pink-200 mb-6">
            <Brain size={13} />
            Sistema de Gestión para Psicopedagogas
          </span>

          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-slate-900 mb-6 tracking-tight">
            Tu práctica,{' '}
            <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              organizada y simple
            </span>
          </h1>

          <p className="text-xl text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Gestioná pacientes, turnos, sesiones, evaluaciones y pagos desde un solo lugar.
            Pensado para la práctica psicopedagógica argentina.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold text-base px-7 py-3.5 rounded-xl shadow-lg shadow-pink-400/30 transition-all hover:-translate-y-0.5"
            >
              Acceder al sistema
              <ChevronRight size={18} />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 bg-white text-pink-600 font-semibold text-base px-7 py-3.5 rounded-xl border border-pink-200 hover:border-pink-400 hover:bg-pink-50 transition-all"
            >
              Ver características
            </a>
          </div>

          <p className="mt-5 text-sm text-slate-400">
            Sin instalación · Acceso desde cualquier dispositivo · Datos seguros
          </p>
        </div>

        {/* mock de la app */}
        <div className="relative max-w-4xl mx-auto mt-16">
          <div className="bg-white rounded-2xl border border-pink-100 shadow-2xl shadow-pink-200/40 overflow-hidden">
            {/* barra de título */}
            <div className="bg-purple-50 px-4 py-3 flex items-center gap-2 border-b border-pink-100">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-slate-400 font-medium">AgendaPsicope — Dashboard</span>
            </div>
            {/* contenido mock */}
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Pacientes activos', val: '24', color: 'from-pink-400 to-pink-500' },
                { label: 'Turnos esta semana', val: '12', color: 'from-purple-400 to-purple-500' },
                { label: 'Cobros del mes', val: '$186k', color: 'from-fuchsia-400 to-fuchsia-500' },
                { label: 'Sin sesión reciente', val: '3', color: 'from-rose-400 to-rose-500' },
              ].map((s) => (
                <div key={s.label} className="bg-gradient-to-br from-white to-pink-50 rounded-xl border border-pink-100 p-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} mb-2`} />
                  <div className="text-xl font-bold text-slate-800">{s.val}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="px-5 pb-5 grid grid-cols-3 gap-3">
              {['Próximos turnos', 'Últimas sesiones', 'Pagos pendientes'].map((t) => (
                <div key={t} className="bg-purple-50 rounded-xl border border-pink-100 p-3 space-y-2">
                  <div className="text-xs font-semibold text-slate-600">{t}</div>
                  <div className="h-2 rounded-full bg-pink-200" />
                  <div className="h-2 rounded-full bg-pink-100 w-3/4" />
                  <div className="h-2 rounded-full bg-pink-100 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-pink-50 text-pink-600 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-pink-100 mb-4">
              Características
            </span>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              Todo lo que necesitás,<br />en un solo sistema
            </h2>
            <p className="text-lg text-slate-500 max-w-lg mx-auto">
              Diseñado específicamente para la práctica psicopedagógica. Sin funciones innecesarias, sin curva de aprendizaje.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group bg-white border border-pink-100 rounded-2xl p-6 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-100 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center mb-4 shadow-md shadow-pink-200/50 group-hover:scale-105 transition-transform">
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{f.desc}</p>
                <span className="inline-block bg-pink-50 text-pink-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-pink-100">
                  {f.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFICIOS ── */}
      <section id="beneficios" className="py-24 px-6 bg-gradient-to-br from-purple-600 to-pink-600 text-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block bg-white/15 text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/25 mb-5">
              Por qué AgendaPsicope
            </span>
            <h2 className="text-4xl font-extrabold leading-tight mb-5">
              Pensado para vos,<br />psicopedagoga
            </h2>
            <p className="text-pink-100 text-lg leading-relaxed mb-8">
              No es un sistema genérico adaptado. Fue construido desde cero para las necesidades reales de una práctica psicopedagógica en Argentina.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-white text-pink-600 font-bold text-sm px-6 py-3 rounded-xl hover:bg-pink-50 transition-colors shadow-lg"
            >
              Empezar ahora
              <ChevronRight size={16} />
            </Link>
          </div>

          <ul className="space-y-3.5">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/15">
                <CheckCircle2 size={18} className="text-pink-200 shrink-0" />
                <span className="text-sm font-medium text-white/90">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 px-6 bg-purple-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-white text-pink-600 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-pink-200 mb-4">
              Testimonios
            </span>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              Lo que dicen las profesionales
            </h2>
            <p className="text-lg text-slate-500">
              Psicopedagogas que ya organizaron su práctica con AgendaPsicope.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-pink-100 p-6 shadow-sm hover:shadow-md hover:border-pink-200 transition-all">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="text-sm text-slate-600 leading-relaxed italic mb-6">
                  "{t.text}"
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
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
      <section className="py-24 px-6 bg-white text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500 shadow-xl shadow-pink-300/40 mb-6">
            <Brain size={32} className="text-white" />
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Organizá tu práctica hoy
          </h2>
          <p className="text-lg text-slate-500 mb-10">
            Accedé al sistema y empezá a gestionar tus pacientes, turnos y pagos de manera profesional.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold text-base px-8 py-4 rounded-xl shadow-lg shadow-pink-400/30 transition-all hover:-translate-y-0.5"
          >
            Ingresar al sistema
            <ChevronRight size={18} />
          </Link>
          <div className="flex items-center justify-center gap-6 mt-8 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><Shield size={13} /> Datos seguros</span>
            <span className="flex items-center gap-1.5"><Smartphone size={13} /> Cualquier dispositivo</span>
            <span className="flex items-center gap-1.5"><MessageCircle size={13} /> WhatsApp integrado</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-pink-500/20 p-1.5 rounded-lg">
              <Brain size={16} className="text-pink-400" />
            </div>
            <span className="font-bold text-sm text-slate-300">
              Agenda<span className="text-pink-400">Psicope</span>
            </span>
          </div>
          <p className="text-xs text-center">
            Sistema de gestión para psicopedagogas · {new Date().getFullYear()}
          </p>
          <Link to="/login" className="text-xs text-pink-400 hover:text-pink-300 transition-colors font-medium">
            Ingresar al sistema →
          </Link>
        </div>
      </footer>
    </div>
  );
}
