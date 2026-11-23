// Pase de fotos del taller: las 8 de `public/images/eventos/` rotan con
// fundido. Respeta reduced-motion (foto fija) y pausa con pestaña oculta.

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "motion/react";

const PHOTOS = Array.from(
  { length: 8 },
  (_, i) => `/images/eventos/${i + 1}.webp`,
);

const INTERVAL_MS = 4000;

export function OwnerSlideshow() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    let id = window.setInterval(
      () => setActive((a) => (a + 1) % PHOTOS.length),
      INTERVAL_MS,
    );
    const onVisibility = () => {
      window.clearInterval(id);
      if (!document.hidden) {
        id = window.setInterval(
          () => setActive((a) => (a + 1) % PHOTOS.length),
          INTERVAL_MS,
        );
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduceMotion]);

  return (
    <div className="bg-bg-alt relative aspect-square w-full overflow-hidden rounded-3xl">
      {PHOTOS.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={`Foto ${i + 1} de eventos de Amorelo`}
          fill
          sizes="(min-width: 768px) 40vw, 90vw"
          priority={i === 0}
          loading={i === 0 ? undefined : "lazy"}
          className={`object-cover transition-opacity duration-1000 motion-reduce:transition-none ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}
