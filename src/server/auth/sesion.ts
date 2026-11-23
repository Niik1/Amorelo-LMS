import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type SesionActivaInfo = {
  perfil_id: string;
  session_id: string;
  dispositivo: string | null;
  navegador: string | null;
  ip: string | null;
  iniciada_en: string;
  ultima_actividad_en: string;
};

/**
 * Consulta si el alumno ya cuenta con una sesión activa en otro dispositivo.
 */
export async function obtenerSesionActivaAlumno(
  perfilId: string,
): Promise<SesionActivaInfo | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("obtener_sesion_activa", {
    p_perfil_id: perfilId,
  });

  if (error || !data || data.length === 0) return null;
  return data[0] as unknown as SesionActivaInfo;
}

/**
 * Registra la sesión activa del alumno (expulsa la sesión previa si existía en auth.sessions).
 */
export async function registrarSesionAlumno(params: {
  perfilId: string;
  sessionId: string;
  dispositivo?: string | null;
  navegador?: string | null;
  ip?: string | null;
}): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.rpc("registrar_sesion", {
    p_perfil_id: params.perfilId,
    p_session_id: params.sessionId,
    p_dispositivo: params.dispositivo ?? undefined,
    p_navegador: params.navegador ?? undefined,
    p_ip: params.ip ?? undefined,
  });

  if (error) {
    console.error("[sesion] Error registrando sesión activa:", error);
    return false;
  }
  return true;
}

/**
 * Libera la sesión activa al hacer logout.
 */
export async function liberarSesionAlumno(
  perfilId: string,
  sessionId: string,
): Promise<void> {
  const admin = createAdminClient();
  await admin.rpc("liberar_sesion", {
    p_perfil_id: perfilId,
    p_session_id: sessionId,
  });
}
