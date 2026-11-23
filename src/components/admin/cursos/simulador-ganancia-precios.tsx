"use client";

import { useState } from "react";
import { TrendingUp, Wallet, ShieldCheck, Tag, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type CuponSimple = {
  id: string;
  codigo: string;
  porcentaje: number;
};

interface SimuladorGananciaPreciosProps {
  precioPen: string | number;
  precioUsd: string | number;
  cupones: CuponSimple[];
}

/**
 * Calcula la comisión de Mercado Pago en Perú para cobro en línea:
 * Tasa estándar: 3.49% + S/ 1.00 (+ 18% IGV sobre comisiones)
 */
export function calcularComisionMercadoPago(montoPen: number): {
  comisionTotal: number;
  gananciaNeta: number;
} {
  if (montoPen <= 0 || isNaN(montoPen)) {
    return { comisionTotal: 0, gananciaNeta: 0 };
  }

  const comisionBase = montoPen * 0.0349 + 1.0;
  const comisionTotal = Math.round(comisionBase * 1.18 * 100) / 100;
  const gananciaNeta = Math.max(0, Math.round((montoPen - comisionTotal) * 100) / 100);

  return { comisionTotal, gananciaNeta };
}

export function SimuladorGananciaPrecios({
  precioPen,
  precioUsd,
  cupones,
}: SimuladorGananciaPreciosProps) {
  const [moneda, setMoneda] = useState<"PEN" | "USD">("PEN");

  const numPen = typeof precioPen === "string" ? parseFloat(precioPen) || 0 : precioPen || 0;
  const numUsd = typeof precioUsd === "string" ? parseFloat(precioUsd) || 0 : precioUsd || 0;

  const { comisionTotal: comisionRegularPen, gananciaNeta: gananciaRegularPen } =
    calcularComisionMercadoPago(numPen);

  return (
    <div className="flex flex-col gap-2.5 sm:gap-3">
      {/* Cabecera del Simulador */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-6 sm:size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="size-3.5 sm:size-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-bold text-heading block leading-tight">
              Margen y Ganancia Neta
            </span>
            <span className="text-[11px] sm:text-xs text-muted-foreground block">
              Simulador financiero en vivo
            </span>
          </div>
        </div>

        {/* Toggle Moneda PEN / USD */}
        <div className="w-full grid grid-cols-2 sm:w-auto sm:inline-flex rounded-lg bg-muted p-0.5 sm:p-1 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setMoneda("PEN")}
            className={cn(
              "rounded-md px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-bold transition-colors cursor-pointer text-center",
              moneda === "PEN"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Soles (PEN)
          </button>
          <button
            type="button"
            onClick={() => setMoneda("USD")}
            className={cn(
              "rounded-md px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-bold transition-colors cursor-pointer text-center",
              moneda === "USD"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Dólares (USD)
          </button>
        </div>
      </div>

      {/* Contenido del Simulador */}
      <div className="flex flex-col gap-2.5 sm:gap-3">
        {moneda === "PEN" ? (
          <>
            {/* Escenario 1: Precio Regular Sin Cupón */}
            <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-xs space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-heading">Precio Regular (Sin Cupón)</span>
                <span className="text-sm sm:text-base font-black text-foreground tabular-nums">
                  S/ {numPen.toFixed(2)}
                </span>
              </div>

              <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm border-t border-border/60 pt-1.5 sm:pt-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground font-medium text-xs">Comisión Mercado Pago:</span>
                  <span className="font-bold text-rose-500 whitespace-nowrap tabular-nums shrink-0 text-xs sm:text-sm">
                    - S/ {comisionRegularPen.toFixed(2)}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground/80 leading-tight">
                  Tasa estándar (~3.49% + S/ 1.00 + 18% IGV)
                </div>
                <div className="flex items-center justify-between font-bold pt-1 sm:pt-1.5 border-t border-dashed border-border/60">
                  <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 text-xs sm:text-sm">
                    <Wallet className="size-3.5 sm:size-4" />
                    <span>Tu Ganancia Neta:</span>
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 text-sm sm:text-base font-black tabular-nums">
                    S/ {gananciaRegularPen.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Escenario 2..N: Cupones de Descuento Activos con Scroll Exclusivo */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <Tag className="size-3 sm:size-3.5 text-icon-accent" />
                <span>Impacto de Cupones Activos ({cupones.length})</span>
              </div>

              {cupones.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-2.5 text-center text-xs text-muted-foreground">
                  No hay cupones activos vigentes en este momento.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[135px] sm:max-h-[150px] lg:max-h-[140px] xl:max-h-[180px] overflow-y-auto pr-1">
                  {cupones.map((cup) => {
                    const descFactor = Math.max(0, 1 - cup.porcentaje / 100);
                    const precioDescontado = Math.round(numPen * descFactor * 100) / 100;
                    const { comisionTotal: comisionCup, gananciaNeta: gananciaCup } =
                      calcularComisionMercadoPago(precioDescontado);

                    return (
                      <div
                        key={cup.id}
                        className="rounded-xl border border-border bg-muted/30 p-2 sm:p-2.5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-icon-accent text-[11px] bg-icon-accent-soft px-1.5 py-0.5 rounded-md">
                            {cup.codigo} (-{cup.porcentaje}%)
                          </span>
                          <div className="text-right">
                            <span className="text-[11px] text-muted-foreground line-through mr-1.5 tabular-nums">
                              S/ {numPen.toFixed(2)}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-foreground tabular-nums">
                              S/ {precioDescontado.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Comisión MP:</span>
                          <span className="text-rose-500 font-semibold tabular-nums whitespace-nowrap">
                            - S/ {comisionCup.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-border/60">
                          <span className="text-emerald-700 dark:text-emerald-400">
                            Te quedan limpios:
                          </span>
                          <span className="text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-black tabular-nums">
                            S/ {gananciaCup.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Vista en Dólares (USD) */
          <>
            <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-xs space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-heading">Precio Regular (Sin Cupón)</span>
                <span className="text-sm sm:text-base font-black text-foreground tabular-nums">
                  $ {numUsd.toFixed(2)}
                </span>
              </div>

              <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm border-t border-border/60 pt-1.5 sm:pt-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground truncate">Pasarela Mercado Pago:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0">
                    No aplica (Cobro directo)
                  </span>
                </div>
                <div className="flex items-center justify-between font-bold pt-1 sm:pt-1.5 border-t border-dashed border-border/60">
                  <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 text-xs sm:text-sm">
                    <Wallet className="size-3.5 sm:size-4" />
                    <span>Tu Ganancia Neta:</span>
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 text-sm sm:text-base font-black tabular-nums">
                    $ {numUsd.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <Tag className="size-3 sm:size-3.5 text-icon-accent" />
                <span>Impacto de Cupones Activos ({cupones.length})</span>
              </div>

              {cupones.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-2.5 text-center text-xs text-muted-foreground">
                  No hay cupones activos vigentes en este momento.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[135px] sm:max-h-[150px] lg:max-h-[140px] xl:max-h-[180px] overflow-y-auto pr-1">
                  {cupones.map((cup) => {
                    const descFactor = Math.max(0, 1 - cup.porcentaje / 100);
                    const precioDescontado = Math.round(numUsd * descFactor * 100) / 100;

                    return (
                      <div
                        key={cup.id}
                        className="rounded-xl border border-border bg-muted/30 p-2 sm:p-2.5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-icon-accent text-[11px] bg-icon-accent-soft px-1.5 py-0.5 rounded-md">
                            {cup.codigo} (-{cup.porcentaje}%)
                          </span>
                          <div className="text-right">
                            <span className="text-[11px] text-muted-foreground line-through mr-1.5 tabular-nums">
                              $ {numUsd.toFixed(2)}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-foreground tabular-nums">
                              $ {precioDescontado.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-border/60">
                          <span className="text-emerald-700 dark:text-emerald-400">
                            Te quedan limpios:
                          </span>
                          <span className="text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-black tabular-nums">
                            $ {precioDescontado.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Nota aclaratoria al pie */}
      <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-2 sm:p-2.5 text-[11px] sm:text-xs text-muted-foreground border border-border/50">
        <Info className="size-3.5 sm:size-4 shrink-0 text-icon-accent mt-0.5" />
        <p className="leading-relaxed">
          La comisión de Mercado Pago Perú (~3.49% + S/ 1.00 + IGV) aplica únicamente a pagos en Soles (PEN). En Dólares (USD) se recibe el importe directo de la pasarela internacional.
        </p>
      </div>
    </div>
  );
}
