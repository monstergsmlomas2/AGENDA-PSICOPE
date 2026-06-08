import {
  GRUPOS_EDAD, PD_MEDIA, PD_DS, PE_A_PERCENTIL, CLASIFICACIONES, SUBPRUEBAS,
} from './vmiNormas.js';

// Encuentra el grupo de edad correspondiente
export function getGrupoEdad(edadDecimal) {
  return GRUPOS_EDAD.find(g => edadDecimal >= g.min && edadDecimal <= g.max) || null;
}

// PD → Puntuación Estándar (z-score → PE con media=100, DS=15)
export function pdAPE(subtest, pd, grupoId) {
  const media = PD_MEDIA[subtest]?.[grupoId];
  const ds    = PD_DS[subtest]?.[grupoId];
  if (media == null || ds == null || ds === 0) return null;
  const z = (pd - media) / ds;
  const pe = Math.round(100 + z * 15);
  return Math.min(Math.max(pe, 40), 160); // clampar a rango razonable
}

// PE → Percentil por interpolación en la tabla
export function peAPercentil(pe) {
  const keys = Object.keys(PE_A_PERCENTIL).map(Number).sort((a, b) => a - b);
  if (pe <= keys[0]) return PE_A_PERCENTIL[keys[0]];
  if (pe >= keys[keys.length - 1]) return PE_A_PERCENTIL[keys[keys.length - 1]];

  // interpolación lineal
  for (let i = 0; i < keys.length - 1; i++) {
    const k1 = keys[i], k2 = keys[i + 1];
    if (pe >= k1 && pe <= k2) {
      const t = (pe - k1) / (k2 - k1);
      const p1 = PE_A_PERCENTIL[k1], p2 = PE_A_PERCENTIL[k2];
      return Math.round(p1 + t * (p2 - p1));
    }
  }
  return null;
}

// PE → Clasificación
export function getClasificacion(pe) {
  return CLASIFICACIONES.find(c => pe >= c.minPE) || CLASIFICACIONES[CLASIFICACIONES.length - 1];
}

// Cálculo principal
export function calcularVMI({ edadAnios, edadMeses, VMI, VP, MC }) {
  const edadDecimal = parseFloat(edadAnios) + (parseFloat(edadMeses || 0) / 12);
  const grupo = getGrupoEdad(edadDecimal);
  if (!grupo) return null;

  const scores = { VMI, VP, MC };
  const resultados = {};

  for (const sub of ['VMI', 'VP', 'MC']) {
    const pd = scores[sub];
    if (pd === '' || pd === null || pd === undefined) continue;
    const pdNum = parseInt(pd, 10);
    if (isNaN(pdNum)) continue;
    const max = SUBPRUEBAS.find(s => s.id === sub)?.max || 30;
    const pdClamped = Math.min(Math.max(pdNum, 0), max);
    const pe = pdAPE(sub, pdClamped, grupo.id);
    const percentil = pe != null ? peAPercentil(pe) : null;
    const clasificacion = pe != null ? getClasificacion(pe) : null;
    resultados[sub] = { pd: pdClamped, max, pe, percentil, clasificacion };
  }

  return { resultados, grupo, edadDecimal };
}

const LABELS = {
  VMI: 'Integración Visomotora (VMI)',
  VP:  'Percepción Visual (VP)',
  MC:  'Coordinación Motora (MC)',
};

export function generarParagrafoVMI({ resultados, grupo }, nombrePaciente) {
  const nombre = nombrePaciente?.trim() || 'El/la evaluado/a';
  const partes = [];

  for (const [sub, r] of Object.entries(resultados)) {
    const pctStr = r.percentil != null ? `percentil ${r.percentil}` : 'percentil no calculado';
    partes.push(`${LABELS[sub]}: PE ${r.pe} (${pctStr}) — ${r.clasificacion.label}`);
  }

  if (partes.length === 0) return '';

  const vmi = resultados['VMI'];
  const intro = vmi
    ? `En la administración del Test de Integración Visomotora de Beery (VMI, 6ª edición), ${nombre} (${grupo.label}) obtuvo en la subprueba principal una Puntuación Estándar de ${vmi.pe} (Percentil ${vmi.percentil}), correspondiente a la categoría "${vmi.clasificacion.label}".`
    : `En la administración del Test de Integración Visomotora de Beery (VMI, 6ª edición), ${nombre} (${grupo.label}) fue evaluado/a en las siguientes subpruebas:`;

  const detalle = partes.length > 1
    ? ` Los resultados completos fueron: ${partes.join('; ')}.`
    : '';

  // Recomendación según clasificación VMI o la peor obtenida
  const peores = Object.values(resultados).map(r => r.pe).filter(Boolean);
  const minPE = peores.length ? Math.min(...peores) : 100;
  const rec = minPE < 70
    ? ' Se recomienda intervención psicopedagógica orientada al desarrollo de las habilidades visomotoras y grafomotrices.'
    : minPE < 85
    ? ' Se sugiere seguimiento y actividades de estimulación visomotora.'
    : ' No se requiere intervención específica en el área visomotora en este momento.';

  return `${intro}${detalle}${rec}`.trim();
}
