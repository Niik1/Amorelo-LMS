"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Frases rotativas para la columna izquierda (Globos Burbuja & Academia Amorelo)
export const FRASES_INFORMATIVAS = [
  {
    titulo: "Domina la técnica del globo burbuja perfecto",
    descripcion:
      "Aprende los secretos de estirado, inflado sin arrugas, sellado duradero y acabados impecables desde cero.",
  },
  {
    titulo: "Crea arreglos únicos que enamoren a tus clientes",
    descripcion:
      "Descubre cómo combinar rellenos con plumas, confeti, luces led, flores y vinilos personalizados de alta calidad.",
  },
  {
    titulo: "Transforma tu creatividad en un negocio rentable",
    descripcion:
      "Aprende a costear tus materiales, fijar precios justos y vender arreglos cotizados para toda ocasión especial.",
  },
  {
    titulo: "Tu academia de globos disponible las 24 horas",
    descripcion:
      "Accede a lecciones detalladas en video, guías de proveedores y acompañamiento paso a paso cuando tú decidas.",
  },
  {
    titulo: "De aficionada a experta en decoración con globos",
    descripcion:
      "Perfecciona tus técnicas con métodos probados que garantizan arreglos profesionales y duraderos.",
  },
];

export function AuthPanelLateral() {
  const [fraseActual, setFraseActual] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setFraseActual((prev) => (prev + 1) % FRASES_INFORMATIVAS.length);
    }, 5000);
    return () => clearInterval(intervalo);
  }, []);

  const frase = FRASES_INFORMATIVAS[fraseActual];

  return (
    <div className="hidden lg:flex p-4 sm:p-5">
      <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[26px] bg-[#1A73E8] p-8 pb-0 text-white shadow-inner transition-colors dark:bg-gradient-to-br dark:from-[#1E3A8A] dark:via-[#152764] dark:to-[#0B153D] dark:border dark:border-blue-400/20">
        {/* Adorno decorativo de luz/glow superior */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/20 blur-2xl dark:bg-blue-400/20"
        />

        {/* Frases rotativas (Header del panel izquierdo) */}
        <div className="relative z-10 flex flex-col">
          {/* Contenedor animado de la frase */}
          <div
            key={fraseActual}
            className="mt-2 flex flex-col transition-all duration-500 ease-out"
          >
            <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-white lg:text-[28px]">
              {frase.titulo}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-blue-100/90 dark:text-blue-200/80">
              {frase.descripcion}
            </p>
          </div>

          {/* Indicadores de frases (dots) */}
          <div className="mt-5 flex items-center gap-1.5">
            {FRASES_INFORMATIVAS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setFraseActual(idx)}
                aria-label={`Ir a frase ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === fraseActual
                    ? "w-6 bg-white"
                    : "w-1.5 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Ilustración / Avatar de Academia Amorelo */}
        <div className="relative z-10 flex flex-1 items-end justify-center w-full">
          <div className="relative w-full max-w-[420px] flex items-end justify-center">
            <Image
              src="/images/login/avatarlogin.webp"
              alt="Academia de Globos Amorelo"
              width={480}
              height={372}
              priority
              className="w-full h-auto object-contain drop-shadow-2xl transition-transform duration-500 scale-[1.6] origin-bottom translate-y-15 hover:scale-[1.65]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
