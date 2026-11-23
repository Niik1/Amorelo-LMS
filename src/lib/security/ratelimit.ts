// Sistema de Rate Limiting y Control de Abuso con Upstash Redis (Plan §6.4).
// Incluye:
// 1. Sliding Window para cupones, descargas y navegación.
// 2. Backoff Exponencial Progresivo para Login y Recuperación de Contraseña:
//    1.er bloqueo: 15 min | 2.° bloqueo: 30 min | 3.er bloqueo: 1 hora | 4.° bloqueo+: 2 horas.
// 3. Fallback en memoria robusto para desarrollo local y alta disponibilidad.

import "server-only";
import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type Limite = { ok: boolean; sinRedis?: boolean };

const limiters = new Map<string, Ratelimit | null>();
let redisDisponible: boolean | null = null;

function getRedis(): Redis | null {
  if (redisDisponible !== null) {
    return redisDisponible
      ? new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        })
      : null;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redisDisponible = !!url && !!token;
  return redisDisponible
    ? new Redis({ url: url!, token: token! })
    : null;
}

function getLimiter(
  clave: string,
  max: number,
  ventana: Duration,
): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  let l = limiters.get(clave);
  if (!l) {
    l = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, ventana),
      prefix: clave,
    });
    limiters.set(clave, l);
  }
  return l;
}

// ---------------------------------------------------------------------------
// Fallback en Memoria para Sliding Window (Desarrollo local / Fallback)
// ---------------------------------------------------------------------------
const memoriaSliding = new Map<string, number[]>();

function limiteMemoriaSliding(clave: string, max: number, ventanaMs: number): boolean {
  const ahora = Date.now();
  const intentos = (memoriaSliding.get(clave) ?? []).filter(
    (t) => ahora - t < ventanaMs,
  );
  if (intentos.length >= max) return false;
  intentos.push(ahora);
  memoriaSliding.set(clave, intentos);
  return true;
}

async function consumirSliding(
  prefijo: string,
  clave: string,
  max: number,
  ventana: Duration,
  ventanaMs: number,
  estricto: boolean,
): Promise<Limite> {
  const l = getLimiter(prefijo, max, ventana);
  if (l) {
    try {
      const r = await l.limit(clave);
      return { ok: r.success };
    } catch {
      if (estricto) return { ok: false, sinRedis: true };
      return { ok: limiteMemoriaSliding(`${prefijo}:${clave}`, max, ventanaMs) };
    }
  }
  if (estricto) return { ok: false, sinRedis: true };
  return { ok: limiteMemoriaSliding(`${prefijo}:${clave}`, max, ventanaMs) };
}

// ---------------------------------------------------------------------------
// Backoff Exponencial Progresivo (15 min -> 30 min -> 1 h -> 2 h)
// ---------------------------------------------------------------------------
const MULTIPLICADORES_MINUTOS = [15, 30, 60, 120]; // 15m, 30m, 1h, 2h

type RegistroMemoriaBackoff = {
  intentos: number;
  primerIntento: number;
  bloqueadoHasta: number;
  reincidencias: number;
  ultimaReincidencia: number;
};
const memoriaBackoff = new Map<string, RegistroMemoriaBackoff>();

function limpiarMemoriaAntigua() {
  const ahora = Date.now();
  if (memoriaBackoff.size > 2000) {
    for (const [k, v] of memoriaBackoff.entries()) {
      if (ahora - v.ultimaReincidencia > 24 * 60 * 60 * 1000) {
        memoriaBackoff.delete(k);
      }
    }
  }
}

/**
 * Verifica si una clave (IP o cuenta) está actualmente bajo bloqueo por backoff.
 */
async function estaClaveBloqueada(prefijo: string, clave: string): Promise<boolean> {
  const redis = getRedis();
  const keyBlock = `backoff:${prefijo}:block:${clave}`;

  if (redis) {
    try {
      const bloqueado = await redis.get(keyBlock);
      return Boolean(bloqueado);
    } catch {
      // Fallback a memoria
    }
  }

  const reg = memoriaBackoff.get(`${prefijo}:${clave}`);
  if (reg && reg.bloqueadoHasta > Date.now()) {
    return true;
  }
  return false;
}

/**
 * Registra un intento fallido y, si supera el máximo permitido, activa el bloqueo incremental.
 */
