import { z } from "zod";

const ESTADOS_VALIDOS = ["pendiente", "confirmado", "inasistencia", "cancelado"];
const TIPOS_TURNO_VALIDOS = ["tratamiento", "evaluacion"];

const fechaISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "debe tener formato YYYY-MM-DD");
const horaHHMM = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "debe tener formato HH:MM");

export const crearTurnoSchema = z.object({
  paciente_id: z.union([z.string(), z.number()]),
  fecha: fechaISO,
  hora: horaHHMM,
  consultorio: z.string().trim().min(1).max(100),
  observaciones: z.string().trim().max(2000).nullable().optional(),
  estado: z.enum(ESTADOS_VALIDOS).optional(),
  tipo_cobertura: z.string().trim().max(50).nullable().optional(),
  tipo_turno: z.enum(TIPOS_TURNO_VALIDOS).optional(),
  importe_custom: z.union([z.string(), z.number()]).nullable().optional(),
});

export const actualizarTurnoSchema = crearTurnoSchema.partial({
  paciente_id: true,
  fecha: true,
  hora: true,
  consultorio: true,
});
