/**
 * Definición de los tipos de informe y las secciones que compone cada uno.
 *
 * Se usa en dos lugares y tienen que coincidir:
 * - PacienteDetalle: formulario de carga y vista del informe.
 * - Panel de IA: pide a la IA que devuelva exactamente estas claves, para que
 *   el informe generado se pueda guardar en la ficha sin repartir texto a mano.
 */

export const tiposInforme = [
  { value: 'diagnostico', label: 'Informe Diagnóstico Psicopedagógico' },
  { value: 'evolucion', label: 'Informe de Evolución (periódico)' },
  { value: 'escolar', label: 'Informe Escolar (para docentes/directivos)' },
  { value: 'obra_social', label: 'Informe para Obra Social' },
  { value: 'derivacion', label: 'Derivación a otro profesional' },
  { value: 'asistencia', label: 'Certificado de Asistencia' },
];

export const seccionesPorTipo = {
  diagnostico: [
    { key: 'motivo_consulta', label: 'Motivo de Consulta' },
    { key: 'tecnicas_administradas', label: 'Técnicas Administradas' },
    { key: 'resultados_obtenidos', label: 'Resultados Obtenidos' },
    { key: 'diagnostico_presuntivo', label: 'Diagnóstico Presuntivo' },
    { key: 'orientaciones', label: 'Orientaciones y Sugerencias' },
  ],
  evolucion: [
    { key: 'periodo', label: 'Período' },
    { key: 'objetivos_trabajados', label: 'Objetivos Trabajados' },
    { key: 'logros_alcanzados', label: 'Logros Alcanzados' },
    { key: 'aspectos_continuar', label: 'Aspectos a Continuar Trabajando' },
    { key: 'conclusiones', label: 'Conclusiones' },
  ],
  escolar: [
    { key: 'escuela', label: 'Escuela', short: true },
    { key: 'direccion_escuela', label: 'Dirección', short: true },
    { key: 'anio', label: 'Año', short: true },
    { key: 'turno', label: 'Turno', short: true },
    { key: 'telefono_escuela', label: 'Teléfono', short: true },
    { key: 'logico_matematico', label: '1. Lógico-Matemático (descripción de dificultades, logros alcanzados, etc.)' },
    { key: 'lengua_oral_escrita', label: '2. Lengua Oral y Escrita (descripción de dificultades en la lectoescritura y expresión oral, logros alcanzados, etc.)' },
    { key: 'ciencias_naturales_sociales', label: '3. Ciencias Naturales y Ciencias Sociales (descripción de dificultades, logros alcanzados, etc.)' },
    { key: 'educacion_fisica', label: '4. Educación Física (descripción de dificultades, logros alcanzados, etc.)' },
    { key: 'artistica', label: '5. Artística (descripción de dificultades, logros alcanzados, etc.)' },
    { key: 'idioma_otra', label: '6. Idioma / Otra' },
    { key: 'estrategias_docente', label: '7. Estrategias Implementadas por la Docente ante las Dificultades de Aprendizaje' },
    { key: 'relacion_pares_docentes', label: '8. Relación con sus Pares y Docentes' },
    { key: 'participacion_familiar', label: '9. Participación Familiar en la Escuela' },
    { key: 'intervencion_eoe', label: '10. Intervención del E.O.E.' },
    { key: 'otras_consideraciones', label: '11. Otras Consideraciones' },
  ],
  obra_social: [
    { key: 'diagnostico', label: 'Diagnóstico / CIE' },
    { key: 'justificacion', label: 'Justificación de Sesiones' },
    { key: 'frecuencia', label: 'Frecuencia y Duración' },
    { key: 'objetivos_terapeuticos', label: 'Objetivos Terapéuticos' },
  ],
  derivacion: [
    { key: 'motivo_derivacion', label: 'Motivo de Derivación' },
    { key: 'profesional_sugerido', label: 'Profesional Sugerido' },
    { key: 'antecedentes', label: 'Antecedentes Relevantes' },
  ],
  asistencia: [
    { key: 'periodo_asistencia', label: 'Período de Asistencia' },
    { key: 'frecuencia_asistencia', label: 'Frecuencia' },
    { key: 'observaciones_asistencia', label: 'Observaciones' },
  ],
};

/** Etiqueta legible de un tipo de informe. */
export function labelTipoInforme(value) {
  return tiposInforme.find(t => t.value === value)?.label || 'Informe';
}

/**
 * Convierte el objeto de secciones a texto plano con títulos, para mostrar en
 * pantalla, copiar al portapapeles, imprimir o volcar en el PDF.
 */
export function seccionesATexto(tipo, contenido) {
  if (!contenido) return '';
  return (seccionesPorTipo[tipo] || [])
    .filter(s => contenido[s.key]?.trim())
    .map(s => `${s.label.toUpperCase()}\n${contenido[s.key].trim()}`)
    .join('\n\n');
}
