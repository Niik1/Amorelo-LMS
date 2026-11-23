// Fase 3 — Cron: reconciliación de pagos pendientes.
// Responsabilidad: protegido con CRON_SECRET; consulta órdenes pendientes
// (>10 min y <48 h) contra Mercado Pago/PayPal y las completa por el mismo camino
// idempotente que el webhook (plan §6.3).
// TODO(Fase 3): implementar; hoy responde 501.

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Not implemented — Fase 3" },
    { status: 501 },
  );
}
