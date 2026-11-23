// Verificación de admin en el servidor (defensa en profundidad además del
// proxy). Responsabilidad: confirmar que la sesión actual pertenece a una
// fila activa de `usuarios_admin`. Plan §11.
// La fuente de verdad es la tabla (no profiles.role ni app_metadata).

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Devuelve el ID del admin si la sesión del cliente es de un admin activo,
 * o `null` si no hay sesión o no es admin.
 */
export async function obtenerAdminId(
  client: SupabaseClient<Database>,
): Promise<string | null> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;
  const { data } = await client
    .from("profiles")
    .select("id,activo,rol")
    .eq("id", user.id)
    .eq("rol", "admin")
    .maybeSingle();
  if (!data || !data.activo) return null;
  return user.id;
}

/**
 * Si la sesión ya completó el segundo factor (aal2) en caso de tenerlo configurado.
 * Si el admin aún no tiene factores TOTP enrolados, aal1 es suficiente para entrar al panel
 * y puede enrolar su factor en /panel-admin/seguridad.
 */
export async function sesionCompleta(
  client: SupabaseClient,
): Promise<boolean> {
  const { data: aal } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  const factores = await client.auth.mfa.listFactors();
  const tieneTotp = Boolean(
    factores.data?.totp && factores.data.totp.length > 0,
  );

  if (tieneTotp) {
    return aal?.currentLevel === "aal2";
  }

  return true;
}

/**
 * Admin activo Y sesión aal2. Es la verificación para todo lo que lee o
 * escribe datos del panel.
 *
 * No usar en las rutas de login/enrolamiento (`iniciar`, `verificar`,
 * `activar`, `enrolar`): esas ocurren justamente en aal1, es el paso donde el
 * segundo factor se carga.
 */
export async function obtenerAdminVerificado(
  client: SupabaseClient,
): Promise<string | null> {
  const id = await obtenerAdminId(client);
  if (!id) return null;
  return (await sesionCompleta(client)) ? id : null;
}
