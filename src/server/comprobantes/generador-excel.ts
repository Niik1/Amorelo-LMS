import "server-only";

import ExcelJS from "exceljs";
import { type ComprobanteItem } from "./acciones";

/**
 * Genera un buffer de Excel (.xlsx) formateado con diseño profesional contable.
 */
export async function generarComprobantesExcelBuffer(
  comprobantes: ComprobanteItem[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Amorelo Academia";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Comprobantes B001", {
    views: [{ showGridLines: true }],
  });

  // 1. Título y Metadatos en la hoja
  worksheet.mergeCells("A1:M1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "AMORELO — REGISTRO DE COMPROBANTES DE VENTA (SERIE B001)";
  titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FF1E3A8A" } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  worksheet.getRow(1).height = 28;

  worksheet.mergeCells("A2:M2");
  const subCell = worksheet.getCell("A2");
  subCell.value = `Reporte Contable de Ventas • Exportado el ${new Date().toLocaleDateString("es-PE")} a las ${new Date().toLocaleTimeString("es-PE")}`;
  subCell.font = { name: "Arial", size: 9, italic: true, color: { argb: "FF64748B" } };
  worksheet.getRow(2).height = 18;

  // 2. Definición de Columnas
  const columnas = [
    { header: "N° Comprobante", key: "numero_completo", width: 16 },
    { header: "Fecha Emisión", key: "emitido_en", width: 18 },
    { header: "N° Orden", key: "numero_orden", width: 14 },
    { header: "Canal", key: "canal", width: 14 },
    { header: "Tipo Doc", key: "tipo_doc", width: 11 },
    { header: "N° Documento", key: "numero_doc", width: 15 },
    { header: "Cliente", key: "cliente_nombre", width: 28 },
    { header: "Concepto / Detalle", key: "concepto", width: 34 },
    { header: "Moneda", key: "moneda", width: 10 },
    { header: "Subtotal", key: "subtotal", width: 14 },
    { header: "I.G.V.", key: "igv", width: 12 },
    { header: "Total", key: "total", width: 14 },
    { header: "Estado", key: "estado", width: 18 },
  ];

  const filaEncabezadoNum = 4;
  const rowHeader = worksheet.getRow(filaEncabezadoNum);
  rowHeader.values = columnas.map((c) => c.header);
  rowHeader.height = 24;

  // Estilos de la cabecera
  rowHeader.eachCell((cell) => {
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A8A" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "medium", color: { argb: "FF0F172A" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  });

  // 3. Filas de Datos
  let totalAcumulado = 0;

  comprobantes.forEach((c, idx) => {
    const itemsDesc =
      c.ordenes?.orden_items?.map((i) => i.descripcion).join(", ") ||
      "Curso / Taller";

    const fechaFormateada = c.emitido_en
      ? new Date(c.emitido_en).toLocaleDateString("es-PE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

    totalAcumulado += c.total;

    const rowData = [
      c.numero_completo,
      fechaFormateada,
      c.ordenes?.numero_orden || "-",
      c.ordenes?.canal === "whatsapp" ? "WhatsApp" : "Web / MP",
      c.cliente_tipo_doc || "DNI",
      c.cliente_numero_doc || "-",
      c.cliente_nombre,
      itemsDesc,
      c.moneda,
      c.subtotal,
      c.igv,
      c.total,
      "Control Interno (B001)",
    ];

    const fila = worksheet.addRow(rowData);
    fila.height = 20;

    // Colores alternados
    const bgColorFg = idx % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC";

    fila.eachCell((cell, colNumber) => {
      cell.font = { name: "Arial", size: 9 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bgColorFg },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      // Alineaciones específicas
      if (colNumber === 1 || colNumber === 3 || colNumber === 4 || colNumber === 5 || colNumber === 6 || colNumber === 9 || colNumber === 13) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else if (colNumber === 10 || colNumber === 11 || colNumber === 12) {
        cell.alignment = { vertical: "middle", horizontal: "right" };
        cell.numFmt = '#,##0.00';
      } else {
        cell.alignment = { vertical: "middle", horizontal: "left" };
      }
    });
  });

  // 4. Fila de Totales
  const filaTotal = worksheet.addRow([
    "TOTALES",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    totalAcumulado,
    0,
    totalAcumulado,
    "",
  ]);
  filaTotal.height = 22;

  worksheet.mergeCells(`A${filaTotal.number}:H${filaTotal.number}`);
  filaTotal.getCell(1).font = { name: "Arial", size: 10, bold: true, color: { argb: "FF0F172A" } };
  filaTotal.getCell(1).alignment = { vertical: "middle", horizontal: "center" };

  [10, 11, 12].forEach((colNum) => {
    const c = filaTotal.getCell(colNum);
    c.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF1E3A8A" } };
    c.numFmt = '#,##0.00';
    c.alignment = { vertical: "middle", horizontal: "right" };
    c.border = {
      top: { style: "double", color: { argb: "FF1E3A8A" } },
      bottom: { style: "double", color: { argb: "FF1E3A8A" } },
    };
  });

  // Ajuste de anchos de columnas
  columnas.forEach((col, index) => {
    worksheet.getColumn(index + 1).width = col.width;
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
