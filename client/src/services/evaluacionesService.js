import API_URL from '../config/api.js';

const handleResponse = async (res) => {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }
  return res.json();
};

export const getEvaluaciones = async (pacienteId = null) => {
  try {
    let url = `${API_URL}/evaluaciones`;
    if (pacienteId) url += `?paciente_id=${pacienteId}`;
    const res = await fetch(url);
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al obtener evaluaciones:", error);
    return [];
  }
};

export const getEvaluacionesProximasVencer = async () => {
  try {
    const res = await fetch(`${API_URL}/evaluaciones/proximos-vencer`);
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al obtener evaluaciones próximas a vencer:", error);
    return [];
  }
};

export const crearEvaluacion = async (data) => {
  const res = await fetch(`${API_URL}/evaluaciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await handleResponse(res);
};

export const actualizarEvaluacion = async (id, data) => {
  const res = await fetch(`${API_URL}/evaluaciones/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await handleResponse(res);
};

export const eliminarEvaluacion = async (id) => {
  try {
    const res = await fetch(`${API_URL}/evaluaciones/${id}`, { method: 'DELETE' });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al eliminar evaluación:", error);
    return null;
  }
};
