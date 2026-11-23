// Fase 2 — API: validación de cupones.
// Responsabilidad: validar el código con rate limiting (Upstash) y devolver el
// descuento calculado; mensajes genéricos para no revelar qué códigos existen
// (plan §6.4).
// TODO(Fase 2): implementar; hoy responde 501.

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Not implemented — Fase 2" },
    { status: 501 },
  );
}
