// Utilidades para normalización de teléfonos y generación de archivos VCF (vCard 3.0) y CSV de Google Contacts.
// Formato de nombre: "Nombre Apellido • Nov-2026" (cursos) o "Nombre Apellido • Taller Nov-2026" (talleres).

import { obtenerPrefijoTelefonicoPorPais } from "@/lib/paises/paises";

const PREFIJOS_PAIS: Record<string, string> = {
  PE: "51",
  CO: "57",
  MX: "52",
  CL: "56",
  EC: "593",
  AR: "54",
  BO: "591",
  US: "1",
  ES: "34",
  PA: "507",
  CR: "506",
  DO: "1",
  UY: "598",
  PY: "595",
  GT: "502",
};

const MESES_ABR = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Oct",
  "Nov",
  "Dic",
];

export interface DatosContactoExportar {
  id: string; // ID de matrícula o ID de reserva
  nombres: string;
  apellidos: string;
  nombreCompleto?: string;
  telefono: string;
  pais?: string;
  correo?: string;
  documento?: string; // Ej: "DNI: 78945612"
  cursoOTallerNombre: string;
  tipo: "curso" | "taller";
  fechaRegistroIso: string;
  estado?: string;
}

/**
 * Normaliza un número telefónico a formato internacional E.164 (ej: +51987654321).
 * Si no tiene prefijo, utiliza el código ISO del país (por defecto PE -> +51).
 */
export function normalizarTelefonoE164(
  telefonoRaw: string | undefined | null,
  paisIso: string = "PE"
): string | null {
  if (!telefonoRaw) return null;

  const limpio = telefonoRaw.trim();
  if (!limpio) return null;

  // Si ya empieza con '+', limpiamos espacios y caracteres no numéricos posteriores
  if (limpio.startsWith("+")) {
    const soloDigitos = limpio.replace(/\D/g, "");
    if (soloDigitos.length >= 7) {
      return `+${soloDigitos}`;
    }
    return null;
  }

  // Extraer solo dígitos
  const soloDigitos = limpio.replace(/\D/g, "");
  if (!soloDigitos || soloDigitos.length < 6) {
    return null;
  }

  const prefijo = obtenerPrefijoTelefonicoPorPais(paisIso);

  // Si los dígitos ya comienzan con el prefijo internacional (ej: 51987654321)
  if (soloDigitos.startsWith(prefijo) && soloDigitos.length === prefijo.length + 9) {
    return `+${soloDigitos}`;
  }

  // En caso contrario, anteponemos el prefijo del país
  return `+${prefijo}${soloDigitos}`;
}

/**
 * Obtiene el mes abreviado y año en formato "Nov-2026".
 */
export function obtenerMesAno(fechaIso: string): string {
  try {
    const fecha = new Date(fechaIso);
    if (isNaN(fecha.getTime())) {
      const ahora = new Date();
      return `${MESES_ABR[ahora.getMonth()]}-${ahora.getFullYear()}`;
    }
    const mes = MESES_ABR[fecha.getMonth()];
    const ano = fecha.getFullYear();
    return `${mes}-${ano}`;
  } catch {
    const ahora = new Date();
    return `${MESES_ABR[ahora.getMonth()]}-${ahora.getFullYear()}`;
  }
}

/**
 * Extrae el primer nombre y el primer apellido para el nombre de contacto compacto.
 * "María del Carmen" "Rojas Silva" -> "María Rojas"
 */
export function obtenerNombrePrimerApellido(
  nombres: string,
  apellidos: string,
  nombreCompletoFallback?: string
): { primerNombre: string; primerApellido: string } {
  let pNombre = (nombres || "").trim().split(/\s+/)[0] || "";
  let pApellido = (apellidos || "").trim().split(/\s+/)[0] || "";

  if (!pNombre || !pApellido) {
    const fallbackParts = (nombreCompletoFallback || "").trim().split(/\s+/);
    if (!pNombre && fallbackParts.length > 0) {
      pNombre = fallbackParts[0] || "Alumno";
    }
    if (!pApellido && fallbackParts.length > 1) {
      pApellido = fallbackParts[1] || "";
    }
  }

  return {
    primerNombre: pNombre || "Alumno",
    primerApellido: pApellido || "",
  };
}

/**
 * Construye el Display Name:
 * - Curso: "María Rojas • Nov-2026"
 * - Taller: "María Rojas • Taller Nov-2026"
 */
export function construirDisplayNameContacto(
  primerNombre: string,
  primerApellido: string,
  fechaRegistroIso: string,
  tipo: "curso" | "taller"
): string {
  const mesAno = obtenerMesAno(fechaRegistroIso);
  const nombreBase = primerApellido
    ? `${primerNombre} ${primerApellido}`
    : primerNombre;

  if (tipo === "taller") {
    return `${nombreBase} • Taller ${mesAno}`;
  }
  return `${nombreBase} • ${mesAno}`;
}

