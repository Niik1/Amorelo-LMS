// Sección Precio (#precio): card celeste con la masterclass y su precio.
// Datos vivos desde Supabase (`cursos`), sin ediciones ni cupos.
// Vive entre Productos y Sobre mí: trae la onda superior (antes en About)
// y comparte el fondo crema para empalmar sin cortes.
// Sin curso activo → estado "próximamente" + WhatsApp.
//
// Título, descripción y precios salen de `cursos`; el descuento sale de la
// oferta vigente: cupón live al aire, con respaldo en el cupón normal si el
// live no tiene cupón válido. El servidor calcula los importes de PEN y USD;
// el cliente solo alterna la moneda. La lista de "Lo que incluye" es copy fijo.

import {
  ArrowRightIcon,
  Check,
  MessageCircleIcon,
  VideoIcon,
} from "lucide-react";
import { Button } from "@/components/public/button";
import { CtaWhatsApp } from "@/components/public/cta-whatsapp";
import { PrecioCard } from "@/components/public/precio-card";
import { createPublicClient } from "@/lib/supabase/publico";
import { CURSO_SLUG } from "@/lib/config/curso";
import { calcularPrecio, redondear2 } from "@/lib/precios/calculo";
import {
  obtenerOfertaNormalPublica,
  obtenerOfertaPublica,
} from "@/server/oferta/publica";

const INCLUYE = [
  "Técnica Doble Stuff",
  "Pegado de confetti con micropartículas de agua",
  "Técnica de bolipor",
  "Marmoleado con pintura acrílica",
  "Encapsulado de flores artificiales sin cortar el globo",
  "Encapsulado de peluche",
  "Cono de helado dulcero",
  "Plantilla de costos y presupuestos",
] as const;

type CursoPrecio = {
  nombre: string;
  slug: string;
  descripcion: string | null;
  precio_pen: number;
  precio_usd: number | null;
};

async function getDatosPrecio(): Promise<{
  curso: CursoPrecio | null;
  /** Texto del descuento vigente ya formateado ("40%"). */
  tituloOferta: string | null;
  /** Porcentaje resuelto del cupón vigente, para calcular importes. */
  porcentajeOferta: number | null;
}> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("cursos")
    .select("nombre, slug, descripcion, precio_pen, precio_usd")
    .eq("slug", CURSO_SLUG)
    .eq("activo", true)
    .maybeSingle();
  if (error) throw new Error(error.message);

  // Live al aire sin cupón live válido (vencido o gastado) → respaldo en el
  // cupón normal en vez de quedarnos sin descuento. Fuera de live el mismo
  // resolver ya devuelve el cupón normal.
  const ofertaVigente = await obtenerOfertaPublica();
  const usaRespaldo =
    ofertaVigente.esLive && ofertaVigente.descuentoPorcentaje === null;
  const respaldo = usaRespaldo ? await obtenerOfertaNormalPublica() : null;

  const tituloOferta = (
    usaRespaldo ? respaldo?.descuentoTexto : ofertaVigente.descuentoTexto
  ) ?? null;
  const porcentajeOferta = (
    usaRespaldo ? respaldo?.descuentoPorcentaje : ofertaVigente.descuentoPorcentaje
  ) ?? null;

  return { curso: data, tituloOferta, porcentajeOferta };
}

function Chip({
  Icon,
  children,
}: {
  Icon: typeof VideoIcon;
  children: React.ReactNode;
}) {
  return (
    <li className="inline-flex items-center gap-2 rounded-full border border-[#1F3A6E]/10 bg-white px-4 py-2 text-sm font-bold text-[#38241a] shadow-sm">
      <Icon className="size-4 text-[#1A73E8]" aria-hidden="true" />
      {children}
    </li>
  );
}

