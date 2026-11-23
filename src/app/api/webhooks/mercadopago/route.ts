// Endpoint de Webhook seguro para Mercado Pago (Vector E).
// Ruta: /api/webhooks/mercadopago
// Responsabilidad:
// 1. Validar firma criptográfica x-signature (HMAC-SHA256).
// 2. Consulta directa anti-spoofing (GET /v1/payments/{id}).
// 3. Garantizar idempotencia con public.eventos_webhook.
// 4. Invocar RPCs de negocio: marcar_orden_pagada, emitir_comprobante_interno, otorgar_matricula, confirmar_reserva_taller.

import { NextRequest, NextResponse } from "next/server";
import {
  validarFirmaMercadoPago,
  procesarWebhookMercadoPago,
} from "@/server/checkout/webhook-mp";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "mercadopago-webhook",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");

    const searchParams = req.nextUrl.searchParams;
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // Extraer identificador de pago y tipo de evento
    const dataId =
      searchParams.get("data.id") ||
      searchParams.get("id") ||
      (body?.data?.id ? String(body.data.id) : null) ||
      (body?.id ? String(body.id) : null);

    const tipoEvento =
      searchParams.get("type") ||
      searchParams.get("topic") ||
      body?.type ||
      body?.action ||
      "payment";

    // Si es un ping de prueba de Mercado Pago (ej. desde el panel de desarrollador)
    if (!dataId || body?.action === "test" || tipoEvento === "test") {
      return NextResponse.json({
        ok: true,
        mensaje: "Notificación de prueba o ping recibida correctamente.",
      });
    }

    // 1. Validar firma criptográfica x-signature
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const firmaRes = validarFirmaMercadoPago({
      xSignature,
      xRequestId,
      dataId,
      secret,
    });

    if (!firmaRes.valida) {
      console.warn("[Webhook MP] Firma criptográfica rechazada:", firmaRes.razon);
      return NextResponse.json(
        { error: "Firma inválida", detalle: firmaRes.razon },
        { status: 401 }
      );
    }

    // 2. Procesar de forma atómica e idempotente
    const eventoId = String(body?.id || xRequestId || dataId);
    const resultado = await procesarWebhookMercadoPago({
      paymentId: dataId,
      eventoId,
      tipoEvento,
      payload: {
        headers: {
          "x-signature": xSignature,
          "x-request-id": xRequestId,
        },
        searchParams: Object.fromEntries(searchParams.entries()),
        body,
      },
    });

    if (!resultado.ok) {
      return NextResponse.json(
        { error: resultado.error, status: resultado.status },
        { status: resultado.statusCode || 400 }
      );
    }

    return NextResponse.json(resultado, { status: 200 });
  } catch (error: any) {
    console.error("[Webhook MP] Excepción no controlada:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", detalle: error?.message },
      { status: 500 }
    );
  }
}
