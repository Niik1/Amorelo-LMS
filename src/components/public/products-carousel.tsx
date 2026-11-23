// Carrusel de productos (desktop + mobile): escenario infinito con la misma
// animación — en desktop las vecinas asoman a los bordes recortadas e
// inclinadas (como el mock); en mobile solo se ve la central y las vecinas
// esperan fuera de pantalla (entran deslizándose, nunca aparecen de golpe).
// La activa va al centro recta sobre el medallón, más dos puestos fantasma
// fuera de pantalla en desktop donde espera la foto que viene. El arrastre
// es 1 a 1 e infinito (en mobile, táctil); al soltar se acomoda al centro.
// Las flechas ← → viajan con la misma vuelta circular (desktop: ocultas,
// mobile: visibles abajo).
// Textos, botón y anillos quedan quietos en el server component.

"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductSlide } from "@/lib/product-slides";

// Foto de un puesto (se reutiliza en puestos reales y fantasmas).
function SlidePhoto({
  photo,
  isCenter,
  held,
  reduceMotion,
  dir,
}: {
  photo: ProductSlide;
  isCenter: boolean;
  held: boolean;
  reduceMotion: boolean;
  dir: 1 | -1;
}) {
  return (
    <motion.div
      key={photo.src}
      initial={
        held || reduceMotion
          ? false
          : { opacity: 0, x: dir * (isCenter ? 90 : 40) }
      }
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative h-full w-full"
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        draggable={false}
        priority={isCenter}
        loading={isCenter ? undefined : "lazy"}
        sizes="(min-width: 1024px) 18rem, 16rem"
        className="object-contain"
      />
    </motion.div>
  );
}

// Si al soltar ya recorriste esta fracción del camino (el centro salió del
// círculo), el cambio se completa solo; si no, vuelve atrás.
const COMMIT_RATIO = 0.25;

