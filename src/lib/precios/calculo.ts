// Cálculo de precios de la tienda. Es puro y lo comparten el panel y,
// más adelante, la landing. El precio de lista vive en `cursos`; el descuento
// sale del cupón vigente. Nunca se hardcodea un porcentaje acá.

export type DescuentoPrecio = {
  tipo: string;
  valor: number | string;
};

/** Redondeo monetario a 2 decimales, sin arrastrar errores de coma flotante. */
export function redondear2(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

/** Precio final después del cupón. Si no hay descuento válido, devuelve la lista. */
export function calcularPrecio(
  lista: number,
  descuento: DescuentoPrecio | null | undefined,
): number {
  const base = Number(lista);
  if (!Number.isFinite(base) || base < 0) return 0;
  if (!descuento) return redondear2(base);

  const valor = Number(descuento.valor);
  if (!Number.isFinite(valor) || valor <= 0) return redondear2(base);

  const final =
    descuento.tipo === "porcentaje" ? base * (1 - valor / 100) : base - valor;
  return redondear2(Math.max(0, final));
}

export function formatearMoneda(valor: number, moneda: "PEN" | "USD"): string {
  return new Intl.NumberFormat(moneda === "PEN" ? "es-PE" : "en-US", {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}
