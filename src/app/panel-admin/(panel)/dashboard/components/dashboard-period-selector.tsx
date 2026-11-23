"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DatePicker } from "@/components/ui/date-time-picker";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarRange, Filter, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardPeriodo } from "@/server/dashboard/consultas";

interface PeriodoOption {
  clave: DashboardPeriodo;
  label: string;
}

const PERIODOS: PeriodoOption[] = [
  { clave: "hoy", label: "Hoy" },
  { clave: "7d", label: "7 Días" },
  { clave: "mes", label: "Este Mes" },
  { clave: "30d", label: "30 Días" },
  { clave: "total", label: "Histórico Total" },
  { clave: "personalizado", label: "Personalizado" },
];

interface DashboardPeriodSelectorProps {
  periodoActual: DashboardPeriodo;
  desdeActual?: string;
  hastaActual?: string;
}

export function DashboardPeriodSelector({
  periodoActual,
  desdeActual = "",
  hastaActual = "",
}: DashboardPeriodSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();

  // Helper para formatear YYYY-MM-DD
  const formatYmd = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const getDefectoDesde = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatYmd(d);
  };

  const getDefectoHasta = () => {
    return formatYmd(new Date());
  };

  // Estado local para respuesta inmediata de la UI
  const [tabSeleccionado, setTabSeleccionado] = React.useState<DashboardPeriodo>(periodoActual);
  const [fechaDesde, setFechaDesde] = React.useState<string>(desdeActual || getDefectoDesde());
  const [fechaHasta, setFechaHasta] = React.useState<string>(hastaActual || getDefectoHasta());

  // Sincronizar cuando cambian los props desde el servidor
  React.useEffect(() => {
    setTabSeleccionado(periodoActual);
    if (desdeActual) setFechaDesde(desdeActual);
    if (hastaActual) setFechaHasta(hastaActual);
  }, [periodoActual, desdeActual, hastaActual]);

  const aplicarRango = (desde: string, hasta: string) => {
    if (!desde) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", "personalizado");
    params.set("desde", desde);
    if (hasta) {
      params.set("hasta", hasta);
    } else {
      params.delete("hasta");
    }

    startTransition(() => {
      router.push(`/panel-admin/dashboard?${params.toString()}`, { scroll: false });
    });
  };

  const handleSeleccionar = (nuevo: DashboardPeriodo) => {
    setTabSeleccionado(nuevo);

    if (nuevo === "personalizado") {
      const d = fechaDesde || getDefectoDesde();
      const h = fechaHasta || getDefectoHasta();
      setFechaDesde(d);
      setFechaHasta(h);

      aplicarRango(d, h);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", nuevo);
    params.delete("desde");
    params.delete("hasta");

    startTransition(() => {
      router.push(`/panel-admin/dashboard?${params.toString()}`, { scroll: false });
    });
  };

  const esPersonalizado = tabSeleccionado === "personalizado";

  return (
    <div className="flex w-full flex-col gap-3 min-w-0">
      {/* Cabecera con selector multilínea (flex-wrap): 100% visible en móvil sin scroll oculto */}
      <div className="flex flex-col gap-2 w-full min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin text-[#1e3a8a] dark:text-blue-400" />
          ) : (
            <Calendar className="size-3.5 text-muted-foreground" />
          )}
          <span>Rango temporal:</span>
        </div>

        {/* Botones de periodo con flex-wrap para que NUNCA se corten en pantallas pequeñas */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full">
          {PERIODOS.map((p) => {
            const activo = tabSeleccionado === p.clave;
            const esBotonPersonalizado = p.clave === "personalizado";

            return (
              <button
                key={p.clave}
                type="button"
                disabled={isPending}
                onClick={() => handleSeleccionar(p.clave)}
                className={cn(
                  "inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer border",
                  activo
                    ? "bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-xs dark:bg-blue-600 dark:border-blue-600"
                    : "bg-slate-100 text-slate-700 border-transparent hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
                  esBotonPersonalizado && !activo && "border-slate-300/80 bg-white dark:bg-slate-900 dark:border-slate-700"
                )}
              >
                {esBotonPersonalizado && (
                  <CalendarRange className="mr-1.5 size-3 text-inherit" />
                )}
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rango Personalizado con DatePicker reutilizado — 100% responsive en móvil */}
      {esPersonalizado && (
        <div className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-800/40 animate-in fade-in duration-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            {/* Campo Desde */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <label className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CalendarRange className="size-3.5 text-[#1e3a8a] dark:text-blue-400" />
                <span>Desde:</span>
              </label>
              <div className="w-full">
                <DatePicker
                  value={fechaDesde}
                  onChange={(val) => setFechaDesde(val)}
                  placeholder="Fecha inicio"
                />
              </div>
            </div>

            {/* Campo Hasta */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <label className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CalendarRange className="size-3.5 text-[#1e3a8a] dark:text-blue-400 sm:invisible" />
                <span>Hasta:</span>
              </label>
              <div className="w-full">
                <DatePicker
                  value={fechaHasta}
                  onChange={(val) => setFechaHasta(val)}
                  placeholder="Fecha fin"
                />
              </div>
            </div>

            {/* Botón Filtrar */}
            <div className="w-full sm:w-auto">
              <Button
                type="button"
                disabled={!fechaDesde || isPending}
                onClick={() => aplicarRango(fechaDesde, fechaHasta)}
                className="w-full sm:w-auto h-10 rounded-xl bg-[#1e3a8a] px-5 text-xs font-bold text-white hover:bg-[#1e3a8a]/90 shadow-xs cursor-pointer"
              >
                <Filter className="mr-1.5 size-3.5" />
                <span>Filtrar</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
