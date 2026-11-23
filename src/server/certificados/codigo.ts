// Generador de códigos de verificación únicos totalmente aleatorios.
// Formato: 12 caracteres alfanuméricos mezclados aleatoriamente (ej: 8X2P-9M4K-7W1L).

import crypto from "crypto";

const CARACTERES = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Excluye caracteres ambiguos 0, O, 1, I

/**
 * Genera un código de verificación 100% aleatorio compuesto por letras y números.
 * @param longitud Cantidad de caracteres aleatorios (por defecto 12)
 * @param conGuiones Si debe agrupar cada 4 caracteres con guiones para facilitar lectura (ej: 8X2P-9M4K-7W1L)
 */
export function generarCodigoVerificacionAleatorio(
  longitud: number = 12,
  conGuiones: boolean = true
): string {
  const bytes = crypto.randomBytes(longitud);
  let resultado = "";

  for (let i = 0; i < longitud; i++) {
    resultado += CARACTERES[bytes[i] % CARACTERES.length];
  }

  if (conGuiones && longitud === 12) {
    return `${resultado.slice(0, 4)}-${resultado.slice(4, 8)}-${resultado.slice(8, 12)}`;
  }

  return resultado;
}

/**
 * Normaliza un código de verificación ingresado por un usuario:
 * remueve guiones, espacios y convierte a mayúsculas.
 */
export function normalizarCodigoVerificacion(codigo: string): string {
  return (codigo || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}
