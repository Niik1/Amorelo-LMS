// Sección Temario + Tarjeta de Precio Flotante (Sticky Sidebar):
// - Cabecera centrada arriba: Título H2 'Ocho módulos, ocho proyectos' y descripción centrada.
// - Columna Izquierda: Tarjeta de Precio Sticky conectada con cálculo dinámico (300 tachado, 210 final, 30% OFF, pago único).
// - Columna Derecha: Grilla 2 columnas con los 8 módulos (píldoras PROYECTO BÁSICO, INTERMEDIO, AVANZADO, ADICIONAL, PLANTILLA GRATIS).

import { TemarioCard } from "@/components/public/temario-card";
import { PrecioStickyCard } from "@/components/public/precio-sticky-card";
import { createPublicClient } from "@/lib/supabase/publico";
import { CURSO_SLUG } from "@/lib/config/curso";
import { calcularPrecio, redondear2 } from "@/lib/precios/calculo";
import {
  obtenerOfertaNormalPublica,
  obtenerOfertaPublica,
} from "@/server/oferta/publica";

// ─── Los 8 Módulos con la progresión pedagógica solicitada ────────────────────
const MODULES = [
  {
    moduleNumber: 1,
    badge: "PROYECTO BÁSICO",
    title: "Doble Stuff en globo burbuja",
    image: "/images/temario/1.webp",
    alt: "Proyecto terminado con técnica de doble stuff en globo burbuja",
  },
  {
    moduleNumber: 2,
    badge: "PROYECTO BÁSICO",
    title: "Pegado de confetti con micropartículas de agua",
    image: "/images/temario/2.webp",
    alt: "Proyecto terminado con confetti pegado con micropartículas de agua",
  },
  {
    moduleNumber: 3,
    badge: "PROYECTO INTERMEDIO",
    title: "Bolipor en globo burbuja",
    image: "/images/temario/3.webp",
    alt: "Proyecto terminado con técnica de bolipor en globo burbuja",
  },
  {
    moduleNumber: 4,
    badge: "PROYECTO INTERMEDIO",
    title: "Marmoleado con pintura acrílica",
    image: "/images/temario/4.webp",
    alt: "Proyecto terminado con marmoleado de pintura acrílica",
  },
  {
    moduleNumber: 5,
    badge: "PROYECTO AVANZADO",
    title: "Encapsulado de flores sin cortar el globo",
    image: "/images/temario/5.webp",
    alt: "Proyecto terminado con encapsulado de flores artificiales",
  },
  {
    moduleNumber: 6,
    badge: "PROYECTO AVANZADO",
    title: "Encapsulado de peluche en globo burbuja",
    image: "/images/temario/6.webp",
    alt: "Proyecto terminado con encapsulado de peluche en globo burbuja",
  },
  {
    moduleNumber: 7,
    badge: "PROYECTO ADICIONAL",
    title: "Cono de helado dulcero",
    image: "/images/temario/7.webp",
    alt: "Proyecto terminado de cono de helado dulcero",
  },
  {
    moduleNumber: 8,
    badge: "PLANTILLA GRATIS",
    title: "Costos y Presupuestos en Excel",
    image: "/images/temario/excel.webp",
    alt: "Plantilla de Excel de costos y presupuestos",
  },
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
  tituloOferta: string | null;
  porcentajeOferta: number | null;
}> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("cursos")
      .select("nombre, slug, descripcion, precio_pen, precio_usd")
      .eq("slug", CURSO_SLUG)
      .eq("activo", true)
      .maybeSingle();

    const ofertaVigente = await obtenerOfertaPublica();
    const usaRespaldo =
      ofertaVigente.esLive && ofertaVigente.descuentoPorcentaje === null;
    const respaldo = usaRespaldo ? await obtenerOfertaNormalPublica() : null;

    const tituloOferta = (
      usaRespaldo ? respaldo?.descuentoTexto : ofertaVigente.descuentoTexto
    ) ?? "30%";
    const porcentajeOferta = (
      usaRespaldo ? respaldo?.descuentoPorcentaje : ofertaVigente.descuentoPorcentaje
    ) ?? 30;

    return { curso: data, tituloOferta, porcentajeOferta };
  } catch (e) {
    console.error("[temario/precio] error:", e);
    return {
      curso: {
        nombre: "Masterclass de Globos Burbuja",
        slug: CURSO_SLUG,
        descripcion: null,
        precio_pen: 300,
        precio_usd: 79,
      },
      tituloOferta: "30%",
      porcentajeOferta: 30,
    };
  }
}

