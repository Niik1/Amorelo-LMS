"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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

export interface TopProductPoint {
  item: string;
  ingresos: number;
  unidades: number;
  tipo: string;
}

interface TopProductsChartProps {
  data?: TopProductPoint[];
}

const chartConfig = {
  ingresos: {
    label: "Ingresos (S/)",
    color: "#1e3a8a",
  },
} satisfies ChartConfig;

export function TopProductsChart({ data = [] }: TopProductsChartProps) {
  return (
    <Card className="rounded-2xl border border-black/8 bg-white shadow-xs sm:rounded-3xl dark:border-white/10 dark:bg-slate-900 flex flex-col justify-between">
      <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
        <CardTitle className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-lg">
          Top Productos Más Vendidos
        </CardTitle>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
          Cursos y talleres clasificados por facturación y demanda real.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 p-4 pt-1 sm:p-6 sm:pt-2">
        {data.length === 0 ? (
          <div className="flex h-[200px] w-full items-center justify-center rounded-2xl bg-slate-50/50 text-xs font-medium text-slate-400 sm:h-[260px] dark:bg-slate-800/40">
            Aún no hay compras registradas para calcular el ranking de productos.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[210px] w-full sm:h-[260px]">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `S/ ${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                type="category"
                dataKey="item"
                tickLine={false}
                axisLine={false}
                width={130}
                tick={{ fontSize: 10 }}
                tickFormatter={(val) => (val.length > 16 ? `${val.slice(0, 16)}…` : val)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(val, name, item) => (
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.payload.item} ({item.payload.tipo})
                        </span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-mono text-[#1e3a8a] dark:text-blue-400 font-bold">
                            S/ {Number(val).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-slate-400">
                            {item.payload.unidades} {item.payload.unidades === 1 ? "inscripción" : "inscripciones"}
                          </span>
                        </div>
                      </div>
                    )}
                  />
                }
              />
              <Bar
                dataKey="ingresos"
                fill="#1e3a8a"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
