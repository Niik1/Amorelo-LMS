// Hero: Paso 2 — Tipografía, Jerarquía y Botones según Referencia (Nov 2026)
// - Subtítulo superior: "CURSO VIRTUAL · MASTERCLASS · GLOBOS BURBUJA" (monocromo, tracking amplio, uppercase).
// - H1: Tipografía gigante de alto impacto (estilo editorial de la referencia), blanco puro, tracking apretado.
// - Párrafo: Tamaño exacto al de la referencia.
// - Botones: Píldoras limpias (sin círculos ni flechas dentro), texto centrado, tipografía nítida idéntica a la referencia.

import React from "react";
import Link from "next/link";
import { CheckCircle2, Clock, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/public/button";
import { CtaWhatsApp } from "@/components/public/cta-whatsapp";
import {
  HeroEntrance,
  HeroEntranceItem,
} from "@/components/public/hero-entrance";
import { HeroBalloonCarousel } from "@/components/public/hero-balloon-carousel";

// ─── Componentes SVG individuales (Line art fino en blanco) ──────────────────

function BalloonDoodle({ size = 70, className = "" }: { size?: number; className?: string }) {
  const h = Math.round(size * 1.35);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 60 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="30" cy="30" r="26" />
      <path d="M18 16 A 20 20 0 0 1 34 11" strokeWidth="2.2" />
      <circle cx="39" cy="14" r="1.5" fill="currentColor" stroke="none" />
      <path d="M26 56 L34 56 L30 61 Z" />
      <path d="M30 61 Q35 68 28 73 T32 80" />
    </svg>
  );
}

function ScissorsDoodle({ size = 46, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="38" r="6" />
      <circle cx="36" cy="38" r="6" />
      <path d="M16 33 L24 24 L38 8" />
      <path d="M32 33 L24 24 L10 8" />
      <circle cx="24" cy="24" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function RibbonBowDoodle({ size = 52, className = "" }: { size?: number; className?: string }) {
  const h = Math.round(size * 0.75);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 60 45"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <ellipse cx="30" cy="18" rx="4" ry="4.5" />
      <path d="M26 17 C16 9 8 13 8 20 C8 27 18 25 26 20 Z" />
      <path d="M34 17 C44 9 52 13 52 20 C52 27 42 25 34 20 Z" />
      <path d="M28 22 Q23 33 16 40 Q22 36 28 42" />
      <path d="M32 22 Q37 33 44 40 Q38 36 32 42" />
    </svg>
  );
}

function SparkleDoodle({ size = 30, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M16 2 Q16 16 30 16 Q16 16 16 30 Q16 16 2 16 Q16 16 16 2 Z" />
    </svg>
  );
}

function FlowerDoodle({ size = 42, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="22" cy="22" r="3.5" />
      <path d="M22 18.5 C22 12 16 12 16 17 C16 19 19 20 22 22" />
      <path d="M25.5 22 C32 22 32 16 27 16 C25 16 24 19 22 22" />
      <path d="M22 25.5 C22 32 28 32 28 27 C28 25 25 24 22 22" />
      <path d="M18.5 22 C12 22 12 28 17 28 C19 28 20 25 22 22" />
      <path d="M22 18.5 C26 13 32 17 29 21" />
      <path d="M22 25.5 C18 31 12 27 15 23" />
    </svg>
  );
}

function BrushStrokeDoodle({ size = 56, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.55)}
      viewBox="0 0 60 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M4 22 C16 12 24 26 38 15 C45 9 52 14 56 12" />
      <path d="M10 26 C20 18 28 30 42 20 C46 16 50 18 53 17" strokeWidth="1.1" strokeDasharray="3 3" />
    </svg>
  );
}

