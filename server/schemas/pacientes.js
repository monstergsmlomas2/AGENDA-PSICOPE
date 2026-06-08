import { z } from "zod";

const fechaISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "debe tener formato YYYY-MM-DD");

const camposComunes = {
  nombre: z.string().trim().min(1).max(100),
  apellido: z.string().trim().min(1).max(100),
  dni: z.string().trim().max(20).nullable().optional(),
  fecha_nacimiento: fechaISO.nullable().optional(),
  sexo: z.string().trim().max(20).nullable().optional(),
  domicilio: z.string().trim().max(200).nullable().optional(),
  telefono: z.string().trim().max(30).nullable().optional(),
  email: z.string().trim().email("email inválido").max(150).nullable().optional().or(z.literal("")),
  obra_social: z.string().trim().max(100).nullable().optional(),
  nro_afiliado: z.string().trim().max(50).nullable().optional(),
  motivo: z.string().trim().max(2000).nullable().optional(),
  derivada_por: z.string().trim().max(200).nullable().optional(),
  diagnostico: z.string().trim().max(2000).nullable().optional(),
  cud: z.boolean().nullable().optional(),
  contacto_emergencia: z.string().trim().max(200).nullable().optional(),
  inicio_sesiones: fechaISO.nullable().optional(),
};

export const crearPacienteSchema = z.object({
  ...camposComunes,
  nombre: camposComunes.nombre,
  apellido: camposComunes.apellido,
});

export const actualizarPacienteSchema = z.object(camposComunes).partial({
  dni: true, fecha_nacimiento: true, sexo: true, domicilio: true, telefono: true,
  email: true, obra_social: true, nro_afiliado: true, motivo: true, derivada_por: true,
  diagnostico: true, cud: true, contacto_emergencia: true, inicio_sesiones: true,
}).extend({
  nombre: camposComunes.nombre,
  apellido: camposComunes.apellido,
});
