// Cliente Supabase SIN cookies, para leer datos públicos (por ejemplo la tabla
// `cursos`) desde componentes que se muestran a todos los visitantes.
//
// Por qué existe: `createClient()` de "@/lib/supabase/server" lee `cookies()`,
// y en Next.js eso vuelve DINÁMICA toda la ruta que lo use (una función se
// ejecuta en cada visita y la página nunca se guarda en el CDN). Este cliente
// usa la misma clave publicable (rol anon, con RLS), pero no toca cookies.
//
// Responsabilidad: lecturas públicas sin sesión. Para lecturas con sesión
// (panel, registro de clics) seguí usando "@/lib/supabase/server".

import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/config/env";

export function createPublicClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } =
    getSupabasePublicEnv();

  return createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
