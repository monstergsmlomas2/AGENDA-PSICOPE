import { apiGet, apiPost } from './api.js';
import apiFetch from './api.js';

export async function resumirSesion(pacienteId, notasCrudas, nroSesion) {
  return apiPost('/ia/resumir-sesion', { pacienteId, notasCrudas, nroSesion });
}

export async function generarInforme(pacienteId, tipoInforme) {
  return apiPost('/ia/generar-informe', { pacienteId, tipoInforme });
}

export async function sugerirObjetivos(pacienteId) {
  return apiPost('/ia/sugerir-objetivos', { pacienteId });
}

export async function detectarAbandonos() {
  return apiGet('/ia/detectar-abandonos');
}

export async function alertasEstancamiento(pacienteId) {
  return apiPost('/ia/alertas-estancamiento', { pacienteId });
}

export async function buscarEnHistoria(pacienteId, consulta) {
  return apiPost('/ia/buscar-historia', { pacienteId, consulta });
}

export async function chatClinico(historial, pacienteId = null) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);
  try {
    return await apiPost('/ia/chat', { historial, pacienteId: pacienteId || undefined }, { signal: controller.signal });
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error('El asistente tardó demasiado en responder. Probá de nuevo en unos segundos (el servidor puede estar "despertando").');
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function transcribirAudio(archivo) {
  const formData = new FormData();
  formData.append('archivo', archivo);
  const res = await apiFetch('/ia/transcribir-audio', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al transcribir' }));
    throw new Error(err.error || 'Error al transcribir audio');
  }
  return res.json();
}
