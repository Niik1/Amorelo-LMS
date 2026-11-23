import "server-only";

import ExcelJS from "exceljs";

export interface ColumnaExcel {
  header: string;
  key: string;
  width?: number;
  align?: "left" | "center" | "right";
  isCurrency?: boolean;
}

export interface FilaTotalExcel {
  labelColSpan?: number;
  label?: string;
  valores?: Record<string, number | string>;
}

export interface OpcionesExcelUniversal {
  titulo: string;
  subtitulo?: string;
  nombreHoja?: string;
  columnas: ColumnaExcel[];
  filas: Record<string, any>[];
  total?: FilaTotalExcel;
}

/**
 * Genera un buffer de Excel (.xlsx) con el diseño oficial de Amorelo (#1E3A8A).
 */
export async function generarExcelUniversalBuffer(
  opciones: OpcionesExcelUniversal
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Amorelo Academia";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(opciones.nombreHoja || "Datos", {
    views: [{ showGridLines: true }],
  });

  const totalCols = Math.max(opciones.columnas.length, 1);
  const lastColLetter = totalCols <= 26
    ? String.fromCharCode(64 + totalCols)
    : "Z";

  // 1. Título corporativo
  worksheet.mergeCells(`A1:${lastColLetter}1`);
  const titleCell = worksheet.getCell("A1");
  titleCell.value = opciones.titulo;
  titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FF1E3A8A" } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  worksheet.getRow(1).height = 28;

  // 2. Subtítulo de auditoría
  worksheet.mergeCells(`A2:${lastColLetter}2`);
  const subCell = worksheet.getCell("A2");
  subCell.value =
    opciones.subtitulo ||
    `Reporte Oficial • Exportado el ${new Date().toLocaleDateString("es-PE")} a las ${new Date().toLocaleTimeString("es-PE")}`;
  subCell.font = { name: "Arial", size: 9, italic: true, color: { argb: "FF64748B" } };
  worksheet.getRow(2).height = 18;

  // 3. Encabezados de Columna
  const filaEncabezadoNum = 4;
  const rowHeader = worksheet.getRow(filaEncabezadoNum);
  rowHeader.values = opciones.columnas.map((c) => c.header);
  rowHeader.height = 24;

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

  // 4. Filas de Datos
  opciones.filas.forEach((f, idx) => {
    const rowValues = opciones.columnas.map((col) => {
      const val = f[col.key];
      return val !== undefined && val !== null ? val : "";
    });

    const fila = worksheet.addRow(rowValues);
    fila.height = 20;
    const bgColorFg = idx % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC";

    fila.eachCell((cell, colNumber) => {
      const colDef = opciones.columnas[colNumber - 1];
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

      if (colDef?.isCurrency) {
        cell.alignment = { vertical: "middle", horizontal: "right" };
        cell.numFmt = '#,##0.00';
      } else if (colDef?.align) {
        cell.alignment = { vertical: "middle", horizontal: colDef.align };
      } else {
        cell.alignment = { vertical: "middle", horizontal: "left" };
      }
    });
  });

  // 5. Fila de Totales si se especificó
  if (opciones.total) {
    const span = Math.min(opciones.total.labelColSpan || 1, totalCols);
    const totalRowValues = new Array(totalCols).fill("");
    totalRowValues[0] = opciones.total.label || "TOTALES";

    if (opciones.total.valores) {
      opciones.columnas.forEach((col, idx) => {
        if (opciones.total!.valores![col.key] !== undefined) {
          totalRowValues[idx] = opciones.total!.valores![col.key];
        }
      });
    }

    const filaTotal = worksheet.addRow(totalRowValues);
    filaTotal.height = 22;

    if (span > 1) {
      const spanLetter = String.fromCharCode(64 + span);
      worksheet.mergeCells(`A${filaTotal.number}:${spanLetter}${filaTotal.number}`);
    }
    filaTotal.getCell(1).font = { name: "Arial", size: 10, bold: true, color: { argb: "FF0F172A" } };
    filaTotal.getCell(1).alignment = { vertical: "middle", horizontal: "center" };

    opciones.columnas.forEach((col, idx) => {
      if (opciones.total!.valores && opciones.total!.valores[col.key] !== undefined) {
        const c = filaTotal.getCell(idx + 1);
        c.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF1E3A8A" } };
        if (col.isCurrency) c.numFmt = '#,##0.00';
        c.alignment = { vertical: "middle", horizontal: "right" };
        c.border = {
          top: { style: "double", color: { argb: "FF1E3A8A" } },
          bottom: { style: "double", color: { argb: "FF1E3A8A" } },
        };
      }
    });
  }

  // 6. Anchos de Columna
  opciones.columnas.forEach((col, index) => {
    worksheet.getColumn(index + 1).width = col.width || 18;
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
