// Bloque de los globos: sección bg-alt con esquinas superiores redondeadas,
// solapada sobre el hero. El central manda: es el único en flujo y define
// la caja. Los laterales van en capas absolutas contra sus bordes, así se
// pueden mover (posición, tamaño, z) sin que el central se corra ni un píxel.
// Entrada al scrollear escalonada (una sola vez) disparada por controles:
// los nodos viven siempre (sin remontaje por breakpoint, que colapsaba la
// caja y repetía la animación solo en mobile). En mobile el central entra
// solo con opacidad + subida (sin escala: re-rasterizar 288px por frame
// traba el GPU; los laterales de 80px no tienen ese costo y van completos).
// Levitación: hero-float (globals.css, vaivén de 1.2°) en el div interno de
// cada globo, con duraciones/delays negativos distintos para desincronizar
// los tres. Va en el nodo interior para no pisar la transform que Motion
// controla en el exterior; desactivada con reduced-motion.

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import {
  motion,
  useAnimationControls,
  useInView,
  useReducedMotion,
  type Variant,
} from "motion/react";

const ENTER = {
  duration: 0.7,
  ease: [0.22, 1, 0.36, 1] as const,
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsMobile(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return isMobile;
}

// Puesto con entrada por controles: nace oculto y se muestra al entrar al
// viewport (una vez). Como el nodo nunca se desmonta, no hay saltos de layout
// al resolver el breakpoint después de hidratar.
function BalloonSlot({
  id,
  className,
  origin,
  hidden,
  delay,
  duration = ENTER.duration,
  children,
}: {
  id: string;
  className: string;
  origin?: string;
  hidden: Variant;
  delay: number;
  duration?: number;
  children: ReactNode;
}) {
  const controls = useAnimationControls();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30% 0px" });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (inView && !reduceMotion) controls.start("visible");
  }, [inView, reduceMotion, controls]);

  return (
    <motion.div
      id={id}
      ref={ref}
      className={className}
      style={origin ? { transformOrigin: origin } : undefined}
      initial={reduceMotion ? false : "hidden"}
      animate={reduceMotion ? "visible" : controls}
      variants={{
        hidden,
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { ...ENTER, duration, delay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function HeroBalloon() {
  const isMobile = useIsMobile();
  // Central en mobile: sin escala para no re-rasterizar por frame.
  const hiddenCentral: Variant = isMobile
    ? { opacity: 0, y: 24 }
    : { opacity: 0, y: 60, scale: 0.9 };

  return (
    <section
      aria-label="Arreglos destacados"
      className="bg-bg-alt relative -mt-10 min-h-0 overflow-x-clip rounded-t-[2rem] sm:min-h-[70svh] sm:rounded-t-[3rem]"
    >
      <div className="mx-auto w-full max-w-7xl px-6 pt-0 pb-10 sm:pb-20">
        {/* Caja del trío: la define solo el central (único en flujo). */}
        <div className="pointer-events-none relative mx-auto w-fit select-none">
          {/* Izquierdo: capa libre detrás del central.
              ─ DESKTOP (lg:) ─
              · Eje X (pegarse/separarse del central): lg:-mr-90
                (más valor = más pegado, menos valor = más separado).
              · Eje Y (subir/bajar): lg:-bottom-[50px] lo baja 50px;
                lg:bottom-16 lo subiría 64px.
              · Tamaño: lg:w-180 (solo ancho; el alto acompaña por aspect).
              · Inclinación: -rotate-10 (negativo = punta hacia la izquierda;
                ej. -rotate-12 más tumbado, -rotate-3 más leve, rotate-0 recto).
              · Encima/detrás del central: z-0 detrás, z-20 encima. */}
          <BalloonSlot
            id="globo-izq"
            className="absolute right-full bottom-0 z-0 -mr-35 w-45 shrink-0 -rotate-10 sm:-mr-12 sm:w-48 lg:-bottom-[50px] lg:-mr-100 lg:w-180"
            origin="50% 100%"
            hidden={{ opacity: 0, y: 60, scale: 0.9 }}
            delay={0.1}
          >
            <div className="relative aspect-[3/4] w-full animate-[hero-float_5.5s_ease-in-out_-2s_infinite] motion-reduce:animate-none">
              <Image
                src="/images/hero/globo-izquierdo.webp"
                alt="Arreglo de globo burbuja lateral izquierdo"
                fill
                sizes="(min-width: 1024px) 20rem, (min-width: 640px) 12rem, 5rem"
                className="object-contain"
              />
            </div>
          </BalloonSlot>

          {/* Central: dominante; define la caja y el corrimiento vertical del trío. */}
          <BalloonSlot
            id="globo-central"
            className="relative z-10 -mt-40 w-72 shrink-0 sm:-mt-56 sm:w-96 lg:-mt-[20rem] lg:w-[50rem]"
            origin={isMobile ? undefined : "50% 100%"}
            hidden={hiddenCentral}
            delay={0.15}
            duration={isMobile ? 0.5 : ENTER.duration}
          >
            <div className="relative aspect-[3/4] w-full animate-[hero-float_7s_ease-in-out_infinite] motion-reduce:animate-none">
              <Image
                src="/images/hero/globo-central.webp"
                alt="Arreglo de globo burbuja con globos rosas y caja de regalo"
                fill
                priority
                sizes="(min-width: 1024px) 50rem, (min-width: 640px) 24rem, 18rem"
                className="object-contain"
              />
            </div>
          </BalloonSlot>

          {/* Derecho: capa libre — espejo del izquierdo.
              ─ DESKTOP (lg:) ─
              · Eje X: lg:-ml-100 (más valor = más pegado al central).
              · Eje Y: lg:-bottom-N lo baja; lg:bottom-N lo subiría.
              · Tamaño: lg:w-180.
              · Inclinación: rotate-10 (positivo = punta hacia la derecha;
                ej. rotate-12 más tumbado, rotate-3 más leve, rotate-0 recto).
              · Encima/detrás: z-0 detrás, z-20 encima. */}
          <BalloonSlot
            id="globo-der"
            className="absolute bottom-0 left-full z-0 -ml-35 w-45 shrink-0 rotate-10 sm:-ml-12 sm:w-48 lg:-bottom-[50px] lg:-ml-100 lg:w-180"
            origin="50% 100%"
            hidden={{ opacity: 0, y: 60, scale: 0.9 }}
            delay={0.25}
          >
            <div className="relative aspect-[3/4] w-full animate-[hero-float_5.5s_ease-in-out_-3.5s_infinite] motion-reduce:animate-none">
              <Image
                src="/images/hero/globo-derecho.webp"
                alt="Arreglo de globo burbuja lateral derecho"
                fill
                sizes="(min-width: 1024px) 20rem, (min-width: 640px) 12rem, 5rem"
                className="object-contain"
              />
            </div>
          </BalloonSlot>
        </div>
      </div>
    </section>
  );
}
