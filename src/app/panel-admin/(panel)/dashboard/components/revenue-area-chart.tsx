"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
} from "@/components/ui/chart";

export interface RevenueDataPoint {
  fecha: string;
  ingresos: number;
  ingresosVirtual?: number;
  ingresosPresencial?: number;
  ordenes: number;
}

interface RevenueAreaChartProps {
  data?: RevenueDataPoint[];
  periodoEtiqueta?: string;
  // Compatibilidad con props anteriores
  data30Days?: RevenueDataPoint[];
  data12Months?: RevenueDataPoint[];
}

const chartConfig = {
  ingresosVirtual: {
    label: "Cursos Virtuales",
    color: "#1e3a8a",
  },
  ingresosPresencial: {
    label: "Talleres Presenciales",
    color: "#14b8a6",
  },
  ingresos: {
    label: "Total Facturado",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

export function RevenueAreaChart({
  data,
  periodoEtiqueta = "Periodo actual",
  data30Days = [],
}: RevenueAreaChartProps) {
  const [vista, setVista] = React.useState<"todos" | "virtual" | "presencial">("todos");

  // Usar data del periodo unificado o fallback
  const datos = data && data.length > 0 ? data : data30Days;
  const total = datos.reduce((acc, curr) => acc + (curr.ingresos || 0), 0);
  const totalVirtual = datos.reduce((acc, curr) => acc + (curr.ingresosVirtual || 0), 0);
  const totalPresencial = datos.reduce((acc, curr) => acc + (curr.ingresosPresencial || 0), 0);
  const totalOrdenes = datos.reduce((acc, curr) => acc + (curr.ordenes || 0), 0);

  return (
    <Card className="rounded-2xl border border-black/8 bg-white shadow-xs sm:rounded-3xl dark:border-white/10 dark:bg-slate-900">
      <CardHeader className="flex flex-col gap-3 p-4 pb-2 sm:flex-row sm:items-center sm:justify-between sm:p-6 sm:pb-2">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-lg">
              Evolución de Ingresos en el Tiempo
            </CardTitle>
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#1e3a8a] dark:bg-blue-950/60 dark:text-blue-300">
              {periodoEtiqueta}
            </span>
          </div>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Facturación desglosada por formato (Cursos Virtuales y Talleres Presenciales).
          </CardDescription>
        </div>

        {/* Selector de Vista (Todos / Virtual / Presencial) */}
        <div className="flex w-full items-center justify-between gap-1 rounded-xl bg-slate-100 p-1 sm:w-auto sm:justify-start dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setVista("todos")}
            className={`flex-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all sm:flex-none sm:px-3 sm:text-xs ${
              vista === "todos"
                ? "bg-white text-[#1e3a8a] shadow-xs dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Ambos Formatos
          </button>
          <button
            type="button"
            onClick={() => setVista("virtual")}
            className={`flex-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all sm:flex-none sm:px-3 sm:text-xs ${
              vista === "virtual"
                ? "bg-white text-[#1e3a8a] shadow-xs dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Solo Virtual
          </button>
          <button
            type="button"
            onClick={() => setVista("presencial")}
            className={`flex-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all sm:flex-none sm:px-3 sm:text-xs ${
              vista === "presencial"
                ? "bg-white text-teal-700 shadow-xs dark:bg-slate-700 dark:text-teal-300"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Solo Presencial
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-1 sm:p-6 sm:pt-2">
        {/* Cifras destacadas del periodo con leyenda */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 sm:text-2xl lg:text-3xl dark:text-white">
              S/{" "}
              {(vista === "virtual"
                ? totalVirtual
                : vista === "presencial"
                ? totalPresencial
                : total
              ).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              en {totalOrdenes} ventas pagadas
            </span>
          </div>

          {/* Leyenda interactiva de colores */}
          <div className="flex items-center gap-3 text-xs">
            {(vista === "todos" || vista === "virtual") && (
              <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                <span className="size-2.5 rounded-full bg-[#1e3a8a]" />
                <span>Cursos: S/ {totalVirtual.toLocaleString("es-PE", { minimumFractionDigits: 0 })}</span>
              </div>
            )}
            {(vista === "todos" || vista === "presencial") && (
              <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                <span className="size-2.5 rounded-full bg-[#14b8a6]" />
                <span>Talleres: S/ {totalPresencial.toLocaleString("es-PE", { minimumFractionDigits: 0 })}</span>
              </div>
            )}
          </div>
        </div>

        {datos.length === 0 || total === 0 ? (
          <div className="flex h-[200px] w-full items-center justify-center rounded-2xl bg-slate-50/50 text-xs font-medium text-slate-400 sm:h-[280px] dark:bg-slate-800/40">
            Aún no hay compras registradas en este periodo seleccionado.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[210px] w-full sm:h-[280px]">
            <AreaChart
              data={datos}
              margin={{ top: 10, right: 10, left: 4, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillVirtual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fillPresencial" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="fecha"
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                minTickGap={16}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                width={56}
                tick={{ fontSize: 10 }}
                tickFormatter={(val) =>
                  val === 0 ? "0" : `S/\u00A0${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`
                }
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload as RevenueDataPoint;
                  return (
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                      <p className="mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                        {item.fecha}
                      </p>
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                            <span className="size-2 rounded-full bg-[#1e3a8a]" />
                            Cursos:
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            S/ {(item.ingresosVirtual || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                            <span className="size-2 rounded-full bg-[#14b8a6]" />
                            Talleres:
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            S/ {(item.ingresosPresencial || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-4 border-t border-slate-100 pt-1 font-bold dark:border-slate-800">
                          <span className="text-slate-800 dark:text-slate-200">Total Día:</span>
                          <span className="font-mono text-[#1e3a8a] dark:text-blue-400">
                            S/ {(item.ingresos || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {item.ordenes} {item.ordenes === 1 ? "orden confirmada" : "órdenes confirmadas"}
                        </p>
                      </div>
                    </div>
                  );
                }}
              />

              {/* Áreas según la vista seleccionada */}
              {vista === "todos" && (
                <>
                  <Area
                    dataKey="ingresosVirtual"
                    type="monotone"
                    stackId="1"
                    stroke="#1e3a8a"
                    strokeWidth={2}
                    fill="url(#fillVirtual)"
                  />
                  <Area
                    dataKey="ingresosPresencial"
                    type="monotone"
                    stackId="1"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    fill="url(#fillPresencial)"
                  />
                </>
              )}

              {vista === "virtual" && (
                <Area
                  dataKey="ingresosVirtual"
                  type="monotone"
                  stroke="#1e3a8a"
                  strokeWidth={2.5}
                  fill="url(#fillVirtual)"
                />
              )}

              {vista === "presencial" && (
                <Area
                  dataKey="ingresosPresencial"
                  type="monotone"
                  stroke="#14b8a6"
                  strokeWidth={2.5}
                  fill="url(#fillPresencial)"
                />
              )}
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
