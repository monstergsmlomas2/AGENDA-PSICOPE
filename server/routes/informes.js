import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// 1. LISTAR INFORMES (con filtro opcional por paciente_id)
router.get("/", async (req, res) => {
  const { paciente_id } = req.query;
  try {
    let query = `
      SELECT i.*, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido
      FROM informes i
      JOIN pacientes p ON i.paciente_id = p.id
    `;
    const conditions = ['p.usuario_id = $1'];
    const params = [req.userId];

    if (paciente_id) {
      conditions.push(`i.paciente_id = $${params.length + 1}`);
      params.push(paciente_id);
    }

    query += ` WHERE ${conditions.join(' AND ')}`;
    query += " ORDER BY i.fecha DESC, i.created_at DESC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener informes:", error);
    res.status(500).json({ error: "Error al obtener informes" });
  }
});

// 1b. INFORMES PRÓXIMOS A VENCER (30 días)
router.get("/proximos-vencer", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido
      FROM informes i
      JOIN pacientes p ON i.paciente_id = p.id
      WHERE p.usuario_id = $1
        AND i.fecha_vencimiento IS NOT NULL
        AND i.fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
      ORDER BY i.fecha_vencimiento ASC
    `, [req.userId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener informes próximos a vencer:", error);
    res.status(500).json({ error: "Error al obtener informes próximos a vencer" });
  }
});

// 2. OBTENER INFORME POR ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT i.*, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido
       FROM informes i
       JOIN pacientes p ON i.paciente_id = p.id
       WHERE i.id = $1 AND p.usuario_id = $2`,
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Informe no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener informe:", error);
    res.status(500).json({ error: "Error al obtener informe" });
  }
});

// 3. CREAR INFORME
router.post("/", async (req, res) => {
  const { paciente_id, tipo, fecha, contenido, estado, fecha_vencimiento } = req.body;

  if (!paciente_id || !tipo || !fecha) {
    return res.status(400).json({ error: "Los campos paciente, tipo y fecha son obligatorios" });
  }

  try {
    const dueño = await pool.query("SELECT id FROM pacientes WHERE id = $1 AND usuario_id = $2", [paciente_id, req.userId]);
    if (dueño.rows.length === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }
    const result = await pool.query(
      `INSERT INTO informes (paciente_id, tipo, fecha, contenido, estado, fecha_vencimiento, usuario_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [paciente_id, tipo, fecha, JSON.stringify(contenido || {}), estado || 'borrador', fecha_vencimiento || null, req.userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear informe:", error);
    res.status(500).json({ error: "Error al crear informe" });
  }
});

// 4. ACTUALIZAR INFORME (guarda versión anterior antes de sobrescribir)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { tipo, fecha, contenido, estado, fecha_vencimiento } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Obtener versión actual para archivarla
    const actual = await client.query(
      `SELECT i.* FROM informes i
       JOIN pacientes p ON i.paciente_id = p.id
       WHERE i.id = $1 AND p.usuario_id = $2`,
      [id, req.userId]
    );
    if (actual.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Informe no encontrado" });
    }

    const inf = actual.rows[0];

    // Calcular siguiente número de versión
    const versionRes = await client.query(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next FROM informes_versiones WHERE informe_id = $1`,
      [id]
    );
    const nextVersion = versionRes.rows[0].next;

    // Archivar versión anterior
    await client.query(
      `INSERT INTO informes_versiones (informe_id, version, tipo, fecha, contenido, estado)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, nextVersion, inf.tipo, inf.fecha, inf.contenido, inf.estado]
    );

    // Actualizar informe
    const result = await client.query(
      `UPDATE informes i SET tipo = $1, fecha = $2, contenido = $3, estado = $4, fecha_vencimiento = $5
       FROM pacientes p
       WHERE i.id = $6 AND i.paciente_id = p.id AND p.usuario_id = $7
       RETURNING i.*`,
      [tipo, fecha, JSON.stringify(contenido || {}), estado, fecha_vencimiento || null, id, req.userId]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al actualizar informe:", error);
    res.status(500).json({ error: "Error al actualizar informe" });
  } finally {
    client.release();
  }
});

// 4b. LISTAR VERSIONES DE UN INFORME
router.get("/:id/versiones", async (req, res) => {
  const { id } = req.params;
  try {
    // Verificar que el informe pertenece al usuario
    const check = await pool.query(
      `SELECT i.id FROM informes i JOIN pacientes p ON i.paciente_id = p.id WHERE i.id = $1 AND p.usuario_id = $2`,
      [id, req.userId]
    );
    if (check.rows.length === 0) return res.status(404).json({ error: "Informe no encontrado" });

    const result = await pool.query(
      `SELECT * FROM informes_versiones WHERE informe_id = $1 ORDER BY version DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener versiones:", error);
    res.status(500).json({ error: "Error al obtener versiones" });
  }
});

// 4c. RESTAURAR UNA VERSIÓN
router.post("/:id/versiones/:versionId/restaurar", async (req, res) => {
  const { id, versionId } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar ownership
    const actual = await client.query(
      `SELECT i.* FROM informes i JOIN pacientes p ON i.paciente_id = p.id WHERE i.id = $1 AND p.usuario_id = $2`,
      [id, req.userId]
    );
    if (actual.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Informe no encontrado" });
    }

    const version = await client.query(
      `SELECT * FROM informes_versiones WHERE id = $1 AND informe_id = $2`,
      [versionId, id]
    );
    if (version.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Versión no encontrada" });
    }

    const v = version.rows[0];
    const inf = actual.rows[0];

    // Archivar estado actual antes de restaurar
    const versionRes = await client.query(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next FROM informes_versiones WHERE informe_id = $1`,
      [id]
    );
    await client.query(
      `INSERT INTO informes_versiones (informe_id, version, tipo, fecha, contenido, estado)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, versionRes.rows[0].next, inf.tipo, inf.fecha, inf.contenido, inf.estado]
    );

    // Restaurar
    const result = await client.query(
      `UPDATE informes SET tipo = $1, fecha = $2, contenido = $3, estado = $4 WHERE id = $5 RETURNING *`,
      [v.tipo, v.fecha, v.contenido, v.estado, id]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al restaurar versión:", error);
    res.status(500).json({ error: "Error al restaurar versión" });
  } finally {
    client.release();
  }
});

// 5. ELIMINAR INFORME
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM informes i USING pacientes p
       WHERE i.id = $1 AND i.paciente_id = p.id AND p.usuario_id = $2
       RETURNING i.id`,
      [id, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Informe no encontrado" });
    res.json({ message: "Informe eliminado" });
  } catch (error) {
    console.error("Error al eliminar informe:", error);
    res.status(500).json({ error: "Error al eliminar informe" });
  }
});

export default router;
