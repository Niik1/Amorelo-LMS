// @vitest-environment node

import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { numeroALetras } from "@/lib/moneda-letras";
import { PlantillaBoletaPdf, type DatosPlantillaBoleta } from "@/server/comprobantes/plantilla-boleta-pdf";
import { generarComprobantesExcelBuffer } from "@/server/comprobantes/generador-excel";
import type { ComprobanteItem } from "@/server/comprobantes/acciones";

describe("Módulo de Comprobantes (Serie B001)", () => {
  it("convierte montos a texto contable peruano correctamente", () => {
    expect(numeroALetras(150, "PEN")).toBe("SON: CIENTO CINCUENTA CON 00/100 SOLES");
    expect(numeroALetras(250.5, "PEN")).toBe("SON: DOSCIENTOS CINCUENTA CON 50/100 SOLES");
    expect(numeroALetras(199, "USD")).toBe("SON: CIENTO NOVENTA Y NUEVE CON 00/100 DÓLARES AMERICANOS");
  });

  it("renderiza la boleta en PDF A4 vertical con encabezado estándar %PDF-", async () => {
    const datosMock: DatosPlantillaBoleta = {
      serie: "B001",
      numeroCompleto: "B001-000001",
      tipoDocumento: "boleta",
      fechaEmisionTexto: "06/11/2026 23:55",
      numeroOrden: "ORD-000017",
      clienteNombre: "Alondra García",
      clienteTipoDoc: "DNI",
      clienteNumeroDoc: "72938401",
      clienteDireccion: "Av. Larco 123, Miraflores",
      items: [
        {
          descripcion: "Masterclass de Arcos Orgánicos y Calibración",
          cantidad: 1,
          precioUnitario: 199,
          subtotal: 199,
        },
      ],
      moneda: "PEN",
      subtotal: 199,
      igv: 0,
      total: 199,
      qrDataUrl: null,
    };

    const elemento = React.createElement(PlantillaBoletaPdf, datosMock);
    const buffer = await renderToBuffer(elemento as any);

    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(1000);
    const header = buffer.subarray(0, 5).toString("utf-8");
    expect(header).toBe("%PDF-");
  });

  it("genera un archivo Excel (.xlsx) válido con exceljs", async () => {
    const comprobantesMock: ComprobanteItem[] = [
      {
        id: "comp-1",
        orden_id: "ord-1",
        tipo_documento: "boleta",
        serie: "B001",
        numero: 1,
        numero_completo: "B001-000001",
        cliente_tipo_doc: "DNI",
        cliente_numero_doc: "72938401",
        cliente_nombre: "Alondra García",
        cliente_direccion: null,
        subtotal: 199,
        igv: 0,
        total: 199,
        moneda: "PEN",
        estado_sunat: "pendiente",
        emitido_en: new Date().toISOString(),
        creado_en: new Date().toISOString(),
        ordenes: {
          id: "ord-1",
          numero_orden: "ORD-000017",
          canal: "web",
          tipo_orden: "curso",
          orden_items: [
            {
              id: "item-1",
              descripcion: "Curso de Decoración y Técnicas de Calibración",
              cantidad: 1,
              precio_unitario: 199,
              subtotal: 199,
            },
          ],
        },
      },
    ];

    const excelBuffer = await generarComprobantesExcelBuffer(comprobantesMock);

    expect(excelBuffer).toBeDefined();
    expect(excelBuffer.length).toBeGreaterThan(500);
    // Verificar firma PK zip de archivo XLSX (los archivos .xlsx son zip archives que inician con "PK")
    const header = excelBuffer.subarray(0, 2).toString("utf-8");
    expect(header).toBe("PK");
  });
});
