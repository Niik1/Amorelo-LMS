// Server Action para Onboarding Progresivo y Fidelización de Alumnos (Cumpleaños y Ciudad).
// Permite al alumno guardar su fecha de cumpleaños, ciudad y género para beneficios exclusivos.

"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type DatosFidelizacionInput = {
  fechaNacimiento: string; // YYYY-MM-DD
  ciudad: string;
  genero: string;
  aceptaMarketing: boolean;
};

export type ResultadoFidelizacion =
  | { ok: true }
  | { ok: false; error: string };

export async function guardarDatosFidelizacionAction(
  datos: DatosFidelizacionInput
): Promise<ResultadoFidelizacion> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return { ok: false, error: "Tu sesión ha expirado. Inicia sesión nuevamente." };
    }

    const fechaTrim = (datos.fechaNacimiento || "").trim();
    if (!fechaTrim || !/^\d{4}-\d{2}-\d{2}$/.test(fechaTrim)) {
      return { ok: false, error: "Por favor selecciona una fecha de nacimiento válida." };
    }

    const ciudadTrim = (datos.ciudad || "").trim();
    if (!ciudadTrim) {
      return { ok: false, error: "Por favor ingresa tu ciudad de residencia." };
    }

    const generoTrim = (datos.genero || "Prefiero no decirlo").trim();
    const emailUsuario = user.email?.trim().toLowerCase();

    if (!emailUsuario) {
      return { ok: false, error: "No se pudo identificar el correo del usuario." };
    }

    const admin = createAdminClient();

    // 1. Obtener cliente vinculado (por profiles.cliente_id o por correo)
    const { data: perfil } = await admin
      .from("profiles")
      .select("cliente_id")
      .eq("id", user.id)
      .maybeSingle();

    let clienteId = perfil?.cliente_id;

    if (!clienteId) {
      const { data: clientePorCorreo } = await admin
        .from("clientes")
        .select("id")
        .eq("correo", emailUsuario)
        .maybeSingle();

      clienteId = clientePorCorreo?.id;
    }

    if (!clienteId) {
      return {
        ok: false,
        error: "No se encontró el registro de cliente asociado a tu cuenta.",
      };
    }

    // 2. Actualizar datos en public.clientes
    const { error: updateErr } = await admin
      .from("clientes")
      .update({
        fecha_nacimiento: fechaTrim,
        ciudad: ciudadTrim,
        genero: generoTrim,
        acepta_marketing: datos.aceptaMarketing,
        acepta_marketing_en: datos.aceptaMarketing ? new Date().toISOString() : null,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", clienteId);

    if (updateErr) {
      console.error("[guardarDatosFidelizacionAction] Error al actualizar cliente:", updateErr);
      return { ok: false, error: "No se pudieron guardar tus datos. Inténtalo de nuevo." };
    }

    revalidatePath("/aula", "layout");
    return { ok: true };
  } catch (err: any) {
    console.error("[guardarDatosFidelizacionAction] Excepción:", err);
    return { ok: false, error: "Ocurrió un error inesperado al guardar la información." };
  }
}
