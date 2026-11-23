// Server Actions para validación de tickets y asistencia en Talleres Presenciales (Fase 4 - Plan §4.2, 4.3 y 4.4).

"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerAdminVerificado } from "@/server/auth/admin";
import { validarTicketAcceso } from "./consultas";
import { obtenerOCrearClienteSeguro } from "@/server/clientes/gestion-cliente";
import { obtenerBaseUrl } from "@/lib/urls";
import { emitirComprobanteParaOrden } from "@/server/comprobantes/emision";

export type DatosCrearTaller = {
  nombre: string;
  slug?: string;
  descripcion?: string;
  fecha_inicio: string; // ISO o datetime-local
  fecha_fin: string; // ISO o datetime-local
  lugar: string;
  direccion?: string;
  referencia?: string;
  maps_url?: string;
  cupos_totales: number;
  precio_pen: number;
  precio_preventa_pen?: number;
  preventa_hasta?: string;
  material_incluido?: string;
  horas_academicas?: number;
  estado?: "publicado" | "inhabilitado" | "borrador";
};

/**
 * Convierte una fecha y hora local (ej. "2026-12-05T09:00") a ISO UTC fijando
 * explícitamente el huso horario oficial de Perú (America/Lima / UTC-5).
 * Previene desfases de 5 horas al desplegar en servidores UTC como Vercel.
 */
function normalizarFechaPeruIso(fechaStr: string): string {
  const f = fechaStr.trim();
  if (!f) return f;
  if (f.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(f)) {
    return new Date(f).toISOString();
  }
  const conSegundos = f.length === 16 ? `${f}:00` : f;
  return new Date(`${conSegundos}-05:00`).toISOString();
}

export type DatosReservaManual = {
  tallerId: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  tipoDocumento: "DNI" | "CE" | "PASAPORTE" | "RUC";
  numeroDocumento: string;
  tipoPago: "total" | "adelanto";
  montoPagado: number;
  saldoPendiente?: number;
  fechaLimiteSaldo?: string; // YYYY-MM-DD
  canal: "whatsapp" | "transferencia" | "yape" | "efectivo";
  notas?: string;
};

/**
 * Valida el ingreso de un asistente en la puerta del taller presencial.
 * Acepta token o código (ej: "TK-7842" o la URL completa escaneada por cámara).
 */
export async function validarTicketAction(
  tokenOcodigo: string,
  tallerId?: string
) {
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);

  if (!adminId) {
    return {
      ok: false,
      error: "No autorizado. Solo un administrador verificado puede validar ingresos.",
    };
  }

  const res = await validarTicketAcceso(tokenOcodigo, adminId, tallerId);

  if (res.ok) {
    revalidatePath(`/t/${tokenOcodigo}`);
    revalidatePath("/panel-admin/talleres");
    if (tallerId) {
      revalidatePath(`/panel-admin/talleres/${tallerId}`);
    }
    return {
      ok: true,
      mensaje: res.mensaje,
      resultado: res.resultado,
      detalle: res.detalle,
    };
  }

  return {
    ok: false,
    error: res.mensaje,
    resultado: res.resultado,
    detalle: res.detalle,
  };
}

/**
 * Marca o desmarca asistencia manualmente desde el listado de asistentes del taller.
 */
export async function marcarAsistenciaManualAction(
  reservaId: string,
  asistio: boolean,
  tallerId: string
) {
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);

  if (!adminId) {
    return {
      ok: false,
      error: "No autorizado. Solo un administrador puede marcar asistencia.",
    };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.rpc("marcar_asistencia", {
    p_reserva_id: reservaId,
    p_asistio: asistio,
    p_admin: adminId,
  });

  if (error) {
    return {
      ok: false,
      error: error.message || "Error al actualizar la asistencia del asistente.",
    };
  }

  revalidatePath("/panel-admin/talleres");
  revalidatePath(`/panel-admin/talleres/${tallerId}`);
  return { ok: true };
}

/**
 * Registra una reserva manual de taller presencial (WhatsApp, seña/adelanto o pago total).
 * Aplica Item 4.4 del checklist.
 */
