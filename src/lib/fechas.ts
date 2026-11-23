// Formato de fechas para Perú (América/Lima, UTC-5 fijo sin horario de verano).
// Los formateadores se crean una sola vez para optimizar rendimiento.

export const ZONA_LIMA = "America/Lima";

const HORA = new Intl.DateTimeFormat("es-PE", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: ZONA_LIMA,
});

const FECHA_HORA = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: ZONA_LIMA,
});

/** "21 oct." en es-PE */
const DIA = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  timeZone: ZONA_LIMA,
});

const PARTES_DIA = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: ZONA_LIMA,
});

/** "12:59 a. m." */
export function horaLima(iso: string | null) {
  return iso ? HORA.format(new Date(iso)) : "—";
}

/** "16 oct., 2:52 p. m." */
export function fechaHoraLima(iso: string | null) {
  return iso ? FECHA_HORA.format(new Date(iso)) : "—";
}

/** "21 oct" (sin el punto final que agrega es-PE). */
export function diaLima(iso: string) {
  return DIA.format(new Date(iso)).replace(/\.$/, "");
}

/** Clave de día en Lima (YYYY-MM-DD): agrupa sin depender del navegador. */
export function claveDiaLima(iso: string) {
  const partes = PARTES_DIA.formatToParts(new Date(iso));
  const valor = (tipo: string) =>
    partes.find((p) => p.type === tipo)?.value ?? "";
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}
