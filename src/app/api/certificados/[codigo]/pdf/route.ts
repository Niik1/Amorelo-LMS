// Endpoint para previsualizar y descargar el Certificado Oficial en PDF.
// Admite el código con o sin guiones y genera el PDF 100% en demanda (on-the-fly, 0 KB en Supabase Storage).

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generarCertificadoPdfBuffer } from "@/server/certificados/generador-pdf";
import {
  checkCertificadoRateLimit,
  obtenerIpRequest,
} from "@/lib/security/ratelimit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  // 1. Rate Limit por IP (20 descargas / minuto para evitar saturación de CPU)
  const ip = obtenerIpRequest(request);
  const rateCheck = await checkCertificadoRateLimit(ip);
  if (!rateCheck.ok) {
    return new NextResponse("Límite de solicitudes simultáneas excedido. Inténtalo más tarde.", {
      status: 429,
      headers: {
        "Retry-After": "60",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const { codigo } = await params;

  if (!codigo || typeof codigo !== "string") {
    return new NextResponse("Código de certificado no proporcionado", { status: 400 });
  }

  const admin = createAdminClient();
  const codigoLimpio = codigo.trim();

  // Buscar por coincidencia exacta o normalizada (con o sin guiones)
  const { data: cert } = await admin
    .from("certificados")
    .select("*")
    .or(`codigo_verificacion.eq.${codigoLimpio},codigo_verificacion.ilike.${codigoLimpio}`)
    .maybeSingle();

  if (!cert) {
    return new NextResponse("Certificado no encontrado o código no válido", { status: 404 });
  }

  const url = new URL(request.url);
  const forzarDescarga = url.searchParams.get("descargar") === "1" || url.searchParams.get("download") === "1";
  const tipoDoc = cert.tipo === "finalizacion" ? "Constancia-Finalizacion" : "Constancia-Participacion";
  const filename = `${tipoDoc}-${cert.codigo_verificacion}.pdf`;
  const disposition = forzarDescarga
    ? `attachment; filename="${filename}"`
    : `inline; filename="${filename}"`;

  try {
    // 1. Resolver documento de identidad si existe asociado al alumno o participante
    let documentoAlumno: string | null = null;
    if (cert.matricula_id) {
      const { data: matricula } = await admin
        .from("matriculas")
        .select("perfil_id, profiles(cliente_id, clientes(tipo_documento, numero_documento))")
        .eq("id", cert.matricula_id)
        .maybeSingle();

      const cli = (matricula?.profiles as any)?.clientes;
      if (cli?.numero_documento) {
        documentoAlumno = `${cli.tipo_documento || "Doc"}: ${cli.numero_documento}`;
      }
    } else if (cert.reserva_id) {
      const { data: reserva } = await admin
        .from("reservas_taller")
        .select("cliente_id, clientes(tipo_documento, numero_documento)")
        .eq("id", cert.reserva_id)
        .maybeSingle();

      const cli = (reserva as any)?.clientes;
      if (cli?.numero_documento) {
        documentoAlumno = `${cli.tipo_documento || "Doc"}: ${cli.numero_documento}`;
      }
    }

    // 2. Formatear fecha en texto oficial en español
    const fechaRef = new Date(cert.fecha_referencia || cert.emitido_en);
    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    const fechaEmisionTexto = `${fechaRef.getDate()} de ${meses[fechaRef.getMonth()]} de ${fechaRef.getFullYear()}`;

    // 3. Generar el PDF vectorial en memoria con QR oficial
    const { buffer } = await generarCertificadoPdfBuffer({
      codigoVerificacion: cert.codigo_verificacion,
      tipo: cert.tipo as "finalizacion" | "participacion",
      nombreAlumno: cert.nombre_certificado,
      documentoAlumno,
      tituloCursoOTaller: cert.titulo,
      horasAcademicas: cert.horas_academicas ? Number(cert.horas_academicas) : null,
      fechaEmisionTexto,
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Error al generar el PDF del certificado en demanda:", error);
    return new NextResponse("Error al generar el PDF del certificado", {
      status: 500,
    });
  }
}
