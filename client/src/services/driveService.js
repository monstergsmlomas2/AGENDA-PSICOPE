import { apiGet, apiDelete, apiPost } from './api.js';
import API_URL from '../config/api.js';
import { getToken } from './authService.js';

export const getDriveToken = async () => {
  try {
    return await apiGet('/drive/token');
  } catch {
    return null;
  }
};

export const getDriveStatus = async () => {
  try {
    return await apiGet('/drive/status');
  } catch {
    return { connected: false };
  }
};

export const getDriveAuthUrl = async () => {
  try {
    return await apiGet('/drive/auth-url');
  } catch {
    return null;
  }
};

export const disconnectDrive = async () => {
  try {
    return await apiDelete('/drive/disconnect');
  } catch {
    return null;
  }
};

export const crearCarpeta = async (nombre, parentId = null) => {
  try {
    return await apiPost('/drive/carpeta', { nombre, parentId });
  } catch {
    return null;
  }
};

export const getArchivos = async (pacienteId, seccion = null) => {
  try {
    const query = seccion ? `?seccion=${encodeURIComponent(seccion)}` : '';
    return await apiGet(`/drive/archivos/${pacienteId}${query}`);
  } catch {
    return [];
  }
};

export const subirArchivo = async (pacienteId, file, { folderId = null, seccion = null } = {}) => {
  try {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    if (seccion) formData.append('seccion', seccion);

    const res = await fetch(`${API_URL}/drive/archivos/${pacienteId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

export const eliminarArchivo = async (pacienteId, fileId) => {
  try {
    return await apiDelete(`/drive/archivos/${pacienteId}/${fileId}`);
  } catch {
    return null;
  }
};
