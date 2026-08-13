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

// Cantidad máxima de mensajes previos que se le envían al modelo en cada turno.
// Los hilos pueden crecer indefinidamente, pero el contexto del paciente ya es
// extenso: mandar todo dispararía el costo y el tiempo de respuesta.
const MAX_MENSAJES_CONTEXTO = 30;

// Título del hilo a partir del primer mensaje del profesional.
function titularConversacion(mensaje) {
  const limpio = mensaje.replace(/\s+/g, ' ').trim();
  return limpio.length > 60 ? `${limpio.slice(0, 60)}…` : limpio || 'Nueva conversación';
}

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
  const { pacienteId, tipoInforme, secciones } = req.body;

  if (!pacienteId) return res.status(400).json({ error: 'pacienteId es requerido' });

  // Las secciones las define el cliente (data/seccionesInforme.js) para no
  // duplicar la estructura del formulario de informes en el servidor.
  const seccionesValidas = Array.isArray(secciones)
    ? secciones.filter(s => typeof s?.key === 'string' && typeof s?.label === 'string').slice(0, 30)
    : null;

  try {
    const [pacResult, sesResult, evalResult] = await Promise.all([
      pool.query('SELECT * FROM pacientes WHERE id = $1 AND usuario_id = $2', [pacienteId, req.userId]),
      pool.query('SELECT fecha, observaciones, actividades_realizadas FROM sesiones WHERE paciente_id = $1 AND usuario_id = $2 ORDER BY fecha ASC', [pacienteId, req.userId]),
      pool.query('SELECT * FROM evaluaciones WHERE paciente_id = $1 AND usuario_id = $2', [pacienteId, req.userId]),
    ]);

    if (pacResult.rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' });

    const { texto, secciones: seccionesGeneradas } = await generarInforme({
      paciente: pacResult.rows[0],
      sesiones: sesResult.rows,
      evaluaciones: evalResult.rows,
      tipoInforme,
      secciones: seccionesValidas,
    });

    res.json({ informe: texto, secciones: seccionesGeneradas });
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
// Carga el contexto clínico completo de un paciente para el asistente.
// Devuelve null en `paciente` si el paciente no existe o no es del usuario.
// ─────────────────────────────────────────────
async function cargarContextoPaciente(pacienteId, usuarioId) {
  const vacio = { paciente: null, sesiones: [], evaluaciones: [], informes: [] };
  if (!pacienteId) return vacio;

  const [pacResult, sesResult, evalResult, infResult] = await Promise.all([
    pool.query('SELECT * FROM pacientes WHERE id = $1 AND usuario_id = $2', [pacienteId, usuarioId]),
    pool.query('SELECT fecha, observaciones, actividades_realizadas, recomendaciones, resumen_ia FROM sesiones WHERE paciente_id = $1 AND usuario_id = $2 ORDER BY fecha ASC', [pacienteId, usuarioId]),
    pool.query('SELECT tipo_test, fecha_administracion, resultados, puntaje_obtenido, observaciones FROM evaluaciones WHERE paciente_id = $1 AND usuario_id = $2 ORDER BY fecha_administracion ASC', [pacienteId, usuarioId]),
    pool.query('SELECT tipo, fecha, contenido, estado FROM informes WHERE paciente_id = $1 AND usuario_id = $2 ORDER BY fecha ASC', [pacienteId, usuarioId]),
  ]);

  if (pacResult.rows.length === 0) return vacio;

  return {
    paciente: pacResult.rows[0],
    sesiones: sesResult.rows,
    evaluaciones: evalResult.rows,
    informes: infResult.rows,
  };
}

// ─────────────────────────────────────────────
// 10. CONVERSACIONES DEL ASISTENTE CLÍNICO
// ─────────────────────────────────────────────

// GET /ia/conversaciones?pacienteId=123
// Sin pacienteId devuelve TODOS los hilos del usuario.
// Con pacienteId=general devuelve los hilos sin paciente asociado.
router.get('/conversaciones', async (req, res) => {
  const { pacienteId } = req.query;

  let filtro = '';
  const params = [req.userId];

  if (pacienteId === 'general') {
    filtro = 'AND c.paciente_id IS NULL';
  } else if (pacienteId) {
    filtro = 'AND c.paciente_id = $2';
    params.push(pacienteId);
  }

  try {
    const result = await pool.query(`
      SELECT
        c.id, c.paciente_id, c.titulo, c.creada_en, c.actualizada_en,
        p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
        COUNT(m.id)::INT AS cantidad_mensajes
      FROM ia_conversaciones c
      LEFT JOIN pacientes p ON p.id = c.paciente_id
      LEFT JOIN ia_mensajes m ON m.conversacion_id = c.id
      WHERE c.usuario_id = $1 ${filtro}
      GROUP BY c.id, p.nombre, p.apellido
      ORDER BY c.actualizada_en DESC
      LIMIT 100
    `, params);

    res.json({ conversaciones: result.rows });
  } catch (error) {
    console.error('[IA] listar conversaciones:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /ia/conversaciones/:id — hilo completo con sus mensajes
router.get('/conversaciones/:id', async (req, res) => {
  try {
    const convResult = await pool.query(
      'SELECT id, paciente_id, titulo, creada_en, actualizada_en FROM ia_conversaciones WHERE id = $1 AND usuario_id = $2',
      [req.params.id, req.userId]
    );
    if (convResult.rows.length === 0) return res.status(404).json({ error: 'Conversación no encontrada' });

    const msgResult = await pool.query(
      'SELECT id, role, content, creado_en FROM ia_mensajes WHERE conversacion_id = $1 ORDER BY creado_en ASC, id ASC',
      [req.params.id]
    );

    res.json({ conversacion: convResult.rows[0], mensajes: msgResult.rows });
  } catch (error) {
    console.error('[IA] obtener conversación:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /ia/conversaciones/:id — renombrar
// Body: { titulo }
router.put('/conversaciones/:id', async (req, res) => {
  const { titulo } = req.body;
  if (!titulo?.trim()) return res.status(400).json({ error: 'titulo es requerido' });

  try {
    const result = await pool.query(
      'UPDATE ia_conversaciones SET titulo = $1 WHERE id = $2 AND usuario_id = $3 RETURNING id, paciente_id, titulo, actualizada_en',
      [titulo.trim().slice(0, 120), req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Conversación no encontrada' });

    res.json({ conversacion: result.rows[0] });
  } catch (error) {
    console.error('[IA] renombrar conversación:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /ia/conversaciones/:id — borra el hilo y sus mensajes (ON DELETE CASCADE)
router.delete('/conversaciones/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM ia_conversaciones WHERE id = $1 AND usuario_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Conversación no encontrada' });

    res.json({ ok: true });
  } catch (error) {
    console.error('[IA] eliminar conversación:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// 11. ASISTENTE CLÍNICO CONVERSACIONAL (chat)
// POST /ia/chat
// Body nuevo (persistente): { mensaje, conversacionId?, pacienteId? }
//   Sin conversacionId se crea un hilo nuevo y se devuelve su id.
// Body viejo (sin persistir): { historial: [{role, content}], pacienteId? }
//   Se mantiene por compatibilidad con clientes PWA cacheados.
// ─────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  const { mensaje, conversacionId, historial, pacienteId } = req.body;

  // ── Modo legacy: historial completo desde el cliente, sin persistencia ──
  if (!mensaje?.trim()) {
    if (!Array.isArray(historial) || historial.length === 0) {
      return res.status(400).json({ error: 'mensaje es requerido' });
    }
    try {
      const ctx = await cargarContextoPaciente(pacienteId, req.userId);
      const respuesta = await asistenteChatClinico({ historial, ...ctx });
      return res.json({ respuesta });
    } catch (error) {
      console.error('[IA] chat (legacy):', error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  const texto = mensaje.trim();

  try {
    // ── 1. Resolver el hilo y sus mensajes previos ──
    let conversacion = null;
    let previos = [];

    if (conversacionId) {
      const convResult = await pool.query(
        'SELECT id, paciente_id, titulo FROM ia_conversaciones WHERE id = $1 AND usuario_id = $2',
        [conversacionId, req.userId]
      );
      if (convResult.rows.length === 0) return res.status(404).json({ error: 'Conversación no encontrada' });
      conversacion = convResult.rows[0];

      // Últimos N mensajes, devueltos en orden cronológico
      const msgResult = await pool.query(`
        SELECT role, content FROM (
          SELECT role, content, creado_en, id
          FROM ia_mensajes
          WHERE conversacion_id = $1
          ORDER BY creado_en DESC, id DESC
          LIMIT $2
        ) t
        ORDER BY creado_en ASC, id ASC
      `, [conversacion.id, MAX_MENSAJES_CONTEXTO]);
      previos = msgResult.rows;
    }

    // El paciente del hilo manda sobre el del body: el contexto de una
    // conversación no cambia a mitad de camino.
    const pacienteDelHilo = conversacion ? conversacion.paciente_id : (pacienteId || null);

    // ── 2. Consultar al modelo ──
    const ctx = await cargarContextoPaciente(pacienteDelHilo, req.userId);
    const historialCompleto = [...previos, { role: 'user', content: texto }];
    const respuesta = await asistenteChatClinico({ historial: historialCompleto, ...ctx });

    // ── 3. Persistir recién con la respuesta en mano ──
    // Si la IA falla no queda ni el hilo ni el mensaje suelto.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (!conversacion) {
        const nueva = await client.query(
          'INSERT INTO ia_conversaciones (usuario_id, paciente_id, titulo) VALUES ($1, $2, $3) RETURNING id, paciente_id, titulo',
          [req.userId, pacienteDelHilo, titularConversacion(texto)]
        );
        conversacion = nueva.rows[0];
      }

      await client.query(
        'INSERT INTO ia_mensajes (conversacion_id, role, content) VALUES ($1, $2, $3), ($1, $4, $5)',
        [conversacion.id, 'user', texto, 'assistant', respuesta]
      );

      await client.query('UPDATE ia_conversaciones SET actualizada_en = NOW() WHERE id = $1', [conversacion.id]);

      await client.query('COMMIT');
    } catch (errTx) {
      await client.query('ROLLBACK');
      throw errTx;
    } finally {
      client.release();
    }

    res.json({
      respuesta,
      conversacionId: conversacion.id,
      titulo: conversacion.titulo,
      pacienteId: conversacion.paciente_id,
    });
  } catch (error) {
    console.error('[IA] chat:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
