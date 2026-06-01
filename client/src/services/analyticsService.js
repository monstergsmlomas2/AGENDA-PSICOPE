import { apiGet } from './api.js';

const safeData = async (promise, fallback) => {
  try {
    return await promise;
  } catch {
    return fallback;
  }
};

export const getIngresosMensuales = async () => {
  return safeData(apiGet('/analytics/ingresos-mensuales'), []);
};

export const getSesionesSemanales = async () => {
  return safeData(apiGet('/analytics/sesiones-semanales'), []);
};

export const getPacientesPorObraSocial = async () => {
  return safeData(apiGet('/analytics/pacientes-por-obra-social'), []);
};

export const getResumenMesActual = async () => {
  return safeData(apiGet('/analytics/resumen-mes-actual'), {
    sesiones_este_mes: 0, sesiones_mes_anterior: 0,
    ingresos_este_mes: 0, ingresos_mes_anterior: 0,
    pacientes_activos: 0, turnos_pendientes: 0,
  });
};

export const getTotalesGlobales = async () => {
  return safeData(apiGet('/analytics/totales'), {
    total_turnos: 0,
    ausentes_mes: 0,
  });
};
