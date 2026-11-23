// Paso 2 del login (con TOTP ya enrolado): verifica el código de 6 dígitos
// y confirma que la sesión es de un admin activo.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { obtenerAdminId } from "@/server/auth/admin";
import { checkLoginRateLimit } from "@/lib/security/ratelimit";

const esquema = z.object({
  codigo: z.string().trim().regex(/^\d{6,8}$/),
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
    return NextResponse.json({ error: "Código inválido." }, { status: 400 });
  }

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
  if (!user) {
    return NextResponse.json({ error: "Sesión vencida." }, { status: 401 });
  }
  const { data: factores } = await supabase.auth.mfa.listFactors();
  const totps = factores?.totp ?? [];
  if (totps.length === 0) {
    return NextResponse.json({ error: "Sesión vencida." }, { status: 401 });
  }

  // El código solo vale contra el factor cuyo secreto lo generó, y el cliente
  // no dice desde qué dispositivo entró: se prueba con cada uno hasta que
  // alguno valide. Con un solo factor es una sola vuelta.
  let verificado = false;
  for (const factor of totps) {
    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (challengeError || !challenge) continue;
    const { error } = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: challenge.id,
      code: parsed.data.codigo,
    });
    if (!error) {
      verificado = true;
      break;
    }
  }
  if (!verificado) {
    return NextResponse.json({ error: "Código inválido." }, { status: 401 });
  }

  if (!(await obtenerAdminId(supabase))) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "Credenciales inválidas." },
      { status: 401 },
    );
  }
  return NextResponse.json({ ok: true });
}
