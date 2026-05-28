import { apiGet, apiPost, apiPut, apiDelete } from './api.js';

export const getPacientes = async () => {
  try {
    return await apiGet('/pacientes');
  } catch (error) {
    console.error("Error al obtener pacientes:", error);
    return [];
  }
};

export const getPacienteById = async (id) => {
  try {
    return await apiGet(`/pacientes/${id}`);
  } catch (error) {
    console.error("Error al obtener paciente:", error);
    return null;
  }
};

export const crearPaciente = async (data) => {
  return apiPost('/pacientes', data);
};

export const actualizarPaciente = async (id, data) => {
  return apiPut(`/pacientes/${id}`, data);
};

export const eliminarPaciente = async (id) => {
  try {
    return await apiDelete(`/pacientes/${id}`);
  } catch (error) {
    console.error("Error al eliminar paciente:", error);
    return null;
  }
};

export const guardarEntrevista = async (id, entrevistaData) => {
  try {
    return await apiPut(`/pacientes/${id}/entrevista`, { entrevista: entrevistaData });
  } catch (error) {
    console.error("Error al guardar entrevista:", error);
    return null;
  }
};

export const getSesiones = async (pacienteId) => {
  try {
    return await apiGet(`/pacientes/${pacienteId}/sesiones`);
  } catch (error) {
    console.error("Error al obtener sesiones:", error);
    return [];
  }
};

export const crearSesion = async (pacienteId, data) => {
  return apiPost(`/pacientes/${pacienteId}/sesiones`, data);
};

export const actualizarSesion = async (pacienteId, sesionId, data) => {
  return apiPut(`/pacientes/${pacienteId}/sesiones/${sesionId}`, data);
};

export const eliminarSesion = async (pacienteId, sesionId) => {
  try {
    return await apiDelete(`/pacientes/${pacienteId}/sesiones/${sesionId}`);
  } catch (error) {
    console.error("Error al eliminar sesión:", error);
    return null;
  }
};

export const getPacientesSinSesion = async () => {
  try {
    return await apiGet('/pacientes/sin-sesion-reciente');
  } catch (error) {
    console.error("Error al obtener pacientes sin sesión reciente:", error);
    return [];
  }
};

export const enviarRecordatorioSeguimiento = async (pacienteId) => {
  try {
    return await apiPost(`/pacientes/${pacienteId}/recordatorio-seguimiento`);
  } catch (error) {
    console.error("Error al enviar recordatorio de seguimiento:", error);
    throw error;
  }
};
