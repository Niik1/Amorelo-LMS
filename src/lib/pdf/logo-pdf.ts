import "server-only";
import sharp from "sharp";

/**
 * Descarga y convierte cualquier formato de imagen (WebP, JPG, PNG, SVG)
 * a un Data URI PNG estándar (base64) para garantizar compatibilidad total
 * con @react-pdf/renderer (que no tiene soporte nativo para WebP ni URLs remotas sin buffer).
 */
export async function prepararLogoParaPdf(url?: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Convertir con sharp a PNG con canal alfa y tamaño optimizado para el documento
    const pngBuffer = await sharp(inputBuffer)
      .resize({ width: 600, withoutEnlargement: true })
      .png({ quality: 90 })
      .toBuffer();

    return `data:image/png;base64,${pngBuffer.toString("base64")}`;
  } catch (err) {
    console.warn("[prepararLogoParaPdf] Error al procesar imagen para PDF:", err);
    return null;
  }
}
