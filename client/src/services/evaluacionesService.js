import { apiGet, apiPost, apiPut, apiDelete } from './api.js';

export const getEvaluaciones = async (pacienteId = null) => {
  try {
    let url = '/evaluaciones';
    if (pacienteId) url += `?paciente_id=${pacienteId}`;
    return await apiGet(url);
  } catch (error) {
    console.error("Error al obtener evaluaciones:", error);
    return [];
  }
};

export const getEvaluacionesProximasVencer = async () => {
  try {
    return await apiGet('/evaluaciones/proximos-vencer');
  } catch (error) {
    console.error("Error al obtener evaluaciones próximas a vencer:", error);
    return [];
  }
};

export const crearEvaluacion = async (data) => {
  return apiPost('/evaluaciones', data);
};

export const actualizarEvaluacion = async (id, data) => {
  return apiPut(`/evaluaciones/${id}`, data);
};

export const eliminarEvaluacion = async (id) => {
  try {
    return await apiDelete(`/evaluaciones/${id}`);
  } catch (error) {
    console.error("Error al eliminar evaluación:", error);
    return null;
  }
};
