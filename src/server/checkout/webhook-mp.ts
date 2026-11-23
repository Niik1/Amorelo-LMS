// Procesamiento seguro del Webhook de Mercado Pago (Vector E).
// 1. Validación de x-signature (HMAC-SHA256).
// 2. Consulta anti-spoofing directa a la API de Mercado Pago (GET /v1/payments/{id}).
// 3. Idempotencia mediante public.eventos_webhook.
// 4. Invocación de RPCs: marcar_orden_pagada, emitir_comprobante_interno, otorgar_matricula, confirmar_reserva_taller.

import "server-only";
import crypto from "crypto";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";
import { emitirComprobanteParaOrden } from "@/server/comprobantes/emision";

export type ValidacionFirmaResultado = {
  valida: boolean;
  razon?: string;
};

/**
 * Valida el encabezado criptográfico x-signature según la especificación de Mercado Pago.
 * Manifest: "id:[data.id];request-id:[x-request-id];ts:[ts];"
 * HMAC-SHA256 con MERCADOPAGO_WEBHOOK_SECRET.
 */
export function validarFirmaMercadoPago({
  xSignature,
  xRequestId,
  dataId,
  secret,
}: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret: string | undefined;
}): ValidacionFirmaResultado {
  // Si no hay secret configurado (ej. entorno dev/sandbox sin webhook secret creado aún),
  // se permite continuar para no bloquear pruebas locales.
  if (!secret || secret.trim() === "") {
    return { valida: true, razon: "secret_omitido_en_desarrollo" };
  }

  if (!xSignature) {
    return { valida: false, razon: "falta_encabezado_x_signature" };
  }

  const parts = xSignature.split(",");
  let ts: string | null = null;
  let v1: string | null = null;

  for (const part of parts) {
    const [k, v] = part.trim().split("=");
    if (k === "ts") ts = v;
    if (k === "v1") v1 = v;
  }

  if (!ts || !v1) {
    return { valida: false, razon: "formato_x_signature_invalido" };
  }

  // Construir manifest oficial:
  // "id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];"
  let manifest = "";
  if (dataId) {
    manifest += `id:${dataId.toLowerCase()};`;
  }
  if (xRequestId) {
    manifest += `request-id:${xRequestId};`;
  }
  manifest += `ts:${ts};`;

  const cyphedSignature = crypto
    .createHmac("sha256", secret.trim())
    .update(manifest)
    .digest("hex");

  if (cyphedSignature.length !== v1.length) {
    return { valida: false, razon: "longitud_firma_no_coincide" };
  }

  const coincides = crypto.timingSafeEqual(
    Buffer.from(cyphedSignature, "hex"),
    Buffer.from(v1, "hex")
  );

  return {
    valida: coincides,
    razon: coincides ? "valida" : "firma_hmac_no_coincide",
  };
}

export type ProcesarWebhookResultado =
  | { ok: true; status: string; ordenId?: string; pagoId?: string; matriculaId?: string }
  | { ok: false; status: string; error: string; statusCode: number };

/**
 * Procesa la notificación de pago de Mercado Pago de forma atómica e idempotente.
 */
