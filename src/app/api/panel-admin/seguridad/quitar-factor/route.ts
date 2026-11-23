// Quita un dispositivo TOTP de la cuenta. Pensado para dar de baja un
// dispositivo perdido desde el que todavía tenés.
//
// Reglas: sesión aal2 (verificar el factor es una operación sensible) + admin
// activo, y nunca dejar la cuenta sin factores (te quedarías sin segundo
// factor para entrar).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { obtenerAdminId } from "@/server/auth/admin";
import { checkLoginRateLimit } from "@/lib/security/ratelimit";

const esquema = z.object({ factorId: z.string().uuid() });

function ipDe(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconocida"
  );
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

  let cuerpo: unknown;
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }
  const parsed = esquema.safeParse(cuerpo);
  if (!parsed.success) {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await obtenerAdminId(supabase))) {
    return NextResponse.json(
      { error: "Credenciales inválidas." },
      { status: 401 },
    );
  }

  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") {
    return NextResponse.json(
      { error: "Ingresá tu código para confirmar." },
      { status: 403 },
    );
  }

  const { data: factores } = await supabase.auth.mfa.listFactors();
  const totps = factores?.totp ?? [];
  if (!totps.some((f) => f.id === parsed.data.factorId)) {
    return NextResponse.json(
      { error: "Dispositivo no encontrado." },
      { status: 404 },
    );
  }
  if (totps.length <= 1) {
    return NextResponse.json(
      { error: "No podés quitar el único dispositivo: te quedarías sin 2FA." },
      { status: 400 },
    );
  }

  const { error } = await supabase.auth.mfa.unenroll({
    factorId: parsed.data.factorId,
  });
  if (error) {
    console.error(
      "[seguridad] mfa.unenroll falló:",
      error.code ?? "sin código",
      error.message,
    );
    return NextResponse.json(
      { error: "No se pudo quitar el dispositivo. Intentá de nuevo." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
