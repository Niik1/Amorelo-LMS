// Vitrina de productos: convenio de carpeta + fallback.
// Si `public/images/productos/` contiene fotos numeradas (01-*.webp,
// 02-*.webp...), entran solas al carrusel y al contador. Los SVG de fondo
// (fondo-*) se ignoran. Si la carpeta está vacía, se usan las 3 del hero
// para no dejar la sección vacía en la Fase 1 (estática).

import "server-only";

import { readdir } from "node:fs/promises";
import path from "node:path";

export type ProductSlide = {
  src: string;
  alt: string;
};

const PRODUCT_DIR = "images/productos";
const FALLBACK_SLIDES: ProductSlide[] = [
  {
    src: "/images/hero/globo-central.webp",
    alt: "Detalle de globo burbuja central con globos rosas",
  },
  {
    src: "/images/hero/globo-izquierdo.webp",
    alt: "Detalle de globo burbuja lateral izquierdo",
  },
  {
    src: "/images/hero/globo-derecho.webp",
    alt: "Detalle de globo burbuja lateral derecho",
  },
];

const IMAGE_EXT = /\.(webp|png|jpe?g|avif)$/i;

function prettyAlt(file: string): string {
  const base = file.replace(/\.[^.]+$/, "").replace(/^\d+[-_ ]*/, "");
  const words = base.replace(/[-_]+/g, " ").trim();
  return words ? `Detalle de globo burbuja: ${words}` : "Detalle de globo burbuja";
}

export async function getProductSlides(): Promise<ProductSlide[]> {
  try {
    const dir = path.join(process.cwd(), "public", PRODUCT_DIR);
    const files = (await readdir(dir))
      .filter(
        (f) =>
          IMAGE_EXT.test(f) &&
          !f.toLowerCase().startsWith("fondo-") &&
          !f.toLowerCase().startsWith("pedestal-") &&
          f.toLowerCase() !== "pedestal.webp" &&
          f.toLowerCase() !== "pedestal.png",
      )
      .sort((a, b) => a.localeCompare(b, "es", { numeric: true }));

    if (files.length === 0) return FALLBACK_SLIDES;

    return files.map((file) => ({
      src: `/${PRODUCT_DIR}/${file}`,
      alt: prettyAlt(file),
    }));
  } catch {
    return FALLBACK_SLIDES;
  }
}
