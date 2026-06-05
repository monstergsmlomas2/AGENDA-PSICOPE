/**
 * Servicio de IA abstracto — proveedor actual: DeepSeek V3
 * Para cambiar de proveedor: modificar AI_PROVIDER en .env
 *   AI_PROVIDER=deepseek  (default)
 *   AI_PROVIDER=gemini
 *   AI_PROVIDER=openai
 */

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat'; // DeepSeek V3

/**
 * Llama a DeepSeek con un system prompt y un user prompt.
 * Devuelve el texto de la respuesta.
 */
async function llamarDeepSeek(systemPrompt, userPrompt, opciones = {}) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY no configurada en .env');

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: opciones.model || DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: opciones.temperature ?? 0.4,
      max_tokens: opciones.maxTokens ?? 1500,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// ─────────────────────────────────────────────
// 1. RESUMIR SESIÓN
// ─────────────────────────────────────────────
export async function resumirSesion({ notasCrudas, paciente, nroSesion }) {
  const system = `Sos un asistente clínico especializado en psicopedagogía.
Tu tarea es transformar notas clínicas en un resumen estructurado, profesional y conciso.
Respondé SIEMPRE en español rioplatense.
El formato de respuesta debe ser exactamente este (con los encabezados en negrita):

**Resumen de la sesión:**
[2-3 oraciones describiendo lo trabajado]

**Observaciones clínicas:**
[aspectos relevantes del comportamiento, estado emocional, dificultades observadas]

**Progreso:**
[avances o retrocesos respecto a sesiones anteriores, si hay información]

**Plan para próxima sesión:**
[sugerencias concretas para continuar el tratamiento]`;

  const user = `Paciente: ${paciente.nombre} ${paciente.apellido}
Sesión número: ${nroSesion || 'sin número'}
Diagnóstico registrado: ${paciente.diagnostico || 'no especificado'}
Motivo de consulta: ${paciente.motivo || 'no especificado'}

Notas de la sesión:
${notasCrudas}`;

  return llamarDeepSeek(system, user, { temperature: 0.3, maxTokens: 800 });
}

// ─────────────────────────────────────────────
// 2. GENERAR INFORME PSICOPEDAGÓGICO
// ─────────────────────────────────────────────
export async function generarInforme({ paciente, sesiones, evaluaciones, tipoInforme }) {
  const system = `Sos un psicopedagogo experto redactando informes clínicos formales.
Respondé SIEMPRE en español rioplatense, con lenguaje técnico pero accesible.
El informe debe ser profesional, objetivo y basado en la información provista.
Usá estructura con párrafos claros. No inventes datos que no estén en la información dada.`;

  const sesionesTexto = sesiones.length > 0
    ? sesiones.slice(-10).map((s, i) =>
        `Sesión ${i + 1} (${s.fecha ? new Date(s.fecha).toLocaleDateString('es-AR') : 'sin fecha'}): ${s.observaciones || ''} ${s.actividades_realizadas || ''}`
      ).join('\n')
    : 'Sin sesiones registradas';

  const evaluacionesTexto = evaluaciones.length > 0
    ? evaluaciones.map(e =>
        `${e.nombre_test || e.tipo || 'Evaluación'}: ${e.observaciones || e.resultados || ''}`
      ).join('\n')
    : 'Sin evaluaciones registradas';

  const user = `Tipo de informe: ${tipoInforme || 'Informe psicopedagógico general'}

DATOS DEL PACIENTE:
Nombre: ${paciente.nombre} ${paciente.apellido}
Fecha de nacimiento: ${paciente.fecha_nacimiento ? new Date(paciente.fecha_nacimiento).toLocaleDateString('es-AR') : 'no registrada'}
Diagnóstico: ${paciente.diagnostico || 'no especificado'}
Motivo de consulta: ${paciente.motivo || 'no especificado'}
Derivado por: ${paciente.derivada_por || 'no especificado'}
Obra social: ${paciente.obra_social || 'particular'}

HISTORIAL DE SESIONES (últimas 10):
${sesionesTexto}

EVALUACIONES REALIZADAS:
${evaluacionesTexto}

Redactá un informe psicopedagógico completo basado en esta información. Incluí: introducción, motivo de consulta, metodología de trabajo, evolución clínica observada, conclusiones y recomendaciones.`;

  return llamarDeepSeek(system, user, { temperature: 0.3, maxTokens: 2000 });
}

