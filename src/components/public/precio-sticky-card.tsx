// Tarjeta de Precio Flotante (Sticky Sidebar) para la Sección de Temario:
// - Sticky en desktop (top-28): baja con el scroll mientras el usuario revisa los 8 módulos.
// - Conectada a Supabase y cálculo en vivo (PEN/USD).
// - Precios tachados: S/ 300 lista vs S/ 210 final (o calculado dinámicamente) con badge '30% OFF'.
// - Leyenda limpia: 'Pago único'.
// - Checkpoints de valor claros y botón 'Comprar ahora'.
// - Dudas WhatsApp y sellos de seguridad (Pago seguro / Acceso inmediato).

"use client";

import { useState } from "react";
import { ArrowRightIcon, Check, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/public/button";
import { CtaWhatsApp } from "@/components/public/cta-whatsapp";
import { whatsappUrl } from "@/lib/config/site";

type Moneda = "PEN" | "USD";

export type PrecioStickyCardProps = {
  precioListaPen: number;
  precioFinalPen: number;
  precioListaUsd: number | null;
  precioFinalUsd: number | null;
  ahorroPen: number;
  ahorroUsd: number;
  descuentoTexto: string | null;
  cursoSlug?: string;
  cursoNombre?: string;
};

function formatear(valor: number, moneda: Moneda): string {
  return new Intl.NumberFormat(moneda === "PEN" ? "es-PE" : "en-US", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: Number.isInteger(valor) ? 0 : 2,
  }).format(valor);
}

const CHECKPOINTS = [
  "8 módulos con un proyecto cada uno",
  "Constancia de finalización con código verificable",
  "Plantilla Excel de Costos y Presupuestos",
  "Tu cuenta del Aula Virtual se activa al comprar",
] as const;

