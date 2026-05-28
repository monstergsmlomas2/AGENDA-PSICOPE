import API_URL from '../config/api.js';

const handleResponse = async (res) => {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }
  return res.json();
};

export const getTurnos = async (filtros = {}) => {
  try {
    const params = new URLSearchParams();
    if (filtros.desde) params.append('desde', filtros.desde);
    if (filtros.hasta) params.append('hasta', filtros.hasta);
    if (filtros.paciente_id) params.append('paciente_id', filtros.paciente_id);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_URL}/turnos${query}`);
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al obtener turnos:", error);
    return [];
  }
};

export const crearTurno = async (data) => {
  try {
    const res = await fetch(`${API_URL}/turnos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al crear turno:", error);
    return null;
  }
};

export const eliminarTurno = async (id) => {
  try {
    const res = await fetch(`${API_URL}/turnos/${id}`, {
      method: 'DELETE',
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al eliminar turno:", error);
    return null;
  }
};

export const actualizarEstadoTurno = async (id, estado) => {
  try {
    const res = await fetch(`${API_URL}/turnos/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al actualizar estado del turno:", error);
    return null;
  }
};

export const actualizarTurno = async (id, data) => {
  try {
    const res = await fetch(`${API_URL}/turnos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al actualizar turno:", error);
    return null;
  }
};

export const enviarRecordatorio = async (turnoId) => {
  try {
    const res = await fetch(`${API_URL}/turnos/${turnoId}/recordatorio`, {
      method: 'POST',
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al enviar recordatorio:", error);
    throw error;
  }
};
