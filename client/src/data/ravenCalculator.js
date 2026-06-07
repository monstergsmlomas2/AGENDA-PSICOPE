import {
  CPM_GRUPOS, CPM_BAREMOS, CPM_COMPOSICION,
  SPM_GRUPOS, SPM_BAREMOS, SPM_COMPOSICION,
  APM_GRUPOS, APM_BAREMOS,
  GRADOS_RAVEN,
} from './ravenNormas';

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** Interpolación lineal entre los dos puntos de baremo más cercanos a pdBuscado */
function interpolarPercentil(baremo, pdBuscado) {
  const pds = Object.keys(baremo).map(Number).sort((a, b) => a - b);

  if (pdBuscado <= pds[0]) return baremo[pds[0]];
  if (pdBuscado >= pds[pds.length - 1]) return baremo[pds[pds.length - 1]];

  for (let i = 0; i < pds.length - 1; i++) {
    const pd0 = pds[i];
    const pd1 = pds[i + 1];
    if (pdBuscado >= pd0 && pdBuscado <= pd1) {
      const pc0 = baremo[pd0];
      const pc1 = baremo[pd1];
      if (pd0 === pd1) return pc0;
      const ratio = (pdBuscado - pd0) / (pd1 - pd0);
      return Math.round(pc0 + ratio * (pc1 - pc0));
    }
  }
  return baremo[pds[pds.length - 1]];
}

/** Devuelve el grado interpretativo para un percentil dado */
export function getGrado(percentil) {
  return GRADOS_RAVEN.find(g => percentil >= g.min && percentil <= g.max) || GRADOS_RAVEN[4];
}

/** Redondea años decimales: 7.3 → 7 años 4 meses (para mostrar) */
function formatEdad(edadDecimal) {
  const anios = Math.floor(edadDecimal);
  const meses = Math.round((edadDecimal - anios) * 12);
  if (meses === 0) return `${anios} años`;
  return `${anios} años y ${meses} meses`;
}

// ---------------------------------------------------------------------------
// Selección automática de escala según edad
// ---------------------------------------------------------------------------

export function escalaRecomendada(edadDecimal) {
  if (edadDecimal < 5) return null;
  if (edadDecimal < 11.5) return 'CPM';
  if (edadDecimal < 18) return 'SPM';
  return 'SPM'; // adultos usan SPM; APM solo para nivel superior
}

// ---------------------------------------------------------------------------
// Grupo normativo
// ---------------------------------------------------------------------------

export function getGrupoCPM(edadDecimal) {
  return CPM_GRUPOS.find(g => edadDecimal >= g.edadMin && edadDecimal < g.edadMax) || null;
}

export function getGrupoSPM(edadDecimal) {
  return SPM_GRUPOS.find(g => edadDecimal >= g.edadMin && edadDecimal < g.edadMax) || null;
}

export function getGrupoAPM(edadDecimal) {
  return APM_GRUPOS.find(g => edadDecimal >= g.edadMin && edadDecimal < g.edadMax) || null;
}

// ---------------------------------------------------------------------------
// Cálculo de discrepancias (consistencia interna)
// ---------------------------------------------------------------------------

function calcularDiscrepanciasCPM(pdA, pdAb, pdB, pdTotal) {
  if (!pdTotal || pdTotal < 10 || pdTotal > 36) return null;
  // Buscar la fila más cercana en composicion
  const claves = Object.keys(CPM_COMPOSICION).map(Number);
  const clave = claves.reduce((prev, curr) =>
    Math.abs(curr - pdTotal) < Math.abs(prev - pdTotal) ? curr : prev
  );
  const [expA, expAb, expB] = CPM_COMPOSICION[clave];
  return [
    { conjunto: 'A', obtenido: pdA, esperado: expA, discrepancia: pdA - expA },
    { conjunto: 'Ab', obtenido: pdAb, esperado: expAb, discrepancia: pdAb - expAb },
    { conjunto: 'B', obtenido: pdB, esperado: expB, discrepancia: pdB - expB },
  ];
}

