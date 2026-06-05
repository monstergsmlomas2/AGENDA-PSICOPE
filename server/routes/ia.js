import express from 'express';
import multer from 'multer';
import pool from '../config/db.js';
import {
  resumirSesion,
  generarInforme,
  sugerirObjetivos,
  analizarAbandonos,
  detectarEstancamiento,
  buscarEnHistoria,
} from '../services/aiService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// ─────────────────────────────────────────────
// 1. RESUMIR SESIÓN
// POST /ia/resumir-sesion
// Body: { pacienteId, notasCrudas, nroSesion? }
// ─────────────────────────────────────────────
router.post('/resumir-sesion', async (req, res) => {
  const { pacienteId, notasCrudas, nroSesion } = req.body;

  if (!pacienteId || !notasCrudas?.trim()) {
    return res.status(400).json({ error: 'pacienteId y notasCrudas son requeridos' });
  }

  try {
    const pacResult = await pool.query(
      'SELECT nombre, apellido, diagnostico, motivo FROM pacientes WHERE id = $1 AND usuario_id = $2',
      [pacienteId, req.userId]
    );
    if (pacResult.rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' });

    const resumen = await resumirSesion({ notasCrudas, paciente: pacResult.rows[0], nroSesion });
    res.json({ resumen });
  } catch (error) {
    console.error('[IA] resumir-sesion:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// 2. GENERAR INFORME PSICOPEDAGÓGICO
// POST /ia/generar-informe
// Body: { pacienteId, tipoInforme? }
// ─────────────────────────────────────────────
router.post('/generar-informe', async (req, res) => {
  const { pacienteId, tipoInforme } = req.body;

  if (!pacienteId) return res.status(400).json({ error: 'pacienteId es requerido' });

  try {
    const [pacResult, sesResult, evalResult] = await Promise.all([
      pool.query('SELECT * FROM pacientes WHERE id = $1 AND usuario_id = $2', [pacienteId, req.userId]),
      pool.query('SELECT fecha, observaciones, actividades_realizadas FROM sesiones WHERE paciente_id = $1 AND usuario_id = $2 ORDER BY fecha ASC', [pacienteId, req.userId]),
      pool.query('SELECT * FROM evaluaciones WHERE paciente_id = $1 AND usuario_id = $2', [pacienteId, req.userId]),
    ]);

    if (pacResult.rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' });

    const informe = await generarInforme({
      paciente: pacResult.rows[0],
      sesiones: sesResult.rows,
      evaluaciones: evalResult.rows,
      tipoInforme,
    });

    res.json({ informe });
  } catch (error) {
    console.error('[IA] generar-informe:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// 3. SUGERIR OBJETIVOS TERAPÉUTICOS
// POST /ia/sugerir-objetivos
// Body: { pacienteId }
// ─────────────────────────────────────────────
router.post('/sugerir-objetivos', async (req, res) => {
  const { pacienteId } = req.body;

  if (!pacienteId) return res.status(400).json({ error: 'pacienteId es requerido' });

  try {
    const [pacResult, sesResult] = await Promise.all([
      pool.query('SELECT * FROM pacientes WHERE id = $1 AND usuario_id = $2', [pacienteId, req.userId]),
      pool.query('SELECT observaciones, actividades_realizadas FROM sesiones WHERE paciente_id = $1 AND usuario_id = $2 ORDER BY fecha DESC LIMIT 5', [pacienteId, req.userId]),
    ]);

    if (pacResult.rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' });

    const paciente = pacResult.rows[0];
    const objetivos = await sugerirObjetivos({
      paciente,
      entrevista: paciente.entrevista,
      sesionesRecientes: sesResult.rows,
    });

    res.json({ objetivos });
  } catch (error) {
    console.error('[IA] sugerir-objetivos:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// 4. DETECTAR PACIENTES EN RIESGO DE ABANDONO
// GET /ia/detectar-abandonos
// ─────────────────────────────────────────────
router.get('/detectar-abandonos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id, p.nombre, p.apellido, p.telefono,
        MAX(s.fecha) AS ultima_sesion,
        CASE
          WHEN COUNT(s.id) = 0 THEN NULL
          ELSE EXTRACT(DAY FROM (NOW() - MAX(s.fecha)))::INT
        END AS dias_desde_ultima_sesion
      FROM pacientes p
      LEFT JOIN sesiones s ON s.paciente_id = p.id
      WHERE p.usuario_id = $1
      GROUP BY p.id
      HAVING COUNT(s.id) = 0 OR MAX(s.fecha) < NOW() - INTERVAL '15 days'
      ORDER BY MAX(s.fecha) ASC NULLS FIRST
      LIMIT 20
    `, [req.userId]);

    if (result.rows.length === 0) return res.json({ pacientes: [] });

    const analisis = await analizarAbandonos(result.rows);

    const pacientesConAnalisis = result.rows.map(p => {
      const a = analisis.find(x => x.id === p.id) || { riesgo: 'medio', motivo: '', recomendacion: '' };
      return { ...p, ...a };
    });

    res.json({ pacientes: pacientesConAnalisis });
  } catch (error) {
    console.error('[IA] detectar-abandonos:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// 5. ALERTAS DE EVOLUCIÓN ESTANCADA
// POST /ia/alertas-estancamiento
// Body: { pacienteId }
// ─────────────────────────────────────────────
router.post('/alertas-estancamiento', async (req, res) => {
  const { pacienteId } = req.body;

  if (!pacienteId) return res.status(400).json({ error: 'pacienteId es requerido' });

  try {
    const [pacResult, sesResult] = await Promise.all([
      pool.query('SELECT nombre, apellido, diagnostico FROM pacientes WHERE id = $1 AND usuario_id = $2', [pacienteId, req.userId]),
      pool.query('SELECT fecha, observaciones, actividades_realizadas FROM sesiones WHERE paciente_id = $1 AND usuario_id = $2 ORDER BY fecha ASC', [pacienteId, req.userId]),
    ]);

    if (pacResult.rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' });

    const resultado = await detectarEstancamiento({
      paciente: pacResult.rows[0],
      sesiones: sesResult.rows,
    });

    res.json(resultado);
  } catch (error) {
    console.error('[IA] alertas-estancamiento:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// 6. TRANSCRIPCIÓN DE AUDIO (Groq Whisper)
// POST /ia/transcribir-audio
// Form-data: archivo (audio)
// ─────────────────────────────────────────────
router.post('/transcribir-audio', upload.single('archivo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo de audio' });

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) return res.status(500).json({ error: 'GROQ_API_KEY no configurada en .env' });

  try {
    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('file', blob, req.file.originalname || 'audio.mp3');
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'es');
    formData.append('response_format', 'json');

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqApiKey}` },
      body: formData,
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      throw new Error(`Groq API error ${groqRes.status}: ${err}`);
    }

    const data = await groqRes.json();
    res.json({ transcripcion: data.text });
  } catch (error) {
    console.error('[IA] transcribir-audio:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// 7. BÚSQUEDA INTELIGENTE EN HISTORIA CLÍNICA
// POST /ia/buscar-historia
// Body: { pacienteId, consulta }
// ─────────────────────────────────────────────
router.post('/buscar-historia', async (req, res) => {
  const { pacienteId, consulta } = req.body;

  if (!pacienteId || !consulta?.trim()) {
    return res.status(400).json({ error: 'pacienteId y consulta son requeridos' });
  }

  try {
    const [pacResult, sesResult, evalResult, infResult] = await Promise.all([
      pool.query('SELECT * FROM pacientes WHERE id = $1 AND usuario_id = $2', [pacienteId, req.userId]),
      pool.query('SELECT fecha, observaciones, actividades_realizadas FROM sesiones WHERE paciente_id = $1 ORDER BY fecha ASC', [pacienteId]),
      pool.query('SELECT * FROM evaluaciones WHERE paciente_id = $1', [pacienteId]),
      pool.query('SELECT tipo, fecha, descripcion FROM informes WHERE paciente_id = $1', [pacienteId]),
    ]);

    if (pacResult.rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' });

    const respuesta = await buscarEnHistoria({
      consulta,
      paciente: pacResult.rows[0],
      sesiones: sesResult.rows,
      evaluaciones: evalResult.rows,
      informes: infResult.rows,
    });

    res.json({ respuesta });
  } catch (error) {
    console.error('[IA] buscar-historia:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
