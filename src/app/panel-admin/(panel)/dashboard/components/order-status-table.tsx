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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight, CheckCircle2, Clock, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OrderStatusRow {
  estado: string;
  label: string;
  cantidad: number;
  monto: number;
  porcentaje: number;
  color: string;
}

interface OrderStatusTableProps {
  data?: OrderStatusRow[];
}

const BADGE_STYLES: Record<string, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  pagada: {
    bg: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-700 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  parcial: {
    bg: "bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800",
    text: "text-sky-700 dark:text-sky-300",
    icon: Clock,
  },
  pendiente: {
    bg: "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-300",
    icon: Clock,
  },
  expirada: {
    bg: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
    text: "text-slate-600 dark:text-slate-400",
    icon: XCircle,
  },
  cancelada: {
    bg: "bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800",
    text: "text-rose-700 dark:text-rose-300",
    icon: XCircle,
  },
  reembolsada: {
    bg: "bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800",
    text: "text-purple-700 dark:text-purple-300",
    icon: RefreshCw,
  },
};

export function OrderStatusTable({ data = [] }: OrderStatusTableProps) {
  const totalCantidad = data.reduce((acc, curr) => acc + curr.cantidad, 0);
  const totalMonto = data.reduce((acc, curr) => acc + curr.monto, 0);

  return (
    <Card className="rounded-2xl border border-black/8 bg-white shadow-xs sm:rounded-3xl dark:border-white/10 dark:bg-slate-900">
      <CardHeader className="flex flex-col gap-2 p-4 pb-3 sm:flex-row sm:items-center sm:justify-between sm:p-6 sm:pb-4">
        <div>
          <CardTitle className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-lg">
            Resumen de Estados de Órdenes
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Distribución operativa y financiera de las órdenes registradas en el sistema.
          </CardDescription>
        </div>

        <Link
          href="/panel-admin/ordenes"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1A73E8] hover:underline dark:text-blue-400"
        >
          <span>Gestionar órdenes completas</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        {data.length === 0 ? (
          <div className="flex h-32 w-full items-center justify-center rounded-2xl bg-slate-50/50 text-xs font-medium text-slate-400 dark:bg-slate-800/40">
            Aún no se han registrado órdenes en la plataforma.
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-slate-100 hover:bg-transparent dark:border-slate-800">
                  <TableHead className="px-2 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:px-4 sm:py-3 sm:text-xs dark:text-slate-400">
                    Estado
                  </TableHead>
                  <TableHead className="px-2 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:px-4 sm:py-3 sm:text-xs dark:text-slate-400">
                    <span className="sm:hidden">Cant. / %</span>
                    <span className="hidden sm:inline">Cantidad</span>
                  </TableHead>
                  <TableHead className="hidden px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500 sm:table-cell dark:text-slate-400">
                    Distribución
                  </TableHead>
                  <TableHead className="px-2 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:px-4 sm:py-3 sm:text-xs dark:text-slate-400">
                    Monto Asociado
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => {
                  const style = BADGE_STYLES[row.estado] ?? {
                    bg: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
                    text: "text-slate-600 dark:text-slate-400",
                    icon: AlertCircle,
                  };
                  const Icon = style.icon;

                  return (
                    <TableRow
                      key={row.estado}
                      className="border-b border-slate-100 transition-colors hover:bg-slate-50/60 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                    >
                      {/* Estado con Badge */}
                      <TableCell className="px-2 py-2.5 sm:px-4 sm:py-3 font-medium">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-bold sm:gap-1.5 sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-xs",
                            style.bg,
                            style.text
                          )}
                        >
                          <Icon className="size-3 sm:size-3.5 shrink-0" />
                          <span>{row.label}</span>
                        </span>
                      </TableCell>

                      {/* Cantidad de Órdenes */}
                      <TableCell className="px-2 py-2.5 text-right font-mono sm:px-4 sm:py-3">
                        <span className="text-xs font-bold text-slate-900 sm:text-sm dark:text-white">
                          {row.cantidad}
                        </span>
                        <span className="block text-[10px] font-medium text-slate-400 sm:hidden">
                          {row.porcentaje}%
                        </span>
                      </TableCell>

                      {/* Porcentaje y Mini Barra (Solo Desktop/Tablet) */}
                      <TableCell className="hidden px-4 py-3 text-right sm:table-cell">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.max(row.porcentaje, 6)}%`,
                                backgroundColor: row.color,
                              }}
                            />
                          </div>
                          <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                            {row.porcentaje}%
                          </span>
                        </div>
                      </TableCell>

                      {/* Monto Asociado */}
                      <TableCell className="px-2 py-2.5 text-right font-mono text-xs font-black text-slate-900 sm:px-4 sm:py-3 sm:text-xs dark:text-white">
                        S/ {row.monto.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Fila de Totales */}
                <TableRow className="border-t-2 border-slate-200 bg-slate-50/50 font-bold dark:border-slate-700 dark:bg-slate-800/50">
                  <TableCell className="px-2 py-2.5 text-[11px] uppercase tracking-wider text-slate-700 sm:px-4 sm:py-3 sm:text-xs dark:text-slate-300">
                    Total
                  </TableCell>
                  <TableCell className="px-2 py-2.5 text-right font-mono text-xs font-black text-slate-900 sm:px-4 sm:py-3 sm:text-sm dark:text-white">
                    {totalCantidad}
                    <span className="block text-[10px] font-normal text-slate-400 sm:hidden">
                      100%
                    </span>
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 text-right font-mono text-xs font-bold text-slate-700 sm:table-cell dark:text-slate-300">
                    100%
                  </TableCell>
                  <TableCell className="px-2 py-2.5 text-right font-mono text-xs font-black text-[#1e3a8a] sm:px-4 sm:py-3 sm:text-sm dark:text-blue-400">
                    S/ {totalMonto.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
