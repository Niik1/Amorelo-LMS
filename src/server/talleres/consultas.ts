// Consultas de Talleres y Validación de Tickets (Fase 4 - Plan §4.1, 4.2 y 4.3).

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizarNombrePais } from "@/lib/paises/paises";

export type DatosTicket = {
  numero_orden: string;
  estado: string;
  asistente_nombre: string;
  taller_nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  lugar: string;
  direccion: string | null;
  referencia: string | null;
  material_incluido: string | null;
  maps_url?: string | null;
  ticket_codigo: string;
  total: number;
  monto_pagado: number;
  saldo_pendiente: number;
  fecha_limite_saldo: string | null;
  retenida_hasta: string | null;
  validado_en: string | null;
  asistio: boolean | null;
};

export type TallerAdminItem = {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  horas_academicas?: number | null;
  lugar: string;
  direccion: string | null;
  referencia: string | null;
  material_incluido: string | null;
  maps_url?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  precio_pen: number;
  precio_preventa_pen?: number | null;
  preventa_hasta?: string | null;
  cupos_totales: number;
  estado: string;
  ocupados: number;
  disponibles: number;
  confirmadas: number;
  con_adelanto: number;
  ingresos_validados: number;
  asistieron: number;
};

export type ReservaAsistenteItem = {
  id: string;
  taller_id: string;
  cliente_id: string;
  orden_id: string;
  estado: string;
  ticket_codigo: string;
  token_acceso: string;
  validado_en: string | null;
  asistio: boolean;
  asistencia_marcada_en: string | null;
  fecha_limite_saldo: string | null;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string | null;
  numero_documento: string | null;
  numero_orden: string;
  total: number;
  monto_pagado: number;
  saldo_pendiente: number;
  canal: string;
  contacto_exportado_en?: string | null;
  creado_en?: string;
  pais?: string;
};

/**
 * Obtiene la lista de todos los talleres para el Panel de Administración
 * junto con sus métricas de ocupación en tiempo real.
 */
export async function obtenerTalleresAdmin(): Promise<TallerAdminItem[]> {
  const supabase = createAdminClient();

  const { data: talleres, error: errorTalleres } = await supabase
    .from("talleres")
    .select(`
      id, nombre, slug, descripcion, horas_academicas, lugar, direccion, referencia, material_incluido, maps_url,
      fecha_inicio, fecha_fin, precio_pen, precio_preventa_pen, preventa_hasta, cupos_totales, estado
    `)
    .order("fecha_inicio", { ascending: false });

  if (errorTalleres || !talleres) {
    return [];
  }

  const { data: ocupacion } = await supabase
    .from("v_talleres_ocupacion")
    .select("*");

  const ocupacionMap = new Map((ocupacion || []).map((o: any) => [o.id, o]));

  return talleres.map((t: any) => {
    const o = ocupacionMap.get(t.id) || {};
    return {
      id: t.id,
      nombre: t.nombre,
      slug: t.slug,
      descripcion: t.descripcion ?? null,
      horas_academicas:
        t.horas_academicas !== null && t.horas_academicas !== undefined
          ? Number(t.horas_academicas)
          : null,
      lugar: t.lugar,
      direccion: t.direccion,
      referencia: t.referencia,
      material_incluido: t.material_incluido,
      maps_url: t.maps_url || null,
      fecha_inicio: t.fecha_inicio,
      fecha_fin: t.fecha_fin,
      precio_pen: Number(t.precio_pen || 0),
      precio_preventa_pen:
        t.precio_preventa_pen !== null && t.precio_preventa_pen !== undefined
          ? Number(t.precio_preventa_pen)
          : null,
      preventa_hasta: t.preventa_hasta || null,
      cupos_totales: Number(t.cupos_totales || 0),
      estado: t.estado,
      ocupados: Number(o.ocupados || 0),
      disponibles: Number(o.disponibles ?? t.cupos_totales),
      confirmadas: Number(o.confirmadas || 0),
      con_adelanto: Number(o.con_adelanto || 0),
      ingresos_validados: Number(o.ingresos_validados || 0),
      asistieron: Number(o.asistieron || 0),
    };
  });
}

