import { apiGet, apiPost, apiDelete } from './api.js';

export const getConsultorios = async () => {
  try {
    return await apiGet('/consultorios');
  } catch (error) {
    console.error("Error al obtener consultorios:", error);
    return [];
  }
};

export const crearConsultorio = async (data) => {
  try {
    return await apiPost('/consultorios', data);
  } catch (error) {
    console.error("Error al crear consultorio:", error);
    return null;
  }
};

export const eliminarConsultorio = async (id) => {
  try {
    return await apiDelete(`/consultorios/${id}`);
  } catch (error) {
    console.error("Error al eliminar consultorio:", error);
    return null;
  }
};
