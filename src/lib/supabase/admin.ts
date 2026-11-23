// Fase 0 — Cliente Supabase administrativo con SUPABASE_SECRET_KEY
// (rol service_role, omite RLS).
// Responsabilidad: TODO el backend (checkout, pagos, comprobantes, admin).
//
// REGLA DE ORO: este archivo importa "server-only". Si un componente cliente
// intenta importarlo, el build falla. La SUPABASE_SECRET_KEY NUNCA llega al navegador.

import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminEnv } from "@/lib/config/env";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY } =
    getSupabaseAdminEnv();

  return createSupabaseClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SECRET_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
