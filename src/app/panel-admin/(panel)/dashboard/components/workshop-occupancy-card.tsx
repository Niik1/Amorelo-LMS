"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, CalendarDays, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WorkshopOccupancyItem {
  id: string;
  nombre: string;
  fecha: string;
  cuposTotales: number;
  ocupados: number;
  disponibles: number;
  porcentaje: number;
  estado: string;
}

interface WorkshopOccupancyCardProps {
  data?: WorkshopOccupancyItem[];
}

export function WorkshopOccupancyCard({ data = [] }: WorkshopOccupancyCardProps) {
  const talleresVisibles = data.slice(0, 4);
  const totalCupos = data.reduce((acc, curr) => acc + curr.cuposTotales, 0);
  const totalOcupados = data.reduce((acc, curr) => acc + curr.ocupados, 0);
  const porcentajeGlobal = totalCupos > 0 ? Math.round((totalOcupados / totalCupos) * 100) : 0;

  return (
    <Card className="rounded-2xl border border-black/8 bg-white shadow-xs sm:rounded-3xl dark:border-white/10 dark:bg-slate-900 flex flex-col justify-between">
      <CardHeader className="flex flex-col gap-2 p-4 pb-3 sm:flex-row sm:items-center sm:justify-between sm:p-6 sm:pb-3">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-lg">
              Aforo en Talleres Presenciales
            </CardTitle>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-bold",
                porcentajeGlobal >= 80
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                  : porcentajeGlobal >= 50
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                  : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
              )}
            >
              {porcentajeGlobal}% Aforo Total
            </span>
          </div>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Control de reservas pagadas y disponibilidad en tiempo real.
          </CardDescription>
        </div>

        <Link
          href="/panel-admin/talleres"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#1A73E8] hover:underline dark:text-blue-400"
        >
          <span>Gestionar talleres</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="flex-1 p-4 pt-1 sm:p-6 sm:pt-2">
        {data.length === 0 ? (
          <div className="flex h-[200px] w-full items-center justify-center rounded-2xl bg-slate-50/50 text-xs font-medium text-slate-400 dark:bg-slate-800/40">
            Aún no hay talleres presenciales configurados en la plataforma.
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {talleresVisibles.map((taller) => {
              const fechaFormateada = taller.fecha
                ? new Date(taller.fecha).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "Fecha por definir";

              const colorBarra =
                taller.porcentaje >= 85
                  ? "bg-emerald-500"
                  : taller.porcentaje >= 50
                  ? "bg-amber-500"
                  : "bg-[#14b8a6]";

              return (
                <div
                  key={taller.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:border-slate-200 dark:border-slate-800/80 dark:bg-slate-800/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                        {taller.nombre}
                      </h4>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                        <CalendarDays className="size-3 text-slate-400" />
                        <span>{fechaFormateada}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                        {taller.ocupados}/{taller.cuposTotales}
                      </span>
                      <p className="text-[10px] font-medium text-slate-400">
                        {taller.disponibles} libres
                      </p>
                    </div>
                  </div>

                  {/* Barra de Progreso de Ocupación */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", colorBarra)}
                        style={{ width: `${Math.min(100, Math.max(taller.porcentaje, 4))}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300 w-9 text-right">
                      {taller.porcentaje}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
