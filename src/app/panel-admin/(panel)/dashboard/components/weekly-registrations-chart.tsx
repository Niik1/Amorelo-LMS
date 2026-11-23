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

export interface WeeklyRegistrationPoint {
  semana: string;
  matriculas: number;
}

interface WeeklyRegistrationsChartProps {
  data?: WeeklyRegistrationPoint[];
}

const chartConfig = {
  matriculas: {
    label: "Nuevas Matrículas",
    color: "#7c3aed",
  },
} satisfies ChartConfig;

export function WeeklyRegistrationsChart({ data = [] }: WeeklyRegistrationsChartProps) {
  const totalMatriculas = data.reduce((acc, curr) => acc + curr.matriculas, 0);

  return (
    <Card className="rounded-3xl border border-black/8 bg-white shadow-xs dark:border-white/10 dark:bg-slate-900">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-lg">
            Nuevas Matrículas por Semana
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Ritmo semanal de incorporación de nuevos alumnos al aula virtual.
          </CardDescription>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Mes</span>
          <p className="font-mono text-lg font-black text-purple-600 dark:text-purple-400">
            {totalMatriculas}
          </p>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="semana"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12, fontWeight: 600 }}
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
                  formatter={(val) => (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Matrículas confirmadas:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{val} alumnos</span>
                    </div>
                  )}
                />
              }
            />
            <Bar
              dataKey="matriculas"
              fill="#7c3aed"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
