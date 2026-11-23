// Fase 0 — Cliente Supabase para el navegador (clave publicable, mantiene el
// rol anon y la protección por RLS).
// Responsabilidad: única fáctica de conexión desde componentes cliente.
// Usar solo en componentes "use client"; las escrituras sensibles pasan por el
// servidor con la clave secreta SUPABASE_SECRET_KEY (src/lib/supabase/admin.ts).

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/config/env";
import type { Database } from "@/types/database";
// Efecto de import: fija la duración de la cookie de sesión.
import "@/lib/supabase/cookies";

export function createClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } =
    getSupabasePublicEnv();

  return createBrowserClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
