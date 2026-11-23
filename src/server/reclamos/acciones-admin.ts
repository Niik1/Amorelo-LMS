// Server Actions para el módulo de Reclamaciones (Libro de Reclamaciones) en el Panel Admin.
// Trazabilidad legal, consulta segura y respuesta inmutable vía RPC responder_reclamo().

"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerAdminVerificado } from "@/server/auth/admin";
import {
  type ItemReclamoAdmin,
  mapearFilaAReclamoAdmin,
} from "./tipos";

export type { ItemReclamoAdmin };

/**
 * Obtiene todas las reclamaciones registradas en la base de datos para el Panel Admin.
 */
export async function obtenerReclamosAdminAction(): Promise<{
  ok: boolean;
  reclamos: ItemReclamoAdmin[];
  error?: string;
}> {
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);

  if (!adminId) {
    return {
      ok: false,
      reclamos: [],
      error: "No tienes permisos de administrador para consultar este módulo.",
    };
  }

  const adminClient = createAdminClient();

  try {
    const { data, error } = await adminClient
      .from("reclamos")
      .select("*")
      .order("creado_en", { ascending: false });

    if (error) {
      return {
        ok: false,
        reclamos: [],
        error: error.message,
      };
    }

    const items: ItemReclamoAdmin[] = (data || []).map(mapearFilaAReclamoAdmin);

    return {
      ok: true,
      reclamos: items,
    };
  } catch (err: unknown) {
    const mensaje = err instanceof Error ? err.message : "Error inesperado al cargar reclamaciones.";
    return {
      ok: false,
      reclamos: [],
      error: mensaje,
    };
  }
}

export interface ResponderReclamoInput {
  reclamoId: string;
  respuesta: string;
}

/**
 * Registra formalmente la respuesta oficial del proveedor llamando al RPC `responder_reclamo`.
 */
export async function responderReclamoAdminAction(
  input: ResponderReclamoInput
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);

  if (!adminId) {
    return {
      ok: false,
      error: "Sesión de administrador no válida o expirada.",
    };
  }

  const { reclamoId, respuesta } = input;

  if (!reclamoId || !respuesta || respuesta.trim().length < 10) {
    return {
      ok: false,
      error: "La respuesta debe tener al menos 10 caracteres fundamentados.",
    };
  }

  const adminClient = createAdminClient();

  try {
    // 1. Invocar la función RPC oficial de base de datos
    const { data: respondido, error: rpcError } = await adminClient.rpc("responder_reclamo", {
      p_admin: adminId,
      p_reclamo_id: reclamoId,
      p_respuesta: respuesta.trim(),
    });

    if (rpcError) {
      return {
        ok: false,
        error: rpcError.message,
      };
    }

    if (!respondido) {
      return {
        ok: false,
        error: "No se pudo actualizar el reclamo. Es posible que ya haya sido respondido o cerrado.",
      };
    }

    // 2. Registrar fecha de respuesta enviada si corresponde
    await adminClient
      .from("reclamos")
      .update({ respuesta_enviada_en: new Date().toISOString() })
      .eq("id", reclamoId);

    revalidatePath("/panel-admin/reclamaciones");

    return { ok: true };
  } catch (err: unknown) {
    const mensaje = err instanceof Error ? err.message : "Error al registrar respuesta.";
    return {
      ok: false,
      error: mensaje,
    };
  }
}
