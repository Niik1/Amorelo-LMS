// Helper centralizado para la gestión segura e idempotente de clientes.
// Garantiza la regla:
// 1 Persona = 1 Correo único + 1 Documento único (cuando aplica).
// Evita la sobreescritura accidental o ciega de datos de clientes existentes.

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import { normalizarNombrePais } from "@/lib/paises/paises";

export type DatosClienteInput = {
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  tipoDocumento?: "DNI" | "CE" | "PASAPORTE" | "RUC" | string | null;
  numeroDocumento?: string | null;
  pais?: string | null;
  origen?: string;
};

export type ResultadoClienteSeguro =
  | {
      ok: true;
      clienteId: string;
      esNuevo: boolean;
      nombreCliente: string;
      correo: string;
      numeroDocumento: string | null;
    }
  | { ok: false; error: string };

/**
 * Compara dos cadenas de nombres para determinar si son compatibles
 * (misma persona con segundo nombre omitido o variaciones menores de acentos/espacios).
 * Devuelve false si son personas claramente distintas (ej: "Maria" vs "Carlos").
 */
export function sonNombresCompatibles(nombreA: string, nombreB: string): boolean {
  const normA = (nombreA || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  const normB = (nombreB || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (!normA || !normB) return true;
  if (normA === normB) return true;

  const tokensA = normA.split(/\s+/).filter(Boolean);
  const tokensB = normB.split(/\s+/).filter(Boolean);

  // Si comparten el primer nombre exactamente
  if (tokensA[0] && tokensB[0] && tokensA[0] === tokensB[0]) return true;

  // Si comparten al menos una palabra significativa (más de 2 letras)
  const comparten = tokensA.some(
    (t) => t.length > 2 && tokensB.includes(t)
  );
  return comparten;
}

/**
 * Obtiene un cliente existente o crea uno nuevo de forma segura.
 * Reglas de protección:
 * 1. Si el número de documento ya está registrado con OTRO correo -> Error de colisión.
 * 2. Si el correo ya está registrado con OTRO documento o con un nombre no compatible -> Error de colisión.
 * 3. Si coincide o es la misma persona -> Actualiza datos de contacto (teléfono, país, documento si faltaba) SIN pisar nombres.
 * 4. Si no existe -> Lo crea limpiamente.
 */
export async function obtenerOCrearClienteSeguro(
  datos: DatosClienteInput
): Promise<ResultadoClienteSeguro> {
  const admin = createAdminClient();

  const correoNorm = (datos.correo || "").trim().toLowerCase();
  const nombresNorm = (datos.nombres || "").trim();
  const apellidosNorm = (datos.apellidos || "").trim();
  const telefonoNorm = (datos.telefono || "").trim();
  const numDocNorm = datos.numeroDocumento ? datos.numeroDocumento.trim() : null;
  const tipoDoc = (datos.tipoDocumento || "DNI").trim().toUpperCase();
  const paisNorm = normalizarNombrePais(datos.pais);

  if (!correoNorm) {
    return { ok: false, error: "El correo electrónico es obligatorio." };
  }
  if (!nombresNorm || !apellidosNorm) {
    return { ok: false, error: "Nombres y apellidos son obligatorios." };
  }

  // 1. Validar que el número de documento no pertenezca a otra cuenta con correo distinto
  if (numDocNorm) {
    const { data: clientePorDoc } = await admin
      .from("clientes")
      .select("id, nombres, apellidos, correo, numero_documento")
      .eq("numero_documento", numDocNorm)
      .maybeSingle();

    if (
      clientePorDoc &&
      clientePorDoc.correo.trim().toLowerCase() !== correoNorm
    ) {
      return {
        ok: false,
        error: `El documento ${numDocNorm} ya se encuentra registrado con el correo ${clientePorDoc.correo}. Si eres el titular de esa cuenta, por favor ingresa con ese correo para mantener tu historial unificado.`,
      };
    }
  }

  // 2. Buscar si el correo ya existe
  const { data: clienteExistente } = await admin
    .from("clientes")
    .select(
      "id, nombres, apellidos, correo, telefono, tipo_documento, numero_documento, pais"
    )
    .eq("correo", correoNorm)
    .maybeSingle();

  if (clienteExistente) {
    // 2a. Si el cliente existente ya tiene documento y se ingresó uno diferente
    if (clienteExistente.numero_documento && numDocNorm) {
      if (
        clienteExistente.numero_documento.trim().toLowerCase() !==
        numDocNorm.toLowerCase()
      ) {
        return {
          ok: false,
          error: `El correo ${correoNorm} ya está registrado a nombre de ${clienteExistente.nombres} ${clienteExistente.apellidos} (${clienteExistente.tipo_documento || "Doc"}: ${clienteExistente.numero_documento}). Si este registro es para otro alumno o asistente, por favor ingresa su correo personal.`,
        };
      }
    }

    // 2b. Validar que los nombres sean compatibles (para no pisar a Maria con Carlos si no tenían documento)
    if (!sonNombresCompatibles(clienteExistente.nombres, nombresNorm)) {
      return {
        ok: false,
        error: `El correo ${correoNorm} ya está registrado a nombre de ${clienteExistente.nombres} ${clienteExistente.apellidos}. Si eres un nuevo alumno, por favor utiliza tu correo personal.`,
      };
    }

    // 2c. Es la misma persona: actualizamos datos secundarios SIN destruir su identidad original
    const updatePayload: Database["public"]["Tables"]["clientes"]["Update"] = {
      actualizado_en: new Date().toISOString(),
    };

    if (telefonoNorm && telefonoNorm !== clienteExistente.telefono) {
      updatePayload.telefono = telefonoNorm;
    }
    if (paisNorm && paisNorm !== clienteExistente.pais) {
      updatePayload.pais = paisNorm;
    }
    // Si el cliente no tenía documento registrado y ahora lo aporta, lo completamos
    if (!clienteExistente.numero_documento && numDocNorm) {
      updatePayload.tipo_documento = tipoDoc;
      updatePayload.numero_documento = numDocNorm;
    }

    if (Object.keys(updatePayload).length > 1) {
      await admin
        .from("clientes")
        .update(updatePayload)
        .eq("id", clienteExistente.id);
    }

    return {
      ok: true,
      clienteId: clienteExistente.id,
      esNuevo: false,
      nombreCliente: `${clienteExistente.nombres} ${clienteExistente.apellidos}`.trim(),
      correo: correoNorm,
      numeroDocumento: clienteExistente.numero_documento || numDocNorm,
    };
  }

  // 3. Crear nuevo cliente
  const ORIGENES_VALIDOS = new Set([
    "tiktok_live",
    "web",
    "referido",
    "otro",
    "admin_manual",
    "manual",
    "whatsapp",
  ]);

  const origenFinal = datos.origen
    ? (ORIGENES_VALIDOS.has(datos.origen) ? datos.origen : "otro")
    : "web";

  const { data: nuevoCliente, error: insertErr } = await admin
    .from("clientes")
    .insert({
      nombres: nombresNorm,
      apellidos: apellidosNorm,
      correo: correoNorm,
      telefono: telefonoNorm,
      pais: paisNorm,
      tipo_documento: tipoDoc,
      numero_documento: numDocNorm,
      origen: origenFinal,
    })
    .select("id, nombres, apellidos, correo, numero_documento")
    .single();

  if (insertErr || !nuevoCliente) {
    return {
      ok: false,
      error:
        "Error al registrar los datos de contacto: " +
        (insertErr?.message || "No se pudo crear el registro."),
    };
  }

  return {
    ok: true,
    clienteId: nuevoCliente.id,
    esNuevo: true,
    nombreCliente: `${nombresNorm} ${apellidosNorm}`.trim(),
    correo: correoNorm,
    numeroDocumento: numDocNorm,
  };
}
