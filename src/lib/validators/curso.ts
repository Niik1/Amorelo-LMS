// Esquema Zod para editar el curso desde el panel. Lo usan el formulario con
// react-hook-form y la Server Action.

import { z } from "zod";

const precioOpcional = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce
    .number({ message: "Precio inválido." })
    .min(0, "No puede ser negativo.")
    .optional(),
);

export const esquemaCurso = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, "Mínimo 3 caracteres.")
    .max(120, "Máximo 120 caracteres."),
  descripcion: z
    .string()
    .trim()
    .max(600, "Máximo 600 caracteres.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  imagen_url: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .pipe(z.string().url("URL inválida.").optional()),
  precio_pen: z.coerce
    .number({ message: "Precio inválido." })
    .min(0, "No puede ser negativo."),
  precio_usd: precioOpcional,
  activo: z.boolean().default(true),
});

export type EntradaCurso = z.input<typeof esquemaCurso>;
export type CursoValidado = z.output<typeof esquemaCurso>;

export const esquemaNuevoCurso = esquemaCurso.extend({
  slug: z
    .string()
    .trim()
    .min(3, "Mínimo 3 caracteres.")
    .max(80, "Máximo 80 caracteres.")
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones (ej. curso-reposteria)."),
});

export type EntradaNuevoCurso = z.input<typeof esquemaNuevoCurso>;

