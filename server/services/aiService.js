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
 * Convierte un objeto JSON (ej: entrevista de admisión) en texto plano legible
 * tipo "clave: valor", recorriendo de forma recursiva, para incluirlo en prompts.
 */
function formatearJSONLegible(obj, indent = '') {
  if (obj === null || obj === undefined || obj === '') return null;
  if (typeof obj !== 'object') return String(obj);

  const lineas = [];
  for (const [clave, valor] of Object.entries(obj)) {
    if (valor === null || valor === undefined || valor === '' || valor === false) continue;
    if (typeof valor === 'object') {
      const sub = formatearJSONLegible(valor, indent + '  ');
      if (sub) lineas.push(`${indent}${clave}:\n${sub}`);
    } else {
      lineas.push(`${indent}${clave}: ${valor}`);
    }
  }
  return lineas.length > 0 ? lineas.join('\n') : null;
}

/**
 * Llama a DeepSeek con mensajes completos (para conversaciones multi-turno).
 */
async function llamarDeepSeekConMensajes(messages, opciones = {}) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY no configurada en .env');

  const response = await fetch(DEEPSEEK_API_URL, {
    signal: AbortSignal.timeout(opciones.timeoutMs ?? 30000),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: opciones.model || DEEPSEEK_MODEL,
      messages,
      temperature: opciones.temperature ?? 0.5,
      max_tokens: opciones.maxTokens ?? 1000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

/**
 * Llama a DeepSeek con un system prompt y un user prompt.
 * Devuelve el texto de la respuesta.
 */
async function llamarDeepSeek(systemPrompt, userPrompt, opciones = {}) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY no configurada en .env');

  const response = await fetch(DEEPSEEK_API_URL, {
    signal: AbortSignal.timeout(opciones.timeoutMs ?? 30000),
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
export async function generarInforme({ paciente, sesiones, evaluaciones, tipoInforme, secciones }) {
  // Cuando el cliente manda las secciones del tipo de informe, se pide la
  // respuesta como JSON con esas claves exactas. Así el informe generado entra
  // directo en el formulario de la ficha del paciente, sin repartir texto a mano.
  const modoEstructurado = Array.isArray(secciones) && secciones.length > 0;

  const system = modoEstructurado
    ? `Sos un psicopedagogo experto redactando informes clínicos formales.
Respondé SIEMPRE en español rioplatense, con lenguaje técnico pero accesible.
El informe debe ser profesional, objetivo y basado ÚNICAMENTE en la información provista.
No inventes datos que no estén en la información dada: si para una sección no hay
información suficiente, dejá esa sección como cadena vacía.
Devolvé ÚNICAMENTE un objeto JSON estricto, sin markdown y sin texto adicional,
con EXACTAMENTE estas claves:
${secciones.map(s => `- "${s.key}": ${s.label}`).join('\n')}`
    : `Sos un psicopedagogo experto redactando informes clínicos formales.
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

${modoEstructurado
  ? 'Completá cada sección del informe con la información disponible. Devolvé solo el JSON.'
  : 'Redactá un informe psicopedagógico completo basado en esta información. Incluí: introducción, motivo de consulta, metodología de trabajo, evolución clínica observada, conclusiones y recomendaciones.'}`;

  const respuesta = await llamarDeepSeek(system, user, { temperature: 0.3, maxTokens: 2000 });

  if (!modoEstructurado) return { texto: respuesta, secciones: null };

  // Si el modelo no devuelve JSON válido, se entrega la prosa tal cual y el
  // cliente la vuelca en la primera sección para que el profesional la reparta.
  try {
    const limpio = respuesta.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(limpio);
    const contenido = {};
    for (const s of secciones) {
      if (typeof parsed[s.key] === 'string') contenido[s.key] = parsed[s.key].trim();
    }
    return { texto: respuesta, secciones: contenido };
  } catch {
    console.warn('[IA] generar-informe: el modelo no devolvió JSON válido, se usa la prosa cruda');
    return { texto: respuesta, secciones: null };
  }
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

// ─────────────────────────────────────────────
// 7. EXTRACCIÓN DE EVENTOS PARA AGENDA PERSONAL
// ─────────────────────────────────────────────

/**
 * Detecta si un mensaje libre (enviado a sí mismo) es una tarea/recordatorio
 * y en ese caso extrae los datos del evento.
 * Devuelve { esRecordatorio: bool, evento: {...} | null }
 */
export async function detectarYExtraerRecordatorio(textoLibre, fechaHoy) {
  const system = `Sos un asistente personal que analiza mensajes que un profesional se envía a sí mismo.
Tu única tarea es decidir si el mensaje es una tarea, recordatorio, nota para hacer algo, o un evento a agendar.
Respondé ÚNICAMENTE con un JSON estricto sin texto adicional ni markdown.

Si ES un recordatorio/tarea/evento, devolvé:
{
  "es_recordatorio": true,
  "titulo": "breve resumen (máximo 50 chars)",
  "descripcion": "detalles adicionales o cadena vacía",
  "fecha": "YYYY-MM-DD (calculá fechas relativas sabiendo que hoy es ${fechaHoy})",
  "hora": "HH:MM en formato 24h, o 09:00 si no se menciona",
  "recordatorio_minutos": número entero de minutos antes para la alerta (default 30)
}

Si NO es un recordatorio (es una conversación, reflexión, saludo, mensaje casual, consulta, etc.), devolvé:
{
  "es_recordatorio": false
}

Ejemplos de recordatorios: "llamar a la mamá de Juan mañana", "comprar material de evaluación el viernes", "reunión con la directora jueves 15hs", "pagar el alquiler el 10"
Ejemplos de NO recordatorio: "hola", "qué lindo día", "me olvidé el paraguas", "¿dónde puse las llaves?"`;

  const respuesta = await llamarDeepSeek(system, textoLibre, {
    temperature: 0.1,
    maxTokens: 300,
  });

  try {
    const limpio = respuesta.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(limpio);
    if (!parsed.es_recordatorio) return { esRecordatorio: false, evento: null };
    return {
      esRecordatorio: true,
      evento: {
        titulo: parsed.titulo,
        descripcion: parsed.descripcion || '',
        fecha: parsed.fecha,
        hora: parsed.hora || '09:00',
        recordatorio_minutos: parsed.recordatorio_minutos || 30,
      },
    };
  } catch {
    return { esRecordatorio: false, evento: null };
  }
}

// ─────────────────────────────────────────────
// 8. CLASIFICAR INTENCIÓN DEL ASISTENTE DE VOZ
// ─────────────────────────────────────────────

/**
 * Recibe el texto transcripto y la lista de pacientes del usuario,
 * y devuelve la intención detectada + parámetros estructurados.
 *
 * Intenciones posibles:
 *   - navegar_paciente   { pacienteId, pacienteNombre }
 *   - navegar_ruta       { ruta }
 *   - transcribir_sesion { texto }
 *   - recordatorio_whatsapp { pacienteId, pacienteNombre, mensaje, fecha?, hora? }
 *   - opinion_clinica    { pacienteId, pacienteNombre, consulta }
 *   - respuesta_directa  { respuesta }
 *   - no_entendido       {}
 */
export async function clasificarIntencionAsistente(texto, pacientes = [], fechaHoy) {
  const listaPacientes = pacientes.length > 0
    ? pacientes.map(p => `ID:${p.id} — ${p.nombre} ${p.apellido}`).join('\n')
    : 'Sin pacientes registrados';

  const system = `Sos el asistente de voz de una aplicación de gestión clínica psicopedagógica.
Recibís texto dictado por el profesional y debés clasificar la intención y extraer parámetros.
Respondé ÚNICAMENTE con un JSON estricto sin markdown ni texto adicional.

Intenciones posibles:
- "recordatorio_personal": el profesional quiere agendar una tarea, recordatorio o evento PERSONAL (para sí mismo). NO involucra enviar mensajes a pacientes. Ejemplos: "agregar recordatorio para ir a buscar a alguien", "recordame comprar algo", "tengo reunión el jueves", "anotá que mañana tengo tal cosa".
  Parámetros: { "titulo": "resumen corto máx 50 chars", "descripcion": "detalles o cadena vacía", "fecha_hora": "YYYY-MM-DDTHH:MM:00" (calculá fechas relativas sabiendo que hoy es ${fechaHoy}), "recordatorio_minutos": 30 }
- "navegar_paciente": el profesional quiere ir a la ficha/sesiones/historia de un paciente.
  Parámetros: { "pacienteId": "uuid", "pacienteNombre": "nombre completo" }
- "navegar_ruta": quiere ir a una sección de la app (turnos, pagos, dashboard, etc).
  Parámetros: { "ruta": "/turnos" | "/dashboard" | "/pacientes" | "/pagos" | "/informes" | "/obras-sociales" | "/consultorios" | "/configuracion" | "/ia" | "/mi-agenda" }
- "transcribir_sesion": dictó el contenido de una sesión clínica para guardarla.
  Parámetros: { "texto": "texto completo de la sesión" }
- "recordatorio_whatsapp": quiere enviar un mensaje o recordatorio por WhatsApp directamente A UN PACIENTE (no a sí mismo).
  Parámetros: { "pacienteId": "uuid o null si no se detecta", "pacienteNombre": "nombre", "mensaje": "texto del mensaje", "fecha": "YYYY-MM-DD o null", "hora": "HH:MM o null" }
- "opinion_clinica": quiere una opinión o análisis clínico sobre un paciente.
  Parámetros: { "pacienteId": "uuid o null", "pacienteNombre": "nombre o null", "consulta": "pregunta completa" }
- "respuesta_directa": pregunta general que puedo responder directamente sin abrir pantallas.
  Parámetros: { "respuesta": "texto de respuesta breve" }
- "no_entendido": no se puede determinar la intención.
  Parámetros: {}

REGLA CRÍTICA: Si el profesional dice "agregar recordatorio", "anotá", "recordame", "tengo que", "mañana tengo" → es SIEMPRE "recordatorio_personal" a menos que diga explícitamente "mandá WhatsApp" o "avisá al paciente".

Hoy es ${fechaHoy}.

Lista de pacientes del profesional (usala SOLO para match cuando la intención sea navegar o enviar WhatsApp a ese paciente):
${listaPacientes}

Devolvé exactamente: { "intencion": "...", "params": { ... } }`;

  const respuesta = await llamarDeepSeek(system, texto, { temperature: 0.1, maxTokens: 400 });

  try {
    const limpio = respuesta.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(limpio);
  } catch {
    return { intencion: 'no_entendido', params: {} };
  }
}

// ─────────────────────────────────────────────
// 9. ASISTENTE CLÍNICO CONVERSACIONAL
// ─────────────────────────────────────────────
export async function asistenteChatClinico({ historial, paciente, sesiones, evaluaciones, informes }) {
  let contextoPaciente = '';

  if (paciente) {
    const edad = paciente.fecha_nacimiento
      ? Math.floor((new Date() - new Date(paciente.fecha_nacimiento)) / (365.25 * 24 * 60 * 60 * 1000)) + ' años'
      : 'no registrada';

    contextoPaciente = `
CONTEXTO DEL PACIENTE CON EL QUE ESTÁS TRABAJANDO (información completa de su ficha):

== DATOS GENERALES ==
Nombre: ${paciente.nombre} ${paciente.apellido}
DNI: ${paciente.dni || 'no registrado'}
Edad: ${edad}
Sexo: ${paciente.sexo || 'no registrado'}
Diagnóstico: ${paciente.diagnostico || 'no especificado'}
Motivo de consulta: ${paciente.motivo || 'no especificado'}
Escolaridad / Escuela: ${paciente.escolaridad || paciente.escuela || 'no especificada'}
Obra social: ${paciente.obra_social || 'no registrada'} (N° afiliado: ${paciente.nro_afiliado || 's/d'})
Responsable: ${paciente.responsable || 'no registrado'}
Derivado por: ${paciente.derivada_por || 'no registrado'}
Inicio de tratamiento: ${paciente.inicio_sesiones ? new Date(paciente.inicio_sesiones).toLocaleDateString('es-AR') : 'no registrado'}
Posee CUD (Certificado Único de Discapacidad): ${paciente.cud ? 'Sí' : 'No'}
Consentimiento informado: ${paciente.consentimiento ? 'Firmado' : 'No registrado'}

== ENTREVISTA DE ADMISIÓN ==
${paciente.entrevista ? formatearJSONLegible(paciente.entrevista) : 'No se registró entrevista de admisión.'}

== SESIONES (total: ${sesiones?.length || 0}) ==
${sesiones?.length > 0
  ? sesiones.map((s, i) => `Sesión ${i + 1} (${new Date(s.fecha).toLocaleDateString('es-AR')}):
  Observaciones: ${s.observaciones || 's/d'}
  Actividades realizadas: ${s.actividades_realizadas || 's/d'}
  Recomendaciones: ${s.recomendaciones || 's/d'}
  Resumen IA: ${s.resumen_ia || 's/d'}`).join('\n\n')
  : 'No hay sesiones registradas.'}

== EVALUACIONES (total: ${evaluaciones?.length || 0}) ==
${evaluaciones?.length > 0
  ? evaluaciones.map((e, i) => `Evaluación ${i + 1} — ${e.tipo_test || 'Test'} (${e.fecha_administracion ? new Date(e.fecha_administracion).toLocaleDateString('es-AR') : 's/f'}):
  Puntaje obtenido: ${e.puntaje_obtenido ?? 's/d'}
  Resultados: ${e.resultados || 's/d'}
  Observaciones: ${e.observaciones || 's/d'}`).join('\n\n')
  : 'No hay evaluaciones registradas.'}

== INFORMES (total: ${informes?.length || 0}) ==
${informes?.length > 0
  ? informes.map((inf, i) => `Informe ${i + 1} — ${inf.tipo || 'Informe'} (${inf.fecha ? new Date(inf.fecha).toLocaleDateString('es-AR') : 's/f'}, estado: ${inf.estado || 's/d'}):
${inf.contenido || 's/d'}`).join('\n\n')
  : 'No hay informes registrados.'}
`;
  }

  const systemPrompt = `Sos un asistente clínico especializado en psicopedagogía, que acompaña al profesional en su práctica diaria.
Tu rol es ser un colega experto: respondés consultas clínicas, sugerís estrategias de intervención, interpretás síntomas y señales, y ayudás a reflexionar sobre el proceso terapéutico.
Respondé SIEMPRE en español rioplatense, con lenguaje técnico pero cálido.
Sé conciso y directo. Si no tenés información suficiente, decilo claramente.
Si la consulta del profesional es ambigua, demasiado breve o no entendés bien qué necesita, NUNCA respondas con un mensaje vacío, un simple "?" o algo similar: pedí explícitamente que te explique o detalle mejor su consulta, sugiriendo qué información te serviría (por ejemplo: a qué sesión se refiere, qué objetivo busca, qué dificultad puntual tiene el paciente, etc.).
NUNCA inventés datos que no estén en el contexto provisto.
NUNCA diagnosticás de forma definitiva — siempre usá lenguaje probabilístico y recordá que la decisión clínica final es del profesional.
${contextoPaciente}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...historial,
  ];

  return llamarDeepSeekConMensajes(messages, { temperature: 0.5, maxTokens: 1000 });
}

export async function extraerEventoDeTexto(textoLibre, fechaHoy) {
  const system = `Sos un asistente de productividad personal.
Analizá el siguiente texto escrito por un profesional y extraé los datos
para agendar un recordatorio en su calendario.
Devolvé ÚNICAMENTE un objeto JSON estricto con estas claves:
- "titulo": Breve resumen de la tarea (máximo 50 caracteres).
- "descripcion": Detalles adicionales mencionados. Cadena vacía si no hay.
- "fecha": En formato YYYY-MM-DD. Calculá fechas relativas sabiendo que hoy es ${fechaHoy}.
- "hora": En formato HH:MM (24 horas). Si no se menciona hora, usar "09:00".
- "recordatorio_minutos": Entero de minutos antes para enviar la alerta.
  Por defecto 30 si no se especifica.
Sin texto adicional, sin markdown, solo el JSON.`;

  const user = textoLibre;

  const respuesta = await llamarDeepSeek(system, user, {
    temperature: 0.1,
    maxTokens: 300,
  });

  try {
    const limpio = respuesta.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(limpio);
  } catch {
    throw new Error(`No se pudo parsear el evento extraído por la IA: ${respuesta.substring(0, 100)}`);
  }
}
