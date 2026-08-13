import API_URL from '../config/api.js';
import { getToken } from './authService.js';

/**
 * Helper de fetch que agrega automáticamente:
 * - El header Authorization con el JWT
 * - Content-Type: application/json cuando hay body
 * - La URL base del servidor (API_URL)
 */
async function apiFetch(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Si hay body y no es FormData, agregar Content-Type
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return res;
}

/**
 * Maneja la respuesta: si no es ok, lanza error; si es 204 No Content, devuelve null;
 * sino, parsea JSON.
 */
async function handleResponse(res) {
  if (!res.ok) {
    // Intentar obtener detalle del error del servidor. Se lee el body UNA sola vez
    // como texto y luego se intenta parsear como JSON (el body no se puede releer).
    let errorMsg = `HTTP ${res.status}`;
    try {
      const text = await res.text();
      if (text) {
        errorMsg = text;
        try {
          const errorBody = JSON.parse(text);
          if (errorBody.error) errorMsg = errorBody.error;
          if (errorBody.code === 'TOKEN_EXPIRED') {
            // Token expirado — redirigir a login
            localStorage.removeItem('psicope_token');
            window.location.href = '/login';
            throw new Error('Sesión expirada. Ingresá de nuevo');
          }
        } catch (e) {
          if (e.message === 'Sesión expirada. Ingresá de nuevo') throw e;
          // No era JSON — se usa el texto crudo
        }
      }
    } catch (e) {
      if (e.message === 'Sesión expirada. Ingresá de nuevo') throw e;
      /* body ilegible — se usa el HTTP status */
    }
    throw new Error(errorMsg);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ─── Métodos HTTP conveniencia ───

export async function apiGet(endpoint) {
  const res = await apiFetch(endpoint);
  return handleResponse(res);
}

export async function apiPost(endpoint, data, extra = {}) {
  const res = await apiFetch(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    ...extra,
  });
  return handleResponse(res);
}

export async function apiPut(endpoint, data) {
  const res = await apiFetch(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
  return handleResponse(res);
}

export async function apiPatch(endpoint, data) {
  const res = await apiFetch(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
  return handleResponse(res);
}

export async function apiDelete(endpoint) {
  const res = await apiFetch(endpoint, {
    method: 'DELETE',
  });
  return handleResponse(res);
}

export default apiFetch;
