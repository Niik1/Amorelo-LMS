// Sección Reseñas: lo que dicen los estudiantes. Marquesina infinita de
// borde a borde (lista duplicada, loop perfecto), pausa en hover/foco/toque
// y quieta con reduced-motion. Sin puntitos ni paginado.
// Reseñas estáticas: se editan en REVIEWS y quedan fijas.

"use client";

import { QuoteIcon, StarIcon } from "lucide-react";
import { useReducedMotion } from "motion/react";

type Review = {
  name: string;
  role: string;
  text: string;
};

const REVIEWS: Review[] = [
  {
    name: "María Torres",
    role: "Estudiante de la MasterClass",
    text: "Empecé sin saber ni inflar un globo y a las tres semanas vendí mi primer arreglo para un cumpleaños. El curso de costos me salvó de regalar mi trabajo.",
  },
  {
    name: "Josué Ramos",
    role: "Estudiante de la MasterClass",
    text: "Lo que más me sirvió fueron las técnicas de armado paso a paso. Pauso el video, practico y sigo. Hoy ya tengo pedidos todos los fines de semana.",
  },
  {
    name: "Carmen Vega",
    role: "Estudiante de la MasterClass",
    text: "Tenía miedo de arruinar material, así que nunca probaba nada nuevo. Con la MasterClass me animé y mi catálogo se triplicó en dos meses.",
  },
  {
    name: "Luis Paredes",
    role: "Estudiante de la MasterClass",
    text: "Yo solo quería un ingreso extra y terminé dejando mi otro trabajo. Aprender a calcular cada precio fue lo que cambió todo.",
  },
  {
    name: "Rosa Mendoza",
    role: "Estudiante de la MasterClass",
    text: "Los globos burbuja me parecían imposibles. La explicación es tan clara que mi primer arreglo salió a la primera. Mis clientas no lo creen.",
  },
  {
    name: "Diego Flores",
    role: "Estudiante de la MasterClass",
    text: "La lista de materiales y proveedores me ahorró un montón de plata en compras al tanteo. Ojalá lo hubiera tenido antes de empezar solo.",
  },
] as const;

export function Reviews() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      aria-labelledby="reviews-title"
      className="bg-bg-alt overflow-x-clip"
    >
      <div className="mx-auto w-full max-w-6xl px-6 pt-16 sm:pt-20">
        <p className="inline-flex items-center rounded-full bg-[#16294F] px-5 py-1.5 text-xs font-bold tracking-[0.18em] text-[#FFF4E3] uppercase">
          Reseñas
        </p>
        <h2
          id="reviews-title"
          className="font-heading text-text-heading mt-4 text-4xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-5xl"
        >
          Lo que dicen mis estudiantes
        </h2>
        <p className="text-text-body mt-3 max-w-2xl text-base leading-relaxed text-pretty sm:text-lg">
          Personas que empezaron desde cero y ya arman sus propios detalles.
        </p>
      </div>

      <div className="mt-10 pb-16 sm:pb-20">
        <div
          className="animate-marquee flex w-max motion-reduce:animate-none"
          style={{ animationPlayState: reduceMotion ? "paused" : "running" }}
        >
          {[...REVIEWS, ...REVIEWS].map((review, i) => (
            <article
              key={`${review.name}-${i}`}
              aria-hidden={i >= REVIEWS.length ? true : undefined}
              className="border-border/70 mr-6 flex w-[300px] shrink-0 flex-col rounded-3xl border bg-white p-6 sm:w-[360px] sm:p-7"
            >
              <div className="flex gap-1" aria-label="5 de 5 estrellas">
                {Array.from({ length: 5 }, (_, s) => (
                  <StarIcon
                    key={s}
                    aria-hidden="true"
                    className="fill-amber-400 text-amber-400 size-5"
                  />
                ))}
              </div>
              <QuoteIcon
                aria-hidden="true"
                className="fill-brand text-brand mt-3 size-7"
              />
              <p className="text-text-body mt-2 flex-1 text-base leading-relaxed text-pretty">
                {review.text}
              </p>
              <div className="mt-5 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="font-heading text-text-heading inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-[#E7F0FE] text-xl font-extrabold"
                >
                  {review.name.charAt(0)}
                </span>
                <span>
                  <span className="text-text-heading block text-sm font-bold">
                    {review.name}
                  </span>
                  <span className="text-text-body block text-xs">
                    {review.role}
                  </span>
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
