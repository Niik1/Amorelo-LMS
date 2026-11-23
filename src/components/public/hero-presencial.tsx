"use client";

import Image from "next/image";
import { ArrowRightIcon, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/public/button";

export function HeroPresencial() {
  return (
    <section className="relative -mt-[88px] min-h-[90svh] w-full overflow-hidden flex items-center">
      {/* Imagen de fondo */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/taller-presencial/hero/tallerpresencial.webp"
          alt="Taller presencial de decoración de globos Amorelo"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Gradiente: en móvil va vertical protegiendo el texto; en desktop se extiende de izquierda a derecha */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-[#0D1B3E]/95 via-[#0D1B3E]/85 to-[#0D1B3E]/60 sm:bg-gradient-to-r sm:from-[#0D1B3E]/95 sm:via-[#0D1B3E]/80 sm:to-[#0D1B3E]/40"
        />
      </div>

      {/* Contenido principal en 2 columnas (Texto a la izquierda, PrecioCard a la derecha) */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-24 pb-12 sm:px-6 sm:pt-36 sm:pb-24 lg:pt-40">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">

          {/* ========================================================
              COLUMNA IZQUIERDA: Copy, Titular y Fechas
              ======================================================== */}
          <div className="space-y-6 lg:col-span-7">
            {/* Chip / Badge superior */}
            <div>
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-xs font-bold tracking-wide text-white backdrop-blur-sm sm:text-sm">
                Taller presencial · Centro de Lima
              </span>
            </div>

            {/* Titular principal con sombra para máxima legibilidad */}
            <h1
              className="font-heading text-3xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-white leading-[1.12] text-balance"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.45)" }}
            >
              Tu próximo emprendimiento de detalles empieza aquí
            </h1>

            {/* Bajada / Subtítulo con alto brillo y contraste (sin text-balance para que fluya de corrido) */}
            <p
              className="text-sm sm:text-lg lg:text-xl text-[#FFF4E3] font-medium leading-relaxed max-w-2xl"
              style={{ textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}
            >
              Un taller 100% práctico en Lima: Domina las técnicas desde cero y aprende a cotizar tus detalles.
            </p>

            {/* Botón de acción */}
            <div className="pt-1 sm:pt-2">
              <Button
                render={<a href="#fechas" />}
                nativeButton={false}
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById("fechas");
                  if (target) {
                    target.scrollIntoView({ behavior: "smooth" });
                    window.history.pushState(null, "", "#fechas");
                  }
                }}
                className="relative h-13 sm:h-14 overflow-hidden bg-[#1A73E8] pr-2 pl-6 sm:pl-8 text-base text-[#FFF4E3] transition-colors duration-300 hover:border-[#1A73E8]/40 hover:bg-[#1A73E8] hover:text-[#FFF4E3] active:bg-[#1A73E8]"
              >
                <span
                  aria-hidden="true"
                  className="absolute -inset-px origin-right scale-x-0 bg-white transition-transform duration-300 ease-out group-hover/button:scale-x-100 motion-reduce:transition-none"
                />
                <span className="relative z-10 flex items-center gap-3 transition-colors duration-300 group-hover/button:text-[#1A73E8]">
                  Asegurar mi Cupo
                  <span
                    aria-hidden="true"
                    className="inline-flex size-9 sm:size-10 items-center justify-center rounded-full bg-white text-[#1A73E8] transition-colors duration-300 group-hover/button:bg-[#1A73E8] group-hover/button:text-white"
                  >
                    <ArrowRightIcon className="size-4.5 sm:size-5" />
                  </span>
                </span>
              </Button>
            </div>

            {/* Fila de metadatos (en móvil: ambas píldoras compactas en una sola fila; en desktop: tamaño completo) */}
            <div className="flex flex-nowrap items-center gap-2 pt-1 sm:gap-3 sm:pt-4 text-white">
              <div className="inline-flex items-center gap-1.5 sm:gap-3 rounded-full border border-white/20 bg-black/25 px-2.5 py-1.5 sm:px-4 sm:py-2 backdrop-blur-md shadow-sm shrink-0">
                <div className="flex size-6 sm:size-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
                  <Calendar className="size-3.5 sm:size-5 text-white" />
                </div>
                <span
                  className="text-[11px] sm:text-sm font-semibold whitespace-nowrap"
                  style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
                >
                  <span className="sm:hidden">21 y 22 de Noviembre</span>
                  <span className="hidden sm:inline">Sábado 21 y domingo 22 de nov</span>
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 sm:gap-3 rounded-full border border-white/20 bg-black/25 px-2.5 py-1.5 sm:px-4 sm:py-2 backdrop-blur-md shadow-sm shrink-0">
                <div className="flex size-6 sm:size-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
                  <Clock className="size-3.5 sm:size-5 text-white" />
                </div>
                <span
                  className="text-[11px] sm:text-sm font-semibold whitespace-nowrap"
                  style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
                >
                  <span className="sm:hidden">10:00 am a 6:00 pm</span>
                  <span className="hidden sm:inline">10:00 am a 6:00 pm</span>
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================
              COLUMNA DERECHA: Card de Precio Flotante (Idea 1)
              ======================================================== */}
          <div className="lg:col-span-5">
            <div className="relative rounded-[2.5rem] bg-white p-6 pt-9 sm:p-8 sm:pt-10 shadow-[0_24px_70px_-20px_rgba(31,58,110,0.45)] border border-white/50">
              {/* Badge superior flotante estilo Precios */}
              <span className="absolute -top-4 right-6 z-20 inline-flex items-center rounded-full bg-[#E02424] px-4 py-1.5 text-xs sm:text-sm font-extrabold tracking-wide text-white shadow-lg">
                PREVENTA -40% OFF
              </span>

              {/* Bloque de Precio: Centrado y dominante */}
              <div className="text-center space-y-2">
                <span className="text-xs font-bold tracking-[0.2em] text-[#38241A]/60 uppercase">
                  Inversión en preventa
                </span>

                {/* Precios: Gigante y centrado */}
                <div className="flex items-baseline justify-center gap-3 pt-1">
                  <span className="font-heading text-5xl sm:text-7xl font-extrabold text-[#1F3A6E] tracking-tight">
                    S/ 150
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-[#38241A]/40 line-through">
                    S/ 250
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#38241A]/75 leading-relaxed max-w-xs mx-auto">
                  Aprovecha la preventa antes de que
                  termine.
                </p>
              </div>

              {/* Separador sutil */}
              <div className="my-5 border-t border-[#1F3A6E]/10" />

              {/* Facilitador de pago con S/ 50 (secundario, no compite con el precio) */}
              <div className="text-center space-y-1 rounded-2xl bg-[#E7F0FE]/60 border border-[#1A73E8]/15 p-3.5 sm:p-4">
                <p className="font-heading text-sm sm:text-base font-bold text-[#1F3A6E]">
                  ✨ Reserva tu cupo con solo S/ 50
                </p>
                <p className="text-xs text-[#38241A]/70 leading-relaxed">
                  El saldo restante lo coordinas fácilmente por WhatsApp.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