// ─────────────────────────────────────────────
// 3. SUGERIR OBJETIVOS TERAPÉUTICOS
// ─────────────────────────────────────────────
export async function sugerirObjetivos({ paciente, entrevista, sesionesRecientes }) {
  const system = `Sos un psicopedagogo clínico experto en planificación terapéutica.
Tu tarea es sugerir objetivos terapéuticos específicos, medibles y alcanzables.
Respondé SIEMPRE en español rioplatense.
Organizá los objetivos en:

**Objetivos generales (largo plazo):**
[2-3 objetivos amplios del tratamiento]

**Objetivos específicos (corto plazo):**
[4-6 objetivos concretos para trabajar en las próximas sesiones]

**Estrategias sugeridas:**
[actividades o técnicas recomendadas para alcanzar los objetivos]`;

  const entrevistaTexto = entrevista
    ? Object.entries(entrevista).map(([k, v]) => `${k}: ${v}`).join('\n')
    : 'Sin entrevista registrada';

  const sesionesTexto = sesionesRecientes && sesionesRecientes.length > 0
    ? sesionesRecientes.slice(-5).map(s =>
        `${s.observaciones || ''} ${s.actividades_realizadas || ''}`
      ).join(' | ')
    : 'Sin sesiones registradas';

  const user = `DATOS DEL PACIENTE:
Nombre: ${paciente.nombre} ${paciente.apellido}
Edad: ${paciente.fecha_nacimiento ? Math.floor((new Date() - new Date(paciente.fecha_nacimiento)) / (365.25 * 24 * 60 * 60 * 1000)) + ' años' : 'no registrada'}
Diagnóstico: ${paciente.diagnostico || 'no especificado'}
Motivo de consulta: ${paciente.motivo || 'no especificado'}

ENTREVISTA DE ADMISIÓN:
${entrevistaTexto}

NOTAS DE SESIONES RECIENTES:
${sesionesTexto}

Sugerí objetivos terapéuticos adecuados para este paciente.`;

  return llamarDeepSeek(system, user, { temperature: 0.5, maxTokens: 1000 });
}

// ─────────────────────────────────────────────
// 4. ANALIZAR RIESGO DE ABANDONO
// ─────────────────────────────────────────────
export async function analizarAbandonos(pacientes) {
  if (!pacientes || pacientes.length === 0) return [];

  const system = `Sos un asistente clínico analizando riesgo de abandono de tratamiento.
Para cada paciente, evaluá el riesgo en base a días sin sesión y devolvé un JSON válido.
Respondé ÚNICAMENTE con un array JSON, sin texto adicional, sin markdown, sin bloques de código.`;

  const user = `Analizá estos pacientes y devolvé un array JSON con esta estructura exacta:
[{"id": 1, "riesgo": "alto|medio|bajo", "motivo": "texto corto", "recomendacion": "texto corto"}]

Pacientes:
${pacientes.map(p =>
    `ID ${p.id}: ${p.nombre} ${p.apellido} — última sesión: ${
      p.ultima_sesion
        ? `hace ${p.dias_desde_ultima_sesion} días`
        : 'nunca tuvo sesión'
    }`
  ).join('\n')}

Criterios:
- alto: más de 30 días sin sesión o nunca tuvo sesión
- medio: 15-30 días sin sesión
- bajo: menos de 15 días sin sesión`;

  const respuesta = await llamarDeepSeek(system, user, { temperature: 0.1, maxTokens: 1000 });

  try {
    const limpio = respuesta.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(limpio);
  } catch {
    return pacientes.map(p => ({
      id: p.id,
      riesgo: p.dias_desde_ultima_sesion > 30 || !p.ultima_sesion ? 'alto' : 'medio',
      motivo: 'Sin sesión reciente',
      recomendacion: 'Contactar al paciente',
    }));
  }
}

