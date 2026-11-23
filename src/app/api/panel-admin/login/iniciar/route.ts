// Paso 1 del login: email + clave + Turnstile.
// Responde { paso: "mfa" } (ya tiene TOTP) o { paso: "enrolar" } (primera
// vez). Mensajes genéricos para no revelar qué correos existen.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { obtenerAdminId } from "@/server/auth/admin";
import { checkLoginRateLimit } from "@/lib/security/ratelimit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";

const esquema = z.object({
  correo: z.string().trim().toLowerCase().email(),
  clave: z.string().min(1).max(72),
  turnstile: z.string().min(1),
});

function ipDe(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconocida"
  );
}

export async function POST(req: NextRequest) {
  const ip = ipDe(req);
  let cuerpo: unknown;
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }
  const parsed = esquema.safeParse(cuerpo);
  if (!parsed.success) {
    return NextResponse.json({ error: "Revisá los datos." }, { status: 400 });
  }
  const { correo, clave, turnstile } = parsed.data;

  for (const k of [`login:ip:${ip}`, `login:email:${correo}`]) {
    const r = await checkLoginRateLimit(k);
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
  }

  if (!(await verifyTurnstileToken(turnstile, ip))) {
    return NextResponse.json(
      { error: "Verificación fallida. Recargá e intentá de nuevo." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: correo,
    password: clave,
  });
  if (error) {
    return NextResponse.json(
      { error: "Credenciales inválidas." },
      { status: 401 },
    );
  }

  const { data: factores } = await supabase.auth.mfa.listFactors();
  if ((factores?.totp ?? []).length === 0) {
    // Solo alguien con fila en usuarios_admin puede enrolar 2FA.
    if (!(await obtenerAdminId(supabase))) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "Credenciales inválidas." },
        { status: 401 },
      );
    }
    return NextResponse.json({ paso: "enrolar" });
  }
  return NextResponse.json({ paso: "mfa" });
}