export function PrecioStickyCard({
  precioListaPen,
  precioFinalPen,
  precioListaUsd,
  precioFinalUsd,
  ahorroPen,
  ahorroUsd,
  descuentoTexto,
  cursoSlug,
  cursoNombre = "Masterclass de Globos Burbuja",
}: PrecioStickyCardProps) {
  const [moneda, setMoneda] = useState<Moneda>("PEN");

  const usdDisponible = precioListaUsd !== null && precioFinalUsd !== null;
  const esUsd = moneda === "USD" && usdDisponible;

  // Valores predeterminados requeridos si la BD no los trae (S/ 300 lista y S/ 210 final)
  const listaPen = precioListaPen > 0 ? precioListaPen : 300;
  const finalPen = precioFinalPen > 0 ? precioFinalPen : 210;

  const lista = esUsd ? (precioListaUsd ?? Math.round(listaPen / 3.7)) : listaPen;
  const final = esUsd ? (precioFinalUsd ?? Math.round(finalPen / 3.7)) : finalPen;
  const monedaActiva: Moneda = esUsd ? "USD" : "PEN";
  const tagDescuento = descuentoTexto || "30% OFF";

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-blue-400/20 dark:border-white/10 bg-[#1A73E8] dark:bg-[#0c1c44] p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(26,115,232,0.3)] dark:shadow-[0_25px_65px_-15px_rgba(0,0,0,0.6)] transition-all duration-300">
      {/* ── Capa de degradado radial: Modo Claro (Idéntico a Final CTA) ────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-100 dark:opacity-0 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 85% 20%, #3b8aff 0%, #1A73E8 55%, #0f4bb5 100%)",
        }}
      />

      {/* ── Capa de degradado radial: Modo Oscuro (Idéntico a Final CTA) ───── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 85% 20%, #173b82 0%, #0c2356 50%, #071536 100%)",
        }}
      />

      {/* ── Contenido Interior de la Tarjeta (Z-Index superior) ─────────────── */}
      <div className="relative z-10">
        {/* ── 1. Encabezado de la Tarjeta ─────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] sm:text-xs font-bold tracking-[0.2em] text-white/90 uppercase">
            CURSO VIRTUAL
          </span>
          {/* Badge 30% OFF en rojo */}
          <span className="inline-flex items-center rounded-full bg-[#E02424] px-4 py-1.5 text-xs sm:text-[13px] font-black text-white shadow-md tracking-wide">
            {tagDescuento.includes("OFF") ? tagDescuento : `${tagDescuento} OFF`}
          </span>
        </div>

        <h3 className="font-heading mt-3 text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
          {cursoNombre}
        </h3>

        {/* ── 2. Selector de Moneda: SOLES / DÓLARES ──────────────────────── */}
        <div
          role="group"
          aria-label="Seleccionar moneda"
          className="mt-5 grid grid-cols-2 gap-1 rounded-full bg-black/15 dark:bg-black/25 p-1 border border-white/15"
        >
          <button
            type="button"
            aria-pressed={!esUsd}
            onClick={() => setMoneda("PEN")}
            className={`rounded-full py-2 text-xs font-bold transition-all ${
              !esUsd
                ? "bg-white text-[#0c1c44] shadow-sm font-extrabold"
                : "text-white/80 hover:text-white"
            }`}
          >
            SOLES
          </button>
          <button
            type="button"
            aria-pressed={esUsd}
            onClick={() => setMoneda("USD")}
            className={`rounded-full py-2 text-xs font-bold transition-all ${
              esUsd
                ? "bg-white text-[#0c1c44] shadow-sm font-extrabold"
                : "text-white/80 hover:text-white"
            }`}
          >
            DÓLARES
          </button>
        </div>

        {/* ── 3. Sección de Precios (Centrado en el medio, grande en móvil) ─ */}
        <div className="mt-6 flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline justify-center gap-3">
            <span className="font-price text-5xl sm:text-6xl font-black tracking-tight text-white leading-none">
              {formatear(final, monedaActiva)}
            </span>
            {/* Precio tachado */}
            <span className="font-price text-xl sm:text-2xl font-bold text-white/50 line-through">
              {formatear(lista, monedaActiva)}
            </span>
          </div>

          <p className="mt-2 text-xs sm:text-[13px] font-semibold text-white/85 text-center">
            Pago único
          </p>
        </div>

        {/* ── 4. Checkpoints de Valor en Blanco ───────────────────────────── */}
        <ul className="mt-6 flex flex-col gap-3 border-t border-white/15 pt-5">
          {CHECKPOINTS.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-white/95 font-medium leading-snug">
              <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
                <Check className="size-2.5" strokeWidth={3.5} aria-hidden="true" />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* ── 5. Botón 'Comprar ahora' ────────────────────────────────────── */}
        <div className="mt-6">
          <Button
            render={
              <a
                href={whatsappUrl("¡Hola Amorelo! Quiero comprar la Masterclass de Globos Burbuja con la oferta del 30% OFF.")}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
            nativeButton={false}
            className="relative h-13 sm:h-14 w-full overflow-hidden rounded-full bg-white text-[#0c1c44] border-2 border-white px-6 text-base sm:text-lg font-black shadow-xl transition-all duration-300 hover:bg-white/95 hover:scale-[1.01] active:scale-95"
          >
            <span className="flex items-center justify-center gap-2">
              Comprar ahora
              <ArrowRightIcon className="size-4.5" strokeWidth={2.5} aria-hidden="true" />
            </span>
          </Button>
        </div>

        {/* ── 6. Dudas WhatsApp ───────────────────────────────────────────── */}
        <p className="mt-4 text-center text-xs text-white/80">
          ¿Tienes dudas?{" "}
          <CtaWhatsApp
            boton="precio"
            className="font-bold text-white underline underline-offset-4 hover:opacity-90 transition-opacity"
          >
            Escríbenos por WhatsApp
          </CtaWhatsApp>
        </p>

        {/* ── 7. Sellos de Confianza ──────────────────────────────────────── */}
        <div className="mt-4 flex items-center justify-center gap-5 border-t border-white/15 pt-4 text-xs font-semibold text-white/90">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-white" aria-hidden="true" />
            Pago seguro
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="size-4 text-white" aria-hidden="true" />
            Acceso inmediato
          </span>
        </div>
      </div>
    </div>
  );
}
