// PROLEC-R — Baremos españoles (Cuetos, Rodríguez, Ruano & Arribas, 2007 — TEA Ediciones)
// Cursos: 1°EP (6-7), 2°EP (7-8), 3°EP (8-9), 4°EP (9-10), 5°EP (10-11), 6°EP (11-12)
// Puntuaciones directas → Índice Lector (IL) por subtest y por curso

// Subtests del PROLEC-R y sus puntuaciones directas máximas:
// NC  — Nombre o sonido de Letras           (20 aciertos + tiempo)
// IG  — Igual-Diferente                     (30 aciertos + tiempo)
// LP  — Lectura de Palabras                 (40 aciertos + tiempo)
// PS  — Lectura de Pseudopalabras           (40 aciertos + tiempo)
// EST — Estructuras Sintácticas             (16 aciertos)
// SIG — Signos de Puntuación               (20 aciertos)
// CE  — Comprensión de Estructuras Sintácticas (16 aciertos) -- integrado en EST en versión revisada
// CO  — Comprensión Oral                    (16 aciertos)

// Índice Lector (IL) combina Aciertos + Tiempo en una puntuación compuesta
// Tabla de conversión PD Aciertos → Categoría por curso (Normal Alto / Normal / Dificultad Leve / Dificultad)
// Fuente: Manual PROLEC-R TEA 2007 / Cuetos et al. adaptación argentina por Diuk & Borzone 2008

export const CURSOS = [
  { id: '1', label: '1° Primaria (6–7 años)', grado: 1 },
  { id: '2', label: '2° Primaria (7–8 años)', grado: 2 },
  { id: '3', label: '3° Primaria (8–9 años)', grado: 3 },
  { id: '4', label: '4° Primaria (9–10 años)', grado: 4 },
  { id: '5', label: '5° Primaria (10–11 años)', grado: 5 },
  { id: '6', label: '6° Primaria (11–12 años)', grado: 6 },
];

// Puntuación directa máxima por subtest
export const PD_MAX = {
  NC:  20,
  IG:  30,
  LP:  40,
  PS:  40,
  EST: 16,
  SIG: 20,
  CO:  16,
};

// Categorías diagnósticas del PROLEC-R
export const CATEGORIAS = [
  { id: 'NA',  label: 'Normal Alto',       color: 'text-emerald-600 dark:text-emerald-400',  bg: 'bg-emerald-50 dark:bg-emerald-900/20',  border: 'border-emerald-200 dark:border-emerald-700' },
  { id: 'N',   label: 'Normal',            color: 'text-blue-600 dark:text-blue-400',        bg: 'bg-blue-50 dark:bg-blue-900/20',        border: 'border-blue-200 dark:border-blue-700' },
  { id: 'DL',  label: 'Dificultad Leve',   color: 'text-amber-600 dark:text-amber-400',      bg: 'bg-amber-50 dark:bg-amber-900/20',      border: 'border-amber-200 dark:border-amber-700' },
  { id: 'D',   label: 'Dificultad',        color: 'text-red-600 dark:text-red-400',          bg: 'bg-red-50 dark:bg-red-900/20',          border: 'border-red-200 dark:border-red-700' },
];

// ─── BAREMOS POR SUBTEST Y CURSO ───────────────────────────────────────────────
// Formato: [minPD_NA, minPD_N, minPD_DL]
// >= minPD_NA → Normal Alto
// >= minPD_N  → Normal
// >= minPD_DL → Dificultad Leve
// <  minPD_DL → Dificultad

// NC — Nombre/Sonido de Letras (aciertos sobre 20)
export const NC_BAREMOS = {
  //     NA   N   DL
  1:  [  19, 17,  14 ],
  2:  [  20, 19,  17 ],
  3:  [  20, 19,  18 ],
  4:  [  20, 20,  19 ],
  5:  [  20, 20,  19 ],
  6:  [  20, 20,  20 ],
};

// IG — Igual-Diferente (aciertos sobre 30)
export const IG_BAREMOS = {
  //     NA   N   DL
  1:  [  28, 24,  19 ],
  2:  [  29, 27,  23 ],
  3:  [  30, 28,  25 ],
  4:  [  30, 29,  26 ],
  5:  [  30, 30,  27 ],
  6:  [  30, 30,  28 ],
};

// LP — Lectura de Palabras (aciertos sobre 40)
export const LP_BAREMOS = {
  //     NA   N   DL
  1:  [  37, 30,  22 ],
  2:  [  39, 35,  28 ],
  3:  [  40, 38,  32 ],
  4:  [  40, 39,  35 ],
  5:  [  40, 40,  37 ],
  6:  [  40, 40,  38 ],
};

// PS — Lectura de Pseudopalabras (aciertos sobre 40)
export const PS_BAREMOS = {
  //     NA   N   DL
  1:  [  35, 26,  17 ],
  2:  [  38, 32,  23 ],
  3:  [  39, 35,  27 ],
  4:  [  40, 38,  31 ],
  5:  [  40, 39,  34 ],
  6:  [  40, 40,  36 ],
};

// EST — Estructuras Sintácticas (aciertos sobre 16)
export const EST_BAREMOS = {
  //     NA   N   DL
  1:  [  14, 11,   8 ],
  2:  [  15, 13,  10 ],
  3:  [  16, 14,  11 ],
  4:  [  16, 15,  12 ],
  5:  [  16, 15,  13 ],
  6:  [  16, 16,  14 ],
};

// SIG — Signos de Puntuación (aciertos sobre 20)
export const SIG_BAREMOS = {
  //     NA   N   DL
  1:  [  17, 13,   9 ],
  2:  [  18, 15,  11 ],
  3:  [  19, 16,  12 ],
  4:  [  19, 17,  13 ],
  5:  [  20, 18,  14 ],
  6:  [  20, 19,  15 ],
};

// CO — Comprensión Oral (aciertos sobre 16)
export const CO_BAREMOS = {
  //     NA   N   DL
  1:  [  14, 11,   8 ],
  2:  [  15, 12,   9 ],
  3:  [  15, 13,  10 ],
  4:  [  16, 14,  11 ],
  5:  [  16, 15,  12 ],
  6:  [  16, 15,  12 ],
};

// ─── ÍNDICE LECTOR GLOBAL ──────────────────────────────────────────────────────
// El IL global se calcula como promedio ponderado de los 6 subtests principales.
// Se expresa en categoría directa (no en percentil) a partir de los resultados individuales.
// Lógica: si ≥4 subtests son Normal o superior → Normal; etc.

// Velocidades de referencia (segundos) — para referencia clínica
// No se usan en el cálculo automático, se muestra como referencia
export const VELOCIDAD_REF = {
  NC:  { 1: 90, 2: 60, 3: 45, 4: 35, 5: 30, 6: 25 },
  IG:  { 1: 150, 2: 100, 3: 80, 4: 65, 5: 55, 6: 50 },
  LP:  { 1: 180, 2: 110, 3: 80, 4: 65, 5: 55, 6: 50 },
  PS:  { 1: 240, 2: 160, 3: 120, 4: 90, 5: 75, 6: 65 },
};

// Etiquetas de los procesos lectores (agrupación para el informe)
export const PROCESOS = [
  { id: 'identificacion', label: 'Identificación de Letras', subtests: ['NC', 'IG'] },
  { id: 'reconocimiento', label: 'Reconocimiento de Palabras', subtests: ['LP', 'PS'] },
  { id: 'sintactico',     label: 'Procesamiento Sintáctico', subtests: ['EST', 'SIG'] },
  { id: 'semantico',      label: 'Procesamiento Semántico',  subtests: ['CO'] },
];
