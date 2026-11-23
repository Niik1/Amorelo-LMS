// Sección Productos (Fase 2: carrusel con flechas + arrastre en desktop).
// Full-bleed de extremo a extremo para que las fotos laterales se recorten
// en el borde del viewport como en el mock. Textos, botón y anillos quietos;
// el carrusel cliente mueve solo las fotos y el numerador del contador.
// En mobile queda la foto estática hasta la pasada mobile.
// Sin pedestal: entra después como webp aparte cuando lo pasen.
// Para agregar productos: fotos numeradas en `public/images/productos/`
// (01-*.webp, 02-*.webp...) y entran solas al listado y al contador.

import Image from "next/image";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/public/button";
import { CtaWhatsApp } from "@/components/public/cta-whatsapp";
import { ProductsBackdrop } from "@/components/public/products-backdrop";
import { ProductsCarousel } from "@/components/public/products-carousel";
import { getProductSlides } from "@/lib/product-slides";

// CTA "Quiero Aprender" con barrido marino (misma receta del sitio).
// Se instancia dos veces: en flujo bajo el título (solo mobile) y flotante
// junto al pedestal (solo desktop).
function ProductsCtaButton({
  className = "",
  wrapperClassName = "",
}: {
  className?: string;
  wrapperClassName?: string;
}) {
  return (
    // z-20: queda por encima del layer del carrusel (absolute inset-0),
    // si no el carrusel tapa el botón y el clic nunca llega al ancla.
    <div className={`relative z-20 ${wrapperClassName}`}>
      <Button
        render={
          <CtaWhatsApp boton="productos" />
        }
        nativeButton={false}
        className={`pointer-events-auto relative overflow-hidden bg-white pr-2 pl-7 text-[#38241a] transition-colors duration-300 hover:bg-white active:bg-white ${className}`}
      >
        <span
          aria-hidden="true"
          className="absolute -inset-px origin-right scale-x-0 bg-[#1F3A6E] transition-transform duration-300 ease-out group-hover/button:scale-x-100 motion-reduce:transition-none"
        />
        <span className="relative z-10 flex items-center gap-3 transition-colors duration-300 group-hover/button:text-white">
          Quiero Aprender
          <span
            aria-hidden="true"
            className="inline-flex size-8 items-center justify-center rounded-full bg-[#1F3A6E] text-white transition-colors duration-300 group-hover/button:bg-white group-hover/button:text-[#1F3A6E] sm:size-10"
          >
            <ArrowRightIcon className="size-4 sm:size-5" />
          </span>
        </span>
      </Button>
    </div>
  );
}

export async function Products() {
  const slides = await getProductSlides();

  return (
    <section
      id="productos"
      aria-label="Productos"
      className="bg-bg-alt scroll-mt-20 overflow-x-clip"
    >
      {/* Onda superior: curva bg-alt sobre el brand (transición desde Cursos). */}
      <div aria-hidden="true" className="relative w-full bg-[#1A73E8]">
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="block h-16 w-full sm:h-24"
        >
          <path
            d="M1460 90 C 1200 8 960 8 720 60 S 240 100 -20 55 L-20 0 L1460 0 Z"
            className="fill-bg-alt"
          />
        </svg>
      </div>

      {/* Cuerpo brand full-bleed: escenografía fija + overlay del mock. */}
      <div className="bg-[#1A73E8]">
        <div className="relative w-full py-14 sm:py-20">
          <ProductsBackdrop className="relative left-1/2 block w-[160vw] max-w-none -translate-x-1/2 sm:w-[min(120vw,1100px)]" />

          {/* Overlay: textos y botón quietos (Fase 2). El contador y las fotos
              vivas están en el carrusel cliente. */}
          <div className="pointer-events-none absolute inset-0">
            {/* BLOQUE TEXTO + BOTÓN mobile (en desktop el botón vive junto
                al pedestal). */}
            <div className="absolute top-6 left-6 max-w-[240px] sm:top-55 sm:left-44 sm:max-w-2xl">
              <p className="text-sm leading-snug font-semibold text-[#FFF4E3] sm:text-2xl">
                Esto es exactamente lo que
              </p>
              <p className="font-heading mt-1 text-5xl leading-[1.05] font-extrabold text-[#FFF4E3] sm:text-7xl">
                Lograras crear
              </p>
              <ProductsCtaButton wrapperClassName="mt-4 sm:hidden" />
            </div>

            {/* BOTÓN desktop junto al pedestal (lado izquierdo, abajo). */}
            <ProductsCtaButton
              wrapperClassName="absolute bottom-6 left-6 hidden sm:bottom-70 sm:left-[23%] sm:block"
              className="sm:h-13 sm:pl-10 sm:text-lg"
            />

            {/* PEDESTAL (escenografía fija, detrás de las fotos, misma capa
                que los anillos). Para posicionarlo vos:
                - X: `left-1/2` (con `-translate-x-1/2` queda centrado; subí o
                  bajá el `left-*` para moverlo a los costados).
                - Y: `translate-y-[120px]` en mobile y `lg:translate-y-[260px]`
                  en desktop (más número = más abajo).
                - Tamaño: `w-48` en mobile y `lg:w-64` en desktop. */}
            <div
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 aspect-square w-100 -translate-x-1/2 translate-y-[100px] lg:w-180 lg:translate-y-[178px]"
            >
              <Image
                src="/images/productos/pedestal.webp"
                alt=""
                fill
                sizes="(min-width: 1024px) 16rem, 12rem"
                className="object-contain"
              />
            </div>

            {/* Carrusel desktop: flechas + arrastre, contador vivo. Las fotos
                van POR DELANTE del pedestal (este bloque está después). */}
            <ProductsCarousel slides={slides} />
          </div>
        </div>
      </div>

      {/* Onda inferior: vive en Precio (su borde de arriba, precio.tsx),
          que comparte el fondo crema y empalma sin cortes. */}
    </section>
  );
}
