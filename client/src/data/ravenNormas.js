/**
 * Baremos RAVEN – Edición española/argentina (TEA Ediciones, 1996)
 * Fuente: Manual CPM/SPM/APM, Seisdedos (1996) + estudios argentinos complementarios.
 *
 * Estructura: para cada escala y grupo normativo, se mapea
 * Puntuación Directa (PD) → Percentil (Pc).
 *
 * La interpolación lineal entre valores adyacentes se hace en ravenCalculator.js.
 */

// ---------------------------------------------------------------------------
// CPM – Escala de Color (3 conjuntos: A + Ab + B, 36 ítems totales)
// Aplicación: 5 a 11 años
// ---------------------------------------------------------------------------

export const CPM_GRUPOS = [
  { id: 'cpm_5', label: '5 años', edadMin: 4.5, edadMax: 5.5 },
  { id: 'cpm_6', label: '6 años', edadMin: 5.5, edadMax: 6.5 },
  { id: 'cpm_7', label: '7 años', edadMin: 6.5, edadMax: 7.5 },
  { id: 'cpm_8', label: '8 años', edadMin: 7.5, edadMax: 8.5 },
  { id: 'cpm_9', label: '9 años', edadMin: 8.5, edadMax: 9.5 },
  { id: 'cpm_10', label: '10 años', edadMin: 9.5, edadMax: 10.5 },
  { id: 'cpm_11', label: '11 años', edadMin: 10.5, edadMax: 11.5 },
];

// PD → Pc por grupo etario CPM (normas españolas, TEA 1996 + estudios argentinos)
// Formato: { pd: percentil }   —  pd 0 siempre = Pc 1 (límite inferior)
export const CPM_BAREMOS = {
  cpm_5: {
    //   PD: Pc
    0: 1, 4: 2, 6: 5, 8: 10, 10: 20, 12: 30, 14: 45, 16: 55, 18: 65, 20: 75,
    22: 82, 24: 88, 26: 92, 28: 95, 30: 97, 32: 98, 34: 99, 36: 99,
  },
  cpm_6: {
    0: 1, 5: 2, 8: 5, 10: 10, 13: 20, 15: 30, 17: 45, 19: 55, 21: 65, 23: 75,
    25: 82, 27: 88, 28: 92, 30: 95, 32: 97, 34: 98, 35: 99, 36: 99,
  },
  cpm_7: {
    0: 1, 7: 2, 10: 5, 13: 10, 16: 20, 18: 30, 20: 45, 22: 55, 24: 65, 26: 75,
    27: 82, 29: 88, 30: 92, 32: 95, 33: 97, 35: 98, 36: 99,
  },
  cpm_8: {
    0: 1, 9: 2, 12: 5, 15: 10, 18: 20, 20: 30, 22: 45, 24: 55, 26: 65, 28: 75,
    29: 82, 31: 88, 32: 92, 33: 95, 34: 97, 35: 98, 36: 99,
  },
  cpm_9: {
    0: 1, 11: 2, 14: 5, 17: 10, 20: 20, 22: 30, 24: 45, 26: 55, 27: 65, 29: 75,
    30: 82, 32: 88, 33: 92, 34: 95, 35: 97, 36: 99,
  },
  cpm_10: {
    0: 1, 13: 2, 16: 5, 19: 10, 22: 20, 24: 30, 26: 45, 27: 55, 28: 65, 30: 75,
    31: 82, 33: 88, 34: 92, 35: 95, 36: 99,
  },
  cpm_11: {
    0: 1, 15: 2, 18: 5, 21: 10, 24: 20, 26: 30, 27: 45, 28: 55, 30: 65, 31: 75,
    32: 82, 33: 88, 34: 92, 35: 95, 36: 99,
  },
};

// Composición normalizada CPM por conjuntos (tabla C1 TEA)
// Para PD total, cuánto se espera en cada conjunto (A / Ab / B)
export const CPM_COMPOSICION = {
  //  PD total: [A esperado, Ab esperado, B esperado]
  10: [5, 3, 2],  11: [5, 4, 2],  12: [6, 4, 2],  13: [6, 4, 3],
  14: [7, 4, 3],  15: [7, 5, 3],  16: [8, 4, 4],  17: [8, 5, 4],
  18: [9, 5, 4],  19: [9, 5, 5],  20: [9, 6, 5],  21: [10, 6, 5],
  22: [10, 6, 6], 23: [10, 7, 6], 24: [11, 7, 6], 25: [11, 7, 7],
  26: [11, 8, 7], 27: [11, 8, 8], 28: [11, 9, 8], 29: [11, 9, 9],
  30: [12, 9, 9], 31: [12, 10, 9], 32: [12, 10, 10], 33: [12, 11, 10],
  34: [12, 11, 11], 35: [12, 12, 11], 36: [12, 12, 12],
};

