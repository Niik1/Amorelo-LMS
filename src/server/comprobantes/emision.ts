import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export interface ResultadoEmisionComprobante {
  ok: boolean;
  comprobanteId?: string;
  numeroCompleto?: string;
  error?: string;
}

/**
 * Emite de forma segura e idempotente un comprobante (Serie B001) para una orden dada.
 * Si la orden ya tiene comprobante emitido, devuelve el existente sin duplicar.
 * Solo emite si la orden se encuentra en estado 'pagada'.
 */
export async function emitirComprobanteParaOrden(
  ordenId: string
): Promise<ResultadoEmisionComprobante> {
  try {
    const admin = createAdminClient();

    // 1. Verificar si ya existe un comprobante para esta orden
    const { data: existente } = await (admin.from("comprobantes") as any)
      .select("id, serie, numero")
      .eq("orden_id", ordenId)
      .maybeSingle();

    if (existente) {
      const padNum = String(existente.numero).padStart(6, "0");
      return {
        ok: true,
        comprobanteId: existente.id,
        numeroCompleto: `${existente.serie}-${padNum}`,
      };
    }

    // 2. Obtener la orden completa con cliente e items
    const { data: orden, error: ordenErr } = await (admin.from("ordenes") as any)
      .select(`
        id,
        numero_orden,
        estado,
        comprobante_solicitado,
        facturacion_tipo_doc,
        facturacion_numero_doc,
        facturacion_nombre,
        facturacion_direccion,
        subtotal,
        monto_descuento,
        total,
        moneda,
        cliente_id,
        clientes (
          nombres,
          apellidos,
          correo,
          telefono,
          tipo_documento,
          numero_documento
        ),
        orden_items (
          id,
          descripcion,
          cantidad,
          precio_unitario,
          subtotal
        )
      `)
      .eq("id", ordenId)
      .single();

    if (ordenErr || !orden) {
      return { ok: false, error: "La orden no existe o no fue encontrada." };
    }

    if (orden.estado !== "pagada") {
      return {
        ok: false,
        error: `No se puede emitir comprobante para una orden con estado '${orden.estado}'. Debe estar 100% pagada.`,
      };
    }

    const serie = "B001";

    // 3. Obtener el siguiente correlativo atómico desde PostgreSQL
    const { data: numCorrelativo, error: rpcErr } = await (admin.rpc as any)(
      "obtener_siguiente_numero_comprobante",
      { p_serie: serie }
    );

    if (rpcErr || typeof numCorrelativo !== "number") {
      console.error("[emitirComprobante] Error en RPC obtener_siguiente_numero_comprobante:", rpcErr);
      return { ok: false, error: "Error al generar el número correlativo del comprobante." };
    }

    // 4. Preparar datos del cliente
    const nombreCompletoCliente =
      orden.facturacion_nombre?.trim() ||
      `${orden.clientes?.nombres ?? ""} ${orden.clientes?.apellidos ?? ""}`.trim() ||
      "Cliente Amorelo";

    const tipoDoc =
      orden.facturacion_tipo_doc ||
      orden.clientes?.tipo_documento ||
      "DNI";
    const numeroDoc =
      orden.facturacion_numero_doc ||
      orden.clientes?.numero_documento ||
      "-";
    const direccionDoc = orden.facturacion_direccion || null;

    // Obtener la configuración del emisor y tratamiento de IGV
    const { data: configRow } = await (admin.from("configuraciones") as any)
      .select("valor")
      .eq("clave", "configuracion_comprobante")
      .maybeSingle();

    const configEmisor = configRow?.valor && typeof configRow.valor === "object" ? configRow.valor : {};
    const esIncluido = configEmisor.tratamiento_igv === "incluido";
    const tasaIgv = Number(configEmisor.porcentaje_igv || 18);

    const total = Number(orden.total || 0);
    const subtotal = esIncluido ? Number((total / (1 + tasaIgv / 100)).toFixed(2)) : total;
    const igv = esIncluido ? Number((total - subtotal).toFixed(2)) : 0;

    const ahoraIso = new Date().toISOString();

    // 5. Preparar ítems para JSON
    const itemsRaw = orden.orden_items || [];
    const itemsJson = itemsRaw.length > 0
      ? itemsRaw.map((it: any) => ({
          descripcion: it.descripcion || "Servicio Educativo / Taller",
          cantidad: Number(it.cantidad || 1),
          precio_unitario: Number(it.precio_unitario || 0),
          subtotal: Number(it.subtotal || 0),
        }))
      : [
          {
            descripcion: "Servicio Educativo / Formación Amorelo",
            cantidad: 1,
            precio_unitario: total,
            subtotal: total,
          },
        ];

    // 6. Insertar el comprobante
    const { data: nuevoComprobante, error: insertErr } = await (admin.from("comprobantes") as any)
      .insert({
        orden_id: ordenId,
        tipo_documento: (orden.comprobante_solicitado || (orden as any).tipo_comprobante) === "factura" ? "factura" : "boleta",
        modo: "interno",
        concepto: "total",
        estado_registro: "vigente",
        serie,
        numero: numCorrelativo,
        emisor: {
          nombre: configEmisor.razon_social || "Amorelo",
          nombre_comercial: configEmisor.nombre_comercial || "Academia de Arte y Manualidades",
          ruc: configEmisor.ruc || "20609234561",
          direccion: configEmisor.direccion || "Lima, Perú",
          telefono: configEmisor.telefono || "+51 924 353 798",
          correo: configEmisor.correo || "contacto@amorelo.com",
          sitio_web: configEmisor.sitio_web || "www.amorelo.com",
          pais: "PE",
        },
        items: itemsJson,
        cliente_tipo_doc: tipoDoc,
        cliente_numero_doc: numeroDoc,
        cliente_nombre: nombreCompletoCliente,
        cliente_direccion: direccionDoc,
        cliente_correo: orden.clientes?.correo || null,
        subtotal,
        igv,
        total,
        moneda: orden.moneda || "PEN",
        estado_sunat: "pendiente",
        mensaje_sunat: "Emisión de control interno (Serie B001)",
        emitido_en: ahoraIso,
        ruta_pdf: null, // Zero Storage: se renderiza al vuelo
      })
      .select("id, serie, numero, numero_completo")
      .single();

    if (insertErr || !nuevoComprobante) {
      console.error("[emitirComprobante] Error al insertar comprobante:", insertErr);
      return { ok: false, error: `Error al registrar comprobante: ${insertErr?.message}` };
    }

    const numeroCompleto =
      nuevoComprobante.numero_completo ||
      `${nuevoComprobante.serie}-${String(nuevoComprobante.numero).padStart(8, "0")}`;

    return {
      ok: true,
      comprobanteId: nuevoComprobante.id,
      numeroCompleto,
    };
  } catch (err: any) {
    console.error("[emitirComprobanteParaOrden] Error inesperado:", err);
    return { ok: false, error: err?.message || "Ocurrió un error inesperado al emitir el comprobante." };
  }
}
