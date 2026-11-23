// Esquema Zod para crear cupones desde el panel (también lo usa el
// formulario con react-hook-form). Plan §8.4.

import { z } from "zod";

const fechaFutura = z
  .string()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const esquemaCupon = z
  .object({
    codigo: z
      .string()
      .trim()
      .min(3, "Mínimo 3 caracteres.")
      .max(24, "Máximo 24 caracteres.")
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "Solo letras, números, guion y guion bajo.",
      )
      .transform((v) => v.toUpperCase()),
    tipo_descuento: z.literal("porcentaje"),
    valor_descuento: z.coerce
      .number({ message: "Valor inválido." })
      .positive("Debe ser mayor a 0.")
      .max(100, "El porcentaje no pasa de 100."),
    valido_desde: fechaFutura,
    valido_hasta: fechaFutura,
    usos_maximos: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? undefined : val),
      z.coerce
        .number({ message: "Límite inválido." })
        .int("Debe ser entero.")
        .positive("Debe ser mayor a 0.")
        .optional()
    ),
  })
  .superRefine((v, ctx) => {
    if (v.valido_desde && v.valido_hasta && v.valido_hasta < v.valido_desde) {
      ctx.addIssue({
        code: "custom",
        path: ["valido_hasta"],
        message: "El fin no puede ser antes del inicio.",
      });
    }
  });

export type EntradaCupon = z.input<typeof esquemaCupon>;
export type CuponValidado = z.output<typeof esquemaCupon>;
