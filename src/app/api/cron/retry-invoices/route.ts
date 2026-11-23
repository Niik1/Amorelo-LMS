// Fase 4 — Cron: reintentos de facturación SUNAT.
// Responsabilidad: protegido con CRON_SECRET; procesa los comprobantes con
// next_retry_at <= now() sin duplicar emisiones por orden (plan §6.3 y §13 Fase 4).
// TODO(Fase 4): implementar; hoy responde 501.

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Not implemented — Fase 4" },
    { status: 501 },
  );
}
