"use client";

import * as React from "react";
import { Cell, Pie, PieChart } from "recharts";
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

export interface OrderStatusPoint {
  estado: string;
  label: string;
  cantidad: number;
  color: string;
}

interface OrderStatusChartProps {
  data?: OrderStatusPoint[];
}

const chartConfig = {
  pagada: { label: "Pagadas", color: "#16a34a" },
  parcial: { label: "Con Adelanto", color: "#0ea5e9" },
  pendiente: { label: "Pendientes", color: "#f59e0b" },
  expirada: { label: "Expiradas", color: "#94a3b8" },
  cancelada: { label: "Canceladas", color: "#ef4444" },
  reembolsada: { label: "Reembolsadas", color: "#a855f7" },
} satisfies ChartConfig;

export function OrderStatusChart({ data = [] }: OrderStatusChartProps) {
  const total = data.reduce((acc, curr) => acc + curr.cantidad, 0);

  return (
    <Card className="flex flex-col rounded-3xl border border-black/8 bg-white shadow-xs dark:border-white/10 dark:bg-slate-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-lg">
          Estado de Órdenes
        </CardTitle>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
          Proporción de órdenes pagadas frente a pendientes y expiradas.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between pt-2">
        {total === 0 ? (
          <div className="flex h-[220px] w-full items-center justify-center rounded-2xl bg-slate-50/50 text-xs font-medium text-slate-400 dark:bg-slate-800/40">
            Aún no hay órdenes registradas.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[220px]">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(val, name, item) => (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.payload.label}
                        </span>
                        <span className="text-xs text-slate-500">
                          {val} órdenes ({((Number(val) / total) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Pie
                data={data}
                dataKey="cantidad"
                nameKey="estado"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                stroke="transparent"
              >
                {data.map((entry) => (
                  <Cell key={entry.estado} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}

        {/* Leyenda en 2 columnas */}
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          {data.map((item) => (
            <div key={item.estado} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 truncate">
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate text-slate-600 dark:text-slate-300 font-medium">
                  {item.label}
                </span>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-white ml-2">
                {item.cantidad}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
