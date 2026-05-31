import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './api.js';

export const getTurnos = async (filtros = {}) => {
  try {
    const params = new URLSearchParams();
    if (filtros.desde) params.append('desde', filtros.desde);
    if (filtros.hasta) params.append('hasta', filtros.hasta);
    if (filtros.paciente_id) params.append('paciente_id', filtros.paciente_id);
    const query = params.toString() ? `?${params.toString()}` : '';
    return await apiGet(`/turnos${query}`);
  } catch (error) {
    console.error("Error al obtener turnos:", error);
    return [];
  }
};

export const crearTurno = async (data) => {
  try {
    return await apiPost('/turnos', data);
  } catch (error) {
    console.error("Error al crear turno:", error);
    return null;
  }
};

export const eliminarTurno = async (id) => {
  try {
    return await apiDelete(`/turnos/${id}`);
  } catch (error) {
    console.error("Error al eliminar turno:", error);
    return null;
  }
};

export const actualizarEstadoTurno = async (id, estado) => {
  try {
    return await apiPatch(`/turnos/${id}/estado`, { estado });
  } catch (error) {
    console.error("Error al actualizar estado del turno:", error);
    return null;
  }
};

export const actualizarTurno = async (id, data) => {
  try {
    return await apiPut(`/turnos/${id}`, data);
  } catch (error) {
    console.error("Error al actualizar turno:", error);
    return null;
  }
};

export const getTurnosSinPago = async (mes) => {
  try {
    const query = mes ? `?mes=${mes}` : '';
    return await apiGet(`/turnos/sin-pago${query}`);
  } catch (error) {
    console.error("Error al obtener turnos sin pago:", error);
    return [];
  }
};

export const enviarRecordatorio = async (turnoId) => {
  try {
    return await apiPost(`/turnos/${turnoId}/recordatorio`);
  } catch (error) {
    console.error("Error al enviar recordatorio:", error);
    throw error;
  }
};
