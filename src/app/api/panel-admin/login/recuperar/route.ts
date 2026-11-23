// Recupero de clave: envía el correo de Supabase Auth. Respuesta siempre
// genérica para no revelar qué correos existen.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkLoginRateLimit } from "@/lib/security/ratelimit";
import { getPublicEnv } from "@/lib/config/env";

const esquema = z.object({
  correo: z.string().trim().toLowerCase().email(),
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
    return NextResponse.json({ error: "Correo inválido." }, { status: 400 });
  }

  const r = await checkLoginRateLimit(`recuperar:ip:${ip}`);
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
  const { NEXT_PUBLIC_SITE_URL } = getPublicEnv();
  await supabase.auth.resetPasswordForEmail(parsed.data.correo, {
    redirectTo: `${NEXT_PUBLIC_SITE_URL}/panel-admin/nueva-clave`,
  });
  return NextResponse.json({
    ok: true,
    mensaje:
      "Si el correo existe, te enviamos el enlace para crear una clave nueva.",
  });
}
