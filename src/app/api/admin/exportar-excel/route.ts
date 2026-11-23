import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { obtenerAdminVerificado } from "@/server/auth/admin";
import {
  generarExcelUniversalBuffer,
  type OpcionesExcelUniversal,
} from "@/server/exportacion-excel/generador-excel-universal";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminId = await obtenerAdminVerificado(supabase);
    if (!adminId) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const body = (await request.json()) as {
      nombreArchivo: string;
      opciones: OpcionesExcelUniversal;
    };

    if (!body?.opciones?.columnas || !body?.opciones?.filas) {
      return new NextResponse("Datos incompletos para exportar", { status: 400 });
    }

    const buffer = await generarExcelUniversalBuffer(body.opciones);
    const filename = body.nombreArchivo.endsWith(".xlsx")
      ? body.nombreArchivo
      : `${body.nombreArchivo}.xlsx`;

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
    console.error("[POST /api/admin/exportar-excel] Error:", err);
    return new NextResponse("Error al generar el archivo Excel", { status: 500 });
  }
}
