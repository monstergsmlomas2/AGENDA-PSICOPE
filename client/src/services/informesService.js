import { apiGet, apiPost, apiPut, apiDelete } from './api.js';

export const getInformes = async (pacienteId = null) => {
  try {
    let url = '/informes';
    if (pacienteId) url += `?paciente_id=${pacienteId}`;
    return await apiGet(url);
  } catch (error) {
    console.error("Error al obtener informes:", error);
    return [];
  }
};

export const getInformesProximosVencer = async () => {
  try {
    return await apiGet('/informes/proximos-vencer');
  } catch (error) {
    console.error("Error al obtener informes próximos a vencer:", error);
    return [];
  }
};

export const getInforme = async (id) => {
  try {
    return await apiGet(`/informes/${id}`);
  } catch (error) {
    console.error("Error al obtener informe:", error);
    return null;
  }
};

export const crearInforme = async (data) => {
  try {
    return await apiPost('/informes', data);
  } catch (error) {
    console.error("Error al crear informe:", error);
    return null;
  }
};

export const actualizarInforme = async (id, data) => {
  try {
    return await apiPut(`/informes/${id}`, data);
  } catch (error) {
    console.error("Error al actualizar informe:", error);
    return null;
  }
};

export const eliminarInforme = async (id) => {
  try {
    return await apiDelete(`/informes/${id}`);
  } catch (error) {
    console.error("Error al eliminar informe:", error);
    return null;
  }
};

export const getVersionesInforme = async (id) => {
  try {
    return await apiGet(`/informes/${id}/versiones`);
  } catch (error) {
    console.error("Error al obtener versiones:", error);
    return [];
  }
};

export const restaurarVersionInforme = async (informeId, versionId) => {
  try {
    return await apiPost(`/informes/${informeId}/versiones/${versionId}/restaurar`, {});
  } catch (error) {
    console.error("Error al restaurar versión:", error);
    return null;
  }
};
