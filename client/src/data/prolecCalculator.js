import {
  NC_BAREMOS, IG_BAREMOS, LP_BAREMOS, PS_BAREMOS,
  EST_BAREMOS, SIG_BAREMOS, CO_BAREMOS,
  CATEGORIAS, PROCESOS, PD_MAX,
} from './prolecNormas.js';

const BAREMOS_MAP = {
  NC:  NC_BAREMOS,
  IG:  IG_BAREMOS,
  LP:  LP_BAREMOS,
  PS:  PS_BAREMOS,
  EST: EST_BAREMOS,
  SIG: SIG_BAREMOS,
  CO:  CO_BAREMOS,
};

// Devuelve id de categoría: 'NA' | 'N' | 'DL' | 'D'
export function getCategoria(subtest, pd, grado) {
  const baremo = BAREMOS_MAP[subtest];
  if (!baremo || !baremo[grado]) return null;
  const [minNA, minN, minDL] = baremo[grado];
  if (pd >= minNA) return 'NA';
  if (pd >= minN)  return 'N';
  if (pd >= minDL) return 'DL';
  return 'D';
}

export function getCategoriaObj(id) {
  return CATEGORIAS.find(c => c.id === id) || CATEGORIAS[3];
}

// Índice Lector global: basado en la cantidad de subtests con dificultad
// Lógica PROLEC-R manual: se considera el perfil general
export function calcularIndiceGlobal(resultados) {
  const ids = Object.values(resultados).map(r => r.categoriaId);
  const total = ids.length;
  if (total === 0) return null;

  const enD  = ids.filter(id => id === 'D').length;
  const enDL = ids.filter(id => id === 'DL').length;
  const enNA = ids.filter(id => id === 'NA').length;

  if (enD >= 2)           return 'D';
  if (enD === 1 || enDL >= 2) return 'DL';
  if (enNA >= Math.ceil(total / 2)) return 'NA';
  return 'N';
}

// Calcula resultados para todos los subtests ingresados
export function calcularProlec({ grado, NC, IG, LP, PS, EST, SIG, CO }) {
  const scores = { NC, IG, LP, PS, EST, SIG, CO };
  const resultados = {};

  for (const [sub, pd] of Object.entries(scores)) {
    if (pd === null || pd === undefined || pd === '') continue;
    const pdNum = parseInt(pd, 10);
    if (isNaN(pdNum)) continue;
    const max = PD_MAX[sub];
    const pdClamped = Math.min(Math.max(pdNum, 0), max);
    const categoriaId = getCategoria(sub, pdClamped, grado);
    const porcentaje = Math.round((pdClamped / max) * 100);
    resultados[sub] = {
      pd: pdClamped,
      max,
      porcentaje,
      categoriaId,
      categoria: getCategoriaObj(categoriaId),
    };
  }

  const indiceGlobalId = calcularIndiceGlobal(resultados);
  const indiceGlobal = getCategoriaObj(indiceGlobalId);

  return { resultados, indiceGlobalId, indiceGlobal, grado };
}

// Analiza el perfil por proceso lector
export function analizarProcesos(resultados) {
  return PROCESOS.map(proc => {
    const subs = proc.subtests.filter(s => resultados[s]);
    if (subs.length === 0) return { ...proc, estado: null, categoriaId: null };

    const cats = subs.map(s => resultados[s].categoriaId);
    // Tomar la peor categoría del proceso
    const orden = ['D', 'DL', 'N', 'NA'];
    const peor = cats.reduce((acc, c) => {
      return orden.indexOf(c) < orden.indexOf(acc) ? c : acc;
    }, 'NA');

    return { ...proc, categoriaId: peor, categoria: getCategoriaObj(peor) };
  }).filter(p => p.categoriaId !== null);
}

const LABELS_SUBTEST = {
  NC:  'Nombre/Sonido de Letras',
  IG:  'Igual-Diferente',
  LP:  'Lectura de Palabras',
  PS:  'Lectura de Pseudopalabras',
  EST: 'Estructuras Sintácticas',
  SIG: 'Signos de Puntuación',
  CO:  'Comprensión Oral',
};

export function generarParagrafoClinico(calc, nombrePaciente, cursoLabel) {
  const { resultados, indiceGlobal, indiceGlobalId } = calc;
  const nombre = nombrePaciente?.trim() || 'El/la evaluado/a';
  const procesos = analizarProcesos(resultados);

  const subtestsTexto = Object.entries(resultados).map(([sub, r]) => {
    return `${LABELS_SUBTEST[sub]} (PD: ${r.pd}/${r.max} — ${r.categoria.label})`;
  }).join(', ');

  // Descripción del índice global
  const descripcionGlobal = {
    NA: 'un rendimiento lector por encima de lo esperado para su nivel escolar',
    N:  'un rendimiento lector dentro de los parámetros normales esperados para su nivel escolar',
    DL: 'un rendimiento lector levemente por debajo de lo esperado para su nivel escolar, lo que sugiere la presencia de dificultades leves en los procesos evaluados',
    D:  'un rendimiento lector significativamente por debajo de lo esperado para su nivel escolar, evidenciando dificultades marcadas en los procesos lectores evaluados',
  }[indiceGlobalId] || 'un rendimiento lector que requiere análisis detallado';

  // Descripción por proceso
  const procesosDificultad = procesos.filter(p => p.categoriaId === 'D' || p.categoriaId === 'DL');
  const procesosNormales   = procesos.filter(p => p.categoriaId === 'N' || p.categoriaId === 'NA');

  let procesoTexto = '';
  if (procesosDificultad.length > 0) {
    const nombresD = procesosDificultad.map(p => `${p.label} (${p.categoria.label})`).join(', ');
    procesoTexto += ` Se observan dificultades en: ${nombresD}.`;
  }
  if (procesosNormales.length > 0 && procesosDificultad.length > 0) {
    const nombresN = procesosNormales.map(p => p.label).join(', ');
    procesoTexto += ` El rendimiento se mantiene dentro de parámetros normales en: ${nombresN}.`;
  }

  // Recomendación según índice
  const recomendacion = {
    NA: 'No se requieren intervenciones específicas en el área lectora.',
    N:  'No se requiere intervención específica en el área lectora en este momento.',
    DL: 'Se recomienda seguimiento y apoyo focalizado en los procesos con mayor compromiso.',
    D:  'Se recomienda intervención psicopedagógica especializada en los procesos lectores afectados.',
  }[indiceGlobalId] || '';

  return `En la administración del PROLEC-R (${cursoLabel}), ${nombre} obtuvo ${descripcionGlobal} (Índice Lector Global: ${indiceGlobal.label}).${procesoTexto} ${recomendacion}

Resultados por subtest: ${subtestsTexto}.`.trim();
}
