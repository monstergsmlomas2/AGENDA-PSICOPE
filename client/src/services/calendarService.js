import { apiGet, apiPost, apiPut } from './api.js';

export async function getCalendarStatus() {
  return apiGet('/calendar/status');
}

export async function getCalendarios() {
  return apiGet('/calendar/calendarios') ?? [];
}

export async function updateCalendarConfig({ calendar_id, sync_enabled }) {
  return apiPut('/calendar/config', { calendar_id, sync_enabled });
}

export async function sincronizarTodos() {
  return apiPost('/calendar/sincronizar-todos', {});
}
