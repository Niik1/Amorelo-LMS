import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { DatosPlantillaBoleta } from "./plantilla-boleta-pdf";

const styles = StyleSheet.create({
  page: {
    // 80mm de ancho x 680pt de alto (adaptable a ticket continuo)
    size: [226.77, 680],
    backgroundColor: "#FFFFFF",
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 12,
    fontFamily: "Courier",
    fontSize: 7.5,
    color: "#0F172A",
  },
  header: {
    alignItems: "center",
    textAlign: "center",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#94A3B8",
    borderBottomStyle: "dashed",
    paddingBottom: 8,
  },
  logoImage: {
    maxWidth: 160,
    maxHeight: 55,
    objectFit: "contain",
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 10,
    fontFamily: "Courier-Bold",
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  brandSubtitle: {
    fontSize: 7,
    fontFamily: "Courier",
    color: "#475569",
    marginBottom: 2,
  },
  emisorText: {
    fontSize: 7,
    color: "#475569",
    lineHeight: 1.2,
  },
  docTypeBox: {
    alignItems: "center",
    marginVertical: 6,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: "#94A3B8",
    borderBottomColor: "#94A3B8",
    borderTopStyle: "dashed",
    borderBottomStyle: "dashed",
  },
  docTitle: {
    fontSize: 9,
    fontFamily: "Courier-Bold",
  },
  controlSub: {
    fontSize: 6.5,
    color: "#64748B",
    marginTop: 1,
  },
  docNumber: {
    fontSize: 9,
    fontFamily: "Courier-Bold",
    marginTop: 2,
  },
  clienteBox: {
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
    borderBottomStyle: "dashed",
  },
  clienteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1.5,
  },
  clienteLabel: {
    fontSize: 7,
    fontFamily: "Courier-Bold",
    color: "#334155",
  },
  clienteVallue: {
    fontSize: 7,
    color: "#0F172A",
    maxWidth: "65%",
    textAlign: "right",
  },
  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#94A3B8",
    borderBottomStyle: "dashed",
    paddingBottom: 2,
    marginBottom: 4,
  },
  itemsHeaderText: {
    fontSize: 7,
    fontFamily: "Courier-Bold",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  itemDesc: {
    fontSize: 7,
    width: "70%",
    lineHeight: 1.1,
  },
  itemTotal: {
    fontSize: 7,
    fontFamily: "Courier-Bold",
    width: "30%",
    textAlign: "right",
  },
  totalsBox: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#94A3B8",
    borderTopStyle: "dashed",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  totalRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#0F172A",
  },
  totalLabel: {
    fontSize: 7.5,
    color: "#475569",
  },
  totalValue: {
    fontSize: 7.5,
    fontFamily: "Courier-Bold",
  },
  totalFinalLabel: {
    fontSize: 9,
    fontFamily: "Courier-Bold",
  },
  totalFinalValue: {
    fontSize: 9,
    fontFamily: "Courier-Bold",
  },
  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  qrCode: {
    width: 50,
    height: 50,
  },
  mensajeText: {
    fontSize: 7,
    fontFamily: "Courier-Bold",
    textAlign: "center",
    marginVertical: 4,
    color: "#1E293B",
    textTransform: "uppercase",
  },
  legalText: {
    fontSize: 6,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 1.2,
    marginTop: 4,
  },
});