export async function registrarReservaManualAction(datos: DatosReservaManual) {
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);

  if (!adminId) {
    return {
      ok: false,
      error: "No tienes permisos de administrador para realizar esta acción.",
    };
  }

  const adminClient = createAdminClient();

  try {
    // 1. Obtener datos del taller
    const { data: taller, error: errorTaller } = await adminClient
      .from("talleres")
      .select("id, nombre, precio_pen, fecha_inicio, cupos_totales")
      .eq("id", datos.tallerId)
      .single();

    if (errorTaller || !taller) {
      return { ok: false, error: "El taller especificado no existe." };
    }

    // 2. Crear o asociar cliente de forma segura (sin sobreescritura ciega)
    const resultadoCliente = await obtenerOCrearClienteSeguro({
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      correo: datos.correo,
      telefono: datos.telefono,
      tipoDocumento: datos.tipoDocumento,
      numeroDocumento: datos.numeroDocumento,
      origen: "admin_manual",
    });

    if (!resultadoCliente.ok) {
      return { ok: false, error: resultadoCliente.error };
    }

    const clienteId = resultadoCliente.clienteId;

    // 3. Crear orden y su ítem
    const totalPrecio = Number(taller.precio_pen);
    const montoPagado = Number(datos.montoPagado);
    const saldoPendiente = Math.max(0, totalPrecio - montoPagado);
    const esPagoTotal = datos.tipoPago === "total" || saldoPendiente === 0;

    const { data: orden, error: errorOrden } = await adminClient
      .from("ordenes")
      .insert({
        cliente_id: clienteId,
        clave_idempotencia: `manual-${crypto.randomUUID()}`,
        tipo_orden: "taller",
        canal: "manual",
        registrada_por: adminId,
        subtotal: totalPrecio,
        total: totalPrecio,
        monto_pagado: montoPagado,
        estado: esPagoTotal ? "pagada" : "parcial",
        pagada_en: esPagoTotal ? new Date().toISOString() : undefined,
      })
      .select("id, numero_orden")
      .single();

    if (errorOrden || !orden) {
      return {
        ok: false,
        error: "Error al crear la orden del taller: " + (errorOrden?.message || ""),
      };
    }

    // Insertar el ítem de la orden en public.orden_items
    const { error: errorItem } = await adminClient.from("orden_items").insert({
      orden_id: orden.id,
      tipo_item: "taller",
      taller_id: taller.id,
      descripcion: taller.nombre,
      cantidad: 1,
      precio_unitario: totalPrecio,
      subtotal: totalPrecio,
    });

    if (errorItem) {
      console.error("[registrarReservaManualAction] Error insertando en orden_items:", errorItem);
    }

    // 4. Tomar cupo e insertar reserva
    const fechaLimite =
      !esPagoTotal && datos.fechaLimiteSaldo
        ? new Date(`${datos.fechaLimiteSaldo}T23:59:59-05:00`).toISOString()
        : undefined;

    const { error: errorCupo } = await adminClient.rpc("tomar_cupo_taller", {
      p_taller_id: datos.tallerId,
      p_cliente_id: clienteId,
      p_orden_id: orden.id,
      p_modo: esPagoTotal ? "retencion" : "adelanto",
      p_fecha_limite_saldo: !esPagoTotal ? fechaLimite : undefined,
    });

    if (errorCupo) {
      return {
        ok: false,
        error: "No se pudo reservar el cupo (posible aforo completo o conflicto): " + errorCupo.message,
      };
    }

    // Si pagó el 100%, confirmar la reserva formalmente y emitir comprobante
    if (esPagoTotal) {
      await adminClient.rpc("confirmar_reserva_taller", {
        p_orden_id: orden.id,
      });

      try {
        await emitirComprobanteParaOrden(orden.id);
      } catch (compErr) {
        console.warn("[registrarReservaManualAction] Advertencia emitiendo comprobante:", compErr);
      }
    }

    // Registrar notas y método de pago en la reserva
    if (datos.notas || datos.canal) {
      const notaFinal = [
        datos.canal ? `[Pago vía: ${datos.canal.toUpperCase()}]` : "",
        datos.notas?.trim() || "",
      ]
        .filter(Boolean)
        .join(" - ");

      await adminClient
        .from("reservas_taller")
        .update({ notas: notaFinal })
        .eq("orden_id", orden.id);
    }

    // Obtener la reserva generada
    const { data: reserva } = await adminClient
      .from("reservas_taller")
      .select("ticket_codigo, token_acceso")
      .eq("orden_id", orden.id)
      .single();

    const baseUrl = obtenerBaseUrl();
    const ticketUrl = reserva ? `${baseUrl}/t/${reserva.token_acceso}` : "";

    // Construir mensaje listo para WhatsApp
    const mensajeWhatsApp = `¡Hola ${datos.nombres.trim()}! 🎈
Tu reserva para el taller presencial *${taller.nombre}* ha sido registrada con éxito.

🎟️ *Código de Ticket:* ${reserva?.ticket_codigo || "Pendiente"}
💰 *Monto Pagado:* S/ ${montoPagado.toFixed(2)}
${saldoPendiente > 0 ? `⚠️ *Saldo Pendiente:* S/ ${saldoPendiente.toFixed(2)} (A pagar antes del ingreso)\n` : "✅ *Estado:* Pago 100% Confirmado\n"}
📱 *Tu Ticket Digital y Pase de Entrada:*
${ticketUrl}

¡Nos vemos en el taller! Cualquier consulta estamos a tu disposición. ✨`;

    revalidatePath("/panel-admin/talleres");
    revalidatePath(`/panel-admin/talleres/${datos.tallerId}`);

    return {
      ok: true,
      ticketCodigo: reserva?.ticket_codigo,
      tokenAcceso: reserva?.token_acceso,
      ticketUrl,
      mensajeWhatsApp,
      telefono: datos.telefono,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err.message || "Error inesperado al registrar la reserva manual.",
    };
  }
}

