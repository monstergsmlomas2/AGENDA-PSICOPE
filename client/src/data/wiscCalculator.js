import {
  GRUPOS_EDAD, BAREMOS, SUMA_PE_A_PC_POR_INDICE, SUMA_PE_A_CIT,
  PE_A_PERCENTIL, PC_A_PERCENTIL, CLASIFICACIONES_PC, INDICES, SUBTESTS_PRINCIPALES,
} from './wiscNormas.js';

export function getGrupoEdad(anios, meses) {
  const totalMeses = parseInt(anios) * 12 + parseInt(meses || 0);
  return GRUPOS_EDAD.find(g => totalMeses >= g.minMeses && totalMeses <= g.maxMeses) || null;
}

export function pdAPE(subtest, pd, grupoId) {
  const baremo = BAREMOS[subtest];
  if (!baremo || !baremo[grupoId]) return null;
  const tabla = baremo[grupoId];
  let pe = 1;
  for (let i = 0; i < tabla.length; i++) {
    if (pd >= tabla[i]) pe = i + 1;
  }
  return pe;
}

export function sumaAPCIndice(indiceId, suma) {
  const tabla = SUMA_PE_A_PC_POR_INDICE[indiceId];
  if (!tabla) return null;
  // buscar la suma más cercana hacia abajo
  const keys = Object.keys(tabla).map(Number).sort((a, b) => a - b);
  let pc = tabla[keys[0]];
  for (const k of keys) {
    if (suma >= k) pc = tabla[k];
  }
  return pc;
}

export function sumaAPCCIT(suma) {
  const keys = Object.keys(SUMA_PE_A_CIT).map(Number).sort((a, b) => a - b);
  let pc = SUMA_PE_A_CIT[keys[0]];
  for (const k of keys) {
    if (suma >= k) pc = SUMA_PE_A_CIT[k];
  }
  return pc;
}

export function peAPercentil(pe) {
  return PE_A_PERCENTIL[pe] ?? null;
}

export function pcAPercentil(pc) {
  const keys = Object.keys(PC_A_PERCENTIL).map(Number).sort((a, b) => a - b);
  if (pc <= keys[0]) return PC_A_PERCENTIL[keys[0]];
  if (pc >= keys[keys.length - 1]) return PC_A_PERCENTIL[keys[keys.length - 1]];
  for (let i = 0; i < keys.length - 1; i++) {
    const k1 = keys[i], k2 = keys[i + 1];
    if (pc >= k1 && pc <= k2) {
      const t = (pc - k1) / (k2 - k1);
      return Math.round(PC_A_PERCENTIL[k1] + t * (PC_A_PERCENTIL[k2] - PC_A_PERCENTIL[k1]));
    }
  }
  return null;
}

export function getClasificacion(pc) {
  return CLASIFICACIONES_PC.find(c => pc >= c.minPC) || CLASIFICACIONES_PC[CLASIFICACIONES_PC.length - 1];
}

export function calcularWISC({ anios, meses, scores }) {
  const grupo = getGrupoEdad(anios, meses);
  if (!grupo) return null;

  // 1. PD → PE por subtest
  const resultadosSubtest = {};
  for (const sub of SUBTESTS_PRINCIPALES) {
    const pd = scores[sub.id];
    if (pd === '' || pd === null || pd === undefined) continue;
    const pdNum = parseInt(pd, 10);
    if (isNaN(pdNum)) continue;
    const pdClamped = Math.min(Math.max(pdNum, 0), sub.max);
    const pe = pdAPE(sub.id, pdClamped, grupo.id);
    const percentil = pe != null ? peAPercentil(pe) : null;
    resultadosSubtest[sub.id] = { pd: pdClamped, pe, percentil };
  }

  // 2. Índices primarios: suma de 2 PE → PC (tabla específica por índice)
  const resultadosIndices = {};
  for (const idx of INDICES) {
    const pes = idx.subtests.map(s => resultadosSubtest[s]?.pe).filter(v => v != null);
    if (pes.length !== 2) continue;
    const suma = pes[0] + pes[1];
    const pc = sumaAPCIndice(idx.id, suma);
    if (pc == null) continue;
    const percentil = pcAPercentil(pc);
    const clasificacion = getClasificacion(pc);
    resultadosIndices[idx.id] = { suma, pc, percentil, clasificacion };
  }

  // 3. CIT: suma de los 10 PE principales
  const todasPE = SUBTESTS_PRINCIPALES.map(s => resultadosSubtest[s.id]?.pe).filter(v => v != null);
  let cit = null;
  if (todasPE.length === 10) {
    const sumaCIT = todasPE.reduce((a, b) => a + b, 0);
    const pcCIT = sumaAPCCIT(sumaCIT);
    cit = { sumaPE: sumaCIT, pc: pcCIT, percentil: pcAPercentil(pcCIT), clasificacion: getClasificacion(pcCIT) };
  }

  return { resultadosSubtest, resultadosIndices, cit, grupo };
}

export function generarParagrafoWISC(calc, nombrePaciente) {
  const { resultadosSubtest, resultadosIndices, cit, grupo } = calc;
  const nombre = nombrePaciente?.trim() || 'El/la evaluado/a';

  const citTexto = cit
    ? `un Coeficiente Intelectual Total (CIT) de ${cit.pc} (Percentil ${cit.percentil}), correspondiente a la categoría "${cit.clasificacion.label}"`
    : 'resultados parciales en los índices administrados';

  const indicesTexto = Object.entries(resultadosIndices).map(([id, r]) => {
    const idx = INDICES.find(i => i.id === id);
    return `${idx?.label || id}: PC ${r.pc} (Pc ${r.percentil}, ${r.clasificacion.label})`;
  }).join('; ');

  const subtestsTexto = SUBTESTS_PRINCIPALES
    .filter(s => resultadosSubtest[s.id])
    .map(s => {
      const r = resultadosSubtest[s.id];
      return `${s.label} (PE ${r.pe}, Pc ${r.percentil})`;
    }).join(', ');

  const fortalezas = SUBTESTS_PRINCIPALES.filter(s => resultadosSubtest[s.id]?.pe >= 12).map(s => s.label);
  const debilidades = SUBTESTS_PRINCIPALES.filter(s => resultadosSubtest[s.id]?.pe <= 8).map(s => s.label);

  let perfilTexto = '';
  if (fortalezas.length > 0) perfilTexto += ` Se observan fortalezas en: ${fortalezas.join(', ')}.`;
  if (debilidades.length > 0) perfilTexto += ` Se observan dificultades relativas en: ${debilidades.join(', ')}.`;

  const recomendacion = cit
    ? (cit.pc < 70
        ? ' Se recomienda evaluación complementaria y diseño de intervención psicopedagógica acorde al perfil cognitivo.'
        : cit.pc < 90
        ? ' Se sugiere seguimiento y estrategias de apoyo focalizadas en las áreas con menor rendimiento.'
        : ' El perfil cognitivo no evidencia dificultades significativas en el momento de la evaluación.')
    : '';

  return [
    `En la administración de la Escala de Inteligencia de Wechsler para Niños – 5ª edición (WISC-V), ${nombre} (${grupo.label}) obtuvo ${citTexto}.`,
    indicesTexto ? `Resultados por índice primario: ${indicesTexto}.` : '',
    subtestsTexto ? `Puntajes escala por subtest: ${subtestsTexto}.` : '',
    perfilTexto.trim(),
    recomendacion.trim(),
  ].filter(Boolean).join(' ').trim();
}
