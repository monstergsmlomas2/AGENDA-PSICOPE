import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Clock, User, FileText, ClipboardList, ChevronRight, MessageCircle } from 'lucide-react';
import { getPacientesSinSesion, enviarRecordatorioSeguimiento } from '../services/pacientesService';
import { apiGet } from '../services/api';
import { Link } from 'react-router-dom';

export default function RecordatoriosWidget() {
  const [pacientesSinSesion, setPacientesSinSesion] = useState([]);
  const [informesPorVencer, setInformesPorVencer] = useState([]);
  const [evaluacionesPorVencer, setEvaluacionesPorVencer] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviandoSeguimiento, setEnviandoSeguimiento] = useState(null);

  useEffect(() => {
    const cargarData = async () => {
      setLoading(true);
      try {
        const [pacientes, informes, evaluaciones] = await Promise.all([
          getPacientesSinSesion(),
          apiGet('/informes/proximos-vencer').catch(() => []),
          apiGet('/evaluaciones/proximos-vencer').catch(() => []),
        ]);
        setPacientesSinSesion(Array.isArray(pacientes) ? pacientes : []);
        setInformesPorVencer(Array.isArray(informes) ? informes : []);
        setEvaluacionesPorVencer(Array.isArray(evaluaciones) ? evaluaciones : []);
      } catch (error) {
        console.error("Error al cargar recordatorios:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarData();
  }, []);

  const totalAlertas = pacientesSinSesion.length + informesPorVencer.length + evaluacionesPorVencer.length;

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#262626] rounded-2xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (totalAlertas === 0) {
    return null; // No mostrar widget si no hay alertas
  }

  const formatearDias = (dias) => {
    if (dias === null || dias === undefined) return 'Sin sesiones';
    if (dias === 0) return 'Hoy';
    if (dias === 1) return '1 día';
    return `${dias} días`;
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr + 'T12:00:00Z');
    return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  };

  const handleEnviarSeguimiento = async (paciente, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!paciente.telefono) {
      alert('El paciente no tiene teléfono registrado');
      return;
    }
    setEnviandoSeguimiento(paciente.id);
    try {
      await enviarRecordatorioSeguimiento(paciente.id);
    } catch {
      alert('Error al enviar el mensaje de seguimiento');
    } finally {
      setEnviandoSeguimiento(null);
    }
  };

  const diasHastaVencimiento = (fechaStr) => {
    if (!fechaStr) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const venc = new Date(fechaStr + 'T12:00:00Z');
    const diff = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="bg-white dark:bg-[#141414] border border-purple-300 dark:border-[#262626] rounded-2xl p-6 shadow-sm">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-[#262626] pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <span className="bg-amber-100 dark:bg-amber-500/10 p-2 rounded-lg text-amber-600 dark:text-amber-400">
            <Bell size={18} />
          </span>
          Recordatorios
        </h2>
        <span className="bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-500/30">
          {totalAlertas} {totalAlertas === 1 ? 'alerta' : 'alertas'}
        </span>
      </div>

      <div className="space-y-5">
        {/* Sección: Pacientes sin sesión reciente */}
        {pacientesSinSesion.length > 0 && (
          <div>
            <h3 className="text-xs uppercase tracking-widest font-bold text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 mb-3 flex items-center gap-2">
              <AlertTriangle size={13} className="text-amber-500" />
              Pacientes sin sesión reciente
            </h3>
            <div className="space-y-2">
              {pacientesSinSesion.slice(0, 5).map(p => (
                <Link
                  key={p.id}
                  to={`/pacientes`}
                  className="flex items-center justify-between p-3 rounded-xl bg-purple-100/50 dark:bg-[#0f1115] border border-purple-300 dark:border-[#333] hover:border-amber-500/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-amber-100 dark:bg-amber-500/10 p-2 rounded-lg text-amber-600 dark:text-amber-400 shrink-0">
                      <User size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 dark:text-slate-200 truncate capitalize">
                        {p.apellido}, {p.nombre}
                      </p>
                      <p className="text-[10px] text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 mt-0.5 font-medium">
                        {p.ultima_sesion
                          ? `Ãšlt. sesión: ${formatearFecha(p.ultima_sesion)}`
                          : 'Nunca asistió'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.telefono && (
                      <button
                        onClick={(e) => handleEnviarSeguimiento(p, e)}
                        disabled={enviandoSeguimiento === p.id}
                        className="text-slate-900 hover:text-green-500 bg-white dark:bg-[#1a1c23] p-1.5 rounded-lg border border-purple-300 dark:border-[#333] hover:border-green-500/50 transition-all disabled:opacity-50"
                        title="Enviar seguimiento por WhatsApp"
                      >
                        <MessageCircle size={14} className={enviandoSeguimiento === p.id ? 'animate-pulse' : ''} />
                      </button>
                    )}
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      p.dias_desde_ultima_sesion === null
                        ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                        : p.dias_desde_ultima_sesion > 30
                          ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                          : 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {formatearDias(p.dias_desde_ultima_sesion)}
                    </span>
                    <ChevronRight size={14} className="text-slate-900 group-hover:text-amber-500 transition-colors" />
                  </div>
                </Link>
              ))}
              {pacientesSinSesion.length > 5 && (
                <p className="text-xs text-center text-pink-500 dark:text-slate-500 font-medium pt-1">
                  + {pacientesSinSesion.length - 5} pacientes más
                </p>
              )}
            </div>
          </div>
        )}

        {/* Sección: Vencimientos próximos - Informes */}
        {informesPorVencer.length > 0 && (
          <div>
            <h3 className="text-xs uppercase tracking-widest font-bold text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 mb-3 flex items-center gap-2">
              <Clock size={13} className="text-blue-500" />
              Informes por vencer
            </h3>
            <div className="space-y-2">
              {informesPorVencer.slice(0, 5).map(i => {
                const dias = diasHastaVencimiento(i.fecha_vencimiento);
                return (
                  <Link
                    key={i.id}
                    to={`/informes`}
                    className="flex items-center justify-between p-3 rounded-xl bg-purple-100/50 dark:bg-[#0f1115] border border-purple-300 dark:border-[#333] hover:border-blue-500/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="bg-blue-100 dark:bg-blue-500/10 p-2 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                        <FileText size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 dark:text-slate-200 truncate capitalize">
                          {i.paciente_apellido}, {i.paciente_nombre}
                        </p>
                        <p className="text-[10px] text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 mt-0.5 font-medium capitalize">
                          {i.tipo} • Vence: {formatearFecha(i.fecha_vencimiento)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        dias !== null && dias <= 7
                          ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                          : 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}>
                        {dias !== null ? `${dias} ${dias === 1 ? 'día' : 'días'}` : ''}
                      </span>
                      <ChevronRight size={14} className="text-slate-900 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Sección: Vencimientos próximos - Evaluaciones */}
        {evaluacionesPorVencer.length > 0 && (
          <div>
            <h3 className="text-xs uppercase tracking-widest font-bold text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 mb-3 flex items-center gap-2">
              <ClipboardList size={13} className="text-purple-500" />
              Evaluaciones por vencer
            </h3>
            <div className="space-y-2">
              {evaluacionesPorVencer.slice(0, 5).map(e => {
                const dias = diasHastaVencimiento(e.fecha_vencimiento);
                return (
                  <Link
                    key={e.id}
                    to={`/evaluaciones`}
                    className="flex items-center justify-between p-3 rounded-xl bg-purple-100/50 dark:bg-[#0f1115] border border-purple-300 dark:border-[#333] hover:border-purple-500/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="bg-white dark:bg-purple-500/10 p-2 rounded-lg text-purple-600 dark:text-purple-400 shrink-0">
                        <ClipboardList size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 dark:text-slate-200 truncate capitalize">
                          {e.paciente_apellido}, {e.paciente_nombre}
                        </p>
                        <p className="text-[10px] text-slate-900 font-bold dark:text-slate-700 dark:text-slate-400 mt-0.5 font-medium">
                          {e.tipo_test} • Vence: {formatearFecha(e.fecha_vencimiento)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        dias !== null && dias <= 7
                          ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                          : 'bg-white dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'
                      }`}>
                        {dias !== null ? `${dias} ${dias === 1 ? 'día' : 'días'}` : ''}
                      </span>
                      <ChevronRight size={14} className="text-slate-900 group-hover:text-purple-500 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}








