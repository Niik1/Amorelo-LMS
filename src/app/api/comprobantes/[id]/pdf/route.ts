import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerAdminVerificado } from "@/server/auth/admin";
import { generarBoletaPdfBuffer } from "@/server/comprobantes/generador-pdf";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return new NextResponse("ID de comprobante no proporcionado", { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("No autorizado. Inicie sesión para continuar.", {
        status: 401,
      });
    }

    // 1. Verificar si es administrador
    const adminId = await obtenerAdminVerificado(supabase);

    // 2. Si no es administrador, verificar que el comprobante pertenezca a este alumno
    if (!adminId) {
      const admin = createAdminClient();
      const { data: comp } = await (admin.from("comprobantes") as any)
        .select("orden_id, ordenes(cliente_id, tipo_orden, saldo_pendiente)")
        .eq("id", id)
        .maybeSingle();

      if (!comp) {
        return new NextResponse("Comprobante no encontrado", { status: 404 });
      }

      const { data: perfil } = await admin
        .from("profiles")
        .select("cliente_id")
        .eq("id", user.id)
        .maybeSingle();

      const ordenClienteId = comp?.ordenes?.cliente_id;
      if (!perfil?.cliente_id || perfil.cliente_id !== ordenClienteId) {
        return new NextResponse(
          "No tienes autorización para acceder a este comprobante.",
          { status: 403 }
        );
      }

      // Regla de Negocio: Si es taller con saldo pendiente, no se permite descargar hasta liquidar el 100%
      if (
        comp.ordenes?.tipo_orden === "taller" &&
        Number(comp.ordenes?.saldo_pendiente || 0) > 0
      ) {
        return new NextResponse(
          "El comprobante oficial estará disponible una vez liquidado el saldo total del taller.",
          { status: 403 }
        );
      }
    }

    const url = new URL(request.url);
    const formato = url.searchParams.get("formato") === "ticket" ? "ticket" : "a4";
    const forzarDescarga = url.searchParams.get("descargar") === "1" || url.searchParams.get("download") === "1";

    const resultado = await generarBoletaPdfBuffer(id, formato);
    if (!resultado) {
      return new NextResponse("Comprobante no encontrado", { status: 404 });
    }

    const { buffer, numeroCompleto } = resultado;
    const nombreArchivo = `${numeroCompleto}${formato === "ticket" ? "-ticket" : ""}.pdf`;
    const disposition = forzarDescarga
      ? `attachment; filename="${nombreArchivo}"`
      : `inline; filename="${nombreArchivo}"`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("[GET /api/comprobantes/[id]/pdf] Error:", err);
    return new NextResponse("Error al generar el PDF del comprobante", { status: 500 });
  }
}