/**
 * Crea un nuevo taller presencial en el catálogo de eventos.
 */
export async function crearTallerAction(datos: DatosCrearTaller) {
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);

  if (!adminId) {
    return {
      ok: false,
      error: "No tienes permisos de administrador para realizar esta acción.",
    };
  }

  const adminClient = createAdminClient();

  try {
    const slug =
      datos.slug && datos.slug.trim().length > 0
        ? datos.slug.trim().toLowerCase()
        : datos.nombre
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

    const fechaInicioIso = normalizarFechaPeruIso(datos.fecha_inicio);
    const fechaFinIso = normalizarFechaPeruIso(datos.fecha_fin);

    const preventaHastaIso = datos.preventa_hasta
      ? normalizarFechaPeruIso(datos.preventa_hasta)
      : null;

    const { data, error } = await adminClient
      .from("talleres")
      .insert({
        nombre: datos.nombre.trim(),
        slug,
        descripcion: datos.descripcion?.trim() || null,
        fecha_inicio: fechaInicioIso,
        fecha_fin: fechaFinIso,
        lugar: datos.lugar.trim(),
        direccion: datos.direccion?.trim() || null,
        referencia: datos.referencia?.trim() || null,
        maps_url: datos.maps_url?.trim() || null,
        cupos_totales: Number(datos.cupos_totales),
        precio_pen: Number(datos.precio_pen),
        precio_preventa_pen: datos.precio_preventa_pen
          ? Number(datos.precio_preventa_pen)
          : null,
        preventa_hasta: preventaHastaIso,
        material_incluido: datos.material_incluido?.trim() || null,
        horas_academicas: datos.horas_academicas
          ? Number(datos.horas_academicas)
          : null,
        estado: datos.estado || "publicado",
      })
      .select("id, slug, nombre")
      .single();

    if (error || !data) {
      if (error?.code === "23505") {
        return {
          ok: false,
          error: "Ya existe un taller con este enlace (slug) o nombre similar.",
        };
      }
      return {
        ok: false,
        error: error?.message || "Error al crear el taller en la base de datos.",
      };
    }

    revalidatePath("/panel-admin/talleres");
    return { ok: true, tallerId: data.id, slug: data.slug };
  } catch (err: any) {
    return {
      ok: false,
      error: err.message || "Error inesperado al crear el taller.",
    };
  }
}

export type DatosActualizarTaller = {
  id: string;
  nombre: string;
  slug?: string;
  descripcion?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  lugar: string;
  direccion?: string | null;
  referencia?: string | null;
  maps_url?: string | null;
  cupos_totales: number;
  precio_pen: number;
  precio_preventa_pen?: number | null;
  preventa_hasta?: string | null;
  material_incluido?: string | null;
  horas_academicas?: number | null;
  estado: "publicado" | "inhabilitado" | "cancelado" | string;
};

/**
 * Actualiza un taller presencial existente en el catálogo.
 */
