// Esquemas Zod para el módulo de configuración administrativa.

import { z } from "zod";

export const esquemaTipoCambio = z.object({
  tipo_cambio: z.coerce
    .number({ message: "Tipo de cambio inválido." })
    .positive("Debe ser mayor a 0.")
    .max(1000, "Valor fuera de rango."),
});

export type EntradaTipoCambio = z.input<typeof esquemaTipoCambio>;
export type TipoCambioValidado = z.output<typeof esquemaTipoCambio>;

export const esquemaConfiguracionComprobante = z.object({
  logo_url: z.string().url("URL de logo inválida").nullable().optional(),
  razon_social: z
    .string()
    .min(2, "La razón social debe tener al menos 2 caracteres.")
    .max(100, "La razón social no puede exceder 100 caracteres."),
  nombre_comercial: z
    .string()
    .max(150, "El nombre comercial no puede exceder 150 caracteres."),
  ruc: z
    .string()
    .regex(/^\d+$/, "El RUC debe contener únicamente números.")
    .length(11, "El RUC debe tener exactamente 11 dígitos numéricos."),
  direccion: z
    .string()
    .max(150, "La dirección no puede exceder 150 caracteres."),
  telefono: z
    .string()
    .trim()
    .regex(
      /^\+51\s?\d{9}$/,
      "El teléfono debe contener 9 dígitos con prefijo +51 (ej. +51 924353798)."
    ),
  correo: z
    .string()
    .trim()
    .min(1, "El correo electrónico es obligatorio.")
    .email("Ingresa un correo electrónico válido (ej. contacto@amorelo.com)"),
  sitio_web: z
    .string()
    .trim()
    .min(1, "El sitio web es obligatorio.")
    .regex(
      /^www\.[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+.*$/,
      "El sitio web debe comenzar con www (ej. www.amorelo.com)."
    ),
  tratamiento_igv: z.enum(["exonerado", "incluido"]),
  porcentaje_igv: z
    .number({ message: "Ingresa un porcentaje de IGV válido." })
    .min(0, "El porcentaje no puede ser menor a 0%.")
    .max(100, "El porcentaje no puede ser mayor a 100%."),
  mensaje_agradecimiento: z
    .string()
    .max(250, "El mensaje no puede exceder 250 caracteres."),
  pie_comprobante: z
    .string()
    .max(500, "La leyenda legal no puede exceder 500 caracteres."),
});

export type EntradaConfiguracionComprobante = z.infer<typeof esquemaConfiguracionComprobante>;

export const CONFIGURACION_COMPROBANTE_DEFECTO: EntradaConfiguracionComprobante = {
  logo_url: null,
  razon_social: "AMORELO",
  nombre_comercial: "Academia de Globos y Manualidades",
  ruc: "20609234561",
  direccion: "Lima, Perú",
  telefono: "+51 924 353 798",
  correo: "contacto@amorelo.com",
  sitio_web: "www.amorelo.com",
  tratamiento_igv: "exonerado",
  porcentaje_igv: 18,
  mensaje_agradecimiento: "¡Gracias por confiar en Amorelo para tu formación profesional!",
  pie_comprobante:
    "Este documento es un comprobante de control administrativo interno emitido por Amorelo como constancia fehaciente de pago. No otorga derecho a crédito fiscal ni deducción tributaria formal mientras se encuentre en etapa de emisión a RUC 20.",
};

export const esquemaMensajeBanner = z.object({
  mensaje: z
    .string()
    .trim()
    .min(1, "El mensaje no puede estar vacío.")
    .max(500, "El mensaje no puede exceder 500 caracteres."),
  autor: z.string().trim().max(100, "El autor no puede exceder 100 caracteres.").default("Brayan Rodriguez"),
  activo: z.boolean().default(true),
});

export type EntradaMensajeBanner = z.infer<typeof esquemaMensajeBanner>;

export const MENSAJE_BANNER_DEFECTO: EntradaMensajeBanner = {
  mensaje: "¡Cree en tu talento y que hoy sea un gran día de práctica! Cada detalle que preparas con amor te acerca a tu meta. ✨🎈",
  autor: "Brayan Rodriguez",
  activo: true,
};

