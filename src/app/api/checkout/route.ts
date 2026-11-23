// Fase 2 — API: creación de orden de compra (idempotente).
// Responsabilidad: validar payload (zod), crear/reutilizar la orden por
// idempotency_key y devolver el id de orden como external_reference para el pago
// (plan §5 paso 4 y §6.1).
// TODO(Fase 2): implementar; hoy responde 501 (sin lógica en la Fase 0).

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Not implemented — Fase 2" },
    { status: 501 },
  );
}
