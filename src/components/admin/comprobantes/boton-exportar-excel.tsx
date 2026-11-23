"use client";

import { useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface FiltrosExportacionExcel {
  busqueda?: string;
  tipo?: string;
  fechaInicio?: string | null;
  fechaFin?: string | null;
}

export interface BotonExportarExcelProps {
  filtros?: FiltrosExportacionExcel;
  totalFiltrados?: number;
}

export function BotonExportarExcel({ filtros, totalFiltrados }: BotonExportarExcelProps) {
  const [descargando, setDescargando] = useState(false);

  const handleDescargar = async () => {
    try {
      setDescargando(true);
      toast.info("Generando reporte Excel con los filtros aplicados...", { duration: 2500 });

      const params = new URLSearchParams();
      if (filtros?.busqueda?.trim()) {
        params.set("buscar", filtros.busqueda.trim());
      }
      if (filtros?.tipo && filtros.tipo !== "todos") {
        params.set("tipo", filtros.tipo);
      }
      if (filtros?.fechaInicio) {
        params.set("desde", filtros.fechaInicio);
      }
      if (filtros?.fechaFin) {
        params.set("hasta", filtros.fechaFin);
      }

      const queryString = params.toString();
      const endpoint = `/api/comprobantes/exportar-excel${queryString ? `?${queryString}` : ""}`;

      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error("No se pudo generar el archivo");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fechaStr = new Date().toISOString().split("T")[0];
      a.download = `comprobantes-amorelo-${fechaStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(
        totalFiltrados !== undefined
          ? `Reporte descargado correctamente (${totalFiltrados} comprobantes).`
          : "Reporte descargado correctamente."
      );
    } catch (err: any) {
      console.error("Error al exportar:", err);
      toast.error("Ocurrió un error al descargar el reporte Excel.");
    } finally {
      setDescargando(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleDescargar}
      disabled={descargando}
      className="rounded-full bg-white font-bold text-[#1e3a8a] shadow-sm hover:bg-slate-100 cursor-pointer text-xs sm:text-sm h-10 px-4 gap-2 transition-all"
    >
      {descargando ? (
        <Loader2 className="size-4 animate-spin text-[#1e3a8a]" />
      ) : (
        <FileSpreadsheet className="size-4 text-emerald-600" />
      )}
      <span>Exportar a Excel</span>
      {typeof totalFiltrados === "number" ? (
        <span className="ml-0.5 px-2 py-0.5 text-[11px] bg-slate-100 text-[#1e3a8a] border border-slate-200/80 rounded-full font-black tabular-nums">
          {totalFiltrados}
        </span>
      ) : null}
    </Button>
  );
}
