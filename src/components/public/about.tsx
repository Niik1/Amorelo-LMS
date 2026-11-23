// Sección Sobre mí: foto del dueño + presentación del taller.
// La foto va en public/images/sobre-mi/dueno.webp (cuadrado).
// TODO(sobre-mi): agregar la foto real con ese nombre (sin código).
// NOTA: la onda superior se mudó a la sección Precio (precio.tsx), que
// comparte este mismo fondo para empalmar sin cortes.

import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/public/button";
import { CtaWhatsApp } from "@/components/public/cta-whatsapp";
import { OwnerSlideshow } from "@/components/public/owner-slideshow";

const TAGS = [
  "Globos burbuja",
  "Enseño desde cero",
  "Detalles para vender",
] as const;

export function About() {
  return (
    <section
      id="sobre-mi"
      aria-labelledby="about-title"
      className="bg-bg-alt relative scroll-mt-20"
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 sm:py-20 md:grid-cols-[40%_60%] md:gap-14">
        {/* Fotos del taller con fundido automático. */}
        <div className="order-2 mx-auto w-full max-w-sm md:order-1 md:max-w-none">
          <OwnerSlideshow />
        </div>

        <div className="order-1 md:order-2">
          <p className="inline-flex items-center rounded-full bg-[#1F3A6E] px-5 py-1.5 text-xs font-bold tracking-[0.18em] text-[#FFF4E3] uppercase">
            Sobre mí
          </p>

          <h2
            id="about-title"
            className="font-heading text-text-heading mt-4 text-4xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-5xl"
          >
            Detrás de El taller de Amorelo
          </h2>

          <p className="text-text-body mt-4 text-base leading-relaxed text-pretty sm:text-lg">
            Hola soy Brayan Rodriguez me dedico a armar detalles con globos
            burbuja y a enseñar a otras personas a hacerlo, empezando desde
            cero.
          </p>
          <p className="text-text-body mt-3 text-base leading-relaxed text-pretty sm:text-lg">
            Creé esta MasterClass para que aprendas las técnicas, armes tus
            propios detalles y sepas qué precio ponerles para empezar a generar
            ingresos.
          </p>

          <ul className="mt-6 flex flex-wrap gap-3">
            {TAGS.map((tag) => (
              <li
                key={tag}
                className="border-text-heading text-text-heading rounded-full border-2 bg-white px-5 py-2 text-sm font-bold"
              >
                {tag}
              </li>
            ))}
          </ul>

          <Button
            render={
              <CtaWhatsApp boton="sobre-mi" />
            }
            nativeButton={false}
            className="relative mt-8 h-12 overflow-hidden bg-[#1F3A6E] pr-2 pl-8 text-lg text-[#FFF4E3] transition-colors duration-300 hover:border-[#1F3A6E]/40 hover:bg-[#1F3A6E] active:bg-[#1F3A6E]"
          >
            <span
              aria-hidden="true"
              className="absolute -inset-px origin-right scale-x-0 bg-white transition-transform duration-300 ease-out group-hover/button:scale-x-100 motion-reduce:transition-none"
            />
            <span className="relative z-10 flex items-center gap-2 transition-colors duration-300 group-hover/button:text-[#1F3A6E]">
              Quiero aprender contigo
              <span
                aria-hidden="true"
                className="inline-flex size-9 items-center justify-center rounded-full bg-[#FFF4E3] text-[#1F3A6E] transition-colors duration-300 group-hover/button:bg-[#1F3A6E] group-hover/button:text-white"
              >
                <ArrowRightIcon className="size-4" />
              </span>
            </span>
          </Button>
        </div>
      </div>
    </section>
  );
}
