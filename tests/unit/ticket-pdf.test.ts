// @vitest-environment node

import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import QRCode from "qrcode";
import { generarTicketPdfBuffer } from "@/server/talleres/ticket-pdf";
import type { DatosTicket } from "@/server/talleres/consultas";

describe("Generación de Tickets y QR de Talleres Presenciales", () => {
  it("genera un código QR válido en formato base64 DataURL", async () => {
    const url = "https://amorelo.pe/t/token-prueba-seguro-123";
    const qrDataUrl = await QRCode.toDataURL(url, {
      margin: 1,
      width: 250,
      errorCorrectionLevel: "M",
    });

    expect(qrDataUrl).toBeDefined();
    expect(qrDataUrl.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("genera un Buffer de PDF válido con firma %PDF-", async () => {
    const ticketMock: DatosTicket = {
      numero_orden: "ORD-2026-TEST",
      estado: "confirmada",
      asistente_nombre: "Luciana Salazar Pérez",
      taller_nombre: "Masterclass de Arcos Orgánicos y Calibración",
      fecha_inicio: "2026-11-20T14:00:00Z",
      fecha_fin: "2026-11-20T19:00:00Z",
      lugar: "Hotel Costa del Sol",
      direccion: "Av. Los Cocoteros 505, Trujillo",
      referencia: "Frente al Golf",
      material_incluido: "Kit completo de globos Sempertex, calibrador y coffee break",
      ticket_codigo: "TK-9921",
      total: 250,
      monto_pagado: 250,
      saldo_pendiente: 0,
      fecha_limite_saldo: null,
      retenida_hasta: null,
      validado_en: null,
      asistio: false,
    };

    const buffer = await generarTicketPdfBuffer(
      ticketMock,
      "https://amorelo.pe/t/test-token"
    );

    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(1000);
    // Verificar encabezado binario estándar de archivos PDF
    const header = buffer.subarray(0, 5).toString("utf-8");
    expect(header).toBe("%PDF-");
  });
});