export async function Temario() {
  const datos = await getDatosPrecio();
  const curso = datos.curso;

  // Precios calculados (Predeterminados S/ 300 lista y S/ 210 final según especificación)
  const precioPen = curso ? Number(curso.precio_pen) : 300;
  const precioUsd = curso?.precio_usd ? Number(curso.precio_usd) : 79;

  const descuentoOferta = { tipo: "porcentaje" as const, valor: datos.porcentajeOferta ?? 30 };
  const precioFinalPen = precioPen ? (calcularPrecio(precioPen, descuentoOferta) ?? 210) : 210;
  const precioFinalUsd = precioUsd ? (calcularPrecio(precioUsd, descuentoOferta) ?? 55) : 55;

  const ahorroPen = redondear2(precioPen - precioFinalPen);
  const ahorroUsd = redondear2(precioUsd - precioFinalUsd);

  return (
    <section
      id="temario"
      aria-labelledby="temario-title"
      className="scroll-mt-20 bg-[#F8FAFC] dark:bg-[#070e24] pt-20 pb-28 sm:pt-28 sm:pb-36 transition-colors duration-500"
    >
      <div className="mx-auto w-full max-w-[1540px] px-5 sm:px-8 lg:px-12 xl:px-16">

        {/* ── 1. CABECERA CENTRADA AL MEDIO (Tal como solicitaste) ───────────── */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-mono text-xs sm:text-[13px] font-bold tracking-[0.2em] text-[#1A73E8] dark:text-blue-400 uppercase">
            TEMARIO DE LA MASTERCLASS
          </span>
          <h2
            id="temario-title"
            className="font-heading mt-3 text-4xl leading-[1.08] font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-[3.5rem]"
          >
            Ocho módulos, ocho proyectos
          </h2>
          <p className="mt-4 text-base sm:text-lg lg:text-xl leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
            Cada módulo culmina con un proyecto real que puedes armar y vender. Desde las bases del inflado hasta la cotización exacta de tu trabajo.
          </p>
        </div>

        {/* ── 2. LAYOUT EN 2 COLUMNAS (STICKY SIDEBAR + GRID) ────────────────── */}
        <div className="mt-14 sm:mt-20 grid grid-cols-1 items-start gap-10 lg:grid-cols-[380px_1fr] xl:grid-cols-[410px_1fr] lg:gap-12 xl:gap-16">

          {/* ══════════════════════════════════════════════════════════════════
              COLUMNA IZQUIERDA: TARJETA DE PRECIO STICKY (Baja con el scroll)
              ══════════════════════════════════════════════════════════════════ */}
          <aside className="w-full lg:sticky lg:top-28 z-20">
            <PrecioStickyCard
              precioListaPen={precioPen}
              precioFinalPen={precioFinalPen}
              precioListaUsd={precioUsd}
              precioFinalUsd={precioFinalUsd}
              ahorroPen={ahorroPen}
              ahorroUsd={ahorroUsd}
              descuentoTexto={datos.tituloOferta}
              cursoSlug={curso?.slug}
              cursoNombre="Masterclass de Globos Burbuja"
            />
          </aside>

          {/* ══════════════════════════════════════════════════════════════════
              COLUMNA DERECHA: GRILLA DE 2 COLUMNAS CON LOS 8 MÓDULOS
              ══════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-7 xl:gap-8">
            {MODULES.map((module, i) => (
              <TemarioCard
                key={module.title}
                moduleNumber={module.moduleNumber}
                badge={module.badge}
                title={module.title}
                image={module.image}
                alt={module.alt}
                index={i}
              />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
