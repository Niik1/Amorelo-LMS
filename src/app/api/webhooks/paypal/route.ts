// Fase 5 — API: webhook de PayPal.
// Responsabilidad: verificar con verify-webhook-signature, consultar el pago
// tras la captura y completar la orden idempotente (plan §6.5).
// TODO(Fase 5): implementar; hoy responde 501.

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Not implemented — Fase 5" },
    { status: 501 },
  );
}
