// Enrolamiento TOTP: primer factor (login) y factor de respaldo (seguridad).
//
// Dos reglas que impone GoTrue y que hay que respetar acá:
// 1. El nombre del factor es único por usuario: un duplicado devuelve 422
//    `mfa_factor_name_conflict`. Por eso el nombre no puede ser fijo.
// 2. Un intento abandonado deja el factor en estado "unverified". El SDK no lo
//    devuelve en `listFactors().totp` (filtra por verified), así que queda
//    invisible: ocupa nombre y nunca sirve para entrar. Antes de enrolar se
//    limpian esos restos.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { obtenerAdminId } from "@/server/auth/admin";
import { checkLoginRateLimit } from "@/lib/security/ratelimit";

/** Nombre del primer dispositivo. */
const NOMBRE_PRINCIPAL = "Panel admin";

function ipDe(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconocida"
  );
}

/** "Panel admin" para el primero; después "Respaldo 1", "Respaldo 2"… */
function nombreLibre(usados: Set<string>) {
  if (!usados.has(NOMBRE_PRINCIPAL)) return NOMBRE_PRINCIPAL;
  for (let n = 1; n <= 20; n++) {
    const nombre = `Respaldo ${n}`;
    if (!usados.has(nombre)) return nombre;
  }
  return `Respaldo ${Date.now()}`;
}

export async function POST(req: NextRequest) {
  const ip = ipDe(req);
  const r = await checkLoginRateLimit(`login:ip:${ip}`);
  if (!r.ok) {
    return NextResponse.json(
      {
        error: r.sinRedis
          ? "Servicio no disponible."
          : "Demasiados intentos. Esperá 15 minutos.",
      },
      { status: r.sinRedis ? 503 : 429 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await obtenerAdminId(supabase))) {
    if (user) await supabase.auth.signOut();
    return NextResponse.json(
      { error: "Credenciales inválidas." },
      { status: 401 },
    );
  }

  const { data: factores } = await supabase.auth.mfa.listFactors();
  const totps = (factores?.all ?? []).filter((f) => f.factor_type === "totp");
  const verificados = totps.filter((f) => f.status === "verified");
  const pendientes = totps.filter((f) => f.status !== "verified");

  if (verificados.length > 0) {
    // Con factores existentes solo se puede agregar otro con sesión
    // totalmente verificada (aal2): es el segundo factor de respaldo.
    const { data: aal } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") {
      return NextResponse.json(
        { error: "Ya tenés 2FA activo. Ingresá tu código." },
        { status: 400 },
      );
    }
  }

  for (const factor of pendientes) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (error) {
      console.error(
        "[seguridad] no se pudo limpiar un factor pendiente:",
        error.code ?? "sin código",
        error.message,
      );
    }
  }

  const friendlyName = nombreLibre(
    new Set(totps.map((f) => f.friendly_name ?? "")),
  );

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName,
  });
  if (error || !data?.totp) {
    console.error(
      "[seguridad] mfa.enroll falló:",
      error?.code ?? "sin código",
      error?.message ?? "sin mensaje",
    );
    const mensaje =
      error?.code === "too_many_enrolled_mfa_factors"
        ? "Alcanzaste el máximo de dispositivos vinculados."
        : error?.code === "mfa_factor_name_conflict"
          ? "Ya tenés un dispositivo con ese nombre. Intentá de nuevo."
          : "No se pudo generar el código. Intentá de nuevo.";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
  return NextResponse.json({
    factorId: data.id,
    uri: data.totp.uri,
    secreto: data.totp.secret,
    qr_code: data.totp.qr_code,
  });
}