/**
 * Escapa caracteres especiales según especificación RFC 2426 (vCard 3.0).
 */
function escaparVCard(texto: string = ""): string {
  return texto
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Genera el archivo VCF (vCard 3.0) con múltiples contactos.
 */
export function generarArchivoVCard(contactos: DatosContactoExportar[]): string {
  const lineas: string[] = [];

  for (const c of contactos) {
    const telE164 = normalizarTelefonoE164(c.telefono, c.pais);
    if (!telE164) continue; // Si no tiene teléfono válido, omitir

    const { primerNombre, primerApellido } = obtenerNombrePrimerApellido(
      c.nombres,
      c.apellidos,
      c.nombreCompleto
    );

    const displayName = construirDisplayNameContacto(
      primerNombre,
      primerApellido,
      c.fechaRegistroIso,
      c.tipo
    );

    const org = c.tipo === "taller"
      ? `Amorelo - Taller Presencial`
      : `Amorelo - ${c.cursoOTallerNombre}`;

    const cargo = c.tipo === "taller" ? "Asistente Taller" : "Alumna Aula Virtual";

    const fechaFormateada = new Date(c.fechaRegistroIso).toLocaleDateString("es-PE");
    const notasPartes: string[] = [
      c.tipo === "taller" ? `Taller: ${c.cursoOTallerNombre}` : `Curso: ${c.cursoOTallerNombre}`,
    ];
    if (c.documento) notasPartes.push(`Doc: ${c.documento}`);
    notasPartes.push(`Registro: ${fechaFormateada}`);
    if (c.estado) notasPartes.push(`Estado: ${c.estado}`);
    notasPartes.push("Amorelo");

    lineas.push("BEGIN:VCARD");
    lineas.push("VERSION:3.0");
    lineas.push(`N:${escaparVCard(primerApellido)};${escaparVCard(primerNombre)};;;`);
    lineas.push(`FN:${escaparVCard(displayName)}`);
    lineas.push(`ORG:${escaparVCard(org)}`);
    lineas.push(`TITLE:${escaparVCard(cargo)}`);
    lineas.push(`TEL;TYPE=CELL,VOICE:${telE164}`);
    if (c.correo) {
      lineas.push(`EMAIL;TYPE=INTERNET:${escaparVCard(c.correo)}`);
    }
    lineas.push(`NOTE:${escaparVCard(notasPartes.join(" | "))}`);
    lineas.push("END:VCARD");
  }

  return lineas.join("\r\n");
}

/**
 * Genera archivo CSV compatible con Google Contacts.
 */
export function generarArchivoGoogleContactsCsv(
  contactos: DatosContactoExportar[]
): string {
  const encabezados = [
    "Name",
    "Given Name",
    "Family Name",
    "Phone 1 - Type",
    "Phone 1 - Value",
    "E-mail 1 - Type",
    "E-mail 1 - Value",
    "Organization 1 - Name",
    "Organization 1 - Title",
    "Notes",
  ];

  const filas: string[] = [encabezados.join(",")];

  for (const c of contactos) {
    const telE164 = normalizarTelefonoE164(c.telefono, c.pais);
    if (!telE164) continue;

    const { primerNombre, primerApellido } = obtenerNombrePrimerApellido(
      c.nombres,
      c.apellidos,
      c.nombreCompleto
    );

    const displayName = construirDisplayNameContacto(
      primerNombre,
      primerApellido,
      c.fechaRegistroIso,
      c.tipo
    );

    const org = c.tipo === "taller"
      ? `Amorelo - Taller Presencial`
      : `Amorelo - ${c.cursoOTallerNombre}`;

    const cargo = c.tipo === "taller" ? "Asistente Taller" : "Alumna Aula Virtual";

    const fechaFormateada = new Date(c.fechaRegistroIso).toLocaleDateString("es-PE");
    const notas = `${c.tipo === "taller" ? "Taller" : "Curso"}: ${c.cursoOTallerNombre} | ${c.documento ? `Doc: ${c.documento} | ` : ""}Registro: ${fechaFormateada} | Amorelo`;

    const escaparCsv = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;

    filas.push(
      [
        escaparCsv(displayName),
        escaparCsv(primerNombre),
        escaparCsv(primerApellido),
        escaparCsv("Mobile"),
        escaparCsv(telE164),
        escaparCsv("Home"),
        escaparCsv(c.correo || ""),
        escaparCsv(org),
        escaparCsv(cargo),
        escaparCsv(notas),
      ].join(",")
    );
  }

  // Prepend UTF-8 BOM so Excel/Google interprets accents properly
  return "\uFEFF" + filas.join("\r\n");
}
