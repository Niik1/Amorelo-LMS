// Fase 0 — Cliente Supabase para el servidor (SSR): clave publicable (rol anon)
// + cookies de la sesión.
// Responsabilidad: Server Components y route handlers (lectura con RLS).
// La sesión se lee/escribe vía cookies de Next.js (getAll/setAll, API recomendada
// de @supabase/ssr).

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "@/lib/config/env";
import type { Database } from "@/types/database";
// Efecto de import: fija la duración de la cookie de sesión.
import "@/lib/supabase/cookies";

export async function createClient() {
  const cookieStore = await cookies();
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } =
    getSupabasePublicEnv();

  return createServerClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Llamado desde un Server Component: las cookies las gestiona el middleware.
          }
        },
      },
    },
  );
}
