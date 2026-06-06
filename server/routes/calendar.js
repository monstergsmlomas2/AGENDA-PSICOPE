import express from 'express';
import pool from '../config/db.js';
import {
  getCalendarStatus,
  updateCalendarConfig,
  listarCalendarios,
  crearEventoCalendar,
  actualizarEventoCalendar,
  eliminarEventoCalendar,
} from '../services/googleCalendar.js';

const router = express.Router();

// GET /calendar/status
router.get('/status', async (req, res) => {
  try {
    const status = await getCalendarStatus(req.userId);
    res.json(status);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estado de Calendar' });
  }
});

// GET /calendar/calendarios — lista los calendarios disponibles del usuario
router.get('/calendarios', async (req, res) => {
  try {
    const calendarios = await listarCalendarios(req.userId);
    res.json(calendarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar calendarios' });
  }
});

// PUT /calendar/config — actualiza calendar_id y sync_enabled
router.put('/config', async (req, res) => {
  try {
    const { calendar_id, sync_enabled } = req.body;
    await updateCalendarConfig(req.userId, { calendar_id, sync_enabled });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar configuración de Calendar' });
  }
});

// POST /calendar/sincronizar-todos — sincroniza todos los turnos pendientes/confirmados
// sin evento de Calendar aún (útil para la primera activación)
router.post('/sincronizar-todos', async (req, res) => {
  try {
    const turnos = await pool.query(
      `SELECT t.*, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido
       FROM turnos t
       JOIN pacientes p ON t.paciente_id = p.id
       WHERE t.usuario_id = $1
         AND t.estado NOT IN ('cancelado', 'inasistencia')
         AND t.google_calendar_event_id IS NULL
         AND t.fecha >= CURRENT_DATE`,
      [req.userId]
    );

    let creados = 0;
    for (const turno of turnos.rows) {
      const eventId = await crearEventoCalendar(req.userId, turno);
      if (eventId) {
        await pool.query(
          'UPDATE turnos SET google_calendar_event_id = $1 WHERE id = $2',
          [eventId, turno.id]
        );
        creados++;
      }
    }

    res.json({ ok: true, sincronizados: creados, total: turnos.rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en sincronización masiva' });
  }
});

export default router;