// ─────────────────────────────────────────────
// 5. DETECTAR ESTANCAMIENTO EN EVOLUCIÓN
// ─────────────────────────────────────────────
export async function detectarEstancamiento({ paciente, sesiones }) {
  if (!sesiones || sesiones.length < 3) {
    return {
      estancado: false,
      mensaje: 'No hay suficientes sesiones para analizar evolución (mínimo 3).',
      sugerencias: [],
    };
  }

  const system = `Sos un psicopedagogo analizando la evolución clínica de un paciente.
Analizá las notas de sesiones y determiná si hay señales de estancamiento terapéutico.
Respondé ÚNICAMENTE con un JSON válido, sin texto adicional ni bloques de código.`;

  const sesionesTexto = sesiones.slice(-8).map((s, i) =>
    `Sesión ${i + 1} (${s.fecha ? new Date(s.fecha).toLocaleDateString('es-AR') : ''}): ${s.observaciones || ''} ${s.actividades_realizadas || ''}`
  ).join('\n');

  const user = `Paciente: ${paciente.nombre} ${paciente.apellido}
Diagnóstico: ${paciente.diagnostico || 'no especificado'}
Total de sesiones: ${sesiones.length}

Últimas sesiones:
${sesionesTexto}

Devolvé SOLO este JSON:
{"estancado": true/false, "nivel": "leve|moderado|severo|sin_estancamiento", "mensaje": "descripción breve", "sugerencias": ["sugerencia 1", "sugerencia 2"]}`;

  const respuesta = await llamarDeepSeek(system, user, { temperature: 0.2, maxTokens: 600 });

  try {
    const limpio = respuesta.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(limpio);
  } catch {
    return { estancado: false, mensaje: respuesta, sugerencias: [] };
  }
}

// ─────────────────────────────────────────────
// 6. BÚSQUEDA INTELIGENTE EN HISTORIA CLÍNICA
// ─────────────────────────────────────────────
export async function buscarEnHistoria({ consulta, paciente, sesiones, evaluaciones, informes }) {
  const system = `Sos un asistente clínico que busca información relevante en historias clínicas.
Analizá la consulta del profesional y respondé con la información más relevante encontrada en los datos.
Respondé en español rioplatense, de forma concisa y organizada.
Si no encontrás información relevante, indicalo claramente.`;

  const sesionesTexto = sesiones && sesiones.length > 0
    ? sesiones.map((s, i) =>
        `Sesión ${i + 1} (${s.fecha ? new Date(s.fecha).toLocaleDateString('es-AR') : ''}): ${s.observaciones || ''} ${s.actividades_realizadas || ''}`
      ).join('\n')
    : 'Sin sesiones';

  const evaluacionesTexto = evaluaciones && evaluaciones.length > 0
    ? evaluaciones.map(e => `${e.nombre_test || 'Evaluación'}: ${e.observaciones || ''}`).join('\n')
    : 'Sin evaluaciones';

  const informesTexto = informes && informes.length > 0
    ? informes.map(i => `${i.tipo || 'Informe'} (${i.fecha ? new Date(i.fecha).toLocaleDateString('es-AR') : ''}): ${i.descripcion || ''}`).join('\n')
    : 'Sin informes';

  const user = `CONSULTA DEL PROFESIONAL: "${consulta}"

HISTORIA CLÍNICA DE: ${paciente.nombre} ${paciente.apellido}
Diagnóstico: ${paciente.diagnostico || 'no especificado'}
Motivo de consulta: ${paciente.motivo || 'no especificado'}

SESIONES:
${sesionesTexto}

EVALUACIONES:
${evaluacionesTexto}

INFORMES:
${informesTexto}

Respondé la consulta basándote en la información de la historia clínica.`;

  return llamarDeepSeek(system, user, { temperature: 0.3, maxTokens: 1000 });
}
