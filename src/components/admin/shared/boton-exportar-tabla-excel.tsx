"use client";

import { useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  type ColumnaExcel,
  type FilaTotalExcel,
} from "@/server/exportacion-excel/generador-excel-universal";

export interface BotonExportarTablaExcelProps {
  nombreArchivo: string;
  titulo: string;
  subtitulo?: string;
  nombreHoja?: string;
  columnas: ColumnaExcel[];
  obtenerFilas: () => Record<string, any>[];
  obtenerTotal?: (filas: Record<string, any>[]) => FilaTotalExcel | undefined;
  totalFiltrados: number;
}

export function BotonExportarTablaExcel({
  nombreArchivo,
  titulo,
  subtitulo,
  nombreHoja,
  columnas,
  obtenerFilas,
  obtenerTotal,
  totalFiltrados,
}: BotonExportarTablaExcelProps) {
  const [descargando, setDescargando] = useState(false);

  const handleDescargar = async () => {
    if (totalFiltrados === 0) {
      toast.info("No hay registros para exportar con los filtros actuales.");
      return;
    }

    try {
      setDescargando(true);
      toast.info("Generando reporte Excel...", { duration: 2000 });

      const filas = obtenerFilas();
      const total = obtenerTotal ? obtenerTotal(filas) : undefined;

      const fechaStr = new Date().toISOString().split("T")[0];
      const filename = `${nombreArchivo}-${fechaStr}.xlsx`;

      const res = await fetch("/api/admin/exportar-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreArchivo: filename,
          opciones: {
            titulo,
            subtitulo,
            nombreHoja,
            columnas,
            filas,
            total,
          },
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo generar el archivo");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Reporte descargado correctamente (${totalFiltrados} registros).`);
    } catch (err: any) {
      console.error("[BotonExportarTablaExcel] Error al exportar:", err);
      toast.error("Ocurrió un error al descargar el reporte Excel.");
    } finally {
      setDescargando(false);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      onClick={handleDescargar}
      disabled={descargando || totalFiltrados === 0}
      className="h-8 sm:h-9 gap-1.5 sm:gap-2 rounded-xl text-xs font-bold border cursor-pointer shadow-sm transition-all shrink-0 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 border-[#1E3A8A] text-white dark:bg-white dark:hover:bg-slate-100 dark:border-white dark:text-[#1E3A8A] disabled:opacity-50 disabled:pointer-events-none"
      title={`Exportar ${totalFiltrados} registros a Excel`}
    >
      {descargando ? (
        <Loader2 className="size-3.5 sm:size-4 animate-spin text-white dark:text-[#1E3A8A]" />
      ) : (
        <FileSpreadsheet className="size-3.5 sm:size-4 text-white dark:text-[#1E3A8A]" />
      )}
      <span>Exportar a Excel</span>
      <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold tabular-nums bg-white/20 text-white dark:bg-[#1E3A8A]/15 dark:text-[#1E3A8A]">
        {totalFiltrados}
      </span>
    </Button>
  );
}
