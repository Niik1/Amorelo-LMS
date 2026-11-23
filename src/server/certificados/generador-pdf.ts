// Servicio para renderizar el PDF del Certificado en un Buffer Node.js optimizado.

import "server-only";
import QRCode from "qrcode";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { PlantillaCertificadoPdf, type DatosPlantillaCertificado } from "./plantilla-pdf";
import { obtenerBaseUrl } from "@/lib/urls";

export type ParametrosGenerarPdf = Omit<
  DatosPlantillaCertificado,
  "qrDataUrl" | "urlVerificacion"
>;

/**
 * Genera el Buffer binario del PDF del certificado.
 * Incluye el código QR dinámico que apunta a /verificar?codigo=... usando la URL base dinámica.
 */
export async function generarCertificadoPdfBuffer(
  params: ParametrosGenerarPdf
): Promise<{ buffer: Buffer; urlVerificacion: string }> {
  const baseUrl = obtenerBaseUrl();
  const urlVerificacion = `${baseUrl}/verificar?codigo=${encodeURIComponent(params.codigoVerificacion)}`;

  // Generar código QR en formato data URL PNG de alta definición pero ultra comprimido (~2-4 KB)
  const qrDataUrl = await QRCode.toDataURL(urlVerificacion, {
    margin: 1,
    width: 200,
    color: {
      dark: "#1F3A6E",
      light: "#FFFFFF",
    },
  });

  const elemento = React.createElement(PlantillaCertificadoPdf, {
    ...params,
    qrDataUrl,
    urlVerificacion,
  });

  const buffer = await renderToBuffer(elemento as any);

  return {
    buffer,
    urlVerificacion,
  };
}