function calcularDiscrepanciasSPM(pdA, pdB, pdC, pdD, pdE, pdTotal) {
  if (!pdTotal || pdTotal < 10 || pdTotal > 60) return null;
  const claves = Object.keys(SPM_COMPOSICION).map(Number);
  const clave = claves.reduce((prev, curr) =>
    Math.abs(curr - pdTotal) < Math.abs(prev - pdTotal) ? curr : prev
  );
  const [expA, expB, expC, expD, expE] = SPM_COMPOSICION[clave];
  return [
    { conjunto: 'A', obtenido: pdA, esperado: expA, discrepancia: pdA - expA },
    { conjunto: 'B', obtenido: pdB, esperado: expB, discrepancia: pdB - expB },
    { conjunto: 'C', obtenido: pdC, esperado: expC, discrepancia: pdC - expC },
    { conjunto: 'D', obtenido: pdD, esperado: expD, discrepancia: pdD - expD },
    { conjunto: 'E', obtenido: pdE, esperado: expE, discrepancia: pdE - expE },
  ];
}

// Indicador de consistencia: si alguna discrepancia > 2, la puntuación puede no ser representativa
function evaluarConsistencia(discrepancias) {
  if (!discrepancias) return { consistente: true, advertencia: null };
  const maxDisc = Math.max(...discrepancias.map(d => Math.abs(d.discrepancia)));
  if (maxDisc > 2) {
    return {
      consistente: false,
      advertencia: `Discrepancia de ${maxDisc} puntos en el perfil de conjuntos. La puntuación total puede no ser una estimación representativa del funcionamiento intelectual del sujeto (según criterio de Raven, 1996).`,
    };
  }
  return { consistente: true, advertencia: null };
}

// ---------------------------------------------------------------------------
// Función principal de cálculo CPM
// ---------------------------------------------------------------------------

export function calcularCPM({ edadDecimal, pdA, pdAb, pdB }) {
  const pdTotal = (pdA || 0) + (pdAb || 0) + (pdB || 0);
  const grupo = getGrupoCPM(edadDecimal);
  if (!grupo) return null;

  const baremo = CPM_BAREMOS[grupo.id];
  const percentil = interpolarPercentil(baremo, pdTotal);
  const grado = getGrado(percentil);
  const discrepancias = calcularDiscrepanciasCPM(pdA || 0, pdAb || 0, pdB || 0, pdTotal);
  const consistencia = evaluarConsistencia(discrepancias);

  return {
    escala: 'CPM',
    escalaLabel: 'Escala de Color (CPM)',
    edadLabel: formatEdad(edadDecimal),
    grupoLabel: grupo.label,
    pdTotal,
    pdMax: 36,
    conjuntos: [
      { nombre: 'Conjunto A', pd: pdA || 0, maxPd: 12 },
      { nombre: 'Conjunto Ab', pd: pdAb || 0, maxPd: 12 },
      { nombre: 'Conjunto B', pd: pdB || 0, maxPd: 12 },
    ],
    percentil,
    grado,
    discrepancias,
    consistencia,
  };
}

// ---------------------------------------------------------------------------
// Función principal de cálculo SPM
// ---------------------------------------------------------------------------

export function calcularSPM({ edadDecimal, pdA, pdB, pdC, pdD, pdE }) {
  const pdTotal = (pdA || 0) + (pdB || 0) + (pdC || 0) + (pdD || 0) + (pdE || 0);
  const grupo = getGrupoSPM(edadDecimal);
  if (!grupo) return null;

  const baremo = SPM_BAREMOS[grupo.id];
  const percentil = interpolarPercentil(baremo, pdTotal);
  const grado = getGrado(percentil);
  const discrepancias = calcularDiscrepanciasSPM(
    pdA || 0, pdB || 0, pdC || 0, pdD || 0, pdE || 0, pdTotal
  );
  const consistencia = evaluarConsistencia(discrepancias);

  return {
    escala: 'SPM',
    escalaLabel: 'Escala General (SPM)',
    edadLabel: formatEdad(edadDecimal),
    grupoLabel: grupo.label,
    pdTotal,
    pdMax: 60,
    conjuntos: [
      { nombre: 'Conjunto A', pd: pdA || 0, maxPd: 12 },
      { nombre: 'Conjunto B', pd: pdB || 0, maxPd: 12 },
      { nombre: 'Conjunto C', pd: pdC || 0, maxPd: 12 },
      { nombre: 'Conjunto D', pd: pdD || 0, maxPd: 12 },
      { nombre: 'Conjunto E', pd: pdE || 0, maxPd: 12 },
    ],
    percentil,
    grado,
    discrepancias,
    consistencia,
  };
}