export async function actualizarTallerAction(datos: DatosActualizarTaller) {
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);

  if (!adminId) {
    return {
      ok: false,
      error: "No tienes permisos de administrador para realizar esta acción.",
    };
  }

  const adminClient = createAdminClient();

  try {
    const fechaInicioIso = normalizarFechaPeruIso(datos.fecha_inicio);
    const fechaFinIso = normalizarFechaPeruIso(datos.fecha_fin);
    const preventaHastaIso = datos.preventa_hasta
      ? normalizarFechaPeruIso(datos.preventa_hasta)
      : null;

    const { data, error } = await adminClient
      .from("talleres")
      .update({
        nombre: datos.nombre.trim(),
        descripcion: datos.descripcion ? datos.descripcion.trim() : null,
        fecha_inicio: fechaInicioIso,
        fecha_fin: fechaFinIso,
        lugar: datos.lugar.trim(),
        direccion: datos.direccion ? datos.direccion.trim() : null,
        referencia: datos.referencia ? datos.referencia.trim() : null,
        maps_url: datos.maps_url ? datos.maps_url.trim() : null,
        cupos_totales: Number(datos.cupos_totales),
        precio_pen: Number(datos.precio_pen),
        precio_preventa_pen:
          datos.precio_preventa_pen !== undefined && datos.precio_preventa_pen !== null
            ? Number(datos.precio_preventa_pen)
            : null,
        preventa_hasta: preventaHastaIso,
        material_incluido: datos.material_incluido ? datos.material_incluido.trim() : null,
        horas_academicas:
          datos.horas_academicas !== undefined && datos.horas_academicas !== null
            ? Number(datos.horas_academicas)
            : null,
        estado: datos.estado || "publicado",
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", datos.id)
      .select("*")
      .single();

    if (error || !data) {
      return {
        ok: false,
        error: error?.message || "Error al actualizar el taller en la base de datos.",
      };
    }

    revalidatePath("/panel-admin/talleres");
    revalidatePath(`/panel-admin/talleres/${datos.id}`);
    revalidatePath("/taller-presencial");

    return { ok: true, taller: data };
  } catch (err: any) {
    return {
      ok: false,
      error: err.message || "Error inesperado al actualizar el taller.",
    };
  }
}

/**
 * Liquida el saldo pendiente de una reserva con adelanto, marcando la orden
 * como pagada (100%) y la reserva como confirmada.
 */
export async function liquidarSaldoReservaAction(datos: {
  reservaId: string;
  ordenId: string;
  tallerId: string;
  canal?: string;
  notas?: string;
}) {
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);

  if (!adminId) {
    return { ok: false, error: "No autorizado." };
  }

  const adminClient = createAdminClient();

  try {
    // 0. Verificar el estado actual de la reserva
    const { data: reservaActual, error: errReservaActual } = await adminClient
      .from("reservas_taller")
      .select("id, estado")
      .eq("id", datos.reservaId)
      .single();

    if (errReservaActual || !reservaActual) {
      return { ok: false, error: "No se encontró la reserva." };
    }

    if (reservaActual.estado === "vencida") {
      return {
        ok: false,
        error: "Esta reserva ya fue marcada como vencida y su cupo fue liberado. No es posible liquidar el saldo de un cupo ya liberado.",
      };
    }

    // 1. Obtener orden actual para conocer el total
    const { data: orden, error: errOrden } = await adminClient
      .from("ordenes")
      .select("id, total, monto_pagado")
      .eq("id", datos.ordenId)
      .single();

    if (errOrden || !orden) {
      return { ok: false, error: "No se encontró la orden asociada." };
    }

    // 2. Actualizar la orden a 100% pagada
    // Nota: saldo_pendiente es GENERATED ALWAYS AS (total - monto_pagado) STORED
    const { error: errUpdateOrden } = await adminClient
      .from("ordenes")
      .update({
        monto_pagado: orden.total,
        estado: "pagada",
      })
      .eq("id", datos.ordenId);

    if (errUpdateOrden) {
      return { ok: false, error: "Error al actualizar la orden: " + errUpdateOrden.message };
    }

    // 2.1. Emitir comprobante al quedar 100% pagada
    try {
      await emitirComprobanteParaOrden(datos.ordenId);
    } catch (compErr) {
      console.warn("[liquidarSaldoTallerAction] Advertencia emitiendo comprobante:", compErr);
    }

    // 3. Actualizar la reserva a 'confirmada'
    const notaSaldo = (datos.canal || datos.notas)
      ? [
          datos.canal ? `[Saldo cancelado vía: ${datos.canal.toUpperCase()}]` : "",
          datos.notas?.trim() || "",
        ]
          .filter(Boolean)
          .join(" - ")
      : undefined;

    const { error: errReserva } = await adminClient
      .from("reservas_taller")
      .update({
        estado: "confirmada",
        ...(notaSaldo ? { notas: notaSaldo } : {}),
      })
      .eq("id", datos.reservaId);

    if (errReserva) {
      return { ok: false, error: "Error al confirmar la reserva: " + errReserva.message };
    }

    revalidatePath("/panel-admin/talleres");
    revalidatePath(`/panel-admin/talleres/${datos.tallerId}`);

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Error al liquidar el saldo." };
  }
}

