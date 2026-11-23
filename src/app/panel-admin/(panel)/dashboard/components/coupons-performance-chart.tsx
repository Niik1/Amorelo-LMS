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

export interface CouponPerformancePoint {
  codigo: string;
  usos: number;
  porcentaje: number;
  ahorro: number;
}

interface CouponsPerformanceChartProps {
  data?: CouponPerformancePoint[];
}

const chartConfig = {
  usos: {
    label: "Veces Canjeado",
    color: "#f59e0b",
  },
} satisfies ChartConfig;

export function CouponsPerformanceChart({ data = [] }: CouponsPerformanceChartProps) {
  const totalUsos = data.reduce((acc, curr) => acc + curr.usos, 0);

  return (
    <Card className="rounded-3xl border border-black/8 bg-white shadow-xs dark:border-white/10 dark:bg-slate-900">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-lg">
            Uso de Cupones Promocionales
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Cupones canjeados en el checkout procedentes de la base de datos.
          </CardDescription>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Canjes</span>
          <p className="font-mono text-lg font-black text-amber-600 dark:text-amber-400">
            {totalUsos}
          </p>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {data.length === 0 ? (
          <div className="flex h-[280px] w-full items-center justify-center rounded-2xl bg-slate-50/50 text-xs font-medium text-slate-400 dark:bg-slate-800/40">
            No se han registrado cupones activos o con canjes.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="codigo"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11, fontWeight: 700 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(val, name, item) => (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                            {item.payload.codigo}
                          </span>
                          <span className="text-xs text-slate-400">
                            ({item.payload.porcentaje}% desc.)
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {val} {Number(val) === 1 ? "canje" : "canjes"}
                          </span>
                          {item.payload.ahorro > 0 && (
                            <span className="text-slate-500">
                              Descuento: S/ {Number(item.payload.ahorro).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  />
                }
              />
              <Bar
                dataKey="usos"
                fill="#f59e0b"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
