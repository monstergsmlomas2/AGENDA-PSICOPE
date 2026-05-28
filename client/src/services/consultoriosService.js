import API_URL from '../config/api.js';

const handleResponse = async (res) => {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }
  return res.json();
};

export const getConsultorios = async () => {
  try {
    const res = await fetch(`${API_URL}/consultorios`);
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al obtener consultorios:", error);
    return [];
  }
};

export const crearConsultorio = async (data) => {
  try {
    const res = await fetch(`${API_URL}/consultorios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al crear consultorio:", error);
    return null;
  }
};

export const eliminarConsultorio = async (id) => {
  try {
    const res = await fetch(`${API_URL}/consultorios/${id}`, {
      method: 'DELETE',
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al eliminar consultorio:", error);
    return null;
  }
};