/**
 * Extiende la fecha límite de pago de saldo para una reserva con adelanto.
 */
export async function extenderPlazoReservaAction(datos: {
  reservaId: string;
  ordenId?: string;
  tallerId: string;
  nuevaFechaLimite: string; // YYYY-MM-DD
}) {
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);

  if (!adminId) {
    return { ok: false, error: "No autorizado." };
  }

  const adminClient = createAdminClient();

  try {
    // 0. Verificar el estado actual de la reserva
    const { data: reservaActual, error: errReservaActual } = await adminClient
      .from("reservas_taller")
      .select("id, estado")
      .eq("id", datos.reservaId)
      .single();

    if (errReservaActual || !reservaActual) {
      return { ok: false, error: "No se encontró la reserva." };
    }

    if (reservaActual.estado === "vencida") {
      return {
        ok: false,
        error: "Esta reserva ya fue marcada como vencida y su cupo fue liberado. No es posible extender el plazo de un cupo ya liberado.",
      };
    }

    const nuevaFechaIso = new Date(`${datos.nuevaFechaLimite}T23:59:59-05:00`).toISOString();

    const { error } = await adminClient
      .from("reservas_taller")
      .update({
        fecha_limite_saldo: nuevaFechaIso,
        estado: "adelanto",
      })
      .eq("id", datos.reservaId);

    if (error) {
      return { ok: false, error: "Error al extender el plazo: " + error.message };
    }

    // Asegurar que la orden vuelva a estado parcial si estaba vencida
    if (datos.ordenId) {
      await adminClient
        .from("ordenes")
        .update({ estado: "parcial" })
        .eq("id", datos.ordenId);
    }

    revalidatePath("/panel-admin/talleres");
    revalidatePath(`/panel-admin/talleres/${datos.tallerId}`);

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Error al extender el plazo." };
  }
}

/**
 * Libera un cupo de reserva vencida o cancelada por falta de pago del saldo.
 * Pasa la reserva y la orden a estado 'vencida', liberando inmediatamente el aforo.
 */
export async function liberarCupoReservaAction(datos: {
  reservaId: string;
  ordenId: string;
  tallerId: string;
  motivo?: string;
}) {
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);

  if (!adminId) {
    return { ok: false, error: "No autorizado." };
  }

  const adminClient = createAdminClient();

  try {
    // 1. Marcar reserva como 'vencida'
    const { error: errReserva } = await adminClient
      .from("reservas_taller")
      .update({
        estado: "vencida",
        notas: datos.motivo ? `[Cupo liberado por admin]: ${datos.motivo}` : "[Cupo liberado por vencimiento de plazo de saldo]",
      })
      .eq("id", datos.reservaId);

    if (errReserva) {
      return { ok: false, error: "Error al liberar cupo de la reserva: " + errReserva.message };
    }

    // 2. Marcar orden como 'vencida'
    await adminClient
      .from("ordenes")
      .update({ estado: "vencida" })
      .eq("id", datos.ordenId);

    revalidatePath("/panel-admin/talleres");
    revalidatePath(`/panel-admin/talleres/${datos.tallerId}`);

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Error al liberar el cupo." };
  }
}

/**
 * Marca una lista de reservas de taller como exportadas a contactos.
 */
export async function marcarReservasContactosExportadosAction(
  reservaIds: string[]
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: "No autenticado" };
    }

    if (!reservaIds || reservaIds.length === 0) {
      return { ok: true };
    }

    const admin = createAdminClient();
    const ahoraIso = new Date().toISOString();

    const { error } = await (admin.from("reservas_taller") as any)
      .update({ contacto_exportado_en: ahoraIso })
      .in("id", reservaIds);

    if (error) {
      console.error("[marcarReservasContactosExportadosAction] Error:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err: any) {
    console.error("[marcarReservasContactosExportadosAction] Excepción:", err);
    return { ok: false, error: err.message };
  }
}



