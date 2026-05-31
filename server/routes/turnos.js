import express from "express";
import pool from "../config/db.js";

const ESTADOS_VALIDOS = ['pendiente', 'confirmado', 'inasistencia', 'cancelado'];
const TIPOS_TURNO_VALIDOS = ['tratamiento', 'evaluacion'];

const router = express.Router();

// 1. OBTENER TURNOS (con filtros opcionales ?desde= ?hasta= ?paciente_id=)
router.get("/", async (req, res) => {
  const { desde, hasta, paciente_id } = req.query;
  try {
    const conditions = ['t.usuario_id = $1'];
    const params = [req.userId];
    let paramIndex = 1;

    if (paciente_id) {
      params.push(paciente_id);
      conditions.push(`t.paciente_id = $${++paramIndex}`);
    }
    if (desde) {
      params.push(desde);
      conditions.push(`t.fecha >= $${++paramIndex}`);
    }
    if (hasta) {
      params.push(hasta);
      conditions.push(`t.fecha <= $${++paramIndex}`);
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
router.post("/", async (req, res) => {
  const { paciente_id, fecha, hora, consultorio, observaciones, estado, tipo_cobertura, tipo_turno, importe_custom } = req.body;

  if (!paciente_id || !fecha || !hora || !consultorio) {
    return res.status(400).json({ error: "Los campos paciente, fecha, hora y consultorio son obligatorios" });
  }

  const estadoFinal = estado || 'pendiente';
  if (!ESTADOS_VALIDOS.includes(estadoFinal)) {
    return res.status(400).json({ error: "Estado no válido. Usar: pendiente, confirmado, inasistencia o cancelado" });
  }

  const tipoTurnoFinal = tipo_turno || 'tratamiento';
  if (!TIPOS_TURNO_VALIDOS.includes(tipoTurnoFinal)) {
    return res.status(400).json({ error: "Tipo de turno no válido. Usar: tratamiento o evaluacion" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO turnos (paciente_id, fecha, hora, consultorio, observaciones, estado, tipo_cobertura, tipo_turno, importe_custom, usuario_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [paciente_id, fecha, hora, consultorio, observaciones, estadoFinal, tipo_cobertura || 'particular', tipoTurnoFinal, importe_custom || null, req.userId]
    );
    res.json(result.rows[0]);
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
      "UPDATE turnos SET estado = $1 WHERE id = $2 AND usuario_id = $3 RETURNING *",
      [estado, id, req.userId]
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

// 5. ACTUALIZAR TURNO COMPLETO
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { fecha, hora, consultorio, observaciones, estado, tipo_cobertura, tipo_turno, importe_custom } = req.body;

  if (estado && !ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({ error: "Estado no válido. Usar: pendiente, confirmado, inasistencia o cancelado" });
  }

  try {
    const result = await pool.query(
      `UPDATE turnos SET fecha = $1, hora = $2, consultorio = $3, observaciones = $4, estado = $5,
       tipo_cobertura = $6, tipo_turno = $7, importe_custom = $8
       WHERE id = $9 AND usuario_id = $10 RETURNING *`,
      [fecha, hora, consultorio, observaciones, estado, tipo_cobertura, tipo_turno || 'tratamiento', importe_custom || null, id, req.userId]
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

// 6. ENVIAR RECORDATORIO WHATSAPP
router.post("/:id/recordatorio", async (req, res) => {
  const { id } = req.params;

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
    const result = await pool.query("DELETE FROM turnos WHERE id = $1 AND usuario_id = $2 RETURNING id", [id, req.userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Turno no encontrado" });
    res.json({ message: "Turno eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar turno" });
  }
});

export default router;
