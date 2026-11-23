import "server-only";

import React from "react";
import QRCode from "qrcode";
import sharp from "sharp";
import { renderToBuffer } from "@react-pdf/renderer";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PlantillaBoletaPdf,
  type DatosPlantillaBoleta,
  type ItemBoleta,
} from "./plantilla-boleta-pdf";
import { PlantillaTicketPdf } from "./plantilla-ticket-pdf";
import { CONFIGURACION_COMPROBANTE_DEFECTO } from "@/lib/validators/configuracion";
import { obtenerBaseUrl } from "@/lib/urls";
import { prepararLogoParaPdf } from "@/lib/pdf/logo-pdf";

/**
 * Genera dinámicamente ("al vuelo") el Buffer binario del PDF para un comprobante dado.
 * Soporta formato "a4" (hoja estándar) o "ticket" (térmico 80mm).
 * Zero Storage: no guarda nada en Supabase Storage, se procesa en memoria en ~60-80 ms.
 */
export async function generarBoletaPdfBuffer(
  comprobanteId: string,
  formato: "a4" | "ticket" = "a4"
): Promise<{
  buffer: Buffer;
  numeroCompleto: string;
} | null> {
  const admin = createAdminClient();

  // 1. Obtener datos del comprobante junto con la orden y sus items, y la configuración del emisor
  const [{ data: comprobante, error }, { data: configRow }] = await Promise.all([
    (admin.from("comprobantes") as any)
      .select(`
        id,
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
        emitido_en,
        ordenes (
          id,
          numero_orden,
          clientes (
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
        )
      `)
      .eq("id", comprobanteId)
      .single(),
    (admin.from("configuraciones") as any)
      .select("valor")
      .eq("clave", "configuracion_comprobante")
      .maybeSingle(),
  ]);

  if (error || !comprobante) {
    console.error("[generarBoletaPdfBuffer] Comprobante no encontrado:", error);
    return null;
  }

  const configEmisor = {
    ...CONFIGURACION_COMPROBANTE_DEFECTO,
    ...(configRow?.valor && typeof configRow.valor === "object" ? configRow.valor : {}),
  };

  const numeroCompleto = `${comprobante.serie}-${String(comprobante.numero).padStart(6, "0")}`;

  // 2. Formatear fecha
  const fechaObj = comprobante.emitido_en ? new Date(comprobante.emitido_en) : new Date();
  const fechaEmisionTexto = fechaObj.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 3. Preparar items
  const ordenItems = comprobante.ordenes?.orden_items || [];
  const items: ItemBoleta[] = ordenItems.map((item: any) => ({
    descripcion: item.descripcion || "Servicio Educativo / Taller",
    cantidad: Number(item.cantidad || 1),
    precioUnitario: Number(item.precio_unitario || 0),
    subtotal: Number(item.subtotal || 0),
  }));

  // Fallback si no había items detallados
  if (items.length === 0) {
    items.push({
      descripcion: "Inscripción en Curso / Taller Amorelo",
      cantidad: 1,
      precioUnitario: Number(comprobante.total || 0),
      subtotal: Number(comprobante.total || 0),
    });
  }

  // 4. Preparar Logo compatible y QR de verificación en paralelo
  const baseUrl = obtenerBaseUrl();
  const urlVerificacion = `${baseUrl}/panel-admin/comprobantes?buscar=${encodeURIComponent(numeroCompleto)}`;

  const [logoDataUri, qrDataUrl] = await Promise.all([
    prepararLogoParaPdf(configEmisor.logo_url),
    (async () => {
      try {
        return await QRCode.toDataURL(urlVerificacion, {
          margin: 1,
          width: formato === "ticket" ? 110 : 150,
          color: {
            dark: "#1E3A8A",
            light: "#FFFFFF",
          },
        });
      } catch (qrErr) {
        console.warn("[generarBoletaPdfBuffer] Error al generar QR:", qrErr);
        return null;
      }
    })(),
  ]);

  const total = Number(comprobante.total || 0);
  let subtotalCalculado = Number(comprobante.subtotal || 0);
  let igvCalculado = Number(comprobante.igv || 0);

  if (configEmisor.tratamiento_igv === "incluido") {
    const tasa = Number(configEmisor.porcentaje_igv || 18);
    subtotalCalculado = Number((total / (1 + tasa / 100)).toFixed(2));
    igvCalculado = Number((total - subtotalCalculado).toFixed(2));
  } else if (configEmisor.tratamiento_igv === "exonerado") {
    subtotalCalculado = total;
    igvCalculado = 0;
  }

  const cliDoc = (comprobante.ordenes as any)?.clientes?.numero_documento;
  const docNumero =
    comprobante.cliente_numero_doc && comprobante.cliente_numero_doc !== "-"
      ? comprobante.cliente_numero_doc
      : cliDoc || "-";
  const docTipo =
    comprobante.cliente_tipo_doc && comprobante.cliente_tipo_doc !== "-"
      ? comprobante.cliente_tipo_doc
      : (comprobante.ordenes as any)?.clientes?.tipo_documento || "DNI";

  const datosBoleta: DatosPlantillaBoleta = {
    serie: comprobante.serie,
    numeroCompleto,
    tipoDocumento: comprobante.tipo_documento === "factura" ? "factura" : "boleta",
    fechaEmisionTexto,
    numeroOrden: comprobante.ordenes?.numero_orden || "ORD-000000",
    clienteNombre: comprobante.cliente_nombre || "Cliente Amorelo",
    clienteTipoDoc: docTipo,
    clienteNumeroDoc: docNumero,
    clienteDireccion: comprobante.cliente_direccion,
    items,
    moneda: comprobante.moneda || "PEN",
    subtotal: subtotalCalculado,
    igv: igvCalculado,
    total,
    qrDataUrl,
    emisor: {
      razonSocial: configEmisor.razon_social,
      nombreComercial: configEmisor.nombre_comercial,
      ruc: configEmisor.ruc,
      direccion: configEmisor.direccion,
      telefono: configEmisor.telefono,
      correo: configEmisor.correo,
      sitioWeb: configEmisor.sitio_web,
      logoUrl: logoDataUri,
    },
    mensajeAgradecimiento: configEmisor.mensaje_agradecimiento,
    pieComprobante: configEmisor.pie_comprobante,
  };

  const plantillaComponente =
    formato === "ticket" ? PlantillaTicketPdf : PlantillaBoletaPdf;

  const elemento = React.createElement(plantillaComponente, datosBoleta);
  const buffer = await renderToBuffer(elemento as any);

  return {
    buffer,
    numeroCompleto,
  };
}
