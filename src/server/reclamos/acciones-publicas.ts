// Server Action para el registro público de Hoja de Reclamación (Libro de Reclamaciones Virtual).
// Conforme a la Ley N° 29571 (Código de Protección y Defensa del Consumidor) y D.S. N° 011-2011-PCM.

"use server";

import "server-only";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export interface RegistrarReclamoInput {
  tipo: "reclamo" | "queja";
  tipoDocumento: "DNI" | "CE" | "PASAPORTE" | "RUC";
  numeroDocumento: string;
  consumidorNombres: string;
  consumidorApellidos: string;
  domicilio: string;
  telefono?: string;
  correo: string;
  esMenorEdad: boolean;
  representanteNombre?: string;
  representanteDocumento?: string;
  bienContratado: "producto" | "servicio";
  descripcionBien: string;
  montoReclamado?: number | null;
  moneda?: "PEN" | "USD" | null;
  ordenId?: string | null;
  detalle: string;
  pedidoConsumidor: string;
}

export interface ResultadoRegistroReclamo {
  ok: boolean;
  id?: string;
  numero?: string;
  creadoEn?: string;
  fechaLimiteRespuesta?: string;
  error?: string;
}

/**
 * Calcula la fecha límite de respuesta legal: 15 días hábiles a partir de hoy (sin fines de semana).
 */
function calcularFechaLimiteRespuesta(diasHabiles: number = 15): string {
  const fecha = new Date();
  let agregados = 0;

  while (agregados < diasHabiles) {
    fecha.setDate(fecha.getDate() + 1);
    const dia = fecha.getDay();
    // 0 = domingo, 6 = sábado
    if (dia !== 0 && dia !== 6) {
      agregados++;
    }
  }

  // Establecer hora límite legal al final de la jornada laboral
  fecha.setHours(23, 59, 59, 999);
  return fecha.toISOString();
}