export function PlantillaTicketPdf(datos: DatosPlantillaBoleta) {
  const simboloMoneda = datos.moneda === "USD" ? "$" : "S/";

  return (
    <Document title={`Ticket-${datos.numeroCompleto}`} author={datos.emisor?.razonSocial || "Amorelo"}>
      <Page size={[226.77, 620]} style={styles.page}>
        {/* Cabecera */}
        <View style={styles.header}>
          {datos.emisor?.logoUrl ? (
            <Image style={styles.logoImage} src={datos.emisor.logoUrl} />
          ) : null}
          <Text style={styles.brandTitle}>{datos.emisor?.razonSocial || "AMORELO"}</Text>
          {datos.emisor?.nombreComercial ? (
            <Text style={styles.brandSubtitle}>{datos.emisor.nombreComercial}</Text>
          ) : null}
          <Text style={styles.emisorText}>RUC: {datos.emisor?.ruc || "20609234561"}</Text>
          {datos.emisor?.direccion ? (
            <Text style={styles.emisorText}>{datos.emisor.direccion}</Text>
          ) : null}
          {datos.emisor?.telefono ? (
            <Text style={styles.emisorText}>Wsp: {datos.emisor.telefono}</Text>
          ) : null}
          {datos.emisor?.correo ? (
            <Text style={styles.emisorText}>{datos.emisor.correo}</Text>
          ) : null}
          {datos.emisor?.sitioWeb ? (
            <Text style={styles.emisorText}>{datos.emisor.sitioWeb}</Text>
          ) : null}
        </View>

        {/* Tipo de Documento */}
        <View style={styles.docTypeBox}>
          <Text style={styles.docTitle}>
            {datos.tipoDocumento === "factura" ? "FACTURA ELECTRÓNICA" : "BOLETA ELECTRÓNICA"}
          </Text>
          <Text style={styles.controlSub}>[ CONTROL ADMINISTRATIVO INTERNO ]</Text>
          <Text style={styles.docNumber}>N° {datos.numeroCompleto}</Text>
        </View>

        {/* Datos Cliente */}
        <View style={styles.clienteBox}>
          <View style={styles.clienteRow}>
            <Text style={styles.clienteLabel}>FECHA:</Text>
            <Text style={styles.clienteVallue}>{datos.fechaEmisionTexto}</Text>
          </View>
          <View style={styles.clienteRow}>
            <Text style={styles.clienteLabel}>CLIENTE:</Text>
            <Text style={styles.clienteVallue}>{datos.clienteNombre}</Text>
          </View>
          <View style={styles.clienteRow}>
            <Text style={styles.clienteLabel}>{datos.clienteTipoDoc || "DOC"}:</Text>
            <Text style={styles.clienteVallue}>{datos.clienteNumeroDoc || "-"}</Text>
          </View>
          <View style={styles.clienteRow}>
            <Text style={styles.clienteLabel}>ORDEN:</Text>
            <Text style={styles.clienteVallue}>#{datos.numeroOrden}</Text>
          </View>
        </View>

        {/* Items Header */}
        <View style={styles.itemsHeader}>
          <Text style={styles.itemsHeaderText}>CANT / DESCRIPCIÓN</Text>
          <Text style={styles.itemsHeaderText}>TOTAL</Text>
        </View>

        {/* Lista de Items */}
        {datos.items.map((it, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemDesc}>
              {it.cantidad} x {it.descripcion}
            </Text>
            <Text style={styles.itemTotal}>
              {simboloMoneda} {it.subtotal.toFixed(2)}
            </Text>
          </View>
        ))}

        {/* Totales */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {datos.igv > 0 ? "OP. GRAVADA:" : "OP. EXONERADA:"}
            </Text>
            <Text style={styles.totalValue}>
              {simboloMoneda} {datos.subtotal.toFixed(2)}
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {datos.igv > 0 ? "I.G.V. (18%):" : "I.G.V. (0%):"}
            </Text>
            <Text style={styles.totalValue}>
              {simboloMoneda} {datos.igv.toFixed(2)}
            </Text>
          </View>

          <View style={styles.totalRowFinal}>
            <Text style={styles.totalFinalLabel}>TOTAL A PAGAR:</Text>
            <Text style={styles.totalFinalValue}>
              {simboloMoneda} {datos.total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* QR */}
        {datos.qrDataUrl ? (
          <View style={styles.qrContainer}>
            <Image style={styles.qrCode} src={datos.qrDataUrl} />
          </View>
        ) : null}

        {/* Mensaje de Agradecimiento */}
        {datos.mensajeAgradecimiento ? (
          <Text style={styles.mensajeText}>{datos.mensajeAgradecimiento}</Text>
        ) : null}

        {/* Leyenda Legal */}
        <Text style={styles.legalText}>
          {datos.pieComprobante ||
            "Este documento es un comprobante de control administrativo interno emitido por Amorelo."}
        </Text>
      </Page>
    </Document>
  );
}