function MiniBubbleDoodle({ size = 26, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 30 30"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className={className}
    >
      <circle cx="15" cy="15" r="12" />
      <path d="M9 10 A 8 8 0 0 1 16 7" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TinyStarsDoodle({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 30 30"
      fill="currentColor"
      stroke="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="8" cy="8" r="1.6" />
      <circle cx="23" cy="11" r="1.3" />
      <circle cx="15" cy="23" r="1.8" />
    </svg>
  );
}

// ─── Fondo de Doodles Adaptativo ─────────────────────────────────────────────
export function HeroBackgroundPattern() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden text-white select-none opacity-15 dark:opacity-12 transition-opacity duration-300"
    >
      {/* Móvil (< md) */}
      <div className="block md:hidden">
        <BalloonDoodle size={58} className="absolute top-[5%] left-[5%] -rotate-12" />
        <SparkleDoodle size={24} className="absolute top-[12%] right-[12%] rotate-12" />
        <MiniBubbleDoodle size={22} className="absolute top-[6%] right-[28%]" />
        <ScissorsDoodle size={38} className="absolute top-[22%] left-[10%] rotate-30" />
        <RibbonBowDoodle size={44} className="absolute top-[28%] right-[8%] -rotate-8" />
        <TinyStarsDoodle size={22} className="absolute top-[36%] left-[22%]" />
        <FlowerDoodle size={36} className="absolute top-[44%] left-[6%] rotate-15" />
        <BalloonDoodle size={56} className="absolute top-[50%] right-[10%] 8" />
        <BrushStrokeDoodle size={48} className="absolute top-[58%] left-[14%] -rotate-10" />
        <SparkleDoodle size={26} className="absolute top-[66%] right-[18%] rotate-45" />
        <ScissorsDoodle size={36} className="absolute top-[72%] left-[8%] -rotate-25" />
        <RibbonBowDoodle size={42} className="absolute top-[78%] right-[8%] rotate-12" />
        <FlowerDoodle size={34} className="absolute top-[85%] left-[16%] -rotate-15" />
        <BalloonDoodle size={54} className="absolute top-[88%] right-[12%] -rotate-10" />
        <MiniBubbleDoodle size={20} className="absolute top-[92%] left-[45%]" />
      </div>

      {/* Desktop/Laptop (>= md) */}
      <div className="hidden md:block">
        <BalloonDoodle size={74} className="absolute top-[4%] left-[3%] -rotate-12" />
        <SparkleDoodle size={32} className="absolute top-[14%] left-[10%] rotate-12" />
        <MiniBubbleDoodle size={28} className="absolute top-[6%] left-[18%] rotate-45" />
        <RibbonBowDoodle size={48} className="absolute top-[16%] left-[24%] -rotate-6" />
        <BrushStrokeDoodle size={58} className="absolute top-[5%] left-[34%] rotate-10" />
        <ScissorsDoodle size={44} className="absolute top-[16%] left-[43%] rotate-45" />
        <BalloonDoodle size={62} className="absolute top-[4%] left-[53%] 8" />
        <FlowerDoodle size={38} className="absolute top-[18%] left-[62%] -rotate-12" />
        <SparkleDoodle size={28} className="absolute top-[6%] left-[70%] rotate-20" />
        <RibbonBowDoodle size={52} className="absolute top-[14%] right-[18%] rotate-8" />
        <MiniBubbleDoodle size={32} className="absolute top-[5%] right-[9%] -rotate-15" />
        <BalloonDoodle size={70} className="absolute top-[15%] right-[2%] 10" />

        <ScissorsDoodle size={46} className="absolute top-[28%] left-[4%] rotate-30" />
        <FlowerDoodle size={42} className="absolute top-[38%] left-[12%] -rotate-15" />
        <BrushStrokeDoodle size={62} className="absolute top-[26%] left-[20%] -rotate-10" />
        <BalloonDoodle size={68} className="absolute top-[36%] left-[29%] rotate-12" />
        <SparkleDoodle size={34} className="absolute top-[28%] left-[39%] rotate-45" />
        <TinyStarsDoodle size={26} className="absolute top-[40%] left-[47%]" />
        <RibbonBowDoodle size={54} className="absolute top-[27%] left-[54%] rotate-6" />
        <MiniBubbleDoodle size={30} className="absolute top-[39%] left-[63%] rotate-30" />
        <ScissorsDoodle size={46} className="absolute top-[26%] right-[24%] -rotate-25" />
        <BrushStrokeDoodle size={60} className="absolute top-[38%] right-[15%] rotate-14" />
        <FlowerDoodle size={44} className="absolute top-[28%] right-[6%] rotate-25" />
        <SparkleDoodle size={32} className="absolute top-[40%] right-[1%] rotate-12" />

        <BalloonDoodle size={68} className="absolute top-[52%] left-[2%] rotate-8" />
        <RibbonBowDoodle size={52} className="absolute top-[64%] left-[9%] -rotate-12" />
        <MiniBubbleDoodle size={26} className="absolute top-[50%] left-[19%] rotate-10" />
        <ScissorsDoodle size={42} className="absolute top-[62%] left-[25%] rotate-45" />
        <FlowerDoodle size={44} className="absolute top-[52%] left-[35%] rotate-18" />
        <BrushStrokeDoodle size={64} className="absolute top-[64%] left-[44%] -rotate-8" />
        <BalloonDoodle size={72} className="absolute top-[50%] left-[53%] -rotate-10" />
        <SparkleDoodle size={30} className="absolute top-[65%] left-[62%] rotate-45" />
        <TinyStarsDoodle size={28} className="absolute top-[52%] right-[26%]" />
        <RibbonBowDoodle size={50} className="absolute top-[63%] right-[18%] rotate-12" />
        <MiniBubbleDoodle size={34} className="absolute top-[51%] right-[9%] -rotate-20" />
        <ScissorsDoodle size={48} className="absolute top-[62%] right-[2%] -rotate-15" />

        <FlowerDoodle size={40} className="absolute top-[78%] left-[4%] rotate-45" />
        <SparkleDoodle size={34} className="absolute top-[88%] left-[12%] rotate-15" />
        <BrushStrokeDoodle size={58} className="absolute top-[76%] left-[20%] rotate-12" />
        <BalloonDoodle size={66} className="absolute top-[86%] left-[30%] rotate-6" />
        <TinyStarsDoodle size={26} className="absolute top-[77%] left-[40%]" />
        <ScissorsDoodle size={44} className="absolute top-[88%] left-[48%] -rotate-30" />
        <RibbonBowDoodle size={56} className="absolute top-[76%] left-[58%] rotate-8" />
        <MiniBubbleDoodle size={28} className="absolute top-[88%] left-[68%] rotate-15" />
        <FlowerDoodle size={42} className="absolute top-[76%] right-[20%] -rotate-15" />
        <SparkleDoodle size={32} className="absolute top-[88%] right-[11%] rotate-45" />
        <BalloonDoodle size={70} className="absolute top-[77%] right-[3%] -rotate-12" />
        <BrushStrokeDoodle size={62} className="absolute top-[89%] right-[2%] rotate-6" />
      </div>
    </div>
  );
}

