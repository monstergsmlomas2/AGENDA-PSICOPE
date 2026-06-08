import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// 1. CREAR PACIENTE
router.post("/", async (req, res) => {
  const { nombre, apellido, dni, fecha_nacimiento, sexo, domicilio, telefono, email, obra_social, nro_afiliado, motivo, derivada_por, diagnostico, cud, contacto_emergencia, inicio_sesiones } = req.body;

  if (!nombre || !apellido) {
    return res.status(400).json({ error: "Los campos nombre y apellido son obligatorios" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO pacientes (nombre, apellido, dni, fecha_nacimiento, sexo, domicilio, telefono, email, obra_social, nro_afiliado, motivo, derivada_por, diagnostico, cud, contacto_emergencia, inicio_sesiones, usuario_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [nombre, apellido, dni || null, fecha_nacimiento, sexo, domicilio, telefono, email, obra_social, nro_afiliado, motivo, derivada_por, diagnostico, cud, contacto_emergencia, inicio_sesiones || null, req.userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear paciente:", error);
    res.status(500).json({ error: "Error al crear paciente" });
  }
});

// 2. LISTAR PACIENTES
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id, nombre, apellido, dni, telefono, email,
        obra_social, nro_afiliado, sexo, domicilio,
        fecha_nacimiento, motivo, derivada_por, diagnostico, cud, contacto_emergencia,
        (entrevista IS NOT NULL) AS entrevista
      FROM pacientes
      WHERE usuario_id = $1
      ORDER BY id DESC
    `, [req.userId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener pacientes" });
  }
});

// 3. PACIENTES SIN SESIÓN RECIENTE (+15 días o nunca)
router.get("/sin-sesion-reciente", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.nombre,
        p.apellido,
        p.dni,
        p.telefono,
        MAX(s.fecha) AS ultima_sesion,
        CASE
          WHEN COUNT(s.id) = 0 THEN NULL
          ELSE EXTRACT(DAY FROM (NOW() - MAX(s.fecha)))::INT
        END AS dias_desde_ultima_sesion
      FROM pacientes p
      LEFT JOIN sesiones s ON s.paciente_id = p.id
      WHERE p.usuario_id = $1
      GROUP BY p.id
      HAVING
        COUNT(s.id) = 0
        OR MAX(s.fecha) < NOW() - INTERVAL '15 days'
      ORDER BY
        CASE WHEN COUNT(s.id) = 0 THEN 0 ELSE 1 END,
        MAX(s.fecha) ASC NULLS FIRST
    `, [req.userId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener pacientes sin sesión reciente:", error);
    res.status(500).json({ error: "Error al obtener pacientes sin sesión reciente" });
  }
});

// 4. OBTENER PACIENTE POR ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM pacientes WHERE id = $1 AND usuario_id = $2", [id, req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener paciente" });
  }
});