async function registrarFalloBackoff(
  prefijo: string,
  clave: string,
  maxIntentos: number = 5,
  ventanaIntentosMs: number = 15 * 60 * 1000
): Promise<{ bloqueado: boolean; duracionMinutos: number }> {
  const redis = getRedis();
  const keyAttempts = `backoff:${prefijo}:attempts:${clave}`;
  const keyReincidencias = `backoff:${prefijo}:reincidencias:${clave}`;
  const keyBlock = `backoff:${prefijo}:block:${clave}`;

  if (redis) {
    try {
      const intentos = await redis.incr(keyAttempts);
      if (intentos === 1) {
        await redis.expire(keyAttempts, Math.floor(ventanaIntentosMs / 1000));
      }

      if (intentos >= maxIntentos) {
        const reincidencias = await redis.incr(keyReincidencias);
        await redis.expire(keyReincidencias, 24 * 60 * 60); // Recordar castigos durante 24h

        const index = Math.min(reincidencias - 1, MULTIPLICADORES_MINUTOS.length - 1);
        const duracionMin = MULTIPLICADORES_MINUTOS[index];
        const duracionSec = duracionMin * 60;

        await redis.set(keyBlock, "1", { ex: duracionSec });
        await redis.del(keyAttempts);

        return { bloqueado: true, duracionMinutos: duracionMin };
      }

      return { bloqueado: false, duracionMinutos: 0 };
    } catch {
      // Fallback a memoria
    }
  }

  // Fallback en memoria
  limpiarMemoriaAntigua();
  const memoKey = `${prefijo}:${clave}`;
  const ahora = Date.now();
  let reg = memoriaBackoff.get(memoKey);

  if (!reg) {
    reg = {
      intentos: 1,
      primerIntento: ahora,
      bloqueadoHasta: 0,
      reincidencias: 0,
      ultimaReincidencia: ahora,
    };
    memoriaBackoff.set(memoKey, reg);
    return { bloqueado: false, duracionMinutos: 0 };
  }

  // Si pasaron más de 24h desde la última reincidencia, resetear historial
  if (ahora - reg.ultimaReincidencia > 24 * 60 * 60 * 1000) {
    reg.reincidencias = 0;
  }

  // Si la ventana de intentos expiró, reiniciar conteo de intentos
  if (ahora - reg.primerIntento > ventanaIntentosMs) {
    reg.intentos = 1;
    reg.primerIntento = ahora;
    return { bloqueado: false, duracionMinutos: 0 };
  }

  reg.intentos += 1;
  if (reg.intentos >= maxIntentos) {
    reg.reincidencias += 1;
    reg.ultimaReincidencia = ahora;

    const index = Math.min(reg.reincidencias - 1, MULTIPLICADORES_MINUTOS.length - 1);
    const duracionMin = MULTIPLICADORES_MINUTOS[index];
    reg.bloqueadoHasta = ahora + duracionMin * 60 * 1000;
    reg.intentos = 0;

    return { bloqueado: true, duracionMinutos: duracionMin };
  }

  return { bloqueado: false, duracionMinutos: 0 };
}

/**
 * Resetea el conteo de intentos de una clave tras una acción exitosa.
 */
async function limpiarIntentosExitosos(prefijo: string, clave: string): Promise<void> {
  const redis = getRedis();
  const keyAttempts = `backoff:${prefijo}:attempts:${clave}`;

  if (redis) {
    try {
      await redis.del(keyAttempts);
    } catch {}
  }

  const memoKey = `${prefijo}:${clave}`;
  const reg = memoriaBackoff.get(memoKey);
  if (reg) {
    reg.intentos = 0;
  }
}

// ---------------------------------------------------------------------------
// 1. INICIO DE SESIÓN (/login) - Estrategia Dual con Backoff Progresivo
// ---------------------------------------------------------------------------

/**
 * Verifica si la IP o la cuenta de correo están bloqueadas para iniciar sesión.
 */
export async function checkLoginRateLimitDual(ip: string, email: string): Promise<Limite> {
  const ipBloqueada = await estaClaveBloqueada("login:ip", ip);
  if (ipBloqueada) return { ok: false };

  const emailNorm = email.trim().toLowerCase();
  if (emailNorm) {
    const emailBloqueado = await estaClaveBloqueada("login:email", emailNorm);
    if (emailBloqueado) return { ok: false };
  }

  return { ok: true };
}

/**
 * Registra un fallo de login. Consume intento en IP y en cuenta de correo.
 */
export async function recordFailedLogin(ip: string, email: string): Promise<void> {
  await registrarFalloBackoff("login:ip", ip, 5, 15 * 60 * 1000);
  const emailNorm = email.trim().toLowerCase();
  if (emailNorm) {
    await registrarFalloBackoff("login:email", emailNorm, 5, 15 * 60 * 1000);
  }
}

