// Tarjeta de precio: selector PEN/USD y CTA. Los importes llegan ya
// calculados desde el servidor; acá solo se elige moneda y se formatea.
// Enteros sin decimales; con decimales cuando el importe los tenga.

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/public/button";
import { CtaWhatsApp } from "@/components/public/cta-whatsapp";
import { whatsappUrl } from "@/lib/config/site";

type Moneda = "PEN" | "USD";

export type PrecioCardProps = {
  precioListaPen: number;
  precioFinalPen: number;
  precioListaUsd: number | null;
  precioFinalUsd: number | null;
  ahorroPen: number;
  ahorroUsd: number;
  /*porCursoPen: number | null;
  porCursoUsd: number | null;*/
  descuentoTexto: string | null;
  cursoSlug?: string;
};

function formatear(valor: number, moneda: Moneda): string {
  return new Intl.NumberFormat(moneda === "PEN" ? "es-PE" : "en-US", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: Number.isInteger(valor) ? 0 : 2,
  }).format(valor);
}

export function PrecioCard({
  precioListaPen,
  precioFinalPen,
  precioListaUsd,
  precioFinalUsd,
  ahorroPen,
  ahorroUsd,
  /*porCursoPen,
  porCursoUsd,*/
  descuentoTexto,
  cursoSlug,
}: PrecioCardProps) {
  const [moneda, setMoneda] = useState<Moneda>("PEN");

  const usdDisponible = precioListaUsd !== null && precioFinalUsd !== null;
  const esUsd = moneda === "USD" && usdDisponible;

  const lista = esUsd ? (precioListaUsd ?? precioListaPen) : precioListaPen;
  const final = esUsd ? (precioFinalUsd ?? precioFinalPen) : precioFinalPen;
  const ahorro = esUsd ? ahorroUsd : ahorroPen;
  /*const porCurso = esUsd ? porCursoUsd : porCursoPen;*/
  const monedaActiva: Moneda = esUsd ? "USD" : "PEN";
  const hayDescuento = descuentoTexto !== null && ahorro > 0;

  return (
    <div className="relative z-10 rounded-[2rem] bg-white p-6 pt-9 shadow-[0_24px_70px_-30px_rgba(31,58,110,0.45)] sm:p-8 sm:pt-10">
      {descuentoTexto && (
        <span className="absolute -top-4 right-6 z-20 inline-flex items-center rounded-full bg-[#E02424] px-5 py-2 text-base font-extrabold tracking-wide text-white shadow-lg sm:-top-5 sm:px-6 sm:py-2.5 sm:text-lg">
          {descuentoTexto} OFF
        </span>
      )}

      <div
        role="group"
        aria-label="Moneda"
        className="grid grid-cols-2 gap-1 rounded-full bg-[#E7F0FE] p-1"
      >
        <button
          type="button"
          aria-pressed={!esUsd}
          onClick={() => setMoneda("PEN")}
          className={`rounded-full px-2 py-2 text-[13px] font-bold whitespace-nowrap transition-colors sm:px-3 sm:text-sm lg:px-2 xl:px-3 ${
            !esUsd
              ? "bg-[#1F3A6E] text-white shadow-sm"
              : "text-[#1F3A6E]/70 hover:text-[#1F3A6E]"
          }`}
        >
          SOLES
        </button>
        <button
          type="button"
          aria-pressed={esUsd}
          disabled={!usdDisponible}
          onClick={() => setMoneda("USD")}
          className={`rounded-full px-2 py-2 text-[13px] font-bold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-sm lg:px-2 xl:px-3 ${
            esUsd
              ? "bg-[#1F3A6E] text-white shadow-sm"
              : "text-[#1F3A6E]/70 hover:text-[#1F3A6E]"
          }`}
        >
          DÓLARES
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs font-bold tracking-[0.18em] text-[#38241a]/60 uppercase">
          Inversión total
        </p>
        <div className="mt-1 flex flex-wrap items-baseline justify-center gap-x-2.5 gap-y-0.5">
          <p className="font-price text-5xl font-extrabold tracking-tight text-[#1F3A6E] sm:text-6xl">
            {formatear(final, monedaActiva)}
          </p>
          {hayDescuento && (
            <p className="font-price text-lg font-bold text-[#38241a]/40 line-through sm:text-xl">
              {formatear(lista, monedaActiva)}
            </p>
          )}
        </div>
        <p className="mt-2 text-xs font-semibold text-[#38241a]/60 sm:text-sm">
          Pago único en {esUsd ? "USD" : "soles"}
          {hayDescuento ? ` · ${descuentoTexto} de descuento ya aplicado` : ""}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {ahorro > 0 && (
          <span className="rounded-full bg-[#DCFCE7] px-3.5 py-1.5 text-sm font-bold text-[#15803D]">
            Ahorras {formatear(ahorro, monedaActiva)}
          </span>
        )}
      </div>

      {/* 
        TEMPORAL: Mientras se tramita el RUC 20 del negocio, redirige a WhatsApp.
        Para reactivar la pasarela cuando esté listo el RUC 20, reemplazar el elemento 'render' por:
        <Link href={cursoSlug ? `/checkout?curso=${encodeURIComponent(cursoSlug)}` : "/checkout"} />
      */}
      <Button
        render={
          <a
            href={whatsappUrl("¡Hola Amorelo! Quiero comprar la Masterclass.")}
            target="_blank"
            rel="noopener noreferrer"
          />
        }
        nativeButton={false}
        className="relative mt-6 h-14 w-full overflow-hidden bg-[#1F3A6E] px-8 text-lg text-[#FFF4E3] transition-colors duration-300 hover:bg-[#1F3A6E] active:bg-[#1F3A6E]"
      >
        <span
          aria-hidden="true"
          className="absolute -inset-px origin-right scale-x-0 bg-[#1A73E8] transition-transform duration-300 ease-out group-hover/button:scale-x-100 motion-reduce:transition-none"
        />
        <span className="relative z-10 flex items-center justify-center gap-2 transition-colors duration-300 group-hover/button:text-white">
        QUIERO PAGAR
          <ArrowRightIcon className="size-5" aria-hidden="true" />
        </span>
      </Button>

      <p className="mt-4 text-center text-sm font-medium text-[#38241a]/70">
        ¿Tienes dudas?{" "}
        <CtaWhatsApp
          boton="precio"
          className="font-bold text-[#1F3A6E] underline underline-offset-4 transition-colors hover:text-[#1A73E8]"
        >
          Escríbenos por WhatsApp
        </CtaWhatsApp>
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-[#1F3A6E]/10 pt-5 text-xs font-semibold text-[#38241a]/70 sm:text-sm">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-4 text-[#1A73E8]" aria-hidden="true" />
          Pago seguro
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap className="size-4 text-[#1A73E8]" aria-hidden="true" />
          Acceso inmediato
        </span>
      </div>
    </div>
  );
}