// 5. ELIMINAR PACIENTE (elimina en cascada turnos, sesiones y evaluaciones)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM turnos WHERE paciente_id = $1 AND usuario_id = $2", [id, req.userId]);
    await client.query("DELETE FROM sesiones WHERE paciente_id = $1 AND usuario_id = $2", [id, req.userId]);
    await client.query("DELETE FROM evaluaciones WHERE paciente_id = $1 AND usuario_id = $2", [id, req.userId]);
    const result = await client.query("DELETE FROM pacientes WHERE id = $1 AND usuario_id = $2 RETURNING id", [id, req.userId]);
    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Paciente no encontrado" });
    }
    await client.query("COMMIT");
    res.json({ message: "Paciente eliminado" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al eliminar paciente:", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// 6. ACTUALIZAR DATOS DEL PACIENTE
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, dni, fecha_nacimiento, sexo, domicilio, telefono, email, obra_social, nro_afiliado, motivo, derivada_por, diagnostico, cud, contacto_emergencia, inicio_sesiones } = req.body;
  try {
    const result = await pool.query(
      `UPDATE pacientes SET nombre=$1, apellido=$2, dni=$3, fecha_nacimiento=$4, sexo=$5, domicilio=$6, telefono=$7, email=$8, obra_social=$9, nro_afiliado=$10, motivo=$11, derivada_por=$12, diagnostico=$13, cud=$14, contacto_emergencia=$15, inicio_sesiones=$16 WHERE id=$17 AND usuario_id=$18 RETURNING *`,
      [nombre, apellido, dni, fecha_nacimiento, sexo, domicilio, telefono, email, obra_social, nro_afiliado, motivo, derivada_por, diagnostico, cud, contacto_emergencia, inicio_sesiones || null, id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar paciente:", error);
    res.status(500).json({ error: "Error al actualizar paciente" });
  }
});

// 7. GUARDAR ENTREVISTA DE ADMISIÓN
router.put("/:id/entrevista", async (req, res) => {
  const { id } = req.params;
  const { entrevista } = req.body;
  try {
    const result = await pool.query(
      "UPDATE pacientes SET entrevista = $1 WHERE id = $2 AND usuario_id = $3 RETURNING *",
      [entrevista, id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al guardar la entrevista" });
  }
});

// ==========================================
// RUTAS: SESIONES
// ==========================================

// 8. OBTENER SESIONES DE UN PACIENTE
router.get("/:id/sesiones", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT s.* FROM sesiones s JOIN pacientes p ON s.paciente_id = p.id WHERE s.paciente_id = $1 AND p.usuario_id = $2 ORDER BY s.fecha ASC",
      [id, req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener sesiones" });
  }
});

// 9. CREAR NUEVA SESIÓN
router.post("/:id/sesiones", async (req, res) => {
  const { id } = req.params;
  const { fecha, observaciones, actividades_realizadas, resumen_ia } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO sesiones (paciente_id, fecha, observaciones, actividades_realizadas, resumen_ia, usuario_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [id, fecha, observaciones, actividades_realizadas, resumen_ia || null, req.userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al crear sesión" });
  }
});

// 10. ACTUALIZAR SESIÓN
router.put("/:id/sesiones/:sesionId", async (req, res) => {
  const { id, sesionId } = req.params;
  const { fecha, actividades_realizadas, observaciones, resumen_ia } = req.body;
  try {
    const result = await pool.query(
      `UPDATE sesiones s SET fecha = $1, actividades_realizadas = $2, observaciones = $3, resumen_ia = $4
       FROM pacientes p
       WHERE s.id = $5 AND s.paciente_id = $6 AND s.paciente_id = p.id AND p.usuario_id = $7
       RETURNING s.*`,
      [fecha, actividades_realizadas, observaciones, resumen_ia || null, sesionId, id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Sesión no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar sesión:", error);
    res.status(500).json({ error: "Error al actualizar sesión" });
  }
});

// 11. ELIMINAR SESIÓN
router.delete("/:id/sesiones/:sesionId", async (req, res) => {
  const { id, sesionId } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM sesiones s USING pacientes p
       WHERE s.id = $1 AND s.paciente_id = $2 AND s.paciente_id = p.id AND p.usuario_id = $3
       RETURNING s.id`,
      [sesionId, id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Sesión no encontrada" });
    }
    res.json({ message: "Sesión eliminada" });
  } catch (error) {
    console.error("Error al eliminar sesión:", error);
    res.status(500).json({ error: "Error al eliminar sesión" });
  }
});

// ==========================================
// RUTAS: WHATSAPP
// ==========================================

// 12. ENVIAR RECORDATORIO DE SEGUIMIENTO A PACIENTE SIN SESIÓN RECIENTE
router.post("/:id/recordatorio-seguimiento", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT id, nombre, apellido, telefono FROM pacientes WHERE id = $1 AND usuario_id = $2",
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    const paciente = result.rows[0];

    if (!paciente.telefono) {
      return res.status(400).json({ error: "El paciente no tiene teléfono registrado" });
    }

    const { enviarMensajeWhatsApp } = await import("../services/whatsapp.js");

    const mensaje = `Hola ${paciente.nombre}! Hace un tiempo que no nos vemos. Si querés retomar las sesiones o tenés alguna consulta, no dudes en escribirnos. ¡Saludos!`;

    try {
      await enviarMensajeWhatsApp({
        usuarioId: req.userId,
        telefono: paciente.telefono,
        mensaje,
      });

      await pool.query(
        `INSERT INTO notificaciones (paciente_id, telefono, mensaje, tipo, estado) VALUES ($1, $2, $3, 'seguimiento_paciente', 'enviado')`,
        [paciente.id, paciente.telefono, mensaje]
      );

      res.json({ ok: true, mensaje: "Mensaje de seguimiento enviado" });
    } catch (error) {
      await pool.query(
        `INSERT INTO notificaciones (paciente_id, telefono, mensaje, tipo, estado, error_detalle) VALUES ($1, $2, $3, 'seguimiento_paciente', 'error', $4)`,
        [paciente.id, paciente.telefono, mensaje, error.message]
      );
      res.status(500).json({ error: "Error al enviar mensaje de seguimiento", detalle: error.message });
    }
  } catch (error) {
    console.error("Error al enviar recordatorio de seguimiento:", error);
    res.status(500).json({ error: "Error al procesar el envío" });
  }
});

export default router;
