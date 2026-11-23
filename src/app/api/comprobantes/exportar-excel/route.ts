import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { obtenerAdminVerificado } from "@/server/auth/admin";
import { obtenerComprobantesAction } from "@/server/comprobantes/acciones";
import { generarComprobantesExcelBuffer } from "@/server/comprobantes/generador-excel";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminId = await obtenerAdminVerificado(supabase);
    if (!adminId) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const res = await obtenerComprobantesAction();
    if (!res.ok) {
      return new NextResponse(res.error || "Error al obtener comprobantes", { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tipo = searchParams.get("tipo");
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");
    const buscar = searchParams.get("buscar")?.toLowerCase().trim();

    let comprobantes = res.comprobantes ?? [];

    // 1. Filtrar por tipo de documento (boleta | factura)
    if (tipo && tipo !== "todos") {
      comprobantes = comprobantes.filter((c) => c.tipo_documento === tipo);
    }

    // 2. Filtrar por rango de fechas de emisión
    if (desde) {
      const fechaDesde = new Date(desde);
      if (!isNaN(fechaDesde.getTime())) {
        comprobantes = comprobantes.filter((c) => new Date(c.emitido_en) >= fechaDesde);
      }
    }

    if (hasta) {
      const fechaHasta = new Date(hasta);
      if (!isNaN(fechaHasta.getTime())) {
        comprobantes = comprobantes.filter((c) => new Date(c.emitido_en) <= fechaHasta);
      }
    }

    // 3. Filtrar por término de búsqueda (comprobante, orden, cliente, documento, ítems)
    if (buscar) {
      comprobantes = comprobantes.filter((c) => {
        const numComp = c.numero_completo.toLowerCase();
        const numOrd = (c.ordenes?.numero_orden || "").toLowerCase();
        const clienteNom = c.cliente_nombre.toLowerCase();
        const docNum = (c.cliente_numero_doc || "").toLowerCase();
        const itemsText =
          c.ordenes?.orden_items?.map((i) => i.descripcion.toLowerCase()).join(" ") ?? "";
        return (
          numComp.includes(buscar) ||
          numOrd.includes(buscar) ||
          clienteNom.includes(buscar) ||
          docNum.includes(buscar) ||
          itemsText.includes(buscar)
        );
      });
    }

    const buffer = await generarComprobantesExcelBuffer(comprobantes);
    const fechaStr = new Date().toISOString().split("T")[0];
    const filename = `comprobantes-amorelo-${fechaStr}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("[GET /api/comprobantes/exportar-excel] Error:", err);
    return new NextResponse("Error al generar el reporte de Excel", { status: 500 });
  }
}
