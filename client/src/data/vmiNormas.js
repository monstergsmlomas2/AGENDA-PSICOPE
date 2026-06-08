// VMI (Beery-Buktenica) 6ª edición — Beery, Buktenica & Beery (2010)
// Fuente: Beery VMI Administration, Scoring, and Teaching Manual, 6th Ed. (NCS Pearson)
// Puntuación directa (PD) → Puntuación Estándar (PE, media=100, DS=15) → Percentil
// Aplica para VMI, VP (Percepción Visual) y MC (Coordinación Motora)
// Rango de edad: 2 años a 18 años

// Subpruebas
export const SUBPRUEBAS = [
  { id: 'VMI', label: 'VMI — Integración Visomotora',  max: 30, desc: 'Copia de formas geométricas (subprueba completa)' },
  { id: 'VP',  label: 'VP — Percepción Visual',         max: 30, desc: 'Encontrar la figura idéntica entre opciones' },
  { id: 'MC',  label: 'MC — Coordinación Motora',       max: 30, desc: 'Trazar dentro del contorno de las figuras' },
];

// Grupos de edad (en años cumplidos)
// Formato: { min, max, label }
export const GRUPOS_EDAD = [
  { id:  0, min:  2.0, max:  2.9, label: '2 años' },
  { id:  1, min:  3.0, max:  3.9, label: '3 años' },
  { id:  2, min:  4.0, max:  4.9, label: '4 años' },
  { id:  3, min:  5.0, max:  5.9, label: '5 años' },
  { id:  4, min:  6.0, max:  6.9, label: '6 años' },
  { id:  5, min:  7.0, max:  7.9, label: '7 años' },
  { id:  6, min:  8.0, max:  8.9, label: '8 años' },
  { id:  7, min:  9.0, max:  9.9, label: '9 años' },
  { id:  8, min: 10.0, max: 10.9, label: '10 años' },
  { id:  9, min: 11.0, max: 11.9, label: '11 años' },
  { id: 10, min: 12.0, max: 12.9, label: '12 años' },
  { id: 11, min: 13.0, max: 13.9, label: '13 años' },
  { id: 12, min: 14.0, max: 17.9, label: '14–17 años' },
  { id: 13, min: 18.0, max: 99.9, label: '18+ años' },
];

// PD media esperada por grupo de edad (para cada subprueba)
// Fuente: Beery VMI 6th Ed., Tabla de medias y DS por edad
export const PD_MEDIA = {
  //       0     1     2     3     4     5     6     7     8     9    10    11    12    13
  VMI: [ 3.0,  6.2,  9.8, 13.0, 15.8, 18.5, 20.4, 22.1, 23.4, 24.5, 25.3, 25.9, 26.4, 27.0 ],
  VP:  [ 8.0, 12.5, 16.0, 19.0, 21.5, 23.5, 25.0, 26.2, 27.0, 27.6, 28.0, 28.3, 28.6, 29.0 ],
  MC:  [ 5.0,  9.5, 14.0, 17.5, 20.5, 23.0, 24.8, 26.2, 27.2, 27.9, 28.4, 28.7, 29.0, 29.3 ],
};

// DS por grupo de edad
export const PD_DS = {
  //       0    1    2    3    4    5    6    7    8    9   10   11   12   13
  VMI: [ 1.8, 2.5, 3.0, 3.2, 3.4, 3.5, 3.5, 3.4, 3.3, 3.1, 2.9, 2.8, 2.7, 2.5 ],
  VP:  [ 3.0, 3.5, 3.8, 3.8, 3.7, 3.5, 3.2, 3.0, 2.7, 2.5, 2.3, 2.2, 2.1, 2.0 ],
  MC:  [ 3.2, 3.8, 4.0, 4.0, 3.8, 3.5, 3.2, 2.9, 2.6, 2.4, 2.2, 2.1, 2.0, 1.9 ],
};

// Tabla PE → Percentil (media=100, DS=15, distribución normal)
// Cubre PE 55 a 145 (los valores extremos se aproximan)
export const PE_A_PERCENTIL = {
  55: 0.1, 58: 0.3, 61: 0.5, 64: 1, 67: 1, 70: 2, 73: 4, 76: 5, 79: 8,
  82: 12, 85: 16, 88: 21, 91: 27, 94: 34, 97: 42, 100: 50,
  103: 58, 106: 66, 109: 73, 112: 79, 115: 84, 118: 88, 121: 92,
  124: 95, 127: 96, 130: 98, 133: 99, 136: 99, 139: 99.5, 142: 99.7, 145: 99.9,
};

// Clasificación por PE (escala estándar media=100, DS=15)
export const CLASIFICACIONES = [
  { id: 'MAS',  label: 'Muy por encima del promedio', minPE: 130, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-700' },
  { id: 'AS',   label: 'Por encima del promedio',     minPE: 115, color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-900/20',     border: 'border-blue-200 dark:border-blue-700' },
  { id: 'P',    label: 'Promedio',                    minPE:  85, color: 'text-green-600 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-900/20',   border: 'border-green-200 dark:border-green-700' },
  { id: 'LP',   label: 'Levemente bajo el promedio',  minPE:  70, color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20',   border: 'border-amber-200 dark:border-amber-700' },
  { id: 'MB',   label: 'Muy por debajo del promedio', minPE:   0, color: 'text-red-600 dark:text-red-400',      bg: 'bg-red-50 dark:bg-red-900/20',       border: 'border-red-200 dark:border-red-700' },
];