/**
 * Obtiene el detalle de un taller específico para su vista de gestión y puerta.
 */
export async function obtenerTallerDetalle(
  tallerId: string
): Promise<TallerAdminItem | null> {
  const talleres = await obtenerTalleresAdmin();
  return talleres.find((t) => t.id === tallerId) || null;
}

/**
 * Obtiene todos los asistentes inscritos a un taller con sus datos personales,
 * estado de pago, código de ticket y asistencia.
 */
export async function obtenerReservasTallerAdmin(
  tallerId: string
): Promise<ReservaAsistenteItem[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reservas_taller")
    .select(`
      id, taller_id, cliente_id, orden_id, estado, ticket_codigo, token_acceso,
      validado_en, asistio, asistencia_marcada_en, fecha_limite_saldo,
      contacto_exportado_en, creado_en,
      clientes ( nombres, apellidos, correo, telefono, numero_documento, pais ),
      ordenes ( numero_orden, total, monto_pagado, saldo_pendiente, canal )
    `)
    .eq("taller_id", tallerId)
    .order("creado_en", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((r: any) => {
    const c = r.clientes || {};
    const o = r.ordenes || {};
    return {
      id: r.id,
      taller_id: r.taller_id,
      cliente_id: r.cliente_id,
      orden_id: r.orden_id,
      estado: r.estado,
      ticket_codigo: r.ticket_codigo,
      token_acceso: r.token_acceso,
      validado_en: r.validado_en,
      asistio: Boolean(r.asistio),
      asistencia_marcada_en: r.asistencia_marcada_en,
      fecha_limite_saldo: r.fecha_limite_saldo,
      nombres: c.nombres || "",
      apellidos: c.apellidos || "",
      correo: c.correo || "",
      telefono: c.telefono || null,
      numero_documento: c.numero_documento || null,
      numero_orden: o.numero_orden || "",
      total: Number(o.total || 0),
      monto_pagado: Number(o.monto_pagado || 0),
      saldo_pendiente: Number(o.saldo_pendiente || 0),
      canal: o.canal || "web",
      contacto_exportado_en: r.contacto_exportado_en || null,
      creado_en: r.creado_en || new Date().toISOString(),
      pais: normalizarNombrePais(c.pais),
    };
  });
}

/**
 * Consulta la reserva y datos del taller usando el token seguro de acceso.
 * Consume la función SQL consultar_reserva_por_token(token).
 */
export async function consultarTicketPorToken(
  token: string
): Promise<DatosTicket | null> {
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("consultar_reserva_por_token", {
    p_token: token.trim(),
  });

  if (error || !data || data.length === 0) {
    return null;
  }

  const row = data[0];

  // Si maps_url no viene en la función RPC, lo resolvemos desde la reserva
  let tallerMapsUrl: string | null = (row as any).maps_url ?? null;
  if (!tallerMapsUrl) {
    const { data: reservaData } = await supabase
      .from("reservas_taller")
      .select("taller:talleres(maps_url)")
      .eq("token_acceso", token.trim())
      .maybeSingle();

    if (reservaData?.taller && typeof reservaData.taller === "object") {
      tallerMapsUrl = (reservaData.taller as any).maps_url ?? null;
    }
  }

  return {
    numero_orden: row.numero_orden,
    estado: row.estado,
    asistente_nombre: row.asistente_nombre,
    taller_nombre: row.taller_nombre,
    fecha_inicio: row.fecha_inicio,
    fecha_fin: row.fecha_fin,
    lugar: row.lugar,
    direccion: row.direccion ?? null,
    referencia: row.referencia ?? null,
    material_incluido: row.material_incluido ?? null,
    maps_url: tallerMapsUrl,
    ticket_codigo: row.ticket_codigo,
    total: Number(row.total || 0),
    monto_pagado: Number(row.monto_pagado || 0),
    saldo_pendiente: Number(row.saldo_pendiente || 0),
    fecha_limite_saldo: row.fecha_limite_saldo ?? null,
    retenida_hasta: row.retenida_hasta ?? null,
    validado_en: row.validado_en ?? null,
    asistio: row.asistio ?? false,
  };
}

/**
 * Valida un ticket en puerta mediante el token de acceso o código corto.
 * Consume la función SQL validar_ticket(codigo, adminId).
 */
export async function validarTicketAcceso(
  codigoOToken: string,
  adminId: string,
  tallerId?: string
): Promise<{
  ok: boolean;
  resultado:
    | "valido"
    | "ya_validado"
    | "no_confirmada"
    | "taller_incorrecto"
    | "no_encontrado"
    | "error";
  mensaje: string;
  detalle?: {
    asistente_nombre: string;
    ticket_codigo: string;
    numero_orden: string;
    taller_nombre: string;
    saldo_pendiente: number;
    asistio: boolean;
    validado_en: string | null;
  };
}> {
  // Limpieza inteligente: si se escaneó una URL completa, extraer el token
  let codigoLimpio = codigoOToken.trim();
  if (codigoLimpio.includes("/t/")) {
    codigoLimpio = codigoLimpio.split("/t/").pop()?.split("?")[0] || codigoLimpio;
  }

  const supabase = createAdminClient();

  // Obtenemos primero los datos para poder mostrarlos en el resultado del escaneo
  const { data: ticketPrevio } = await supabase.rpc("consultar_reserva_por_token", {
    p_token: codigoLimpio,
  });

  const { data, error } = await supabase.rpc("validar_ticket", {
    p_codigo: codigoLimpio,
    p_admin: adminId,
    p_taller_id: tallerId,
  });

  if (error) {
    return {
      ok: false,
      resultado: "error",
      mensaje: "Error de conexión al validar el ticket.",
    };
  }

  const res = String(data);
  const infoPrev = ticketPrevio && ticketPrevio.length > 0 ? ticketPrevio[0] : null;

  const detalle = infoPrev
    ? {
        asistente_nombre: infoPrev.asistente_nombre,
        ticket_codigo: infoPrev.ticket_codigo,
        numero_orden: infoPrev.numero_orden,
        taller_nombre: infoPrev.taller_nombre,
        saldo_pendiente: Number(infoPrev.saldo_pendiente || 0),
        asistio: Boolean(infoPrev.asistio),
        validado_en: infoPrev.validado_en,
      }
    : undefined;

  switch (res) {
    case "valido":
      return {
        ok: true,
        resultado: "valido",
        mensaje: "¡Ingreso Autorizado! Asistencia registrada correctamente.",
        detalle,
      };
    case "ya_validado":
      return {
        ok: false,
        resultado: "ya_validado",
        mensaje: "¡Alerta! Este ticket ya fue ingresado previamente.",
        detalle,
      };
    case "no_confirmada":
      return {
        ok: false,
        resultado: "no_confirmada",
        mensaje:
          infoPrev?.estado === "vencida"
            ? "¡Acceso Denegado! El cupo de este ticket fue liberado por vencimiento del plazo de pago."
            : "Ticket no confirmado (cuenta con saldo pendiente o reserva no pagada).",
        detalle,
      };
    case "taller_incorrecto":
      return {
        ok: false,
        resultado: "taller_incorrecto",
        mensaje: "Este ticket pertenece a otra fecha o taller diferente.",
        detalle,
      };
    case "no_encontrado":
      return {
        ok: false,
        resultado: "no_encontrado",
        mensaje: "Código o token no encontrado en el sistema.",
      };
    default:
      return {
        ok: false,
        resultado: "error",
        mensaje: `Respuesta desconocida del validador: ${res}`,
      };
  }
}