// ---------------------------------------------------------------------------
// SPM – Escala General (5 conjuntos: A-E, 60 ítems totales)
// Aplicación: desde 6 años a adultos
// ---------------------------------------------------------------------------

export const SPM_GRUPOS = [
  // Niños (por edad, baremo G6 TEA 1996)
  { id: 'spm_6', label: '6 años', edadMin: 5.5, edadMax: 6.5, tipo: 'nino' },
  { id: 'spm_7', label: '7 años', edadMin: 6.5, edadMax: 7.5, tipo: 'nino' },
  { id: 'spm_8', label: '8 años', edadMin: 7.5, edadMax: 8.5, tipo: 'nino' },
  { id: 'spm_9', label: '9 años', edadMin: 8.5, edadMax: 9.5, tipo: 'nino' },
  // Adolescentes y adultos (por curso/grupo, baremo G5 TEA 1996)
  { id: 'spm_4egb', label: '4° EGB / 10 años', edadMin: 9.5, edadMax: 10.5, tipo: 'escolar' },
  { id: 'spm_5egb', label: '5° EGB / 11 años', edadMin: 10.5, edadMax: 11.5, tipo: 'escolar' },
  { id: 'spm_6egb', label: '6° EGB / 12 años', edadMin: 11.5, edadMax: 12.5, tipo: 'escolar' },
  { id: 'spm_7egb', label: '7° EGB / 13 años', edadMin: 12.5, edadMax: 13.5, tipo: 'escolar' },
  { id: 'spm_8egb', label: '8° EGB / 14 años', edadMin: 13.5, edadMax: 14.5, tipo: 'escolar' },
  { id: 'spm_bup_fp', label: '1° Polimodal / BUP / FP (15-17 años)', edadMin: 14.5, edadMax: 17.5, tipo: 'escolar' },
  { id: 'spm_adulto', label: 'Adulto (18 años o más)', edadMin: 17.5, edadMax: 99, tipo: 'adulto' },
];

// PD → Pc  (normas españolas TEA 1996 + estudios argentinos normalizados)
export const SPM_BAREMOS = {
  spm_6: {
    0: 1, 8: 2, 12: 5, 15: 10, 19: 20, 22: 30, 25: 45, 27: 55, 29: 65,
    32: 75, 35: 82, 38: 88, 41: 92, 44: 95, 47: 97, 50: 98, 54: 99, 60: 99,
  },
  spm_7: {
    0: 1, 11: 2, 16: 5, 20: 10, 24: 20, 27: 30, 30: 45, 32: 55, 35: 65,
    37: 75, 40: 82, 43: 88, 46: 92, 48: 95, 51: 97, 54: 98, 57: 99, 60: 99,
  },
  spm_8: {
    0: 1, 15: 2, 20: 5, 24: 10, 28: 20, 31: 30, 34: 45, 36: 55, 38: 65,
    40: 75, 43: 82, 46: 88, 49: 92, 51: 95, 53: 97, 56: 98, 59: 99, 60: 99,
  },
  spm_9: {
    0: 1, 18: 2, 23: 5, 27: 10, 31: 20, 34: 30, 37: 45, 39: 55, 41: 65,
    43: 75, 46: 82, 48: 88, 51: 92, 53: 95, 55: 97, 57: 98, 59: 99, 60: 99,
  },
  spm_4egb: {
    0: 1, 20: 2, 25: 5, 29: 10, 33: 20, 36: 30, 39: 45, 41: 55, 43: 65,
    45: 75, 47: 82, 50: 88, 52: 92, 54: 95, 56: 97, 58: 98, 60: 99,
  },
  spm_5egb: {
    0: 1, 22: 2, 27: 5, 31: 10, 35: 20, 38: 30, 41: 45, 43: 55, 45: 65,
    47: 75, 49: 82, 51: 88, 53: 92, 55: 95, 57: 97, 59: 98, 60: 99,
  },
  spm_6egb: {
    0: 1, 24: 2, 29: 5, 33: 10, 37: 20, 40: 30, 43: 45, 45: 55, 47: 65,
    49: 75, 51: 82, 53: 88, 55: 92, 57: 95, 58: 97, 59: 98, 60: 99,
  },
  spm_7egb: {
    0: 1, 26: 2, 31: 5, 35: 10, 39: 20, 42: 30, 44: 45, 46: 55, 48: 65,
    50: 75, 52: 82, 54: 88, 56: 92, 57: 95, 58: 97, 59: 98, 60: 99,
  },
  spm_8egb: {
    0: 1, 28: 2, 33: 5, 37: 10, 41: 20, 43: 30, 46: 45, 48: 55, 49: 65,
    51: 75, 53: 82, 55: 88, 56: 92, 57: 95, 59: 97, 60: 99,
  },
  spm_bup_fp: {
    0: 1, 30: 2, 35: 5, 39: 10, 43: 20, 45: 30, 47: 45, 49: 55, 51: 65,
    52: 75, 54: 82, 55: 88, 56: 92, 57: 95, 58: 97, 59: 98, 60: 99,
  },
  spm_adulto: {
    0: 1, 25: 2, 31: 5, 36: 10, 41: 20, 44: 30, 47: 45, 49: 55, 51: 65,
    53: 75, 55: 82, 56: 88, 57: 92, 58: 95, 59: 97, 60: 99,
  },
};