// ---------------------------------------------------------------------------
// Función principal de cálculo APM
// ---------------------------------------------------------------------------

export function calcularAPM({ edadDecimal, pdSetII }) {
  const pdTotal = pdSetII || 0;
  const grupo = getGrupoAPM(edadDecimal);
  if (!grupo) return null;

  const baremo = APM_BAREMOS[grupo.id];
  const percentil = interpolarPercentil(baremo, pdTotal);
  const grado = getGrado(percentil);

  return {
    escala: 'APM',
    escalaLabel: 'Escala Avanzada/Superior (APM)',
    edadLabel: formatEdad(edadDecimal),
    grupoLabel: grupo.label,
    pdTotal,
    pdMax: 36,
    conjuntos: [
      { nombre: 'Set II', pd: pdTotal, maxPd: 36 },
    ],
    percentil,
    grado,
    discrepancias: null,
    consistencia: { consistente: true, advertencia: null },
  };
}

// ---------------------------------------------------------------------------
// Generador de párrafo clínico automático
// ---------------------------------------------------------------------------

export function generarParagrafoClinico(resultado, nombrePaciente) {
  if (!resultado) return '';
  const nombre = nombrePaciente || 'El/la evaluado/a';
  const { escalaLabel, grupoLabel, pdTotal, pdMax, percentil, grado, consistencia, edadLabel } = resultado;

  const pd_pct = Math.round((pdTotal / pdMax) * 100);

  let consistenciaTexto = '';
  if (!consistencia.consistente) {
    consistenciaTexto = ` Se observa una discrepancia notable en el perfil de conjuntos que sugiere cautela en la interpretación del puntaje total.`;
  }

  let interpretacion = '';
  switch (grado.grado) {
    case 'I':
      interpretacion = `Su desempeño es notablemente superior al de sus pares, ubicándose en el rango de capacidad eductiva intelectualmente superior. Presenta un alto nivel de desarrollo del razonamiento analógico no verbal y de la capacidad para educar relaciones en material abstracto.`;
      break;
    case 'II':
      interpretacion = `Su desempeño se ubica por encima del término medio para su grupo de referencia, evidenciando buenas capacidades de razonamiento abstracto y educción de relaciones no verbales.`;
      break;
    case 'III':
      interpretacion = `Su desempeño se sitúa en el rango correspondiente al término medio para su grupo de referencia, lo que indica un desarrollo adecuado de la capacidad de razonamiento abstracto no verbal esperado para su edad.`;
      break;
    case 'IV':
      interpretacion = `Su desempeño se ubica por debajo del término medio para su grupo de referencia. Se sugiere profundizar la evaluación para determinar si esta característica incide en el rendimiento académico y en otras áreas del desarrollo cognitivo.`;
      break;
    case 'V':
      interpretacion = `Su desempeño se encuentra notablemente por debajo del esperado para su grupo de referencia. Estos resultados requieren ser integrados con el resto de la evaluación psicopedagógica para una interpretación clínica completa.`;
      break;
    default:
      interpretacion = `Los resultados deben interpretarse en el contexto global de la evaluación.`;
  }

  return `En la administración del Test de Matrices Progresivas de Raven (${escalaLabel}), ${nombre} (${edadLabel}) obtuvo una Puntuación Directa (PD) de ${pdTotal} sobre ${pdMax} (${pd_pct}%), correspondiente al Percentil ${percentil} (Pc ${percentil}) según el baremo para ${grupoLabel}. Esto lo/la ubica en el Grado ${grado.grado}: "${grado.label}". ${interpretacion}${consistenciaTexto}`;
}
