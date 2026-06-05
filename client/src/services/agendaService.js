import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './api.js';

export async function getEventos(params) {
  try {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return await apiGet('/agenda-personal' + query) || [];
  } catch {
    return [];
  }
}

export async function crearEvento(data) {
  try {
    return await apiPost('/agenda-personal', data);
  } catch {
    return null;
  }
}

export async function actualizarEvento(id, data) {
  try {
    return await apiPut(`/agenda-personal/${id}`, data);
  } catch {
    return null;
  }
}

export async function eliminarEvento(id) {
  try {
    return await apiDelete(`/agenda-personal/${id}`);
  } catch {
    return null;
  }
}

export async function completarEvento(id) {
  try {
    return await apiPatch(`/agenda-personal/${id}/completar`);
  } catch {
    return null;
  }
}