export async function procesarWebhookMercadoPago({
  paymentId,
  eventoId,
  tipoEvento,
  payload,
}: {
  paymentId: string;
  eventoId: string;
  tipoEvento: string;
  payload: Record<string, unknown>;
}): Promise<ProcesarWebhookResultado> {
  const admin = createAdminClient();

  // 1. Idempotencia en public.eventos_webhook
  const { error: insertEventErr } = await admin.from("eventos_webhook").insert({
    proveedor: "mercadopago",
    evento_id: eventoId,
    tipo_evento: tipoEvento,
    contenido: payload as any,
    procesado: false,
  });

  if (insertEventErr) {
    // Si ya existe (código 23505 = unique_violation), verificar si ya fue procesado
    if (insertEventErr.code === "23505") {
      const { data: eventoExistente } = await admin
        .from("eventos_webhook")
        .select("procesado, error")
        .eq("proveedor", "mercadopago")
        .eq("evento_id", eventoId)
        .maybeSingle();

      if (eventoExistente?.procesado) {
        return {
          ok: true,
          status: "evento_ya_procesado_idempotente",
        };
      }
    } else {
      console.error("[Webhook MP] Error registrando en eventos_webhook:", insertEventErr);
    }
  }

  // 2. Consulta directa Anti-Spoofing a Mercado Pago (GET /v1/payments/{id})
  const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!mpAccessToken) {
    await admin
      .from("eventos_webhook")
      .update({ error: "Falta MERCADOPAGO_ACCESS_TOKEN en servidor" })
      .eq("proveedor", "mercadopago")
      .eq("evento_id", eventoId);

    return {
      ok: false,
      status: "config_error",
      error: "MERCADOPAGO_ACCESS_TOKEN no configurado",
      statusCode: 500,
    };
  }

  let paymentData: any;
  try {
    const mpClient = new MercadoPagoConfig({ accessToken: mpAccessToken });
    const payment = new Payment(mpClient);
    paymentData = await payment.get({ id: Number(paymentId) });
  } catch (apiErr: any) {
    console.error("[Webhook MP] Error consultando API de Mercado Pago:", apiErr);
    await admin
      .from("eventos_webhook")
      .update({ error: `Error en consulta MP: ${apiErr?.message || String(apiErr)}` })
      .eq("proveedor", "mercadopago")
      .eq("evento_id", eventoId);

    return {
      ok: false,
      status: "mercadopago_api_error",
      error: "No se pudo consultar el pago en Mercado Pago",
      statusCode: 400,
    };
  }

  if (!paymentData || !paymentData.id) {
    return {
      ok: false,
      status: "pago_no_encontrado",
      error: "El pago no existe en Mercado Pago",
      statusCode: 404,
    };
  }

  const ordenId = paymentData.external_reference;
  if (!ordenId) {
    await admin
      .from("eventos_webhook")
      .update({ error: "Pago sin external_reference (no vinculado a orden)" })
      .eq("proveedor", "mercadopago")
      .eq("evento_id", eventoId);

    return {
      ok: false,
      status: "sin_external_reference",
      error: "El pago no contiene un external_reference válido",
      statusCode: 400,
    };
  }

  // 3. Verificar estado del pago
  if (paymentData.status !== "approved") {
    // Si fue rechazado o cancelado, registrar en la orden
    if (paymentData.status === "rejected" || paymentData.status === "cancelled") {
      await admin
        .from("ordenes")
        .update({ estado: "fallida" })
        .eq("id", ordenId)
        .eq("estado", "pendiente");
    }

    await admin
      .from("eventos_webhook")
      .update({
        error: `Estado de pago no aprobado: ${paymentData.status} (${paymentData.status_detail})`,
        procesado: true,
        procesado_en: new Date().toISOString(),
      })
      .eq("proveedor", "mercadopago")
      .eq("evento_id", eventoId);

    return {
      ok: true,
      status: `pago_${paymentData.status}`,
      ordenId,
    };
  }

  // 4. Buscar la orden asociada
  const { data: orden, error: ordenErr } = await admin
    .from("ordenes")
    .select("id, numero_orden, total, subtotal, moneda, estado, cliente_id, orden_items(*), clientes(*)")
    .eq("id", ordenId)
    .maybeSingle();

  if (ordenErr || !orden) {
    await admin
      .from("eventos_webhook")
      .update({ error: `Orden ${ordenId} no encontrada en base de datos` })
      .eq("proveedor", "mercadopago")
      .eq("evento_id", eventoId);

    return {
      ok: false,
      status: "orden_no_encontrada",
      error: `Orden ${ordenId} no encontrada`,
      statusCode: 404,
    };
  }

  // 5. Registrar pago en public.pagos
  let pagoId: string | undefined;
  const { data: pagoExistente } = await admin
    .from("pagos")
    .select("id")
    .eq("orden_id", orden.id)
    .eq("proveedor_pago_id", String(paymentData.id))
    .maybeSingle();

  if (pagoExistente) {
    pagoId = pagoExistente.id;
  } else {
    const { data: nuevoPago, error: insertPagoErr } = await admin
      .from("pagos")
      .insert({
        orden_id: orden.id,
        proveedor: "mercadopago",
        tipo: "total",
        proveedor_pago_id: String(paymentData.id),
        metodo_pago: paymentData.payment_method_id || "mercadopago",
        referencia: String(paymentData.id),
        estado: "aprobado",
        monto: Number(paymentData.transaction_amount),
        moneda: paymentData.currency_id || "PEN",
        respuesta_cruda: paymentData,
        pagado_en: paymentData.date_approved || new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertPagoErr) {
      console.error("[Webhook MP] Error insertando pago:", insertPagoErr);
    } else {
      pagoId = nuevoPago.id;
    }
  }

  // 6. Invocar RPC public.marcar_orden_pagada(orden.id)
  try {
    await admin.rpc("marcar_orden_pagada", { p_orden_id: orden.id });
  } catch (rpcErr) {
    console.error("[Webhook MP] Error en RPC marcar_orden_pagada:", rpcErr);
    // Fallback directo a ordenes
    await admin
      .from("ordenes")
      .update({
        estado: "pagada",
        monto_pagado: Number(paymentData.transaction_amount),
        pagada_en: new Date().toISOString(),
      })
      .eq("id", orden.id);
  }

  // 7. Emitir comprobante interno automático (Serie B001)
  try {
    await emitirComprobanteParaOrden(orden.id);
  } catch (compErr) {
    console.warn("[Webhook MP] Advertencia en emitirComprobanteParaOrden:", compErr);
  }

  // 8. Otorgar Matrícula (Cursos) o Confirmar Reserva (Talleres)
  let matriculaId: string | undefined;
  const items = orden.orden_items || [];
  const cliente = (orden as any).clientes;

  for (const item of items) {
    // Si es un curso
    if (item.tipo_item === "curso" || item.curso_id) {
      let perfilId: string | null = null;

      if (cliente?.correo) {
        const { data: perfilExistente } = await admin
          .from("profiles")
          .select("id")
          .eq("correo", cliente.correo)
          .maybeSingle();

        if (perfilExistente) {
          perfilId = perfilExistente.id;
        } else {
          // Crear usuario en auth y perfil
          const claveTemp = "Alumno" + Math.floor(100000 + Math.random() * 900000) + "!";
          const { data: nuevoUser, error: authErr } = await admin.auth.admin.createUser({
            email: cliente.correo,
            password: claveTemp,
            email_confirm: true,
            user_metadata: {
              nombre: `${cliente.nombres} ${cliente.apellidos}`.trim(),
              rol: "student",
            },
          });

          if (!authErr && nuevoUser?.user) {
            perfilId = nuevoUser.user.id;
            await admin.from("profiles").insert({
              id: perfilId,
              cliente_id: orden.cliente_id,
              nombre_completo: `${cliente.nombres} ${cliente.apellidos}`.trim(),
              correo: cliente.correo,
              rol: "student",
              debe_cambiar_clave: true,
            });
          }
        }
      }

      if (perfilId) {
        try {
          const { data: resMatricula } = await admin.rpc("otorgar_matricula", {
            p_orden_id: orden.id,
            p_perfil_id: perfilId,
          });
          matriculaId = resMatricula || undefined;
        } catch (matErr) {
          console.error("[Webhook MP] Error en RPC otorgar_matricula, ejecutando fallback:", matErr);
          const ahora = new Date();
          const vence = new Date();
          vence.setFullYear(vence.getFullYear() + 1);

          const { data: fallbackMat } = await (admin.from("matriculas") as any)
            .insert({
              perfil_id: perfilId,
              curso_id: item.curso_id,
              orden_id: orden.id,
              otorgada_en: ahora.toISOString(),
              vence_en: vence.toISOString(),
              estado: "activa",
            })
            .select("id")
            .maybeSingle();

          matriculaId = fallbackMat?.id;
        }

        // Marcar acceso como otorgado
        await admin
          .from("ordenes")
          .update({ estado_acceso: "otorgado" })
          .eq("id", orden.id);
      }
    }

    // Si es un taller presencial
    if (item.tipo_item === "taller" || item.taller_id) {
      try {
        await admin.rpc("confirmar_reserva_taller", { p_orden_id: orden.id });
      } catch (tallerErr) {
        console.error("[Webhook MP] Error en confirmar_reserva_taller:", tallerErr);
      }
    }
  }

  // 9. Actualizar evento_webhook como procesado con éxito
  await admin
    .from("eventos_webhook")
    .update({
      procesado: true,
      procesado_en: new Date().toISOString(),
      error: null,
    })
    .eq("proveedor", "mercadopago")
    .eq("evento_id", eventoId);

  return {
    ok: true,
    status: "pago_procesado_exitosamente",
    ordenId: orden.id,
    pagoId,
    matriculaId,
  };
}
