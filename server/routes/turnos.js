import express from "express";
import pool from "../config/db.js";

const ESTADOS_VALIDOS = ['pendiente', 'confirmado', 'inasistencia', 'cancelado'];

const router = express.Router();

// 1. OBTENER TURNOS (con filtros opcionales ?desde= ?hasta= ?paciente_id=)
router.get("/", async (req, res) => {
  const { desde, hasta, paciente_id } = req.query;
  try {
    const conditions = [];
    const params = [];

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

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(`
      SELECT
        t.id, t.paciente_id, t.estado, t.observaciones, t.tipo_cobertura,
        t.consultorio, t.hora,
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

// 2. CREAR UN TURNO
router.post("/", async (req, res) => {
  const { paciente_id, fecha, hora, consultorio, observaciones, estado, tipo_cobertura } = req.body;

  // Validación de campos obligatorios
  if (!paciente_id || !fecha || !hora || !consultorio) {
    return res.status(400).json({ error: "Los campos paciente, fecha, hora y consultorio son obligatorios" });
  }

  const estadoFinal = estado || 'pendiente';
  if (!ESTADOS_VALIDOS.includes(estadoFinal)) {
    return res.status(400).json({ error: "Estado no válido. Usar: pendiente, confirmado, inasistencia o cancelado" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO turnos (paciente_id, fecha, hora, consultorio, observaciones, estado, tipo_cobertura)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [paciente_id, fecha, hora, consultorio, observaciones, estadoFinal, tipo_cobertura || 'particular']
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear turno" });
  }
});

// 3. ACTUALIZAR ESTADO DE UN TURNO (cambio rápido desde calendario)
router.patch("/:id/estado", async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({ error: "Estado no válido. Usar: pendiente, confirmado, inasistencia o cancelado" });
  }

  try {
    const result = await pool.query(
      "UPDATE turnos SET estado = $1 WHERE id = $2 RETURNING *",
      [estado, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Turno no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar estado del turno" });
  }
});

// 4. ACTUALIZAR TURNO COMPLETO
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { fecha, hora, consultorio, observaciones, estado, tipo_cobertura } = req.body;

  if (estado && !ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({ error: "Estado no válido. Usar: pendiente, confirmado, inasistencia o cancelado" });
  }

  try {
    const result = await pool.query(
      `UPDATE turnos SET fecha = $1, hora = $2, consultorio = $3, observaciones = $4, estado = $5, tipo_cobertura = $6
       WHERE id = $7 RETURNING *`,
      [fecha, hora, consultorio, observaciones, estado, tipo_cobertura, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Turno no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar turno" });
  }
});

// 5. ENVIAR RECORDATORIO WHATSAPP
router.post("/:id/recordatorio", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT t.*, p.nombre, p.apellido, p.telefono
      FROM turnos t
      JOIN pacientes p ON t.paciente_id = p.id
      WHERE t.id = $1
    `, [id]);

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

// 6. ELIMINAR UN TURNO
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM turnos WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Turno no encontrado" });
    res.json({ message: "Turno eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar turno" });
  }
});

export default router;