// Fase 0 — Validación de variables de entorno con Zod.
// Responsabilidad: fallar rápido si falta alguna variable, separando las
// públicas (NEXT_PUBLIC_*, visibles en el navegador) de las de servidor.
//
// IMPORTANTE: getServerEnv() solo puede usarse en archivos de servidor
// (route handlers, server components, librerías con "server-only").
// Nunca llamar getServerEnv() desde componentes "use client": los secretos
// de servidor no deben llegar al navegador.
//
// La validación es perezosa (se ejecuta al llamar al getter, no al importar
// el módulo) para no romper `next build` cuando el entorno local no tiene
// todas las variables.

import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
});

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
  MERCADOPAGO_ACCESS_TOKEN: z.string().default(""),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().default(""),
  PAYPAL_ENV: z.enum(["sandbox", "live"]).default("sandbox"),
  PAYPAL_CLIENT_ID: z.string().default(""),
  PAYPAL_CLIENT_SECRET: z.string().default(""),
  PAYPAL_WEBHOOK_ID: z.string().default(""),
  BILLING_API_URL: z.string().default(""),
  BILLING_API_TOKEN: z.string().default(""),
  RESEND_API_KEY: z.string().default(""),
  EMAIL_FROM: z.string().default(""),
  UPSTASH_REDIS_REST_URL: z.string().default(""),
  UPSTASH_REDIS_REST_TOKEN: z.string().default(""),
  TURNSTILE_SECRET_KEY: z.string().default(""),
  CRON_SECRET: z.string().default(""),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/** Valida y devuelve las variables públicas (seguras para el navegador). */
export function getPublicEnv(): PublicEnv {
  // OJO: leer cada clave por acceso directo. Next solo incrusta en el
  // bundle del navegador los `process.env.X` literales; pasar `process.env`
  // entero llega vacío al cliente y rompe (ZodError).
  return publicEnvSchema.parse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY:
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  });
}

// Solo URL + clave publicable de Supabase. Los clientes Supabase
// (servidor y navegador) usan ESTE getter y no el completo, para no
// reventar cuando falta una variable de otra fase (ej. Turnstile).
const supabasePublicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export type SupabasePublicEnv = z.infer<typeof supabasePublicEnvSchema>;

/** Variables mínimas para conectarse a Supabase (SSR y navegador). */
export function getSupabasePublicEnv(): SupabasePublicEnv {
  // Mismo motivo que getPublicEnv: accesos directos para que Next los
  // incruste en el bundle del navegador.
  return supabasePublicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

// Variables mínimas para el cliente service_role de Supabase.
const supabaseAdminEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
});

export type SupabaseAdminEnv = z.infer<typeof supabaseAdminEnvSchema>;

/** Variables mínimas de Supabase con service_role para el servidor. */
export function getSupabaseAdminEnv(): SupabaseAdminEnv {
  return supabaseAdminEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  });
}

/** Valida y devuelve las variables de servidor. SOLO usar en el servidor. */
export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse(process.env);
}
