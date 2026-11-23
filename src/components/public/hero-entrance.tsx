// Entrada escalonada de la columna izquierda del hero: subida leve
// (16px, 700ms ease-out), un item detras del otro con ~90ms de retardo.
// SIN fade de opacity: LCP no pinta elementos con opacity 0, así que el
// texto protagonista del hero queda visible desde el SSR y la animación
// solo mueve transform (no layout, no CLS). El fade disable queda para
// secciones bajo el pliegue. Con reduced-motion todo directo.
// Solo animacion de montaje: corre una vez al cargar/recargar.

"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { cn } from "cn";

const STAGGER_MS = 90;

const ReadyContext = createContext(false);

export function HeroEntrance({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return <ReadyContext.Provider value={ready}>{children}</ReadyContext.Provider>;
}

export function HeroEntranceItem({
  index,
  children,
  className,
}: {
  index: number;
  children: ReactNode;
  className?: string;
}) {
  const ready = useContext(ReadyContext);

  return (
    <div
      className={cn(
        "transition-transform duration-700 ease-out motion-reduce:transition-none",
        ready ? "translate-y-0" : "translate-y-4",
        className,
      )}
      style={{ transitionDelay: `${index * STAGGER_MS}ms` }}
    >
      {children}
    </div>
  );
}
