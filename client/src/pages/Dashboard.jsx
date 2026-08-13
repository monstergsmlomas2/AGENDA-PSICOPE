import { useState } from 'react';
import { Users, Calendar as CalendarIcon, Clock, Activity, ArrowRight, MapPin, DollarSign, AlertTriangle, TrendingUp, TrendingDown, BarChart3, CreditCard, PieChart as PieChartIcon, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';
import RecordatoriosWidget from '../components/RecordatoriosWidget';
import { Skeleton, ErrorState } from '../components/ui';
import { useDashboardData } from '../hooks/useDashboardData';

const COLORS = ['#14b8a6', '#06b6d4', '#f59e0b', '#8b5cf6', '#ef4444'];

// ─── Skeletons ──────────────────────────────────────────
function MetricSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
      <Skeleton variant="circle" className="w-12 h-12 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-20 h-3" />
        <Skeleton variant="text" className="w-16 h-6" />
      </div>
    </div>
  );
}

function ChartSkeleton({ height = 'h-[280px]' }) {
  return (
    <div className={`${height} flex items-end gap-2 px-4 pb-4`}>
      {[60, 80, 45, 90, 70, 55, 85].map((h, i) => (
        <div key={i} className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-t-md animate-pulse" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

function ListSkeleton({ items = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-purple-100/50 dark:bg-slate-950/50 border border-purple-300 dark:border-slate-800">
          <Skeleton variant="text" className="w-16 h-10 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton variant="text" className="w-40 h-4" />
            <Skeleton variant="text" className="w-24 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Gráfico de barras SVG ───────────────────────────────
function BarChartSVG({ data, dataKey, color = '#14b8a6', labelKey, height = 220 }) {
  const [tooltip, setTooltip] = useState(null);
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-slate-900 text-sm font-medium" style={{ height }}>
        Sin datos disponibles
      </div>
    );
  }
  const maxVal = Math.max(...data.map(d => Number(d[dataKey]) || 0), 1);

  return (
    <div className="relative" style={{ height }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${data.length * 50} ${height}`} preserveAspectRatio="none">
        {/* Líneas de guía */}
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1="0" y1={height - ratio * (height - 20)}
            x2={data.length * 50} y2={height - ratio * (height - 20)}
            stroke="#334155" strokeOpacity="0.3" strokeDasharray="4 4"
          />
        ))}
        {data.map((d, i) => {
          const val = Number(d[dataKey]) || 0;
          const barH = Math.max((val / maxVal) * (height - 30), 4);
          const x = i * 50 + 8;
          const y = height - barH - 20;
          return (
            <g key={i}>
              <rect
                x={x} y={y} width={34} height={barH}
                rx="5" ry="5" fill={color} fillOpacity="0.85"
                onMouseEnter={() => setTooltip({ x: i * 50 + 25, y, val, label: d[labelKey] })}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'pointer', transition: 'fill-opacity 0.15s' }}
              />
              <text x={x + 17} y={height - 4} textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600">
                {d[labelKey]?.toString().slice(0, 4)}
              </text>
            </g>
          );
        })}
      </svg>
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 shadow-xl text-sm font-bold text-white z-10"
          style={{ left: `${(tooltip.x / (data.length * 50)) * 100}%`, top: 0, transform: 'translate(-50%, 0)' }}
        >
          {tooltip.label}: {tooltip.val}
        </div>
      )}
    </div>
  );
}

// ─── Gráfico de área SVG ─────────────────────────────────
function AreaChartSVG({ data, keys, colors, labelKey, formatter, height = 260 }) {
  const [tooltip, setTooltip] = useState(null);
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-slate-900 text-sm font-medium" style={{ height }}>
        Sin datos disponibles
      </div>
    );
  }

  const W = 600;
  const H = height;
  const PAD = { top: 10, right: 10, bottom: 28, left: 50 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const allVals = data.flatMap(d => keys.map(k => Number(d[k]) || 0));
  const maxVal = Math.max(...allVals, 1);

  const px = (i) => PAD.left + (i / (data.length - 1)) * chartW;
  const py = (val) => PAD.top + chartH - (val / maxVal) * chartH;

  const pathD = (key) =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(Number(d[key]) || 0)}`).join(' ');

  const areaD = (key) => {
    const line = pathD(key);
    return `${line} L${px(data.length - 1)},${PAD.top + chartH} L${PAD.left},${PAD.top + chartH} Z`;
  };

  return (
    <div className="relative" style={{ height }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          {keys.map((k, i) => (
            <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors[i]} stopOpacity="0.25" />
              <stop offset="100%" stopColor={colors[i]} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {/* Guías horizontales */}
        {[0, 0.25, 0.5, 0.75, 1].map((r) => (
          <line key={r}
            x1={PAD.left} y1={PAD.top + chartH * (1 - r)}
            x2={PAD.left + chartW} y2={PAD.top + chartH * (1 - r)}
            stroke="#334155" strokeOpacity="0.3" strokeDasharray="4 4"
          />
        ))}
        {/* Áreas */}
        {keys.map((k) => (
          <path key={k} d={areaD(k)} fill={`url(#grad-${k})`} />
        ))}
        {/* Líneas */}
        {keys.map((k, i) => (
          <path key={k} d={pathD(k)} fill="none" stroke={colors[i]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {/* Puntos */}
        {keys.map((k, i) =>
          data.map((d, j) => (
            <circle key={`${k}-${j}`}
              cx={px(j)} cy={py(Number(d[k]) || 0)} r="4"
              fill={colors[i]} stroke="#0f1115" strokeWidth="2"
              onMouseEnter={() => setTooltip({ x: px(j), key: k, d, i: j })}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'pointer' }}
            />
          ))
        )}
        {/* Labels eje X */}
        {data.map((d, i) => (
          <text key={i} x={px(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="600">
            {d[labelKey]}
          </text>
        ))}
        {/* Labels eje Y */}
        {[0, 0.5, 1].map((r) => (
          <text key={r} x={PAD.left - 6} y={PAD.top + chartH * (1 - r) + 4} textAnchor="end" fontSize="10" fill="#64748b">
            {formatter ? formatter(maxVal * r) : Math.round(maxVal * r)}
          </text>
        ))}
      </svg>
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 shadow-xl z-10 text-xs"
          style={{ left: `${(tooltip.x / W) * 100}%`, top: 16, transform: 'translate(-50%, 0)' }}
        >
          <p className="font-bold text-slate-300 mb-1">{tooltip.d[labelKey]}</p>
          {keys.map((k, i) => (
            <p key={k} className="font-bold" style={{ color: colors[i] }}>
              {k}: {formatter ? formatter(Number(tooltip.d[k]) || 0) : tooltip.d[k]}
            </p>
          ))}
        </div>
      )}
      {/* Leyenda */}
      <div className="absolute top-0 right-0 flex items-center gap-4">
        {keys.map((k, i) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full inline-block" style={{ backgroundColor: colors[i] }} />
            <span className="text-xs font-semibold text-slate-900 capitalize">{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Gráfico de donut SVG ────────────────────────────────
function DonutChartSVG({ data, nameKey, valueKey, height = 220 }) {
  const [active, setActive] = useState(null);
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-slate-900 text-sm font-medium" style={{ height }}>
        Sin datos disponibles
      </div>
    );
  }

  const total = data.reduce((s, d) => s + (Number(d[valueKey]) || 0), 0);
  if (total === 0) return (
    <div className="flex items-center justify-center text-slate-900 text-sm font-medium" style={{ height }}>
      Sin datos disponibles
    </div>
  );
  const cx = 90, cy = 90, R = 70, r = 44;

  const slices = [];
  {
    let angle = -Math.PI / 2;
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      const val = Number(d[valueKey]) || 0;
      const sweep = (val / total) * 2 * Math.PI;
      const x1 = cx + R * Math.cos(angle), y1 = cy + R * Math.sin(angle);
      angle += sweep;
      const x2 = cx + R * Math.cos(angle), y2 = cy + R * Math.sin(angle);
      const x3 = cx + r * Math.cos(angle), y3 = cy + r * Math.sin(angle);
      const xa = cx + r * Math.cos(angle - sweep), ya = cy + r * Math.sin(angle - sweep);
      const large = sweep > Math.PI ? 1 : 0;
      slices.push({
        d: `M${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${large} 0 ${xa},${ya} Z`,
        color: COLORS[i % COLORS.length],
        name: d[nameKey],
        val,
        pct: Math.round((val / total) * 100),
      });
    }
  }

  return (
    <div style={{ height }} className="flex gap-4 items-center">
      <svg width={180} height={180} viewBox="0 0 180 180" className="shrink-0">
        {slices.map((s, i) => (
          <path
            key={i} d={s.d} fill={s.color}
            fillOpacity={active === i ? 1 : 0.8}
            stroke="#0f1115" strokeWidth="2"
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            style={{ cursor: 'pointer', transition: 'fill-opacity 0.15s' }}
          />
        ))}
        {active !== null ? (
          <>
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="800" fill="white">
              {slices[active].pct}%
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#94a3b8">
              {slices[active].name.slice(0, 12)}
            </text>
          </>
        ) : (
          <>
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="800" fill="white">
              {total}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#94a3b8">
              pacientes
            </text>
          </>
        )}
      </svg>
      <div className="flex-1 space-y-2 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-slate-900 truncate flex-1">{s.name}</span>
            <span className="text-xs font-bold text-slate-300">{s.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Componente principal ───────────────────────────────
export default function Dashboard() {
  const {
    loading, error, stats, pagosPendientes,
    ingresosMensuales, sesionesSemanales, pacientesPorObraSocial, resumenMes,
    sinSesionReciente,
    recargar,
  } = useDashboardData();

  const formatCurrency = (val) =>
    `$${Number(val).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

  const formatMonth = (mesStr) => {
    if (!mesStr) return '';
    const [, m] = mesStr.split('-');
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${meses[parseInt(m, 10) - 1]}`;
  };

  const formatDay = (diaStr) => {
    if (!diaStr) return '';
    const d = new Date(diaStr + 'T12:00:00Z');
    return d.toLocaleDateString('es-AR', { weekday: 'short' });
  };

  const pctChange = (actual, anterior) => {
    if (!anterior || anterior === 0) return null;
    const pct = ((actual - anterior) / anterior) * 100;
    return { pct: Math.abs(pct).toFixed(1), up: pct >= 0 };
  };

  const sesPct = pctChange(Number(resumenMes.sesiones_este_mes), Number(resumenMes.sesiones_mes_anterior));
  const ingPct = pctChange(Number(resumenMes.ingresos_este_mes), Number(resumenMes.ingresos_mes_anterior));

  const calcularDiasDesde = (fechaStr) => {
    if (!fechaStr) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha = new Date(fechaStr + 'T12:00:00Z');
    const diff = Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Formatear datos para charts
  const ingresosData = ingresosMensuales.map(d => ({ ...d, mes: formatMonth(d.mes) }));
  const sesionesData = sesionesSemanales.map(d => ({ ...d, dia: formatDay(d.dia) }));

  if (error) {
    return (
      <div className="space-y-6">
        <HeaderSection />
        <ErrorState onRetry={recargar} />
      </div>
    );
  }

  return (
    <div className="space-y-4 text-slate-900 dark:text-white">

      {/* ────────── HEADER ────────── */}
      <HeaderSection />

      {/* ────────── 1. KPI CARDS ────────── */}
      <section>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <MetricSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard icon={<Users size={24} />} label="Pacientes" value={stats.totalPacientes}
              iconClass="text-indigo-500" gradientTo="to-indigo-500/10" hoverBorder="hover:border-indigo-500/20" />
            <KpiCard icon={<CalendarIcon size={24} />} label="Turnos Totales" value={stats.totalTurnos}
              iconClass="text-pink-500" gradientTo="to-pink-500/10" hoverBorder="hover:border-pink-500/20" />
            <KpiCard icon={<Clock size={24} />} label="Turnos Hoy" value={stats.turnosHoy.length}
              sub={`${stats.turnosMes} este mes`}
              iconClass="text-emerald-500" gradientTo="to-emerald-500/10" hoverBorder="hover:border-emerald-500/20" />
            <KpiCard icon={<BarChart3 size={24} />} label="Sesiones Mes" value={resumenMes.sesiones_este_mes}
              change={sesPct}
              iconClass="text-blue-500" gradientTo="to-blue-500/10" hoverBorder="hover:border-blue-500/20" />
            <KpiCard icon={<DollarSign size={24} />} label="Ingresos Mes" value={formatCurrency(resumenMes.ingresos_este_mes)}
              change={ingPct}
              iconClass="text-amber-500" gradientTo="to-amber-500/10" hoverBorder="hover:border-amber-500/20" />
            <KpiCard icon={<AlertTriangle size={24} />} label="Ausentes" value={stats.ausentesMes}
              sub="este mes"
              iconClass="text-orange-500" gradientTo="to-orange-500/10" hoverBorder="hover:border-orange-500/20" />
          </div>
        )}
      </section>

      {/* ────────── 2. GRÁFICOS ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Ingresos Mensuales — Área (2/3) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-white via-white to-pink-100/60 dark:from-slate-900 dark:via-slate-900 dark:to-pink-500/5 border border-pink-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400" />
            Ingresos Últimos 6 Meses
          </h2>
          {loading ? <ChartSkeleton /> : (
            <AreaChartSVG
              data={ingresosData}
              keys={['ingresado', 'cobrado']}
              colors={['#14b8a6', '#06b6d4']}
              labelKey="mes"
              formatter={formatCurrency}
              height={220}
            />
          )}
        </div>

        {/* Sesiones Semanales — Barras (1/3) */}
        <div className="bg-gradient-to-br from-white via-white to-pink-100/60 dark:from-slate-900 dark:via-slate-900 dark:to-pink-500/5 border border-pink-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Activity size={20} className="text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400" />
            Sesiones (7 días)
          </h2>
          {loading ? <ChartSkeleton /> : (
            <BarChartSVG
              data={sesionesData}
              dataKey="sesiones"
              labelKey="dia"
              color="#14b8a6"
              height={220}
            />
          )}
        </div>
      </div>

      {/* ────────── 3. OBRA SOCIAL + RESUMEN ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="bg-gradient-to-br from-white via-white to-pink-100/60 dark:from-slate-900 dark:via-slate-900 dark:to-pink-500/5 border border-pink-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <PieChartIcon size={18} className="text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Obra Social</h2>
          </div>
          {loading ? <ChartSkeleton height="h-[220px]" /> : (
            <DonutChartSVG
              data={pacientesPorObraSocial}
              nameKey="nombre"
              valueKey="cantidad"
              height={220}
            />
          )}
        </div>

        <div className="lg:col-span-2 bg-gradient-to-br from-white via-white to-pink-100/60 dark:from-slate-900 dark:via-slate-900 dark:to-pink-500/5 border border-pink-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <CreditCard size={20} className="text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400" />
            Resumen del Mes
          </h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl bg-purple-100/50 dark:bg-slate-950/50 border border-purple-300 dark:border-slate-800">
                  <Skeleton variant="text" className="w-16 h-3 mb-2" />
                  <Skeleton variant="text" className="w-20 h-5" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <SummaryBox label="Pacientes activos" value={resumenMes.pacientes_activos}
                icon={<Users size={16} />} color="text-indigo-600 dark:text-indigo-400" bg="bg-indigo-50 dark:bg-indigo-500/10" />
              <SummaryBox label="Turnos pendientes" value={resumenMes.turnos_pendientes}
                icon={<CalendarIcon size={16} />} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-500/10" />
              <SummaryBox label="Sesiones" value={resumenMes.sesiones_este_mes}
                sub={`vs ${resumenMes.sesiones_mes_anterior} mes ant.`} change={sesPct}
                icon={<Activity size={16} />} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-500/10" />
              <SummaryBox label="Facturado" value={formatCurrency(resumenMes.ingresos_este_mes)}
                icon={<DollarSign size={16} />} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-500/10" />
              <SummaryBox label="Ausentes" value={stats.ausentesMes}
                icon={<AlertTriangle size={16} />} color="text-red-600 dark:text-red-400" bg="bg-red-50 dark:bg-red-500/10" />
              <SummaryBox label="Próx. 7 días" value={stats.proximos7Dias.length}
                icon={<TrendingUp size={16} />} color="text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400" bg="bg-white dark:bg-teal-500/10" />
            </div>
          )}
        </div>
      </div>

      {/* ────────── 4. TURNOS HOY + PRÓXIMOS 7 ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Pacientes para Hoy" icon={<CalendarIcon size={20} />} linkTo="/turnos" linkLabel="Ver agenda">
          {loading ? <ListSkeleton items={3} /> : stats.turnosHoy.length === 0 ? (
            <EmptySection message="No tenés turnos programados para hoy." />
          ) : (
            <div className="space-y-3">
              {stats.turnosHoy.map((turno) => (
                <div key={turno.id} className="flex items-center justify-between p-4 rounded-xl bg-purple-100/50 dark:bg-slate-950/50 border border-purple-300 dark:border-slate-800 hover:border-pink-500/50 dark:hover:border-teal-500/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-white dark:bg-[#141414] border border-purple-300 dark:border-slate-800 text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 px-4 py-2 rounded-lg font-black text-lg shadow-sm">
                      {turno.hora?.slice(0, 5)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white capitalize">
                        {turno.paciente_apellido}, {turno.paciente_nombre}
                      </h3>
                      <div className="flex items-center gap-1 mt-1 text-sm text-slate-900 dark:text-white">
                        <MapPin size={14} /> {turno.consultorio}
                      </div>
                    </div>
                  </div>
                  <Link to="/pacientes" className="px-4 py-2 text-sm font-bold bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors">
                    Ver ficha
                  </Link>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Próximos 7 Días" icon={<TrendingUp size={20} />}>
          {loading ? <ListSkeleton items={4} /> : stats.proximos7Dias.length === 0 ? (
            <EmptySection message="No hay turnos programados para los próximos 7 días." />
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-2">
              {stats.proximos7Dias.map((turno) => (
                <div key={turno.id} className="flex items-center justify-between p-3.5 rounded-xl bg-purple-100/50 dark:bg-slate-950/50 border border-purple-300 dark:border-slate-800 hover:border-pink-500/50 dark:hover:border-teal-500/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-white dark:bg-[#141414] border border-purple-300 dark:border-slate-800 text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 px-3 py-1.5 rounded-lg font-bold text-sm shadow-sm text-center min-w-[56px]">
                      <div className="text-[10px] uppercase text-slate-900 font-medium">
                        {new Date(turno.fecha + 'T12:00:00Z').toLocaleDateString('es-AR', { weekday: 'short' })}
                      </div>
                      <div>{new Date(turno.fecha + 'T12:00:00Z').getDate()}</div>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white capitalize text-sm">
                        {turno.paciente_apellido}, {turno.paciente_nombre}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-900 dark:text-white">
                        <span>{turno.hora?.slice(0, 5)} hs</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><MapPin size={11} /> {turno.consultorio}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ────────── 5. PAGOS PENDIENTES + RECORDATORIOS ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Pagos Pendientes" icon={<DollarSign size={20} />} linkTo="/pagos" linkLabel="Ir a Pagos">
          {loading ? <ListSkeleton items={3} /> : pagosPendientes.length === 0 ? (
            <EmptySection message="No hay pagos pendientes. ✓" />
          ) : (
            <div className="space-y-3">
              {pagosPendientes.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3.5 rounded-xl bg-purple-100/50 dark:bg-slate-950/50 border border-purple-300 dark:border-slate-800 hover:border-pink-500/50 dark:hover:border-teal-500/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-white dark:bg-teal-500/10 p-2 rounded-lg text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 shrink-0">
                      <DollarSign size={16} />
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white capitalize text-sm truncate">
                      {p.paciente_nombre} {p.paciente_apellido}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      ${Number(p.monto).toLocaleString('es-AR')}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      p.estado === 'pendiente'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30'
                        : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/30'
                    }`}>
                      {p.estado === 'pendiente' ? 'Pendiente' : 'Deuda'}
                    </span>
                  </div>
                </div>
              ))}
              {pagosPendientes.length > 5 && (
                <Link to="/pagos" className="block text-center py-3 text-sm font-bold text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 hover:text-pink-700 dark:hover:text-teal-300 transition-colors">
                  Ver todos →
                </Link>
              )}
            </div>
          )}
        </SectionCard>

        <RecordatoriosWidget />
      </div>

      {/* ────────── 6. PACIENTES SIN ATENCIÓN RECIENTE ────────── */}
      <SectionCard
        title="Pacientes sin atención reciente"
        icon={<UserX size={20} className="text-orange-500" />}
        linkTo="/pacientes"
        linkLabel="Ver todos"
      >
        {loading ? (
          <ListSkeleton items={4} />
        ) : sinSesionReciente.length === 0 ? (
          <EmptySection message="Todos los pacientes tuvieron sesión esta semana." />
        ) : (
          <div className="space-y-3">
            {sinSesionReciente.slice(0, 6).map((p) => {
              const dias = calcularDiasDesde(p.ultima_sesion);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-purple-100/50 dark:bg-slate-950/50 border border-purple-300 dark:border-slate-800 hover:border-pink-500/50 dark:hover:border-teal-500/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-white dark:bg-orange-500/10 p-2 rounded-lg text-orange-600 dark:text-orange-400 shrink-0">
                      <UserX size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white capitalize text-sm truncate">
                        {p.nombre} {p.apellido}
                      </p>
                      <p className="text-xs text-slate-900 dark:text-white mt-0.5">
                        {dias !== null
                          ? `Última sesión: hace ${dias} ${dias === 1 ? 'día' : 'días'}`
                          : 'Sin sesiones registradas'}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/pacientes/${p.id}`}
                    className="px-4 py-2 text-sm font-bold bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors shrink-0"
                  >
                    Ver ficha
                  </Link>
                </div>
              );
            })}
            {sinSesionReciente.length > 6 && (
              <Link
                to="/pacientes"
                className="block text-center py-3 text-sm font-bold text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 hover:text-pink-700 dark:hover:text-teal-300 transition-colors"
              >
                Ver todos →
              </Link>
            )}
          </div>
        )}
      </SectionCard>

    </div>
  );
}

// ─── Subcomponentes ─────────────────────────────────────

function HeaderSection() {
  const hoy = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="mb-2">
      <h1 className="text-2xl font-bold flex items-center gap-2.5 text-slate-900 dark:text-white">
        <span className="bg-pink-100 text-pink-700 dark:bg-teal-500/10 dark:text-teal-400 p-2 rounded-xl">
          <Activity size={20} />
        </span>
        Panel de Control
      </h1>
      <p className="text-slate-900 dark:text-white mt-2 font-medium capitalize">{hoy}</p>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, change, iconClass, gradientTo, hoverBorder }) {
  // Clonar el icono en tamaño grande para el fondo decorativo
  const bigIcon = icon && icon.type
    ? <icon.type size={96} className={iconClass} />
    : icon;

  return (
    <div className={`group relative border border-purple-200 dark:border-[#2a2a2a] bg-gradient-to-br from-white via-white/95 ${gradientTo} dark:from-[#141414] dark:via-[#141414]/95 rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-lg ${hoverBorder}`}>
      {/* Icono gigante decorativo — esquina superior derecha, semitransparente */}
      <div className={`absolute right-0 top-0 p-3 ${iconClass} opacity-10 group-hover:opacity-20 transition-opacity duration-200`}>
        {bigIcon}
      </div>

      {/* Header: icono chico + label */}
      <div className="relative px-5 pt-5 pb-2 flex items-center gap-2">
        <span className={iconClass}>{icon}</span>
        <span className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">{label}</span>
      </div>

      {/* Valor principal */}
      <div className="relative px-5 pb-5">
        <p className="text-3xl font-bold text-slate-800 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-slate-900 dark:text-white mt-1 font-medium">{sub}</p>}
        {change && (
          <div className="flex items-center gap-1.5 mt-2">
            {change.up
              ? <TrendingUp size={14} className="text-emerald-500" />
              : <TrendingDown size={14} className="text-red-500" />}
            <span className={`text-sm font-bold ${change.up ? 'text-emerald-500' : 'text-red-500'}`}>{change.pct}%</span>
            <span className="text-[10px] text-slate-400">vs mes ant.</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryBox({ label, value, sub, change, icon, color, bg }) {
  return (
    <div className="p-4 rounded-xl bg-purple-100/50 dark:bg-slate-950/50 border border-purple-300 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-2">
        <span className={`${bg} ${color} p-1.5 rounded-lg`}>{icon}</span>
        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-black text-slate-900 dark:text-white">{value}</p>
      {sub && <p className="text-[11px] text-slate-900 dark:text-white mt-0.5">{sub}</p>}
      {change && (
        <div className="flex items-center gap-1 mt-1">
          {change.up ? <TrendingUp size={12} className="text-emerald-500" /> : <TrendingDown size={12} className="text-red-500" />}
          <span className={`text-[11px] font-bold ${change.up ? 'text-emerald-500' : 'text-red-500'}`}>{change.pct}%</span>
        </div>
      )}
    </div>
  );
}

function SectionCard({ title, icon, children, linkTo, linkLabel }) {
  return (
    <div className="bg-gradient-to-br from-white via-white to-pink-100/60 dark:from-slate-900 dark:via-slate-900 dark:to-pink-500/5 border border-pink-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-pink-100 dark:border-slate-800 pb-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400">{icon}</span>
          {title}
        </h2>
        {linkTo && (
          <Link to={linkTo} className="text-sm font-bold text-slate-900 font-bold dark:text-slate-600 dark:text-teal-400 hover:text-pink-700 dark:hover:text-teal-300 flex items-center gap-1 transition-colors">
            {linkLabel} <ArrowRight size={16} />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptySection({ message }) {
  return (
    <div className="text-center py-12 bg-purple-100/50 dark:bg-slate-950 rounded-xl border border-dashed border-purple-300 dark:border-slate-800">
      <p className="text-slate-900 dark:text-white font-medium">{message}</p>
    </div>
  );
}







