// Endpoint para previsualizar y descargar el Ticket del Taller Presencial en PDF (Fase 4.1).

import { NextRequest, NextResponse } from "next/server";
import { consultarTicketPorToken } from "@/server/talleres/consultas";
import { generarTicketPdfBuffer } from "@/server/talleres/ticket-pdf";
import { checkTicketRateLimit, obtenerIpRequest } from "@/lib/security/ratelimit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  // 1. Rate Limit por IP (30 descargas / minuto)
  const ip = obtenerIpRequest(request);
  const rateCheck = await checkTicketRateLimit(ip);
  if (!rateCheck.ok) {
    return new NextResponse("Límite de solicitudes simultáneas excedido. Inténtalo más tarde.", {
      status: 429,
      headers: {
        "Retry-After": "60",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const { token } = await params;

  if (!token || typeof token !== "string") {
    return new NextResponse("Token de ticket no proporcionado", { status: 400 });
  }

  const ticket = await consultarTicketPorToken(token);

  if (!ticket) {
    return new NextResponse("Ticket no encontrado o no existe", { status: 404 });
  }

  if (ticket.estado === "vencida") {
    return new NextResponse(
      "El cupo de este ticket ha sido liberado por vencimiento del plazo de pago. El ticket no se encuentra vigente.",
      {
        status: 410,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      }
    );
  }

  const origin = request.nextUrl.origin;
  const urlValidacion = `${origin}/t/${token}`;

  try {
    const pdfBuffer = await generarTicketPdfBuffer(ticket, urlValidacion);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Ticket-${ticket.ticket_codigo}.pdf"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error al generar el PDF del ticket:", error);
    return new NextResponse("Error al generar el PDF del ticket", {
      status: 500,
    });
  }
}