// ─── Hero Principal: Estilo Referencia (Tipografía Monumental + Botones Clean) ─
export function Hero() {
  return (
    <section
      id="inicio"
      aria-labelledby="hero-title"
      className="relative -mt-[80px] flex min-h-[calc(100vh+80px)] scroll-mt-20 flex-col justify-start md:justify-center overflow-x-clip pt-40 sm:pt-44 md:pt-36 lg:pt-24 pb-16 transition-colors duration-500 bg-[#1A73E8] dark:bg-[#070e24]"
    >
      {/* ── Capa de degradado radial: Modo Claro (Azul Marca con iluminación cenital / costados) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-100 dark:opacity-0 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(ellipse 110% 90% at 85% 15%, #4d96ff 0%, #257bf0 35%, #1A73E8 65%, #1052bd 100%)",
        }}
      />

      {/* Resplandor ambiental de luz blanca/celeste en Modo Claro (esquina superior derecha, estilo Login) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-100 dark:opacity-0 transition-opacity duration-500"
      >
        <div className="absolute -top-36 right-0 h-[640px] w-[640px] rounded-full bg-white/20 blur-[140px]" />
        <div className="absolute top-1/3 -left-32 h-[480px] w-[480px] rounded-full bg-white/10 blur-[130px]" />
      </div>

      {/* ── Capa de degradado radial: Modo Oscuro (Idéntico a Login, Reclamaciones y Verificar) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(ellipse 100% 85% at 85% 15%, #1d387d 0%, #142658 35%, #0b1435 70%, #070e24 100%)",
        }}
      />

      {/* Resplandor ambiental institucional en Modo Oscuro (esquina superior derecha, idéntico a Login) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-0 dark:opacity-100 transition-opacity duration-500"
      >
        <div className="absolute -top-32 right-0 h-[620px] w-[620px] rounded-full bg-[#1d387d]/40 blur-[150px]" />
      </div>

      {/* Patrón de Doodles de fondo */}
      <HeroBackgroundPattern />

      {/* ── Contenedor General Amplio (max-w-[1540px]) ─────────────────────── */}
      <div className="relative z-10 mx-auto w-full max-w-[1540px] px-6 sm:px-10 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[58%_42%] xl:grid-cols-[56%_44%]">

          {/* ══════════════════════════════════════════════════════════════════
              COLUMNA IZQUIERDA: DISEÑO EDITORIAL INSPIRADO EN LA REFERENCIA
              ══════════════════════════════════════════════════════════════════ */}
          <div className="text-left">
            <HeroEntrance>
              {/* 1. Header Superior: MASTERCLASS · GLOBOS BURBUJA (Equilibrado a 13px) */}
              <HeroEntranceItem index={0}>
                <p className="text-xs sm:text-[13px] font-bold tracking-[0.2em] text-white/90 uppercase font-mono sm:font-sans">
                  MASTERCLASS <span className="opacity-60 mx-1.5">·</span> GLOBOS BURBUJA
                </p>
              </HeroEntranceItem>

              {/* 2. Titular H1 Monumental */}
              <HeroEntranceItem index={1}>
                <h1
                  id="hero-title"
                  className="font-heading mt-4 sm:mt-5 text-[2.75rem] leading-[1.0] font-black tracking-[-0.035em] text-balance text-white sm:text-6xl md:text-7xl lg:text-[4.75rem] xl:text-[5.5rem]"
                >
                  Iniciá tu emprendimiento con globos burbuja
                </h1>
              </HeroEntranceItem>

              {/* 3. Subtítulo: Reducido a 17px - 18px (elegante y cómodo) */}
              <HeroEntranceItem index={2}>
                <p className="mt-5 max-w-xl text-base sm:text-[17px] lg:text-lg leading-[1.48] text-pretty text-white/90 font-normal">
                  Aprende y Emprende desde casa con nuestros cursos desde cero y paso a paso. Incluye plantilla de costos exclusiva para cotizar con precisión.
                </p>
              </HeroEntranceItem>

              {/* 4. Botones Píldora Limpios */}
              <HeroEntranceItem index={3} className="mt-7 sm:mt-8">
                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    render={<CtaWhatsApp boton="hero" />}
                    nativeButton={false}
                    className="h-13 sm:h-14 rounded-full bg-white px-8 sm:px-9 text-base sm:text-lg font-bold text-[#1F3A6E] shadow-xl transition-all duration-300 hover:bg-white/90 hover:scale-[1.02] active:scale-95 border-0"
                  >
                    Quiero la MasterClass
                  </Button>

                  <Button
                    variant="outline"
                    render={<Link href="/#temario" />}
                    nativeButton={false}
                    className="h-13 sm:h-14 rounded-full border-[1.5px] border-white/80 bg-white/10 dark:bg-white/5 px-8 sm:px-9 text-base sm:text-lg font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:border-white hover:text-white active:scale-95"
                  >
                    Ver el temario
                  </Button>
                </div>
              </HeroEntranceItem>

              {/* 5. Micro-garantías: Reducidas a 14px e iconos de 18px */}
              <HeroEntranceItem index={4} className="mt-8">
                <div className="flex flex-wrap items-center gap-x-7 gap-y-2.5 pt-1 text-sm font-medium text-white/90">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4.5 text-white shrink-0" aria-hidden="true" />
                    <span>Sin experiencia previa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="size-4.5 text-white shrink-0" aria-hidden="true" />
                    <span>A tu propio ritmo (24/7)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="size-4.5 text-white shrink-0" aria-hidden="true" />
                    <span>Plantilla Excel de Costos</span>
                  </div>
                </div>
              </HeroEntranceItem>
            </HeroEntrance>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              COLUMNA DERECHA: CARRUSEL DE GLOBOS BURBUJA FLOTANTES
              ══════════════════════════════════════════════════════════════════ */}
          <div className="flex items-center justify-center w-full">
            <HeroBalloonCarousel />
          </div>

        </div>
      </div>
    </section>
  );
}