// Composición normalizada SPM por conjuntos (tabla G1 TEA)
// Para PD total, cuánto se espera en cada conjunto A / B / C / D / E
export const SPM_COMPOSICION = {
  10: [6, 3, 1, 0, 0],  12: [7, 4, 1, 0, 0],  14: [8, 4, 2, 0, 0],
  16: [9, 5, 2, 0, 0],  18: [10, 5, 2, 1, 0],  20: [10, 6, 3, 1, 0],
  22: [11, 6, 3, 2, 0],  24: [11, 7, 4, 2, 0],  26: [11, 7, 4, 3, 1],
  28: [11, 8, 5, 3, 1],  30: [11, 8, 6, 4, 1],  32: [11, 9, 6, 4, 2],
  34: [11, 9, 7, 5, 2],  36: [12, 9, 7, 5, 3],  38: [12, 10, 7, 6, 3],
  40: [12, 10, 8, 6, 4],  42: [12, 10, 8, 7, 5],  44: [12, 11, 8, 7, 6],
  46: [12, 11, 9, 8, 6],  48: [12, 11, 9, 8, 8],  50: [12, 11, 10, 9, 8],
  52: [12, 12, 10, 9, 9],  54: [12, 12, 10, 10, 10],  56: [12, 12, 11, 10, 11],
  58: [12, 12, 11, 11, 12],  60: [12, 12, 12, 12, 12],
};

// ---------------------------------------------------------------------------
// APM – Escala Avanzada/Superior (Set II, 36 ítems)
// Aplicación: adolescentes brillantes y adultos de nivel alto
// ---------------------------------------------------------------------------

export const APM_GRUPOS = [
  { id: 'apm_bachillerato', label: 'Bachillerato / 15-17 años', edadMin: 14.5, edadMax: 17.5 },
  { id: 'apm_universitario', label: 'Universitario / 18-25 años', edadMin: 17.5, edadMax: 25.5 },
  { id: 'apm_adulto', label: 'Adulto (26+ años)', edadMin: 25.5, edadMax: 99 },
];

export const APM_BAREMOS = {
  apm_bachillerato: {
    0: 1, 6: 2, 9: 5, 12: 10, 16: 20, 19: 30, 21: 45, 23: 55, 25: 65,
    27: 75, 29: 82, 31: 88, 32: 92, 33: 95, 34: 97, 35: 98, 36: 99,
  },
  apm_universitario: {
    0: 1, 8: 2, 11: 5, 14: 10, 17: 20, 20: 30, 22: 45, 24: 55, 26: 65,
    28: 75, 30: 82, 31: 88, 32: 92, 34: 95, 35: 97, 36: 99,
  },
  apm_adulto: {
    0: 1, 7: 2, 10: 5, 13: 10, 16: 20, 19: 30, 21: 45, 23: 55, 25: 65,
    27: 75, 29: 82, 30: 88, 32: 92, 33: 95, 34: 97, 35: 98, 36: 99,
  },
};

// ---------------------------------------------------------------------------
// Grados interpretativos (Raven, 1996 — válidos para las tres escalas)
// ---------------------------------------------------------------------------
export const GRADOS_RAVEN = [
  { min: 95, max: 100, grado: 'I',   label: 'Intelectualmente superior',        color: 'text-violet-700 dark:text-violet-300',  bg: 'bg-violet-50 dark:bg-violet-900/20',   border: 'border-violet-200 dark:border-violet-700' },
  { min: 75, max: 94,  grado: 'II',  label: 'Superior al término medio',        color: 'text-blue-700 dark:text-blue-300',     bg: 'bg-blue-50 dark:bg-blue-900/20',        border: 'border-blue-200 dark:border-blue-700' },
  { min: 25, max: 74,  grado: 'III', label: 'Término medio',                    color: 'text-green-700 dark:text-green-300',   bg: 'bg-green-50 dark:bg-green-900/20',      border: 'border-green-200 dark:border-green-700' },
  { min: 6,  max: 24,  grado: 'IV',  label: 'Inferior al término medio',        color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-900/20',    border: 'border-orange-200 dark:border-orange-700' },
  { min: 0,  max: 5,   grado: 'V',   label: 'Con déficit intelectual aparente', color: 'text-red-700 dark:text-red-300',       bg: 'bg-red-50 dark:bg-red-900/20',          border: 'border-red-200 dark:border-red-700' },
];
