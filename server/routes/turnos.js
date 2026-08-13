import express from "express";
import pool from "../config/db.js";
import {
  crearEventoCalendar,
  actualizarEventoCalendar,
  eliminarEventoCalendar,
} from "../services/googleCalendar.js";
import { validateBody } from "../middleware/validate.js";
import { crearTurnoSchema, actualizarTurnoSchema } from "../schemas/turnos.js";

const ESTADOS_VALIDOS = ['pendiente', 'confirmado', 'inasistencia', 'cancelado'];
const TIPOS_TURNO_VALIDOS = ['tratamiento', 'evaluacion'];

const router = express.Router();

// 1. OBTENER TURNOS (con filtros opcionales ?desde= ?hasta= ?paciente_id=)
router.get("/", async (req, res) => {
  const { desde, hasta, paciente_id } = req.query;
  try {
    const conditions = ['t.usuario_id = $1'];
    const params = [req.userId];

    if (paciente_id) {
      params.push(paciente_id);
      conditions.push(`t.paciente_id = $${params.length}`);
    }
    if (desde) {
      params.push(desde);
      conditions.push(`t.fecha >= $${params.length}`);
    }
    if (hasta) {
      params.push(hasta);
      conditions.push(`t.fecha <= $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const result = await pool.query(`
      SELECT
        t.id, t.paciente_id, t.estado, t.observaciones, t.tipo_cobertura,
        t.consultorio, t.hora, t.tipo_turno, t.importe_custom,
        TO_CHAR(t.fecha, 'YYYY-MM-DD') AS fecha,
        p.nombre AS paciente_nombre,
        p.apellido AS paciente_apellido,
        p.obra_social AS paciente_obra_social
      FROM turnos t
      JOIN pacientes p ON t.paciente_id = p.id
      ${where}
      ORDER BY t.fecha ASC, t.hora ASC
    `, params);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener turnos" });
  }
});

// 2. TURNOS CONFIRMADOS SIN PAGO REGISTRADO (para caja)
router.get("/sin-pago", async (req, res) => {
  const { mes } = req.query;
  try {
    const conditions = ["t.usuario_id = $1", "t.estado NOT IN ('cancelado', 'inasistencia')", "p_link.turno_id IS NULL"];
    const params = [req.userId];

    if (mes) {
      params.push(mes);
      conditions.push(`TO_CHAR(t.fecha, 'YYYY-MM') = $${params.length}`);
    }

    const result = await pool.query(`
      SELECT
        t.id, t.paciente_id, t.estado, t.tipo_cobertura, t.consultorio, t.hora,
        t.tipo_turno, t.importe_custom,
        TO_CHAR(t.fecha, 'YYYY-MM-DD') AS fecha,
        p.nombre AS paciente_nombre,
        p.apellido AS paciente_apellido,
        c.monto_tratamiento, c.monto_evaluacion
      FROM turnos t
      JOIN pacientes p ON t.paciente_id = p.id
      LEFT JOIN consultorios c ON c.nombre = t.consultorio AND c.usuario_id = t.usuario_id
      LEFT JOIN pagos p_link ON p_link.turno_id = t.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY t.fecha DESC, t.hora ASC
    `, params);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener turnos sin pago" });
  }
});

// 3. CREAR UN TURNO
router.post("/", validateBody(crearTurnoSchema), async (req, res) => {
  const { paciente_id, fecha, hora, consultorio, observaciones, estado, tipo_cobertura, tipo_turno, importe_custom } = req.body;

  const estadoFinal = estado || 'pendiente';
  const tipoTurnoFinal = tipo_turno || 'tratamiento';

  try {
    const dueño = await pool.query("SELECT id FROM pacientes WHERE id = $1 AND usuario_id = $2", [paciente_id, req.userId]);
    if (dueño.rows.length === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }
    const result = await pool.query(
      `WITH nuevo_turno AS (
         INSERT INTO turnos (paciente_id, fecha, hora, consultorio, observaciones, estado, tipo_cobertura, tipo_turno, importe_custom, usuario_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *
       )
       SELECT nt.*, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido
       FROM nuevo_turno nt
       JOIN pacientes p ON p.id = nt.paciente_id`,
      [paciente_id, fecha, hora, consultorio, observaciones, estadoFinal, tipo_cobertura || 'particular', tipoTurnoFinal, importe_custom || null, req.userId]
    );
    const turno = result.rows[0];

    const eventId = await crearEventoCalendar(req.userId, turno);
    if (eventId) {
      await pool.query('UPDATE turnos SET google_calendar_event_id = $1 WHERE id = $2', [eventId, turno.id]);
      turno.google_calendar_event_id = eventId;
    }

    res.json(turno);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear turno" });
  }
});

// 4. ACTUALIZAR ESTADO DE UN TURNO (cambio rápido desde calendario)
router.patch("/:id/estado", async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({ error: "Estado no válido. Usar: pendiente, confirmado, inasistencia o cancelado" });
  }

  try {
    const result = await pool.query(
      `WITH actualizado AS (
         UPDATE turnos SET estado = $1 WHERE id = $2 AND usuario_id = $3 RETURNING *
       )
       SELECT a.*, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
              pg.id AS pago_id, c.monto_tratamiento, c.monto_evaluacion
       FROM actualizado a
       JOIN pacientes p ON p.id = a.paciente_id
       LEFT JOIN pagos pg ON pg.turno_id = a.id
       LEFT JOIN consultorios c ON c.nombre = a.consultorio AND c.usuario_id = a.usuario_id`,
      [estado, id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Turno no encontrado" });
    }
    const turno = result.rows[0];

    // Al confirmar, crear pago automático si no existe uno vinculado
    if (estado === 'confirmado' && turno.pago_id == null) {
      let monto = turno.importe_custom;
      if (monto == null) {
        monto = turno.tipo_turno === 'evaluacion' ? turno.monto_evaluacion : turno.monto_tratamiento;
      }

      if (monto != null) {
        const concepto = turno.tipo_turno === 'evaluacion' ? 'Evaluación psicopedagógica' : 'Sesión de tratamiento';
        await pool.query(
          `INSERT INTO pagos (paciente_id, fecha, concepto, monto, tipo_pago, estado, turno_id, usuario_id)
           VALUES ($1, $2, $3, $4, 'efectivo', 'pendiente', $5, $6)`,
          [turno.paciente_id, turno.fecha, concepto, monto, turno.id, req.userId]
        );
      }
    }

    // Sincronizar con Google Calendar
    if (turno.google_calendar_event_id) {
      await actualizarEventoCalendar(req.userId, turno.google_calendar_event_id, turno);
    }

    res.json(turno);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar estado del turno" });
  }
});

// 5. ACTUALIZAR TURNO COMPLETO
router.put("/:id", validateBody(actualizarTurnoSchema), async (req, res) => {
  const { id } = req.params;
  const { fecha, hora, consultorio, observaciones, estado, tipo_cobertura, tipo_turno, importe_custom } = req.body;

  try {
    const result = await pool.query(
      `WITH actualizado AS (
         UPDATE turnos SET fecha = $1, hora = $2, consultorio = $3, observaciones = $4, estado = $5,
         tipo_cobertura = $6, tipo_turno = $7, importe_custom = $8
         WHERE id = $9 AND usuario_id = $10 RETURNING *
       )
       SELECT a.*, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido
       FROM actualizado a
       JOIN pacientes p ON p.id = a.paciente_id`,
      [fecha, hora, consultorio, observaciones, estado, tipo_cobertura, tipo_turno || 'tratamiento', importe_custom || null, id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Turno no encontrado" });
    }
    const turno = result.rows[0];

    // Sincronizar con Google Calendar
    if (turno.google_calendar_event_id) {
      await actualizarEventoCalendar(req.userId, turno.google_calendar_event_id, turno);
    }

    res.json(turno);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar turno" });
  }
});

// 6. ENVIAR RECORDATORIO WHATSAPP
router.post("/:id/recordatorio", async (req, res) => {
  const { id } = req.params;

  if (process.env.WHATSAPP_PAUSADO === "true") {
    return res.status(503).json({ error: "WhatsApp está pausado. Quitá WHATSAPP_PAUSADO para reactivar." });
  }

  try {
    const result = await pool.query(`
      SELECT t.*, p.nombre, p.apellido, p.telefono
      FROM turnos t
      JOIN pacientes p ON t.paciente_id = p.id
      WHERE t.id = $1 AND t.usuario_id = $2
    `, [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Turno no encontrado" });
    }

    const turno = result.rows[0];

    if (!turno.telefono) {
      return res.status(400).json({ error: "El paciente no tiene teléfono registrado" });
    }

    const { enviarMensajeWhatsApp } = await import("../services/whatsapp.js");

    const fechaFormateada = new Date(turno.fecha + "T12:00:00Z").toLocaleDateString("es-AR", {
      weekday: "long", day: "numeric", month: "long"
    });
    const hora = turno.hora ? turno.hora.substring(0, 5) : "";
    const mensaje = `Hola ${turno.nombre}! Te recordamos que tenés turno mañana ${fechaFormateada} a las ${hora} en ${turno.consultorio}. Ante cualquier cambio comunicate con nosotros. ¡Hasta mañana!`;

    try {
      await enviarMensajeWhatsApp({
        usuarioId: req.userId,
        telefono: turno.telefono,
        mensaje,
      });

      await pool.query(
        `INSERT INTO notificaciones (turno_id, paciente_id, telefono, mensaje, tipo, estado) VALUES ($1, $2, $3, $4, 'recordatorio_turno', 'enviado')`,
        [turno.id, turno.paciente_id, turno.telefono, mensaje]
      );

      res.json({ ok: true, mensaje: "Recordatorio enviado" });
    } catch (error) {
      await pool.query(
        `INSERT INTO notificaciones (turno_id, paciente_id, telefono, mensaje, tipo, estado, error_detalle) VALUES ($1, $2, $3, $4, 'recordatorio_turno', 'error', $5)`,
        [turno.id, turno.paciente_id, turno.telefono, mensaje, error.message]
      );
      res.status(500).json({ error: "Error al enviar recordatorio", detalle: error.message });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al procesar recordatorio" });
  }
});

// 7. ELIMINAR UN TURNO
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM turnos WHERE id = $1 AND usuario_id = $2 RETURNING id, google_calendar_event_id",
      [id, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Turno no encontrado" });

    const { google_calendar_event_id } = result.rows[0];
    if (google_calendar_event_id) {
      await eliminarEventoCalendar(req.userId, google_calendar_event_id);
    }

    res.json({ message: "Turno eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar turno" });
  }
});

export default router;
