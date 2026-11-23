import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

export interface KpiCardProps {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  icono: React.ComponentType<{ className?: string }>;
  tono?: "blue" | "emerald" | "amber" | "indigo" | "rose" | "purple";
  valorClassName?: string;
  className?: string;
  tendencia?: {
    valor: string;
    positivo?: boolean;
    texto?: string;
  };
  badge?: string;
  href?: string;
}

const TILE_STYLES: Record<
  NonNullable<KpiCardProps["tono"]>,
  { tile: string; icon: string; border: string }
> = {
  blue: {
    tile: "bg-blue-50 text-[#1e3a8a] dark:bg-blue-950/50 dark:text-blue-300",
    icon: "text-[#1A73E8] dark:text-blue-400",
    border: "group-hover:border-blue-200 dark:group-hover:border-blue-900",
  },
  emerald: {
    tile: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    icon: "text-emerald-600 dark:text-emerald-400",
    border: "group-hover:border-emerald-200 dark:group-hover:border-emerald-900",
  },
  amber: {
    tile: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    icon: "text-amber-500 dark:text-amber-400",
    border: "group-hover:border-amber-200 dark:group-hover:border-amber-900",
  },
  indigo: {
    tile: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
    icon: "text-indigo-600 dark:text-indigo-400",
    border: "group-hover:border-indigo-200 dark:group-hover:border-indigo-900",
  },
  rose: {
    tile: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
    icon: "text-rose-600 dark:text-rose-400",
    border: "group-hover:border-rose-200 dark:group-hover:border-rose-900",
  },
  purple: {
    tile: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
    icon: "text-purple-600 dark:text-purple-400",
    border: "group-hover:border-purple-200 dark:group-hover:border-purple-900",
  },
};

export function KpiCard({
  titulo,
  valor,
  subtitulo,
  icono: Icon,
  tono = "blue",
  valorClassName,
  className,
  tendencia,
  badge,
  href,
}: KpiCardProps) {
  const estiloTono = TILE_STYLES[tono] ?? TILE_STYLES.blue;

  const content = (
    <div
      className={cn(
        "group relative flex min-h-[140px] flex-col justify-between overflow-hidden rounded-2xl border border-black/8 bg-white p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:min-h-0 sm:p-5 dark:border-white/10 dark:bg-slate-900/90",
        estiloTono.border,
        className
      )}
    >
      <div>
        {/* Cabecera: Título + Badge / Ícono */}
        <div className="flex items-start justify-between gap-1.5 sm:gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[9.5px] font-bold uppercase tracking-wider text-slate-500 sm:text-[11px] dark:text-slate-400">
              {titulo}
            </span>
            {badge && (
              <span className="inline-flex w-fit max-w-full truncate rounded-full bg-slate-100 px-1.5 py-0.5 text-[8.5px] font-semibold text-slate-600 sm:text-[10px] dark:bg-slate-800 dark:text-slate-300">
                {badge}
              </span>
            )}
          </div>
          <div
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-lg shadow-xs transition-transform duration-200 group-hover:scale-105 sm:size-10 sm:rounded-xl",
              estiloTono.tile
            )}
          >
            <Icon className={cn("size-3.5 sm:size-5", estiloTono.icon)} />
          </div>
        </div>

        {/* Cifra Principal */}
        <div
          className={cn(
            "mt-2 text-lg font-black tracking-tight text-slate-900 sm:mt-3 sm:text-2xl lg:text-3xl dark:text-white truncate",
            valorClassName
          )}
        >
          {valor}
        </div>
      </div>

      {/* Pie de la tarjeta: Tendencia y/o Subtítulo */}
      {(tendencia || subtitulo) && (
        <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-slate-100 pt-2 sm:mt-3 sm:gap-2 sm:pt-3 dark:border-slate-800/80">
          {tendencia && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-bold sm:gap-1 sm:rounded-md sm:px-1.5 sm:text-xs",
                tendencia.positivo !== false
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
              )}
            >
              {tendencia.positivo !== false ? (
                <TrendingUp className="size-3 sm:size-3.5" />
              ) : (
                <TrendingDown className="size-3 sm:size-3.5" />
              )}
              {tendencia.valor}
            </span>
          )}
          {subtitulo && (
            <p className="truncate text-[9.5px] font-medium text-slate-500 sm:text-xs dark:text-slate-400">
              {tendencia?.texto ? tendencia.texto : subtitulo}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-hidden">
        {content}
      </Link>
    );
  }

  return content;
}
