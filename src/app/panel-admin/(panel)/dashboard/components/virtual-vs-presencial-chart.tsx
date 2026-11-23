"use client";

import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BookOpen, CalendarDays } from "lucide-react";

export interface VirtualVsPresencialPoint {
  tipo: string;
  nombre: string;
  ingresos: number;
  ordenesCount: number;
  porcentaje: number;
  color: string;
}

interface VirtualVsPresencialChartProps {
  data?: VirtualVsPresencialPoint[];
  periodoEtiqueta?: string;
}

const chartConfig = {
  virtual: {
    label: "Cursos Virtuales",
    color: "#1e3a8a",
  },
  presencial: {
    label: "Talleres Presenciales",
    color: "#14b8a6",
  },
} satisfies ChartConfig;

export function VirtualVsPresencialChart({
  data = [],
  periodoEtiqueta,
}: VirtualVsPresencialChartProps) {
  const total = data.reduce((acc, curr) => acc + curr.ingresos, 0);
  const totalOrdenes = data.reduce((acc, curr) => acc + curr.ordenesCount, 0);

  const virtual = data.find((d) => d.tipo === "virtual") || {
    ingresos: 0,
    ordenesCount: 0,
    porcentaje: 0,
  };
  const presencial = data.find((d) => d.tipo === "presencial") || {
    ingresos: 0,
    ordenesCount: 0,
    porcentaje: 0,
  };

  return (
    <Card className="flex h-full flex-col justify-between rounded-2xl border border-black/8 bg-white shadow-xs sm:rounded-3xl dark:border-white/10 dark:bg-slate-900">
      <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                Virtual vs Presencial
              </CardTitle>
              {periodoEtiqueta && (
                <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                  {periodoEtiqueta}
                </span>
              )}
            </div>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Comparativa de ingresos y volumen por formato.
            </CardDescription>
          </div>
          <span className="font-mono text-xs font-bold text-slate-400">
            {totalOrdenes} ventas
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between p-4 pt-1 sm:p-6 sm:pt-2">
        {total === 0 ? (
          <div className="flex h-[200px] w-full items-center justify-center rounded-2xl bg-slate-50/50 text-xs font-medium text-slate-400 sm:h-[280px] dark:bg-slate-800/40">
            Aún no hay compras registradas para comparar formatos.
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Gráfico circular Donut proporcionado para móvil y desktop */}
            <div className="relative h-[180px] w-full sm:h-[210px]">
              <ChartContainer config={chartConfig} className="mx-auto h-[180px] w-full sm:h-[210px]">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(val, name, item) => (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-800 dark:text-slate-100">
                              {item.payload.nombre}
                            </span>
                            <span className="text-xs text-slate-500">
                              S/ {Number(val).toLocaleString("es-PE", { minimumFractionDigits: 2 })} ({item.payload.porcentaje}%)
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {item.payload.ordenesCount} órdenes confirmadas
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Pie
                    data={data}
                    dataKey="ingresos"
                    nameKey="tipo"
                    innerRadius={56}
                    outerRadius={80}
                    paddingAngle={4}
                    stroke="transparent"
                  >
                    {data.map((entry) => (
                      <Cell key={entry.tipo} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>

              {/* Etiqueta Central del Donut */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">
                  Total Recaudado
                </span>
                <span className="font-mono text-sm font-black text-slate-900 sm:text-lg dark:text-white">
                  S/ {total.toLocaleString("es-PE", { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Gráfico de Barras Comparativas de Distribución */}
            <div className="mt-3 flex w-full flex-col gap-3 border-t border-slate-100 pt-3 sm:mt-4 sm:gap-3.5 sm:pt-4 dark:border-slate-800">
              {/* Barra: Cursos Virtuales */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <BookOpen className="size-3.5 text-[#1e3a8a] dark:text-blue-400" />
                    <span>Cursos Virtuales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                      S/ {virtual.ingresos.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                      {virtual.porcentaje}%
                    </span>
                  </div>
                </div>
                {/* Barra de progreso visual */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-[#1e3a8a] transition-all duration-500"
                    style={{ width: `${Math.max(virtual.porcentaje, 4)}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-400">
                  {virtual.ordenesCount} {virtual.ordenesCount === 1 ? "inscripción virtual" : "inscripciones virtuales"}
                </span>
              </div>

              {/* Barra: Talleres Presenciales */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <CalendarDays className="size-3.5 text-[#14b8a6] dark:text-teal-400" />
                    <span>Talleres Presenciales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                      S/ {presencial.ingresos.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                      {presencial.porcentaje}%
                    </span>
                  </div>
                </div>
                {/* Barra de progreso visual */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-[#14b8a6] transition-all duration-500"
                    style={{ width: `${Math.max(presencial.porcentaje, 4)}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-400">
                  {presencial.ordenesCount} {presencial.ordenesCount === 1 ? "cupo en taller" : "cupos en talleres"}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
