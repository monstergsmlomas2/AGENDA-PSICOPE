import { google } from 'googleapis';
import { getOAuth2Client, refreshTokensIfNeeded } from './googleDrive.js';
import pool from '../config/db.js';

const TIMEZONE = 'America/Argentina/Buenos_Aires';
const DURATION_MINUTES = 50;

async function getTokensFromDB(userId) {
  const result = await pool.query(
    'SELECT access_token, refresh_token, expiry_date FROM google_drive_tokens WHERE usuario_id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

async function saveTokensToDB(userId, tokens) {
  await pool.query(
    `INSERT INTO google_drive_tokens (usuario_id, access_token, refresh_token, expiry_date, actualizado_en)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (usuario_id) DO UPDATE SET
       access_token = EXCLUDED.access_token,
       refresh_token = COALESCE(EXCLUDED.refresh_token, google_drive_tokens.refresh_token),
       expiry_date = EXCLUDED.expiry_date,
       actualizado_en = NOW()`,
    [userId, tokens.access_token, tokens.refresh_token, tokens.expiry_date]
  );
}

async function getCalendarConfig(userId) {
  const result = await pool.query(
    'SELECT calendar_id, sync_enabled FROM google_calendar_config WHERE usuario_id = $1',
    [userId]
  );
  return result.rows[0] || { calendar_id: 'primary', sync_enabled: true };
}

async function getAuthenticatedCalendar(userId) {
  let tokens = await getTokensFromDB(userId);
  if (!tokens) return null;

  const { tokens: refreshed, refreshed: didRefresh } = await refreshTokensIfNeeded(tokens);
  if (didRefresh) {
    await saveTokensToDB(userId, refreshed);
    tokens = refreshed;
  }

  const auth = getOAuth2Client();
  auth.setCredentials(tokens);
  return google.calendar({ version: 'v3', auth });
}

function buildEventBody(turno) {
  const [horaH, horaM] = turno.hora.substring(0, 5).split(':').map(Number);
  const startDt = new Date(`${turno.fecha}T${turno.hora.substring(0, 5)}:00`);
  const endDt = new Date(startDt.getTime() + DURATION_MINUTES * 60 * 1000);

  const pad = (n) => String(n).padStart(2, '0');
  const fmtLocal = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

  const estadoLabel = {
    pendiente: 'Pendiente',
    confirmado: 'Confirmado',
    inasistencia: 'Inasistencia',
    cancelado: 'Cancelado',
  }[turno.estado] || turno.estado;

  const tipoLabel = turno.tipo_turno === 'evaluacion' ? 'Evaluación' : 'Sesión';

  const pacienteNombre = [turno.paciente_nombre, turno.paciente_apellido].filter(Boolean).join(' ') || 'Paciente';

  return {
    summary: `${tipoLabel} — ${pacienteNombre}`,
    description: [
      `Consultorio: ${turno.consultorio || '—'}`,
      `Estado: ${estadoLabel}`,
      turno.observaciones ? `Notas: ${turno.observaciones}` : null,
    ].filter(Boolean).join('\n'),
    start: { dateTime: fmtLocal(startDt), timeZone: TIMEZONE },
    end: { dateTime: fmtLocal(endDt), timeZone: TIMEZONE },
    status: turno.estado === 'cancelado' ? 'cancelled' : turno.estado === 'confirmado' ? 'confirmed' : 'tentative',
    colorId: { pendiente: '5', confirmado: '2', inasistencia: '8', cancelado: '11' }[turno.estado] || '5',
  };
}

export async function crearEventoCalendar(userId, turno) {
  try {
    const calendar = await getAuthenticatedCalendar(userId);
    if (!calendar) return null;

    const config = await getCalendarConfig(userId);
    if (!config.sync_enabled) return null;

    const evento = await calendar.events.insert({
      calendarId: config.calendar_id,
      requestBody: buildEventBody(turno),
    });

    return evento.data.id;
  } catch (err) {
    console.error('[Calendar] Error al crear evento:', err.message);
    return null;
  }
}

export async function actualizarEventoCalendar(userId, eventId, turno) {
  try {
    const calendar = await getAuthenticatedCalendar(userId);
    if (!calendar || !eventId) return false;

    const config = await getCalendarConfig(userId);
    if (!config.sync_enabled) return false;

    await calendar.events.update({
      calendarId: config.calendar_id,
      eventId,
      requestBody: buildEventBody(turno),
    });

    return true;
  } catch (err) {
    console.error('[Calendar] Error al actualizar evento:', err.message);
    return false;
  }
}

export async function eliminarEventoCalendar(userId, eventId) {
  try {
    const calendar = await getAuthenticatedCalendar(userId);
    if (!calendar || !eventId) return false;

    const config = await getCalendarConfig(userId);

    await calendar.events.delete({
      calendarId: config.calendar_id,
      eventId,
    });

    return true;
  } catch (err) {
    console.error('[Calendar] Error al eliminar evento:', err.message);
    return false;
  }
}

export async function listarCalendarios(userId) {
  const calendar = await getAuthenticatedCalendar(userId);
  if (!calendar) return [];

  const result = await calendar.calendarList.list({ minAccessRole: 'writer' });
  return (result.data.items || []).map((c) => ({ id: c.id, summary: c.summary, primary: !!c.primary }));
}

export async function getCalendarStatus(userId) {
  const tokens = await getTokensFromDB(userId);
  if (!tokens) return { connected: false, sync_enabled: false, calendar_id: 'primary' };

  const config = await getCalendarConfig(userId);
  return { connected: true, sync_enabled: config.sync_enabled, calendar_id: config.calendar_id };
}

export async function updateCalendarConfig(userId, { calendar_id, sync_enabled }) {
  await pool.query(
    `INSERT INTO google_calendar_config (usuario_id, calendar_id, sync_enabled, actualizado_en)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (usuario_id) DO UPDATE SET
       calendar_id = EXCLUDED.calendar_id,
       sync_enabled = EXCLUDED.sync_enabled,
       actualizado_en = NOW()`,
    [userId, calendar_id || 'primary', sync_enabled ?? true]
  );
}
