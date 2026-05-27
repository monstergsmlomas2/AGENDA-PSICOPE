const safeJson = async (res, fallback) => {
  if (!res.ok) return fallback;
  try { return await res.json(); } catch { return fallback; }
};

export const getIngresosMensuales = async () => {
  try {
    const res = await fetch('/analytics/ingresos-mensuales');
    return safeJson(res, []);
  } catch { return []; }
};

export const getSesionesSemanales = async () => {
  try {
    const res = await fetch('/analytics/sesiones-semanales');
    return safeJson(res, []);
  } catch { return []; }
};

export const getPacientesPorObraSocial = async () => {
  try {
    const res = await fetch('/analytics/pacientes-por-obra-social');
    return safeJson(res, []);
  } catch { return []; }
};

export const getResumenMesActual = async () => {
  try {
    const res = await fetch('/analytics/resumen-mes-actual');
    return safeJson(res, {
      sesiones_este_mes: 0, sesiones_mes_anterior: 0,
      ingresos_este_mes: 0, ingresos_mes_anterior: 0,
      pacientes_activos: 0, turnos_pendientes: 0,
    });
  } catch {
    return {
      sesiones_este_mes: 0, sesiones_mes_anterior: 0,
      ingresos_este_mes: 0, ingresos_mes_anterior: 0,
      pacientes_activos: 0, turnos_pendientes: 0,
    };
  }
};
