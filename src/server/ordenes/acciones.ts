"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerAdminVerificado } from "@/server/auth/admin";

export type ReembolsoOrdenResultado =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Marca una orden como 'reembolsada' y revoca automáticamente los accesos
 * al aula virtual (si es curso) o cancela la reserva (si es taller).
 */
export async function marcarOrdenReembolsadaAction(
  ordenId: string,
  motivo?: string
): Promise<ReembolsoOrdenResultado> {
  try {
    const supabase = await createClient();
    const adminId = await obtenerAdminVerificado(supabase);
    if (!adminId) {
      return { ok: false, error: "No tienes permisos de administrador." };
    }

    const admin = createAdminClient();

    // 1. Obtener la orden actual
    const { data: orden, error: ordenErr } = await (admin.from("ordenes") as any)
      .select("id, numero_orden, estado, tipo_orden, cliente_id")
      .eq("id", ordenId)
      .single();

    if (ordenErr || !orden) {
      return { ok: false, error: "La orden no existe o no fue encontrada." };
    }

    if (orden.estado === "reembolsada") {
      return { ok: false, error: "Esta orden ya se encuentra registrada como reembolsada." };
    }

    const ahoraIso = new Date().toISOString();
    const motivoFinal = motivo?.trim() || `Reembolso procesado para la orden #${orden.numero_orden}`;

    // 2. Actualizar estado de la orden a 'reembolsada'
    const { error: updateOrdenErr } = await (admin.from("ordenes") as any)
      .update({
        estado: "reembolsada",
      })
      .eq("id", ordenId);

    if (updateOrdenErr) {
      return { ok: false, error: `Error al actualizar orden: ${updateOrdenErr.message}` };
    }

    // 3. Revocar acceso a curso si aplica
    if (orden.tipo_orden === "curso" || !orden.tipo_orden) {
      const { data: matriculas } = await (admin.from("matriculas") as any)
        .select("id")
        .eq("orden_id", ordenId);

      if (matriculas && matriculas.length > 0) {
        await (admin.from("matriculas") as any)
          .update({
            estado: "revocada",
            revocada_en: ahoraIso,
            motivo_revocacion: motivoFinal,
          })
          .eq("orden_id", ordenId);
      }
    }

    // 4. Cancelar reserva de taller si aplica
    if (orden.tipo_orden === "taller") {
      await (admin.from("reservas_taller") as any)
        .update({
          estado: "cancelada",
        })
        .eq("orden_id", ordenId);
    }

    return { ok: true };
  } catch (err: any) {
    console.error("[marcarOrdenReembolsadaAction] Error:", err);
    return { ok: false, error: err?.message || "Ocurrió un error inesperado al procesar el reembolso." };
  }
}

/**
 * Pasa automáticamente a 'expirada' toda orden que siga en 'pendiente'
 * y tenga más de 24 horas de haber sido creada.
 */
export async function autoExpirarOrdenesAction(): Promise<{ ok: boolean; modificadas: number }> {
  try {
    const admin = createAdminClient();
    const limite24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: expiradas, error } = await (admin.from("ordenes") as any)
      .update({ estado: "expirada" })
      .eq("estado", "pendiente")
      .lt("creado_en", limite24Horas)
      .select("id");

    if (error) {
      console.warn("[autoExpirarOrdenesAction] Advertencia expirando órdenes:", error);
      return { ok: false, modificadas: 0 };
    }

    return { ok: true, modificadas: expiradas?.length || 0 };
  } catch (err: any) {
    console.error("[autoExpirarOrdenesAction] Excepción:", err);
    return { ok: false, modificadas: 0 };
  }
}