export function ProductsCarousel({ slides }: { slides: ProductSlide[] }) {
  const total = slides.length;
  const reduceMotion = !!useReducedMotion();
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  // held: el puntero está abajo (durante el arrastre no hay animación de
  // entrada, la foto sigue a la mano 1 a 1).
  const [held, setHeld] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const flying = useRef(false);
  // off: desplazamiento actual del escenario; step: distancia centro→vecina
  // medida en este viewport (se mide una vez por gesto).
  const drag = useRef({
    startX: 0,
    off: 0,
    dragging: false,
    moved: false,
    step: 0,
  });
  // shift: corrimiento de los puestos fantasma (un paso entero, medido del
  // layout real; se actualiza al cambiar el viewport).
  const [shift, setShift] = useState(0);

  // Los puestos reales se buscan por data-slot: los fantasmas son hermanos
  // posteriores y nunca alteran la medición ni el agarre.
  const slotEl = (offset: -1 | 0 | 1) =>
    stageRef.current?.querySelector(`[data-slot="${offset}"]`) ?? null;

  useLayoutEffect(() => {
    const measure = () => {
      const left = slotEl(-1);
      const center = slotEl(0);
      if (!left || !center) return;
      const cx = (el: Element) => {
        const b = el.getBoundingClientRect();
        return b.left + b.width / 2;
      };
      const s = cx(center) - cx(left);
      if (s > 0) setShift(s);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  if (total === 0) return null;

  // Puesto -1/0/+1 con vuelta circular: del último se vuelve al primero.
  const at = (offset: number) => slides[(active + offset + total) % total];

  const advance = (d: 1 | -1) => {
    setDir(d);
    setActive((a) => (a + d + total) % total);
  };

  // Distancia en px entre el centro y la vecina (solo puestos reales).
  const measureStep = (toLeft: boolean) => {
    const left = slotEl(-1);
    const center = slotEl(0);
    const right = slotEl(1);
    if (!left || !center || !right) return 0;
    const cx = (el: Element) => {
      const b = el.getBoundingClientRect();
      return b.left + b.width / 2;
    };
    return toLeft ? cx(center) - cx(left) : cx(right) - cx(center);
  };

  // Viaje animado hasta la vecina con enderezado: el escenario se traslada
  // y, a la vez, la foto que entra gira de ±15° a 0° y la que sale de 0° a
  // ∓15°. Al llegar se rota (vuelta infinita) sin salto visual.
  const travel = (d: 1 | -1, durationMs: number) => {
    const stage = stageRef.current;
    const step =
      drag.current.step > 0 ? drag.current.step : measureStep(d === 1);
    if (!stage || !step || total < 2) {
      advance(d);
      return;
    }
    if (reduceMotion) {
      advance(d);
      return;
    }
    flying.current = true;
    setHeld(true);
    // Se animan los puestos reales (los fantasmas viajan con el escenario).
    const entering = slotEl(d) as HTMLElement | null;
    const exiting = slotEl(0) as HTMLElement | null;
    if (!entering || !exiting) {
      advance(d);
      return;
    }
    const tilt = d === 1 ? 15 : -15;
    const anims = [
      entering.animate([{ rotate: `${tilt}deg` }, { rotate: "0deg" }], {
        duration: durationMs,
        easing: "ease-out",
        fill: "forwards",
      }),
      exiting.animate([{ rotate: "0deg" }, { rotate: `${-tilt}deg` }], {
        duration: durationMs,
        easing: "ease-out",
        fill: "forwards",
      }),
    ];
    stage.style.transition = `transform ${durationMs}ms ease-out`;
    stage.style.transform = `translateX(${-d * step}px)`;
    window.setTimeout(() => {
      advance(d);
      anims.forEach((a) => a.cancel());
      stage.style.transition = "none";
      stage.style.transform = "translateX(0px)";
      // held se libera después del reacomodo: así la foto no reproduce la
      // animación de entrada al nacer en el centro (ese era el saltito).
      window.setTimeout(() => {
        setHeld(false);
        flying.current = false;
      }, 80);
    }, durationMs + 20);
  };

  // Flechas: viajan hasta la vecina con enderezado (vuelta infinita).
  const go = (d: 1 | -1) => {
    if (flying.current || total < 2) return;
    travel(d, 450);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (flying.current) return;
    stageRef.current?.setPointerCapture(e.pointerId);
    const el = stageRef.current;
    if (el) {
      el.style.transition = "none";
      el.style.transform = "translateX(0px)";
    }
    drag.current = {
      startX: e.clientX,
      off: 0,
      dragging: true,
      moved: false,
      step: 0,
    };
    setHeld(true);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const dr = drag.current;
    if (!dr.dragging) return;
    let next = e.clientX - dr.startX;
    if (Math.abs(next) > 10) dr.moved = true;
    if (!dr.step) {
      const s = measureStep(next < 0);
      if (s > 0) dr.step = s;
    }
    if (dr.step > 0) {
      // Al recorrer una distancia completa la vecina queda justo al centro:
      // se rota y el escenario se recentra sin salto visual. Así se puede
      // arrastrar eternamente, pasando y pasando fotos.
      while (next <= -dr.step) {
        advance(1);
        next += dr.step;
        dr.startX -= dr.step;
      }
      while (next >= dr.step) {
        advance(-1);
        next -= dr.step;
        dr.startX += dr.step;
      }
    }
    dr.off = next;
    const el = stageRef.current;
    if (el) {
      el.style.transition = "none";
      el.style.transform = `translateX(${next}px)`;
    }
  };

  const endDrag = () => {
    const dr = drag.current;
    if (!dr.dragging) return;
    dr.dragging = false;
    // Si el centro ya salió del círculo, se completa el cambio con viaje
    // animado (desliza + endereza lento); si no, vuelve atrás.
    const step = dr.step > 0 ? dr.step : measureStep(dr.off < 0);
    const d: 1 | -1 = dr.off < 0 ? 1 : -1;
    if (step > 0 && Math.abs(dr.off) >= step * COMMIT_RATIO) {
      travel(d, 600);
      return;
    }
    setHeld(false);
    const el = stageRef.current;
    if (el) {
      el.style.transition = reduceMotion ? "none" : "transform 0.3s ease-out";
      el.style.transform = "translateX(0px)";
    }
  };

  // Puestos: en mobile solo la central es visible (las vecinas esperan
  // fuera de pantalla, sin inclinar para que no asome ni un filo; al viajar
  // se inclinan igual por la animación); en desktop (sm:) asoman recortadas
  // e inclinadas. Las clases sm:/lg: son las originales de desktop, intactas.
  const slotClass = (offset: -1 | 0 | 1) => {
    if (offset === 0)
      return "absolute top-1/2 left-1/2 aspect-[3/4] w-80 -translate-x-1/2 -translate-y-1/2 sm:w-72 sm:-translate-y-92 lg:w-140";
    if (offset === -1)
      return "absolute top-1/2 left-0 aspect-[3/4] w-80 -translate-x-full -translate-y-1/2 sm:w-48 sm:-translate-x-75 sm:-translate-y-92 sm:-rotate-15 lg:w-140";
    return "absolute top-1/2 right-0 aspect-[3/4] w-80 -translate-y-1/2 translate-x-full sm:w-48 sm:translate-x-75 sm:-translate-y-92 sm:rotate-15 lg:w-140";
  };

  return (
    <div className="pointer-events-auto absolute inset-0">
      {/* Contador vivo con vuelta circular (solo desktop; en mobile lo pinta
          el bloque mobile de abajo). */}
      <p
        aria-live="polite"
        aria-label={`Producto ${active + 1} de ${total}`}
        className="font-heading absolute top-6 right-6 hidden text-2xl font-extrabold text-[#FFF4E3] tabular-nums sm:top-70 sm:right-70 sm:block sm:text-6xl"
      >
        {active + 1}/{total}
      </p>

      {/* Mobile: contador vivo + flechas (solo mobile). La foto la pinta el
          escenario compartido (puesto central). */}
      <div className="absolute inset-0 sm:hidden">
        <p
          aria-live="polite"
          aria-label={`Producto ${active + 1} de ${total}`}
          className="font-heading absolute top-18 right-6 text-5xl font-extrabold text-[#FFF4E3] tabular-nums"
        >
          {active + 1}/{total}
        </p>

        <div className="absolute bottom-25 left-1/2 flex -translate-x-1/2 items-center gap-40">
          <button
            type="button"
            aria-label="Producto anterior"
            onClick={() => go(-1)}
            className="text-[#FFF4E3] transition-opacity hover:opacity-80"
          >
            <ChevronLeft className="size-10" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Producto siguiente"
            onClick={() => go(1)}
            className="text-[#FFF4E3] transition-opacity hover:opacity-80"
          >
            <ChevronRight className="size-10" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Escenario compartido desktop + mobile: solo se mueven las fotos.
          En mobile el centro coincide con la foto anterior (misma posición
          y tamaño) y las vecinas quedan fuera de pantalla. */}
      <div
        ref={stageRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Productos"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ touchAction: "pan-y" }}
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 cursor-grab touch-pan-y select-none active:cursor-grabbing"
      >
        {([-1, 0, 1] as const).map((offset) => {
          const photo = at(offset);
          const isCenter = offset === 0;
          return (
            <div
              key={offset}
              data-slot={offset}
              role="group"
              aria-roledescription="slide"
              aria-label={`${((active + offset + total) % total) + 1} de ${total}`}
              className={slotClass(offset)}
              onClick={() => {
                if (drag.current.moved || isCenter) return;
                go(offset);
              }}
            >
              <SlidePhoto
                photo={photo}
                isCenter={isCenter}
                held={held}
                reduceMotion={reduceMotion}
                dir={dir}
              />
            </div>
          );
        })}

        {/* Puestos fantasma: clones exactos de las vecinas dentro de un
            envoltorio SIN rotar que solo los corre un paso hacia afuera. La
            foto que viene ya espera fuera de pantalla e ingresa deslizándose
            en X a la misma altura (nunca aparece de golpe). No participan en
            medición, agarre ni clicks: pura escenografía. */}
        {([-2, 2] as const).map((offset) => (
          <div
            key={`fantasma-${offset}`}
            aria-hidden="true"
            className="absolute inset-0 hidden sm:block"
            style={{
              transform: `translateX(${offset < 0 ? -shift : shift}px)`,
            }}
          >
            <div role="presentation" className={slotClass(offset < 0 ? -1 : 1)}>
              <SlidePhoto
                photo={at(offset)}
                isCenter={false}
                held={held}
                reduceMotion={reduceMotion}
                dir={dir}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