function ListaIncluye({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-3.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#1F3A6E] text-white">
            <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
          </span>
          <span className="text-sm leading-snug font-semibold text-[#38241a]">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

export async function Precio() {
  let datos: Awaited<ReturnType<typeof getDatosPrecio>> | null = null;
  try {
    datos = await getDatosPrecio();
  } catch (e) {
    console.error(
      "[precio] sin datos vivos, muestro próximamente:",
      e instanceof Error ? e.message : e,
    );
  }

  const curso = datos?.curso ?? null;
  const tituloOferta = datos?.tituloOferta ?? null;

  const precioPen = curso ? Number(curso.precio_pen) : null;
  const precioUsd =
    curso?.precio_usd === null || curso?.precio_usd === undefined
      ? null
      : Number(curso.precio_usd);

  const descuentoOferta =
    datos?.porcentajeOferta !== null && datos?.porcentajeOferta !== undefined
      ? { tipo: "porcentaje" as const, valor: datos.porcentajeOferta }
      : null;
  const precioNormalPen =
    precioPen !== null && descuentoOferta
      ? calcularPrecio(precioPen, descuentoOferta)
      : null;
  const precioNormalUsd =
    precioUsd !== null && descuentoOferta
      ? calcularPrecio(precioUsd, descuentoOferta)
      : null;

  const cantidadCursos = INCLUYE.length;
  const precioFinalPen =
    precioPen !== null ? (precioNormalPen ?? precioPen) : null;
  const precioFinalUsd =
    precioUsd !== null ? (precioNormalUsd ?? precioUsd) : null;
  const ahorroPen =
    precioPen !== null && precioNormalPen !== null
      ? redondear2(precioPen - precioNormalPen)
      : 0;
  const ahorroUsd =
    precioUsd !== null && precioNormalUsd !== null
      ? redondear2(precioUsd - precioNormalUsd)
      : 0;
  /*const porCursoPen =
    precioFinalPen !== null
      ? redondear2(precioFinalPen / cantidadCursos)
      : null;
  const porCursoUsd =
    precioFinalUsd !== null
      ? redondear2(precioFinalUsd / cantidadCursos)
      : null;*/

  return (
    <section
      id="precio"
      aria-labelledby="precio-title"
      className="bg-bg-alt relative scroll-mt-20 pb-16 sm:pb-20"
    >
      {/* Onda superior (mudada desde Sobre mí): recorta sobre el azul de
          Productos. Full-bleed (sin padding en la sección) para que llegue
          de borde a borde. Se usa offset relativo (-top) y NO margen
          negativo. */}
      <div
        aria-hidden="true"
        className="relative -top-16 -mb-16 w-full sm:-top-24 sm:-mb-24"
      >
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="block h-16 w-full -scale-x-100 sm:h-24"
        >
          <path
            d="M-20 90 C 240 8 480 8 720 60 S 1200 100 1460 55 L1460 120 L-20 120 Z"
            className="fill-bg-alt"
          />
        </svg>
      </div>

      <div className="px-4 pt-10 sm:px-2 sm:pt-14 lg:px-4">
        <div className="mx-auto w-full max-w-[1500px] overflow-hidden rounded-[2.5rem] bg-[#E7F0FE] px-6 py-14 sm:px-8 sm:py-20">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:gap-14 xl:grid-cols-[1.34fr_0.66fr]">
            {/* Izquierda: curso, temario e inclusiones. */}
            <div>
              <p className="inline-flex items-center rounded-full bg-[#1F3A6E] px-5 py-1.5 text-xs font-bold tracking-[0.18em] text-[#FFF4E3] uppercase">
                MasterClass
              </p>
              <h2
                id="precio-title"
                className="font-heading mt-4 text-4xl leading-[1.08] font-extrabold tracking-tight text-balance text-[#38241a] sm:text-5xl"
              >
                {curso?.nombre ?? "MasterClass de Decoración y Globos"}
              </h2>
              {curso?.descripcion && (
                <p className="mt-4 max-w-xl text-base leading-relaxed text-pretty text-[#38241a]/80 sm:text-lg">
                  {curso.descripcion}
                </p>
              )}

              <p className="mt-8 text-xs font-bold tracking-[0.18em] text-[#38241a]/60 uppercase">
                Lo que incluye
              </p>
              <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <ListaIncluye items={INCLUYE.slice(0, 4)} />
                <ListaIncluye items={INCLUYE.slice(4)} />
              </div>

              <ul className="mt-8 flex flex-wrap items-center gap-3">
                <Chip Icon={VideoIcon}>
                  Acceso inmediato
                </Chip>
                <Chip Icon={MessageCircleIcon}>
                  Asesoría personalizada por WhatsApp
                </Chip>
              </ul>
            </div>

            {/* Derecha: tarjeta blanca con selector de moneda. */}
            <div className="mx-auto w-full max-w-md lg:ml-auto lg:max-w-[460px]">
              {curso && precioPen !== null && precioFinalPen !== null ? (
                <PrecioCard
                  precioListaPen={precioPen}
                  precioFinalPen={precioFinalPen}
                  precioListaUsd={precioUsd}
                  precioFinalUsd={precioFinalUsd}
                  ahorroPen={ahorroPen}
                  ahorroUsd={ahorroUsd}
                  /*porCursoPen={porCursoPen}
                  porCursoUsd={porCursoUsd}*/
                  descuentoTexto={tituloOferta}
                  cursoSlug={curso.slug}
                />
              ) : (
                <div className="relative z-10 rounded-[2rem] bg-white p-8 text-center shadow-[0_24px_70px_-30px_rgba(31,58,110,0.45)]">
                  <p className="font-heading text-3xl font-extrabold tracking-tight text-balance text-[#1F3A6E]">
                    Te avisamos cuando abra
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[#38241a]/70">
                    Escríbenos y te avisamos cuando el curso esté disponible.
                  </p>
                  <Button
                    render={<CtaWhatsApp boton="precio" />}
                    nativeButton={false}
                    className="relative mt-5 h-12 w-full overflow-hidden bg-[#1F3A6E] pr-2 pl-6 text-base text-[#FFF4E3] transition-colors duration-300 hover:bg-[#1F3A6E] active:bg-[#1F3A6E]"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Avisarme por WhatsApp
                      <span
                        aria-hidden="true"
                        className="inline-flex size-10 items-center justify-center rounded-full bg-[#FFF4E3] text-[#1F3A6E]"
                      >
                        <ArrowRightIcon className="size-5" />
                      </span>
                    </span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
