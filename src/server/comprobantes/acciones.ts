"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerAdminVerificado } from "@/server/auth/admin";
import { emitirComprobanteParaOrden, type ResultadoEmisionComprobante } from "./emision";

/**
 * Genera manualmente un comprobante para una orden pagada que aún no cuente con uno.
 */
export async function generarComprobanteManualAction(
  ordenId: string
): Promise<ResultadoEmisionComprobante> {
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);
  if (!adminId) {
    return { ok: false, error: "No tienes permisos de administrador." };
  }

  return await emitirComprobanteParaOrden(ordenId);
}

export interface FiltrosComprobantes {
  busqueda?: string;
  tipoDocumento?: string;
  periodoFecha?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export type ComprobanteItem = {
  id: string;
  orden_id: string;
  tipo_documento: string;
  serie: string;
  numero: number;
  numero_completo: string;
  cliente_tipo_doc: string | null;
  cliente_numero_doc: string | null;
  cliente_nombre: string;
  cliente_direccion: string | null;
  subtotal: number;
  igv: number;
  total: number;
  moneda: string;
  estado_sunat: string;
  emitido_en: string;
  creado_en: string;
  ordenes: {
    id: string;
    numero_orden: string;
    canal: string;
    tipo_orden?: string;
    orden_items?: {
      id: string;
      descripcion: string;
      cantidad: number;
      precio_unitario: number;
      subtotal: number;
    }[];
  } | null;
};

/**
 * Obtiene el listado completo de comprobantes emitidos para el panel administrativo.
 */
export async function obtenerComprobantesAction(): Promise<{
  ok: boolean;
  comprobantes: ComprobanteItem[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const adminId = await obtenerAdminVerificado(supabase);
    if (!adminId) {
      return { ok: false, comprobantes: [], error: "No tienes permisos de administrador." };
    }

    const admin = createAdminClient();

    const { data, error } = await (admin.from("comprobantes") as any)
      .select(`
        id,
        orden_id,
        tipo_documento,
        serie,
        numero,
        cliente_tipo_doc,
        cliente_numero_doc,
        cliente_nombre,
        cliente_direccion,
        subtotal,
        igv,
        total,
        moneda,
        estado_sunat,
        emitido_en,
        creado_en,
        ordenes (
          id,
          numero_orden,
          canal,
          tipo_orden,
          clientes (
            numero_documento,
            tipo_documento
          ),
          orden_items (
            id,
            descripcion,
            cantidad,
            precio_unitario,
            subtotal
          )
        )
      `)
      .order("emitido_en", { ascending: false });

    if (error) {
      console.error("[obtenerComprobantesAction] Error:", error);
      return { ok: false, comprobantes: [], error: error.message };
    }

    const items: ComprobanteItem[] = (data ?? []).map((c: any) => {
      const cli = c.ordenes?.clientes;
      const numDoc =
        c.cliente_numero_doc && c.cliente_numero_doc !== "-"
          ? c.cliente_numero_doc
          : cli?.numero_documento || "-";
      const tipoDoc =
        c.cliente_tipo_doc && c.cliente_tipo_doc !== "-"
          ? c.cliente_tipo_doc
          : cli?.tipo_documento || "DNI";

      return {
        ...c,
        cliente_numero_doc: numDoc,
        cliente_tipo_doc: tipoDoc,
        numero_completo: `${c.serie}-${String(c.numero).padStart(6, "0")}`,
        subtotal: Number(c.subtotal || 0),
        igv: Number(c.igv || 0),
        total: Number(c.total || 0),
      };
    });

    return { ok: true, comprobantes: items };
  } catch (err: any) {
    console.error("[obtenerComprobantesAction] Error inesperado:", err);
    return { ok: false, comprobantes: [], error: err?.message || "Error al cargar comprobantes." };
  }
}
