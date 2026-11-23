// Definición centralizada de países, siglas ISO y prefijos telefónicos.
// Usable tanto en Client Components como en Server Actions y consultas.

export type PaisItem = {
  codigoIso: string;
  nombre: string;
  prefijo: string;
  bandera: string;
  formatoEjemplo: string;
};

export const PAISES: PaisItem[] = [
  { codigoIso: "PE", nombre: "Perú", prefijo: "+51", bandera: "🇵🇪", formatoEjemplo: "987 654 321" },
  { codigoIso: "CO", nombre: "Colombia", prefijo: "+57", bandera: "🇨🇴", formatoEjemplo: "300 123 4567" },
  { codigoIso: "MX", nombre: "México", prefijo: "+52", bandera: "🇲🇽", formatoEjemplo: "55 1234 5678" },
  { codigoIso: "CL", nombre: "Chile", prefijo: "+56", bandera: "🇨🇱", formatoEjemplo: "9 1234 5678" },
  { codigoIso: "EC", nombre: "Ecuador", prefijo: "+593", bandera: "🇪🇨", formatoEjemplo: "99 123 4567" },
  { codigoIso: "AR", nombre: "Argentina", prefijo: "+54", bandera: "🇦🇷", formatoEjemplo: "11 1234 5678" },
  { codigoIso: "BO", nombre: "Bolivia", prefijo: "+591", bandera: "🇧🇴", formatoEjemplo: "7123 4567" },
  { codigoIso: "US", nombre: "Estados Unidos", prefijo: "+1", bandera: "🇺🇸", formatoEjemplo: "202 555 0123" },
  { codigoIso: "ES", nombre: "España", prefijo: "+34", bandera: "🇪🇸", formatoEjemplo: "612 34 56 78" },
  { codigoIso: "PA", nombre: "Panamá", prefijo: "+507", bandera: "🇵🇦", formatoEjemplo: "6123 4567" },
  { codigoIso: "CR", nombre: "Costa Rica", prefijo: "+506", bandera: "🇨🇷", formatoEjemplo: "8123 4567" },
  { codigoIso: "DO", nombre: "Rep. Dominicana", prefijo: "+1", bandera: "🇩🇴", formatoEjemplo: "809 123 4567" },
  { codigoIso: "UY", nombre: "Uruguay", prefijo: "+598", bandera: "🇺🇾", formatoEjemplo: "99 123 456" },
  { codigoIso: "PY", nombre: "Paraguay", prefijo: "+595", bandera: "🇵🇾", formatoEjemplo: "981 123 456" },
  { codigoIso: "GT", nombre: "Guatemala", prefijo: "+502", bandera: "🇬🇹", formatoEjemplo: "5123 4567" },
];

/**
 * Normaliza cualquier entrada (código ISO, sigla, nombre con o sin tildes)
 * al nombre completo oficial del país para guardar en la base de datos (ej: "Perú").
 */
export function normalizarNombrePais(valor?: string | null): string {
  if (!valor) return "Perú";
  const v = valor.trim();
  if (!v) return "Perú";

  const vMayus = v.toUpperCase();
  const vSinTilde = v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Caso especial: si guardaron solo "P"
  if (vMayus === "P" || vMayus === "PE" || vSinTilde === "peru") {
    return "Perú";
  }

  // 1. Coincidencia por código ISO
  const porIso = PAISES.find((p) => p.codigoIso.toUpperCase() === vMayus);
  if (porIso) return porIso.nombre;

  // 2. Coincidencia por nombre sin tilde
  const porNombre = PAISES.find((p) => {
    const pSinTilde = p.nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return pSinTilde === vSinTilde;
  });
  if (porNombre) return porNombre.nombre;

  // Si ya es un nombre completo personalizado o no está en la lista estándar, retornarlo capitalizado o tal cual
  return v;
}

/**
 * Obtiene el código ISO de 2 letras (ej: "PE", "CO") a partir del nombre completo
 * o de un código previo, para que los selectores de UI muestren la bandera y prefijo correctos.
 */
export function obtenerIsoDePais(valor?: string | null): string {
  if (!valor) return "PE";
  const v = valor.trim();
  if (!v) return "PE";

  const vMayus = v.toUpperCase();
  if (vMayus === "P" || vMayus === "PE") return "PE";

  // Si ya es un código ISO válido de 2 letras
  const porIso = PAISES.find((p) => p.codigoIso.toUpperCase() === vMayus);
  if (porIso) return porIso.codigoIso;

  // Búsqueda por nombre
  const vSinTilde = v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const porNombre = PAISES.find((p) => {
    const pSinTilde = p.nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return pSinTilde === vSinTilde;
  });

  return porNombre ? porNombre.codigoIso : "PE";
}

/**
 * Obtiene el prefijo telefónico numérico (sin '+', ej: "51", "57")
 * a partir de un código ISO o nombre de país.
 */
export function obtenerPrefijoTelefonicoPorPais(valor?: string | null): string {
  const iso = obtenerIsoDePais(valor);
  const pais = PAISES.find((p) => p.codigoIso === iso);
  return pais ? pais.prefijo.replace("+", "") : "51";
}
