import { apiGet, apiPost, apiPut, apiDelete } from './api.js';

let _obrasSocialesCache = null;

export const getObrasSociales = async () => {
  if (_obrasSocialesCache) return _obrasSocialesCache;
  try {
    const data = await apiGet('/obras-sociales');
    _obrasSocialesCache = data;
    return data;
  } catch (error) {
    console.error("Error al obtener obras sociales:", error);
    return [];
  }
};

export const getObraSocial = async (id) => {
  try {
    return await apiGet(`/obras-sociales/${id}`);
  } catch (error) {
    console.error("Error al obtener obra social:", error);
    return null;
  }
};

export const crearObraSocial = async (data) => {
  try {
    const result = await apiPost('/obras-sociales', data);
    _obrasSocialesCache = null;
    return result;
  } catch (error) {
    console.error("Error al crear obra social:", error);
    return null;
  }
};

export const actualizarObraSocial = async (id, data) => {
  try {
    const result = await apiPut(`/obras-sociales/${id}`, data);
    _obrasSocialesCache = null;
    return result;
  } catch (error) {
    console.error("Error al actualizar obra social:", error);
    return null;
  }
};

export const eliminarObraSocial = async (id) => {
  try {
    const result = await apiDelete(`/obras-sociales/${id}`);
    _obrasSocialesCache = null;
    return result;
  } catch (error) {
    console.error("Error al eliminar obra social:", error);
    return null;
  }
};
