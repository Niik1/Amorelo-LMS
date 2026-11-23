// Redirección de los CTAs a WhatsApp (plan-mvp §16).
//
// Resuelve la oferta vigente EN EL MOMENTO DEL CLIC: si el live se apagó
// mientras la landing estaba abierta, el mensaje sale igual con la oferta
// correcta. Aprovecha la misma petición para registrar el clic (una sola
// llamada, sin el POST aparte de antes).
//
// Nunca bloquea al visitante: cualquier falla de medición termina en el
// mismo redirect. Si el rate limit salta, redirige pero no cuenta.

import { NextRequest, NextResponse } from "next/server";
import { resolverOfertaPublica } from "@/server/oferta/publica";

export const dynamic = "force-dynamic";

function redirigir(href: string) {
  const res = NextResponse.redirect(href, 307);
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}

export async function GET(_req: NextRequest) {
  const oferta = await resolverOfertaPublica();
  return redirigir(oferta.href);
}
