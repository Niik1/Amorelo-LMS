// Generador de PDF en memoria para la Hoja de Reclamación Oficial (INDECOPI).
// Cero almacenamiento en buckets; devuelve directamente el Buffer binario optimizado.

import "server-only";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { PlantillaHojaReclamoPdf } from "./plantilla-hoja-reclamo-pdf";
import type { ItemReclamoAdmin } from "./acciones-admin";
import { obtenerConfiguracionComprobanteAction } from "@/server/configuracion/acciones";
import { prepararLogoParaPdf } from "@/lib/pdf/logo-pdf";

/**
 * Genera el Buffer binario en memoria del PDF de la Hoja de Reclamación.
 * 100% en memoria en tamaño A4 vertical.
 */
export async function generarHojaReclamoPdfBuffer(
  reclamo: ItemReclamoAdmin
): Promise<Buffer> {
  const configuracion = await obtenerConfiguracionComprobanteAction();
  const logoDataUri = await prepararLogoParaPdf(configuracion.logo_url);
  const elemento = React.createElement(PlantillaHojaReclamoPdf, {
    reclamo,
    configuracion,
    logoDataUri,
  });
  const buffer = await renderToBuffer(elemento as any);
  return buffer;
}