/**
 * Resetea el contador de fallos cuando el login es 100% exitoso.
 */
export async function resetLoginSuccess(email: string): Promise<void> {
  const emailNorm = email.trim().toLowerCase();
  if (emailNorm) {
    await limpiarIntentosExitosos("login:email", emailNorm);
  }
}

// ---------------------------------------------------------------------------
// 2. RECUPERACIÓN DE CONTRASEÑA (/recuperar) - Estrategia Dual con Backoff
// ---------------------------------------------------------------------------

/**
 * Verifica si la IP o el correo están bloqueados para solicitar restablecimiento.
 */
export async function checkRecuperarRateLimitDual(ip: string, email: string): Promise<Limite> {
  const ipBloqueada = await estaClaveBloqueada("recuperar:ip", ip);
  if (ipBloqueada) return { ok: false };

  const emailNorm = email.trim().toLowerCase();
  if (emailNorm) {
    const emailBloqueado = await estaClaveBloqueada("recuperar:email", emailNorm);
    if (emailBloqueado) return { ok: false };
  }

  return { ok: true };
}

/**
 * Registra una solicitud de recuperación de contraseña.
 * Aplica 5 solicitudes máximas antes de activar el backoff incremental.
 */
export async function recordRecuperarAttempt(ip: string, email: string): Promise<void> {
  await registrarFalloBackoff("recuperar:ip", ip, 5, 15 * 60 * 1000);
  const emailNorm = email.trim().toLowerCase();
  if (emailNorm) {
    await registrarFalloBackoff("recuperar:email", emailNorm, 3, 15 * 60 * 1000);
  }
}

// ---------------------------------------------------------------------------
// 3. VALIDACIÓN DE CUPONES (Checkout) - 5 Intentos Fallidos / 5 min
// ---------------------------------------------------------------------------

export async function checkCuponRateLimit(ip: string): Promise<Limite> {
  const bloqueada = await estaClaveBloqueada("cupon:ip", ip);
  return { ok: !bloqueada };
}

export async function recordFailedCupon(ip: string): Promise<void> {
  // 5 intentos erróneos en 5 minutos activan 5 minutos de pausa
  await registrarFalloBackoff("cupon:ip", ip, 5, 5 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// 4. CERTIFICADOS PDF (/api/certificados/[codigo]/pdf) - 20 req/min
// ---------------------------------------------------------------------------

export function checkCertificadoRateLimit(ip: string): Promise<Limite> {
  return consumirSliding("cert-pdf", ip, 20, "1 m", 60 * 1000, false);
}

// ---------------------------------------------------------------------------
// 5. TICKETS DE TALLER (/t/[token] y PDF) - 30 req/min
// ---------------------------------------------------------------------------

export function checkTicketRateLimit(ip: string): Promise<Limite> {
  return consumirSliding("ticket-view", ip, 30, "1 m", 60 * 1000, false);
}

// ---------------------------------------------------------------------------
// 6. CHECKOUT PÚBLICO (10 intentos / 10 min por IP)
// ---------------------------------------------------------------------------

export function checkCheckoutRateLimit(clave: string): Promise<Limite> {
  return consumirSliding(
    "checkout",
    clave,
    10,
    "10 m",
    10 * 60 * 1000,
    process.env.NODE_ENV === "production",
  );
}

// Utilidades anteriores para retrocompatibilidad
export function checkLoginRateLimit(clave: string): Promise<Limite> {
  return consumirSliding(
    "panel-login",
    clave,
    5,
    "15 m",
    15 * 60 * 1000,
    process.env.NODE_ENV === "production",
  );
}

export function checkClicsRateLimit(clave: string): Promise<Limite> {
  return consumirSliding("clics", clave, 60, "1 m", 60 * 1000, false);
}

/**
 * Helper universal para extraer la IP cliente desde cualquier contexto Server Action
 */
export async function obtenerIpServidor(): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    const realIp = h.get("x-real-ip");
    if (realIp) return realIp.trim();
    const cfIp = h.get("cf-connecting-ip");
    if (cfIp) return cfIp.trim();
  } catch {}
  return "127.0.0.1";
}

/**
 * Helper universal para extraer la IP cliente desde un Request o NextRequest (Route Handlers)
 */
export function obtenerIpRequest(req: Request): string {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp.trim();
    const cfIp = req.headers.get("cf-connecting-ip");
    if (cfIp) return cfIp.trim();
  } catch {}
  return "127.0.0.1";
}