export async function registrarReclamoPublicoAction(
  input: RegistrarReclamoInput
): Promise<ResultadoRegistroReclamo> {
  try {
    // 1. Validaciones básicas
    if (!input.tipo || !["reclamo", "queja"].includes(input.tipo)) {
      return { ok: false, error: "Selecciona si se trata de un reclamo o una queja." };
    }

    if (!input.tipoDocumento || !["DNI", "CE", "PASAPORTE", "RUC"].includes(input.tipoDocumento)) {
      return { ok: false, error: "Selecciona un tipo de documento válido." };
    }

    const docTrim = (input.numeroDocumento || "").trim();
    if (!docTrim || docTrim.length < 4) {
      return { ok: false, error: "Ingresa un número de documento válido." };
    }

    if (input.tipoDocumento === "DNI" && !/^\d{8}$/.test(docTrim)) {
      return { ok: false, error: "El DNI debe contener exactamente 8 dígitos numéricos." };
    }

    if (input.tipoDocumento === "RUC" && !/^\d{11}$/.test(docTrim)) {
      return { ok: false, error: "El RUC debe contener exactamente 11 dígitos numéricos." };
    }

    if ((input.tipoDocumento === "CE" || input.tipoDocumento === "PASAPORTE") && !/^[A-Za-z0-9]{4,12}$/.test(docTrim)) {
      return { ok: false, error: "El documento debe contener entre 4 y 12 caracteres alfanuméricos." };
    }

    const nombres = (input.consumidorNombres || "").trim();
    const apellidos = (input.consumidorApellidos || "").trim();
    if (nombres.length < 2 || apellidos.length < 2) {
      return { ok: false, error: "Ingresa nombres y apellidos válidos." };
    }
    if (nombres.length > 50 || apellidos.length > 50) {
      return { ok: false, error: "Nombres y apellidos no deben exceder los 50 caracteres cada uno." };
    }

    const telefonoTrim = (input.telefono || "").trim();
    if (telefonoTrim && !/^\d{9}$/.test(telefonoTrim)) {
      return { ok: false, error: "El teléfono debe contener exactamente 9 dígitos numéricos." };
    }

    const domicilio = (input.domicilio || "").trim();
    if (domicilio.length < 5) {
      return { ok: false, error: "Ingresa una dirección de domicilio válida." };
    }
    if (domicilio.length > 150) {
      return { ok: false, error: "La dirección no debe exceder los 150 caracteres." };
    }

    const correo = (input.correo || "").trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo || !emailRegex.test(correo)) {
      return { ok: false, error: "Ingresa un correo electrónico válido para recibir la constancia." };
    }

    if (input.esMenorEdad) {
      const repNombre = (input.representanteNombre || "").trim();
      const repDoc = (input.representanteDocumento || "").trim();
      if (repNombre.length < 3 || repDoc.length < 4) {
        return {
          ok: false,
          error: "Si el consumidor es menor de edad, debes indicar el nombre y documento del padre o apoderado.",
        };
      }
      if (repNombre.length > 50) {
        return { ok: false, error: "El nombre del representante no debe exceder los 50 caracteres." };
      }
      if (repDoc.length > 12) {
        return { ok: false, error: "El documento del representante no debe exceder los 12 caracteres." };
      }
    }

    if (!input.bienContratado || !["producto", "servicio"].includes(input.bienContratado)) {
      return { ok: false, error: "Selecciona si el bien contratado es un producto o servicio." };
    }

    const descripcionBien = (input.descripcionBien || "").trim();
    if (descripcionBien.length < 3) {
      return { ok: false, error: "Indica el nombre o descripción del producto o servicio contratado." };
    }
    if (descripcionBien.length > 120) {
      return { ok: false, error: "La descripción del bien no debe exceder los 120 caracteres." };
    }

    const ordenCodigo = (input.ordenId || "").trim();
    if (!ordenCodigo || ordenCodigo.length < 3 || ordenCodigo.length > 30) {
      return {
        ok: false,
        error: "Debes ingresar el N.° de orden o pedido de tu compra.",
      };
    }

    const detalle = (input.detalle || "").trim();
    if (detalle.length < 10) {
      return { ok: false, error: "El detalle de la reclamación debe contener al menos 10 caracteres." };
    }
    if (detalle.length > 700) {
      return { ok: false, error: "El detalle de la reclamación no debe exceder los 700 caracteres." };
    }

    const pedido = (input.pedidoConsumidor || "").trim();
    if (pedido.length < 5) {
      return { ok: false, error: "Indica el pedido o solución que solicitas a Amorelo." };
    }
    if (pedido.length > 350) {
      return { ok: false, error: "El pedido concreto no debe exceder los 350 caracteres." };
    }

    // 2. Extraer IP pública del cliente para trazabilidad legal y Rate Limit
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      null;

    const adminClient = createAdminClient();

    // Rate Limit: 1 envío cada 15 minutos por IP
    if (ip) {
      const hace15Min = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data: reclamoReciente } = await adminClient
        .from("reclamos")
        .select("id, creado_en")
        .eq("ip", ip)
        .gte("creado_en", hace15Min)
        .limit(1)
        .maybeSingle();

      if (reclamoReciente) {
        return {
          ok: false,
          error: "Por seguridad, solo se permite registrar una reclamación cada 15 minutos desde tu red. Por favor intenta más tarde.",
        };
      }
    }

    // 3. Verificación estricta de orden en la base de datos (Opción A)
    // Se limpia posible prefijo '#' y se busca por el número visible (ej. ORD-000018).
    // Si la orden no existe, se responde con mensaje genérico de protección anti-enumeración.
    const ordenLimpia = ordenCodigo.replace(/^#\s*/, "");
    const { data: ordenRegistrada, error: errorOrden } = await adminClient
      .from("ordenes")
      .select("id, numero_orden")
      .ilike("numero_orden", ordenLimpia)
      .maybeSingle();

    if (errorOrden || !ordenRegistrada) {
      return {
        ok: false,
        error: "No hemos podido registrar tu reclamación en este momento. Inténtalo nuevamente.",
      };
    }

    const fechaLimite = calcularFechaLimiteRespuesta(15);

    // 4. Inserción segura con cliente administrativo vinculando el UUID real de la orden
    const payload = {
      tipo: input.tipo,
      tipo_documento: input.tipoDocumento,
      numero_documento: docTrim,
      consumidor_nombres: nombres,
      consumidor_apellidos: apellidos,
      domicilio: domicilio,
      telefono: (input.telefono || "").trim() || null,
      correo: correo,
      es_menor_edad: Boolean(input.esMenorEdad),
      representante_nombre: input.esMenorEdad ? (input.representanteNombre || "").trim() : null,
      representante_documento: input.esMenorEdad ? (input.representanteDocumento || "").trim() : null,
      bien_contratado: input.bienContratado,
      descripcion_bien: descripcionBien,
      monto_reclamado: input.montoReclamado && input.montoReclamado > 0 ? input.montoReclamado : null,
      moneda: input.montoReclamado && input.montoReclamado > 0 ? input.moneda || "PEN" : null,
      orden_id: ordenRegistrada.id,
      detalle: detalle,
      pedido_consumidor: pedido,
      estado: "pendiente",
      fecha_limite_respuesta: fechaLimite,
      ip: ip,
    };

    const { data, error } = await adminClient
      .from("reclamos")
      .insert(payload)
      .select("id, numero, creado_en, fecha_limite_respuesta")
      .single();

    if (error || !data) {
      console.error("[Reclamaciones Públicas] Error al insertar en BD:", error);
      return {
        ok: false,
        error: "No hemos podido registrar tu reclamación en este momento. Inténtalo nuevamente.",
      };
    }

    // Revalidar vista de reclamos en el panel admin para que aparezca en tiempo real
    revalidatePath("/panel-admin/reclamaciones");

    return {
      ok: true,
      id: data.id,
      numero: data.numero,
      creadoEn: data.creado_en,
      fechaLimiteRespuesta: data.fecha_limite_respuesta,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error inesperado al procesar el reclamo.";
    console.error("[Reclamaciones Públicas] Excepción:", err);
    return { ok: false, error: msg };
  }
}
