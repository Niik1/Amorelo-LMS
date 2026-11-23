/**
 * Utilidad de optimización y compresión de imágenes en el cliente (Browser).
 * Convierte archivos de imagen (PNG, JPG, JPEG, etc.) a formato WebP moderno,
 * redimensionando si superan la resolución máxima para lograr pesos ultra livianos (< 300KB)
 * con excelente fidelidad visual para la web y aula virtual.
 */

export async function optimizarImagenAWebP(
  archivo: File,
  maxDimension = 1920,
  calidad = 0.85
): Promise<{ archivoOptimizado: File; pesoOriginalKb: number; pesoOptimizadoKb: number }> {
  const pesoOriginalKb = Math.round(archivo.size / 1024);

  // Si no es una imagen o ya es un svg/gif animado, devolver tal cual
  if (!archivo.type.startsWith("image/") || archivo.type === "image/svg+xml" || archivo.type === "image/gif") {
    return { archivoOptimizado: archivo, pesoOriginalKb, pesoOptimizadoKb: pesoOriginalKb };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(archivo);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Escalar proporcionalmente manteniendo relación de aspecto
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ archivoOptimizado: archivo, pesoOriginalKb, pesoOptimizadoKb: pesoOriginalKb });
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({ archivoOptimizado: archivo, pesoOriginalKb, pesoOptimizadoKb: pesoOriginalKb });
            return;
          }

          const nombreBase = archivo.name
            .replace(/\.[^/.]+$/, "")
            .replace(/[^a-zA-Z0-9_-]/g, "_");

          const archivoWebP = new File([blob], `${nombreBase}.webp`, {
            type: "image/webp",
            lastModified: Date.now(),
          });

          const pesoOptimizadoKb = Math.round(blob.size / 1024);
          resolve({ archivoOptimizado: archivoWebP, pesoOriginalKb, pesoOptimizadoKb });
        },
        "image/webp",
        calidad
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ archivoOptimizado: archivo, pesoOriginalKb, pesoOptimizadoKb: pesoOriginalKb });
    };

    img.src = objectUrl;
  });
}
