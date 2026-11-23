// Verificación server-side de Cloudflare Turnstile.
// Responsabilidad: validar el token del captcha con TURNSTILE_SECRET_KEY
// antes de procesar login (y más adelante el checkout). Plan §6.4.
// Solo valida las variables que necesita (no todo el env).

import "server-only";
import { z } from "zod";

const turnstileEnvSchema = z.object({
  TURNSTILE_SECRET_KEY: z.string().min(1),
});

/** Valida un token de Turnstile contra Cloudflare. `false` = rechazar. */
export async function verifyTurnstileToken(
  token: string,
  ip?: string,
): Promise<boolean> {
  const isDev = process.env.NODE_ENV !== "production";

  if (!token || !token.trim()) {
    if (isDev) {
      console.warn("[Turnstile] Dev mode: token vacío permitido en desarrollo local.");
      return true;
    }
    return false;
  }

  // Tokens de prueba/bypass en entornos de desarrollo/test
  if (isDev && (token === "dev-bypass" || token === "test-token")) {
    return true;
  }

  let secret: string;
  try {
    ({ TURNSTILE_SECRET_KEY: secret } = turnstileEnvSchema.parse(process.env));
  } catch {
    if (isDev) {
      console.warn("[Turnstile] TURNSTILE_SECRET_KEY no configurado en dev.");
      return true;
    }
    return false;
  }

  try {
    const body = new URLSearchParams({
      secret: secret.trim(),
      response: token.trim(),
    });
    if (ip && ip !== "desconocida" && ip !== "127.0.0.1" && ip !== "::1") {
      body.set("remoteip", ip);
    }
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!data?.success) {
      console.warn("[Turnstile] Falló verificación Cloudflare:", data);
      // En desarrollo local (ej. localhost vs dominio registrado en Cloudflare), permitir continuar
      if (isDev) {
        console.warn("[Turnstile] Modo desarrollo: continuando a pesar del error de verificación de origen.");
        return true;
      }
    }
    return data?.success === true;
  } catch (err) {
    console.error("[Turnstile] Error de red:", err);
    if (isDev) return true;
    return false;
  }
}
