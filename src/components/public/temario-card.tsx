// Card del temario (Estilo de la Referencia):
// - Imagen del proyecto con píldora de progresión en la esquina superior izquierda.
// - Pie de tarjeta: Encabezado 'MÓDULO #X' (mayúscula, sin minutos) y Título de la técnica.
// - Sin descripciones para un look limpio y visual.

"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

export type TemarioCardProps = {
  /** Path de la imagen del proyecto terminado. */
  image: string;
  alt: string;
  /** Píldora de progresión: PROYECTO BÁSICO / INTERMEDIO / AVANZADO / ADICIONAL / PLANTILLA GRATIS */
  badge: string;
  /** Número de módulo (1 a 8) */
  moduleNumber: number;
  title: string;
  index?: number;
};

export function TemarioCard({
  image,
  alt,
  badge,
  moduleNumber,
  title,
  index = 0,
}: TemarioCardProps) {
  const reduceMotion = useReducedMotion();

  // Estilo de la píldora según nivel
  const isPlantilla = badge.includes("PLANTILLA");

  return (
    <motion.article
      initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative flex flex-col overflow-hidden rounded-[24px] bg-white border border-slate-200/80 dark:border-white/10 dark:bg-[#0c1c44] shadow-[0_10px_30px_rgba(8,28,60,0.06)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.3)] transition-all duration-300 hover:shadow-xl hover:border-blue-400/30"
    >
      {/* ── 1. Contenedor de la Imagen ─────────────────────────────────────── */}
      <div className="relative aspect-[4/3] sm:aspect-[4/3.2] overflow-hidden bg-slate-100 dark:bg-slate-900">
        <Image
          src={image}
          alt={alt}
          fill
          sizes="(min-width: 1280px) 35vw, (min-width: 1024px) 45vw, 100vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none"
        />

        {/* Scrim degradado inferior muy sutil */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10"
        />

        {/* Píldora de Proyecto en la esquina superior izquierda (tal como en la referencia) */}
        <div className="absolute top-3.5 left-3.5 z-10">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${
              isPlantilla
                ? "bg-amber-400 text-slate-900 border border-amber-300"
                : "bg-white/90 text-[#1F3A6E] dark:bg-slate-900/90 dark:text-blue-200 border border-white/20"
            }`}
          >
            {isPlantilla && <span className="text-amber-900 font-extrabold">★</span>}
            {badge}
          </span>
        </div>
      </div>

      {/* ── 2. Pie de Tarjeta: Módulo #X y Título ─────────────────────────── */}
      <div className="flex flex-col p-5 sm:p-6 bg-white dark:bg-[#0c1c44]">
        <span className="font-mono text-xs font-bold tracking-[0.18em] text-[#1A73E8] dark:text-blue-400 uppercase">
          MÓDULO #{moduleNumber.toString().padStart(2, "0")}
        </span>
        <h3 className="font-heading mt-1.5 text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug text-balance">
          {title}
        </h3>
      </div>
    </motion.article>
  );
}
