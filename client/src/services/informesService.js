import API_URL from '../config/api.js';

const handleResponse = async (res) => {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }
  return res.json();
};

export const getInformes = async (pacienteId = null) => {
  try {
    let url = `${API_URL}/informes`;
    if (pacienteId) url += `?paciente_id=${pacienteId}`;
    const res = await fetch(url);
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al obtener informes:", error);
    return [];
  }
};

export const getInformesProximosVencer = async () => {
  try {
    const res = await fetch(`${API_URL}/informes/proximos-vencer`);
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al obtener informes próximos a vencer:", error);
    return [];
  }
};

export const getInforme = async (id) => {
  try {
    const res = await fetch(`${API_URL}/informes/${id}`);
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al obtener informe:", error);
    return null;
  }
};

export const crearInforme = async (data) => {
  try {
    const res = await fetch(`${API_URL}/informes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al crear informe:", error);
    return null;
  }
};

export const actualizarInforme = async (id, data) => {
  try {
    const res = await fetch(`${API_URL}/informes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al actualizar informe:", error);
    return null;
  }
};

export const eliminarInforme = async (id) => {
  try {
    const res = await fetch(`${API_URL}/informes/${id}`, { method: 'DELETE' });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al eliminar informe:", error);
    return null;
  }
};
