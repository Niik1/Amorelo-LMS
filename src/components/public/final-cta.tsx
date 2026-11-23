// Franja Final CTA: Cápsula Flotante (Ecosistema de Taller)
// - Banner flotante con márgenes (no pegado a los bordes), esquinas redondeadas [32px].
// - Fondo azul profundo con degradado ambiental y sutiles doodles de taller (moño, destellos, burbujas).
// - Pre-título: 'EMPIEZA HOY MISMO'
// - Titular: '¿Estás listo para emprender?'
// - Botón píldora blanco sólido: 'Quiero empezar' alineado a la derecha en desktop.

import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/public/button";
import { CtaWhatsApp } from "@/components/public/cta-whatsapp";

// ─── Doodles vectoriales sutiles para las esquinas del banner ────────────────
function SparkleIcon({ size = 28, className = "" }: { size?: number; className?: string }) {
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

function RibbonBowIcon({ size = 52, className = "" }: { size?: number; className?: string }) {
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

function MiniBubbleIcon({ size = 32, className = "" }: { size?: number; className?: string }) {
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

export function FinalCta() {
  return (
    <section
      aria-label="Llamado final a la inscripción"
      className="bg-[#F8FAFC] dark:bg-[#070e24] px-4 sm:px-6 lg:px-10 py-12 sm:py-16 lg:py-20 transition-colors duration-500"
    >
      <div className="mx-auto w-full max-w-[1540px]">
        {/* ── Banner Cápsula Flotante (Rounded [32px], sin fotos de stock) ────── */}
        <div className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] bg-[#1A73E8] dark:bg-[#0c1c44] border border-blue-400/20 dark:border-white/10 px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-16 shadow-[0_25px_60px_-15px_rgba(26,115,232,0.3)] dark:shadow-[0_25px_65px_-15px_rgba(0,0,0,0.6)]">
          
          {/* Capa de iluminación ambiental y degradado de taller */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-100"
            style={{
              background:
                "radial-gradient(ellipse 90% 80% at 85% 20%, #3b8aff 0%, #1A73E8 55%, #0f4bb5 100%)",
            }}
          />

          {/* Iluminación en Modo Oscuro */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-500"
            style={{
              background:
                "radial-gradient(ellipse 90% 80% at 85% 20%, #173b82 0%, #0c2356 50%, #071536 100%)",
            }}
          />

          {/* ── Doodles sutiles del Ecosistema de Taller (Opacidad 10%) ─────── */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden text-white opacity-10 select-none"
          >
            <RibbonBowIcon size={64} className="absolute -top-3 left-[8%] rotate-12" />
            <SparkleIcon size={34} className="absolute top-[20%] left-[22%] -rotate-15" />
            <MiniBubbleIcon size={36} className="absolute bottom-4 left-[14%] rotate-45" />
            <MiniBubbleIcon size={44} className="absolute -top-2 right-[25%] -rotate-10" />
            <SparkleIcon size={38} className="absolute bottom-[20%] right-[10%] rotate-12" />
            <RibbonBowIcon size={56} className="absolute -bottom-4 right-[2%] -rotate-12" />
          </div>

          {/* ── Contenido en 2 Columnas (Estilo Referencia) ─────────────────── */}
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 sm:gap-10">
            
            {/* Lado Izquierdo: Textos */}
            <div className="max-w-2xl text-left">
              <p className="font-mono text-xs sm:text-[13px] font-bold tracking-[0.22em] text-white/80 uppercase">
                EMPIEZA HOY MISMO
              </p>
              <h2 className="font-heading mt-2.5 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.08] text-balance">
                ¿Estás listo para emprender?
              </h2>
              <p className="mt-3 text-sm sm:text-base text-white/85 font-normal max-w-xl">
                Aprende las técnicas más solicitadas en globos burbuja y construye un negocio rentable desde tu propio hogar.
              </p>
            </div>

            {/* Lado Derecho: Botón Píldora Blanco Sólido */}
            <div className="w-full lg:w-auto shrink-0 flex items-center justify-start lg:justify-end">
              <Button
                render={<CtaWhatsApp boton="final" />}
                nativeButton={false}
                className="h-14 sm:h-15 w-full sm:w-auto rounded-full bg-white px-9 sm:px-10 text-base sm:text-lg font-bold text-[#1F3A6E] shadow-xl transition-all duration-300 hover:bg-white/95 hover:scale-[1.02] active:scale-95 border-0"
              >
                <span className="flex items-center justify-center gap-3">
                  Quiero empezar
                  <ArrowRightIcon className="size-4.5 sm:size-5" />
                </span>
              </Button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
