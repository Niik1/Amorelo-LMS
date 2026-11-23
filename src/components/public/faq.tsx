// Sección Preguntas frecuentes: título + subtítulo + CTA a la izquierda,
// acordeón en píldoras a la derecha (la abierta muestra la respuesta adentro).

"use client";

import { useState } from "react";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/public/button";
import { CtaWhatsApp } from "@/components/public/cta-whatsapp";

const FAQS = [
  {
    q: "¿Necesito experiencia previa?",
    a: "No. La MasterClass empieza desde cero: el primer curso cubre materiales, herramientas y tu primer globo burbuja. Si ya tienes experiencia, igual encontrarás técnicas avanzadas en los niveles 2 y 3.",
  },
  {
    q: "¿Qué incluye la MasterClass?",
    a: "Los 8 cursos completos: Básico, Intermedio y Avanzado, técnicas de armado profesional y el curso de costos. Incluye lista de materiales y proveedores para que no compres de más.",
  },
  {
    q: "¿Para qué sirve el curso de costos?",
    a: "Para que sepas exactamente qué precio ponerle a cada detalle: calculas materiales, tiempo y ganancia, y dejas de trabajar sin ganar dinero real.",
  },
  {
    q: "¿Cómo son las clases?",
    a: "Son en vivo por Zoom los lunes, miércoles y viernes de 7:00 a 10:00 de la noche. Si no puedes asistir, la grabación queda disponible desde el día siguiente para que la veas a tu ritmo.",
  },
  {
    q: "¿Y si me pierdo una clase en vivo?",
    a: "No pasa nada: todas las clases quedan grabadas y puedes verlas desde el día siguiente, las veces que quieras.",
  },
  {
    q: "¿Cuánto cuesta?",
    a: "El precio actual y las facilidades de pago están en la sección de Precio. Y si tienes dudas, escríbenos por WhatsApp y te ayudamos a inscribirte.",
  },
] as const;

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    // Franja del color de reseñas detrás: las puntas superiores recortan
    // sobre bg-alt en vez del crema del fondo general.
    <div className="bg-bg-alt">
      <section
        id="faq"
        aria-labelledby="faq-title"
        className="scroll-mt-20 rounded-t-[2.5rem] bg-[#E7F0FE]"
      >
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-10 px-6 py-16 sm:py-20 md:grid-cols-[1fr_1.5fr] md:gap-12 lg:max-w-7xl">
          <div>
            <h2
              id="faq-title"
              className="font-heading text-text-heading text-4xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-5xl"
            >
              Preguntas frecuentes
            </h2>
            <p className="text-text-body mt-3 max-w-xl text-base leading-relaxed text-pretty sm:text-lg">
              Lo que suelen preguntar antes de empezar.
            </p>
            <Button
              render={
                <CtaWhatsApp boton="faq" />
              }
              nativeButton={false}
              className="relative mt-8 h-13 overflow-hidden bg-white pr-2 pl-10 text-lg text-[#1F3A6E] transition-colors duration-300 hover:bg-white active:bg-white"
            >
              <span
                aria-hidden="true"
                className="absolute -inset-px origin-right scale-x-0 bg-[#1F3A6E] transition-transform duration-300 ease-out group-hover/button:scale-x-100 motion-reduce:transition-none"
              />
              <span className="relative z-10 flex items-center gap-3 transition-colors duration-300 group-hover/button:text-white">
                Inscribirme
                <span
                  aria-hidden="true"
                  className="inline-flex size-10 items-center justify-center rounded-full bg-[#1F3A6E] text-white transition-colors duration-300 group-hover/button:bg-white group-hover/button:text-[#1F3A6E]"
                >
                  <ArrowRightIcon className="size-5" />
                </span>
              </span>
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            {FAQS.map((faq, i) => {
              const isOpen = open === i;
              return (
                <div
                  key={faq.q}
                  className="overflow-hidden rounded-[2.5rem] bg-white"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="focus-visible:ring-text-heading flex w-full items-center justify-between gap-4 px-6 py-5 text-left focus-visible:ring-2 focus-visible:outline-none sm:px-8"
                  >
                    <span className="font-heading text-text-heading text-lg font-extrabold sm:text-xl">
                      {faq.q}
                    </span>
                    <span
                      aria-hidden="true"
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#1F3A6E] text-[#FFF4E3]"
                    >
                      <span className="relative block size-4">
                        <span className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 rounded-full bg-current" />
                        <span
                          className={`absolute top-0 left-1/2 h-full w-0.5 -translate-x-1/2 rounded-full bg-current transition-transform duration-300 motion-reduce:transition-none ${
                            isOpen ? "scale-y-0" : "scale-y-100"
                          }`}
                        />
                      </span>
                    </span>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                      isOpen
                        ? "grid-rows-[1fr] duration-[350ms]"
                        : "grid-rows-[0fr] duration-300"
                    }`}
                  >
                    <div
                      className={`overflow-hidden transition-opacity ease-[cubic-bezier(0.25,0.1,0.25,1)] motion-reduce:transition-none ${
                        isOpen
                          ? "opacity-100 delay-50 duration-[250ms]"
                          : "opacity-0 duration-150"
                      }`}
                    >
                      <p className="text-text-body px-6 pt-1 pb-7 text-base leading-relaxed sm:px-8">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
