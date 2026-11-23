"use server";

import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CertificadoVerificado {
  id: string;
  codigo_verificacion: string;
  nombre_certificado: string;
  titulo: string;
  tipo: string;
  estado: "vigente" | "anulado" | "emitido";
  emitido_en: string;
  horas_academicas?: number | null;
  motivo_anulacion?: string | null;
  reemplaza_certificado_id?: string | null;
  qrDataUrl?: string;
}

export interface CertificadoReemplazante {
  codigo_verificacion: string;
  nombre_certificado: string;
  emitido_en: string;
}

export interface VerificarResultado {
  encontrado: boolean;
  certificado: CertificadoVerificado | null;
  certificadoReemplazante: CertificadoReemplazante | null;
  error?: string;
}

export async function verificarCodigoAction(codigo: string): Promise<VerificarResultado> {
  const codigoLimpio = (codigo || "").trim().toUpperCase();

  if (!codigoLimpio) {
    return {
      encontrado: false,
      certificado: null,
      certificadoReemplazante: null,
      error: "Por favor ingresa un código de certificado.",
    };
  }

  try {
    const admin = createAdminClient();

    const { data: cert, error: certError } = await admin
      .from("certificados")
      .select("*")
      .or(`codigo_verificacion.eq.${codigoLimpio},codigo_verificacion.ilike.${codigoLimpio}`)
      .maybeSingle();

    if (certError) {
      console.error("[verificarCodigoAction] Error al consultar certificado:", certError);
      return {
        encontrado: false,
        certificado: null,
        certificadoReemplazante: null,
        error: "Ocurrió un error al verificar el certificado. Inténtalo nuevamente.",
      };
    }

    if (!cert) {
      return {
        encontrado: false,
        certificado: null,
        certificadoReemplazante: null,
      };
    }

    let qrDataUrl = "";
    try {
      qrDataUrl = await QRCode.toDataURL(
        `https://amorelo.pe/verificar?codigo=${cert.codigo_verificacion}`,
        {
          margin: 1,
          width: 140,
          color: { dark: "#0F172A", light: "#FFFFFF" },
        }
      );
    } catch {
      // noop
    }

    let certificadoReemplazante: CertificadoReemplazante | null = null;

    if (cert.estado === "anulado") {
      const { data: nuevo } = await admin
        .from("certificados")
        .select("codigo_verificacion, nombre_certificado, emitido_en")
        .eq("reemplaza_certificado_id", cert.id)
        .in("estado", ["vigente", "emitido"])
        .maybeSingle();

      if (nuevo) {
        certificadoReemplazante = nuevo;
      }
    }

    return {
      encontrado: true,
      certificado: { ...cert, qrDataUrl } as CertificadoVerificado,
      certificadoReemplazante,
    };
  } catch (err) {
    console.error("[verificarCodigoAction] Excepción inesperada:", err);
    return {
      encontrado: false,
      certificado: null,
      certificadoReemplazante: null,
      error: "Error de conexión con el registro oficial.",
    };
  }
}
