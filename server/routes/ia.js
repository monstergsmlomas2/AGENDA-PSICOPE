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
  clasificarIntencionAsistente,
  asistenteChatClinico,
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

// ─────────────────────────────────────────────
// 8. CLASIFICAR INTENCIÓN (texto ya transcripto — usado por Web Speech API)
// POST /ia/clasificar-intencion
// Body: { transcripcion }
// ─────────────────────────────────────────────
router.post('/clasificar-intencion', async (req, res) => {
  const { transcripcion } = req.body;
  if (!transcripcion?.trim()) return res.status(400).json({ error: 'transcripcion es requerida' });

  try {
    const pacientesResult = await pool.query(
      'SELECT id, nombre, apellido FROM pacientes WHERE usuario_id = $1 ORDER BY apellido ASC',
      [req.userId]
    );
    const fechaHoy = new Date().toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
    const { intencion, params } = await clasificarIntencionAsistente(
      transcripcion,
      pacientesResult.rows,
      fechaHoy
    );
    res.json({ intencion, params });
  } catch (err) {
    console.error('[IA] clasificar-intencion:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// 9. ASISTENTE DE VOZ (audio — Groq Whisper + fallback)
// POST /ia/asistente
// Form-data: archivo (audio)
// Devuelve: { transcripcion, intencion, params, proveedorTranscripcion }
// ─────────────────────────────────────────────
router.post('/asistente', upload.single('archivo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió archivo de audio' });

  const groqApiKey = process.env.GROQ_API_KEY;
  let transcripcion = null;
  let proveedorTranscripcion = null;

  // ── Paso 1: Transcripción con Groq (con fallback a DeepSeek) ──
  if (groqApiKey) {
    try {
      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append('file', blob, req.file.originalname || 'audio.webm');
      formData.append('model', 'whisper-large-v3');
      formData.append('language', 'es');
      formData.append('response_format', 'json');

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqApiKey}` },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (groqRes.ok) {
        const data = await groqRes.json();
        transcripcion = data.text;
        proveedorTranscripcion = 'groq';
      } else {
        const errText = await groqRes.text();
        console.warn(`[Asistente] Groq falló (${groqRes.status}), usando fallback DeepSeek. Error: ${errText}`);
      }
    } catch (err) {
      console.warn(`[Asistente] Groq timeout/error: ${err.message} — usando fallback DeepSeek`);
    }
  }

  // Sin Groq no hay transcripción de audio disponible desde el servidor
  if (!transcripcion) {
    return res.status(503).json({ error: 'Servicio de transcripción no disponible. Configurá GROQ_API_KEY.' });
  }

  // ── Paso 2: Clasificar intención con DeepSeek ──
  try {
    const pacientesResult = await pool.query(
      'SELECT id, nombre, apellido FROM pacientes WHERE usuario_id = $1 ORDER BY apellido ASC',
      [req.userId]
    );

    const fechaHoy = new Date().toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });

    const { intencion, params } = await clasificarIntencionAsistente(
      transcripcion,
      pacientesResult.rows,
      fechaHoy
    );

    res.json({ transcripcion, intencion, params, proveedorTranscripcion });
  } catch (err) {
    console.error('[Asistente] clasificar intención:', err.message);
    // Aunque falle la clasificación, devolvemos la transcripción
    res.json({ transcripcion, intencion: 'no_entendido', params: {}, proveedorTranscripcion });
  }
});

// ─────────────────────────────────────────────
// 10. ASISTENTE CLÍNICO CONVERSACIONAL (chat)
// POST /ia/chat
// Body: { historial: [{role, content}], pacienteId? }
// ─────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  const { historial, pacienteId } = req.body;

  if (!historial || !Array.isArray(historial) || historial.length === 0) {
    return res.status(400).json({ error: 'historial es requerido y debe ser un array' });
  }

  try {
    let paciente = null;
    let sesiones = [];
    let evaluaciones = [];

    if (pacienteId) {
      const [pacResult, sesResult, evalResult] = await Promise.all([
        pool.query('SELECT * FROM pacientes WHERE id = $1 AND usuario_id = $2', [pacienteId, req.userId]),
        pool.query('SELECT fecha, observaciones, actividades_realizadas FROM sesiones WHERE paciente_id = $1 AND usuario_id = $2 ORDER BY fecha ASC', [pacienteId, req.userId]),
        pool.query('SELECT nombre_test, tipo, observaciones FROM evaluaciones WHERE paciente_id = $1 AND usuario_id = $2', [pacienteId, req.userId]),
      ]);
      if (pacResult.rows.length > 0) {
        paciente = pacResult.rows[0];
        sesiones = sesResult.rows;
        evaluaciones = evalResult.rows;
      }
    }

    const respuesta = await asistenteChatClinico({ historial, paciente, sesiones, evaluaciones });
    res.json({ respuesta });
  } catch (error) {
    console.error('[IA] chat:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
