// Componente: Carrusel de Globos Flotantes (Hero Columna Derecha)
// - Rotación automática cada 3.5 segundos con transición de salida a la izquierda y entrada desde la derecha.
// - Efecto continuo de levitación/flotación vertical física (bouncing flotante suave).
// - Sombra elíptica interactiva en la base que se expande y contrae en sincronía con la flotación.
// - Pausa en hover para admirar los detalles.

"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const BALLOON_SLIDES = [
  {
    id: "globo-1",
    src: "/images/hero/globo1_sin_fondo.webp",
    alt: "Globo burbuja con arreglo floral y caja personalizada",
    title: "Encapsulado Floral",
    badge: "Técnica Estrella",
  },
  {
    id: "globo-2",
    src: "/images/hero/globo2_sin_fondo.webp",
    alt: "Globo burbuja con confeti interno y micropartículas",
    title: "Doble Stuff & Confeti",
    badge: "Más Vendido",
  },
  {
    id: "globo-3",
    src: "/images/hero/globo3_sin_fondo.webp",
    alt: "Globo burbuja prémium con peluche y cintas decorativas",
    title: "Encapsulado de Peluche",
    badge: "Alta Ganancia",
  },
];

export function HeroBalloonCarousel() {
  const [current, setCurrent] = useState(0);
  const reduceMotion = useReducedMotion();

  // Rotación automática continua cada 3.5 segundos (sin pausa en hover)
  useEffect(() => {
    if (reduceMotion) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % BALLOON_SLIDES.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [reduceMotion]);

  const activeSlide = BALLOON_SLIDES[current];

  return (
    <div
      className="relative flex flex-col items-center justify-center w-full max-w-[460px] lg:max-w-[520px] xl:max-w-[560px] select-none py-6"
      role="region"
      aria-label="Galería de técnicas con globos burbuja"
    >
      {/* ── 1. Contenedor de la Imagen Flotante ─────────────────────────────── */}
      <div className="relative w-full aspect-[3/4] max-h-[580px] lg:max-h-[640px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.id}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 70, scale: 0.94 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -70, scale: 0.94 }}
            transition={{
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            {/* Animación continua de levitación / flotación suave */}
            <motion.div
              animate={
                reduceMotion
                  ? undefined
                  : {
                      y: [-10, 10, -10],
                      rotate: [-1.2, 1.2, -1.2],
                    }
              }
              transition={
                reduceMotion
                  ? undefined
                  : {
                      duration: 4.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
              }
              className="relative w-full h-full flex items-center justify-center drop-shadow-[0_20px_45px_rgba(4,20,60,0.35)] dark:drop-shadow-[0_25px_50px_rgba(0,0,0,0.65)]"
            >
              <Image
                src={activeSlide.src}
                alt={activeSlide.alt}
                width={1086}
                height={1448}
                priority
                className="w-auto h-full max-h-[540px] lg:max-h-[600px] object-contain drop-shadow-md"
                sizes="(min-width: 1280px) 520px, (min-width: 1024px) 450px, 90vw"
              />

              {/* Tag flotante con el nombre de la técnica */}
              <div className="absolute top-8 right-2 sm:right-6 lg:right-4 z-20 pointer-events-auto">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 dark:bg-white/10 px-3.5 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-md">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  {activeSlide.badge}
                </span>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── 2. Sombra Elíptica 3D en la Base (Respira con la flotación) ─────── */}
      <div className="relative w-full flex items-center justify-center -mt-6">
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: [1, 0.82, 1],
                  opacity: [0.35, 0.2, 0.35],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: 4.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
          className="w-48 sm:w-60 lg:w-72 h-6 sm:h-7 rounded-[100%] bg-[#081838] dark:bg-black blur-md"
          aria-hidden="true"
        />
      </div>

      {/* ── 3. Indicadores de Puntos Píldora ───────────────────────────────── */}
      <div className="flex items-center gap-2 mt-4 z-20">
        {BALLOON_SLIDES.map((slide, index) => {
          const isActive = index === current;
          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => setCurrent(index)}
              aria-label={`Ver técnica ${index + 1}: ${slide.title}`}
              aria-pressed={isActive}
              className={`h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                isActive
                  ? "w-8 bg-white shadow-sm"
                  : "w-2.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
