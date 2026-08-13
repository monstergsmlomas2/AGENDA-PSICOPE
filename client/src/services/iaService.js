import { apiGet, apiPost, apiPut, apiDelete } from './api.js';
import apiFetch from './api.js';

export async function resumirSesion(pacienteId, notasCrudas, nroSesion) {
  return apiPost('/ia/resumir-sesion', { pacienteId, notasCrudas, nroSesion });
}

/**
 * Genera un informe con IA.
 * Si se pasan `secciones` ([{key, label}]), la IA devuelve el contenido repartido
 * en esas claves para poder guardarlo directamente en la ficha del paciente.
 * Devuelve { informe: texto, secciones: {clave: texto} | null }.
 */
export async function generarInforme(pacienteId, tipoInforme, secciones = null) {
  return apiPost('/ia/generar-informe', { pacienteId, tipoInforme, secciones: secciones || undefined });
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

/**
 * Envía un mensaje al asistente clínico.
 * Sin `conversacionId` el servidor crea un hilo nuevo y devuelve su id.
 * Devuelve { respuesta, conversacionId, titulo, pacienteId }.
 */
export async function chatClinico({ mensaje, conversacionId = null, pacienteId = null }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);
  try {
    return await apiPost('/ia/chat', {
      mensaje,
      conversacionId: conversacionId || undefined,
      pacienteId: pacienteId || undefined,
    }, { signal: controller.signal });
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error('El asistente tardó demasiado en responder. Probá de nuevo en unos segundos (el servidor puede estar "despertando").');
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Conversaciones del asistente clínico ───

/**
 * Lista los hilos del profesional.
 * @param {string|number|null} pacienteId - id del paciente, 'general' para los
 *   hilos sin paciente, o null para traer todos.
 */
export async function listarConversaciones(pacienteId = null) {
  const query = pacienteId ? `?pacienteId=${encodeURIComponent(pacienteId)}` : '';
  const data = await apiGet(`/ia/conversaciones${query}`);
  return data.conversaciones || [];
}

export async function obtenerConversacion(id) {
  return apiGet(`/ia/conversaciones/${id}`);
}

export async function renombrarConversacion(id, titulo) {
  return apiPut(`/ia/conversaciones/${id}`, { titulo });
}

export async function eliminarConversacion(id) {
  return apiDelete(`/ia/conversaciones/${id}`);
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
