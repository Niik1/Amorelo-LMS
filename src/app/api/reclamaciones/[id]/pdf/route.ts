// Endpoint para generar y visualizar la Hoja de Reclamación Oficial INDECOPI en PDF.
// 100% en memoria en tamaño A4 vertical con @react-pdf/renderer (Cero Storage en Buckets).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerAdminVerificado } from "@/server/auth/admin";
import { generarHojaReclamoPdfBuffer } from "@/server/reclamos/generador-pdf";
import { mapearFilaAReclamoAdmin } from "@/server/reclamos/tipos";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return new NextResponse("Identificador de reclamación no proporcionado", {
      status: 400,
    });
  }

  const searchParams = _request.nextUrl.searchParams;
  const emailParam = searchParams.get("email")?.toLowerCase().trim();

  // Verificar si tiene sesión de administrador
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);

  const adminClient = createAdminClient();

  // Buscar reclamo por ID UUID o por N° de Hoja (ej: LR-2026-000001)
  const query = id.includes("-") && id.length > 30
    ? adminClient.from("reclamos").select("*").eq("id", id).maybeSingle()
    : adminClient.from("reclamos").select("*").eq("numero", id).maybeSingle();

  const { data: row, error } = await query;

  if (error || !row) {
    return new NextResponse("Hoja de reclamación no encontrada", {
      status: 404,
    });
  }

  // Si no es admin, validar que el correo coincida con el registrado en el reclamo
  if (!adminId) {
    const correoReclamo = (row.correo || "").toLowerCase().trim();
    if (!emailParam || emailParam !== correoReclamo) {
      return new NextResponse(
        "No autorizado. Se requieren permisos de administrador o correo registrado del reclamo.",
        { status: 401 }
      );
    }
  }

  const reclamo = mapearFilaAReclamoAdmin(row);

  try {
    const buffer = await generarHojaReclamoPdfBuffer(reclamo);
    const filename = `Hoja-Reclamacion-${reclamo.numero}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: unknown) {
    const mensaje = err instanceof Error ? err.message : "Error al renderizar el documento PDF.";
    console.error("[PDF Reclamaciones] Error:", err);
    return new NextResponse(`Error al generar el PDF: ${mensaje}`, {
      status: 500,
    });
  }
}
