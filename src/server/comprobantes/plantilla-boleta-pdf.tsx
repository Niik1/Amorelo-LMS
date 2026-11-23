import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { numeroALetras } from "@/lib/moneda-letras";

export interface ItemBoleta {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface DatosPlantillaBoleta {
  serie: string;
  numeroCompleto: string;
  tipoDocumento: "boleta" | "factura";
  fechaEmisionTexto: string;
  numeroOrden: string;
  clienteNombre: string;
  clienteTipoDoc: string;
  clienteNumeroDoc: string;
  clienteDireccion?: string | null;
  items: ItemBoleta[];
  moneda: string;
  subtotal: number;
  igv: number;
  total: number;
  qrDataUrl?: string | null;

  // Datos dinámicos de configuración
  emisor?: {
    razonSocial?: string;
    nombreComercial?: string;
    ruc?: string;
    direccion?: string;
    telefono?: string;
    correo?: string;
    sitioWeb?: string;
    logoUrl?: string | null;
  };
  mensajeAgradecimiento?: string;
  pieComprobante?: string;
}

const styles = StyleSheet.create({
  page: {
    size: "A4",
    backgroundColor: "#FFFFFF",
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1E293B",
  },
  // Cabecera
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  emisorInfo: {
    width: "55%",
    alignItems: "flex-start",
  },
  brandTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#1E3A8A",
    letterSpacing: 0.8,
    marginBottom: 2,
    textAlign: "left",
  },
  brandSubtitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    marginBottom: 5,
    textTransform: "uppercase",
    textAlign: "left",
  },
  emisorLine: {
    fontSize: 8,
    color: "#64748B",
    lineHeight: 1.35,
    textAlign: "left",
  },
  // Caja de Comprobante
  rucBox: {
    width: "40%",
    borderWidth: 1.5,
    borderColor: "#1E3A8A",
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  rucText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  tipoDocTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    textTransform: "uppercase",
    marginBottom: 2,
    textAlign: "center",
  },
  controlInternoSub: {
    fontSize: 7.5,
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  numeroDocText: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#1E3A8A",
    letterSpacing: 1,
  },
  // Bloque dual de Datos (Cliente a la izquierda, Venta a la derecha)
  infoDualContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  infoBoxLeft: {
    width: "57%",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 5,
    padding: 8,
    backgroundColor: "#FFFFFF",
  },
  infoBoxRight: {
    width: "41%",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 5,
    padding: 8,
    backgroundColor: "#FFFFFF",
  },
  boxTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#1E3A8A",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 3,
    marginBottom: 5,
    textTransform: "uppercase",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 2.5,
  },
  infoLabelLeft: {
    width: "32%",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
  },
  infoValueLeft: {
    width: "68%",
    fontSize: 8,
    color: "#1E293B",
  },
  infoLabelRight: {
    width: "50%",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
  },
  infoValueRight: {
    width: "50%",
    fontSize: 8,
    color: "#1E293B",
  },
  // Tabla de Items
  table: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 4,
    marginBottom: 16,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1E3A8A",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  thText: {
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  colCant: {
    width: "10%",
    textAlign: "center",
  },
  colDesc: {
    width: "55%",
    paddingRight: 6,
  },
  colPrecio: {
    width: "17%",
    textAlign: "right",
  },
  colImporte: {
    width: "18%",
    textAlign: "right",
  },
  // Sección de Totales
  totalsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  sonLetrasBox: {
    width: "55%",
    padding: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 4,
    backgroundColor: "#F8FAFC",
  },
  sonLetrasLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    marginBottom: 3,
  },
  sonLetrasText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#1E293B",
  },
  totalsTable: {
    width: "40%",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  totalRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#1E3A8A",
  },
  totalLabel: {
    fontSize: 8.5,
    color: "#475569",
  },
  totalValue: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#1E293B",
  },
  totalFinalLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
  },
  totalFinalValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
  },
  // Pie de Página
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 12,
    marginTop: "auto",
  },
  footerLegal: {
    width: "78%",
  },
  footerLegalText: {
    fontSize: 7,
    color: "#64748B",
    lineHeight: 1.3,
    marginBottom: 2,
  },
  qrCode: {
    width: 60,
    height: 60,
  },
  logoImage: {
    maxWidth: 220,
    maxHeight: 75,
    objectFit: "contain",
    objectPosition: "left",
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  mensajeBox: {
    marginTop: 10,
    padding: 6,
    backgroundColor: "#F8FAFC",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    textAlign: "center",
  },
  mensajeText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#1E3A8A",
  },
});

export function PlantillaBoletaPdf(datos: DatosPlantillaBoleta) {
  const simboloMoneda = datos.moneda === "USD" ? "$" : "S/";
  const textoLetras = numeroALetras(datos.total, datos.moneda);

  return (
    <Document title={`Comprobante-${datos.numeroCompleto}`} author={datos.emisor?.razonSocial || "Amorelo"}>
      <Page size="A4" style={styles.page}>
        {/* Cabecera */}
        <View style={styles.headerContainer}>
          <View style={styles.emisorInfo}>
            {datos.emisor?.logoUrl ? (
              <Image style={styles.logoImage} src={datos.emisor.logoUrl} />
            ) : null}
            <Text style={styles.brandTitle}>{datos.emisor?.razonSocial || "AMORELO"}</Text>
            {datos.emisor?.nombreComercial ? (
              <Text style={styles.brandSubtitle}>{datos.emisor.nombreComercial}</Text>
            ) : null}
            {datos.emisor?.direccion ? (
              <Text style={styles.emisorLine}>{datos.emisor.direccion}</Text>
            ) : null}
            {datos.emisor?.telefono ? (
              <Text style={styles.emisorLine}>WhatsApp: {datos.emisor.telefono}</Text>
            ) : null}
            {datos.emisor?.correo ? (
              <Text style={styles.emisorLine}>Correo: {datos.emisor.correo}</Text>
            ) : null}
            {datos.emisor?.sitioWeb ? (
              <Text style={styles.emisorLine}>Sitio Web: {datos.emisor.sitioWeb}</Text>
            ) : null}
          </View>

          <View style={styles.rucBox}>
            <Text style={styles.rucText}>RUC {datos.emisor?.ruc || "10771535785"}</Text>
            <Text style={styles.tipoDocTitle}>
              {datos.tipoDocumento === "factura" ? "FACTURA" : "BOLETA DE VENTA"}
            </Text>
            <Text style={styles.controlInternoSub}>CONTROL INTERNO</Text>
            <Text style={styles.numeroDocText}>N° {datos.numeroCompleto}</Text>
          </View>
        </View>

        {/* Datos del Cliente y Emisión en cajas paralelas */}
        <View style={styles.infoDualContainer}>
          <View style={styles.infoBoxLeft}>
            <Text style={styles.boxTitle}>DATOS DEL CLIENTE</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabelLeft}>{datos.clienteTipoDoc || "DOCUMENTO"}:</Text>
              <Text style={styles.infoValueLeft}>{datos.clienteNumeroDoc || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabelLeft}>SEÑOR(A):</Text>
              <Text style={styles.infoValueLeft}>{datos.clienteNombre}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabelLeft}>DIRECCIÓN:</Text>
              <Text style={styles.infoValueLeft}>{datos.clienteDireccion || "-"}</Text>
            </View>
          </View>

          <View style={styles.infoBoxRight}>
            <Text style={styles.boxTitle}>DETALLE DE EMISIÓN</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabelRight}>FECHA EMISIÓN:</Text>
              <Text style={styles.infoValueRight}>
                {datos.fechaEmisionTexto.split(",")[0] || datos.fechaEmisionTexto}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabelRight}>FECHA DE VENC.:</Text>
              <Text style={styles.infoValueRight}>
                {datos.fechaEmisionTexto.split(",")[0] || datos.fechaEmisionTexto}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabelRight}>N° DE ORDEN:</Text>
              <Text style={styles.infoValueRight}>#{datos.numeroOrden}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabelRight}>MONEDA:</Text>
              <Text style={styles.infoValueRight}>
                {datos.moneda === "USD" ? "DÓLARES" : "SOLES"}
              </Text>
            </View>
          </View>
        </View>

        {/* Tabla de Items */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colCant}>
              <Text style={styles.thText}>CANT.</Text>
            </View>
            <View style={styles.colDesc}>
              <Text style={styles.thText}>DESCRIPCIÓN / CONCEPTO</Text>
            </View>
            <View style={styles.colPrecio}>
              <Text style={styles.thText}>P. UNITARIO</Text>
            </View>
            <View style={styles.colImporte}>
              <Text style={styles.thText}>IMPORTE</Text>
            </View>
          </View>

          {datos.items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <View style={styles.colCant}>
                <Text>{item.cantidad}</Text>
              </View>
              <View style={styles.colDesc}>
                <Text>{item.descripcion}</Text>
              </View>
              <View style={styles.colPrecio}>
                <Text>
                  {simboloMoneda} {item.precioUnitario.toFixed(2)}
                </Text>
              </View>
              <View style={styles.colImporte}>
                <Text>
                  {simboloMoneda} {item.subtotal.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totales y Son Letras */}
        <View style={styles.totalsSection}>
          <View style={styles.sonLetrasBox}>
            <Text style={styles.sonLetrasLabel}>IMPORTE EN LETRAS</Text>
            <Text style={styles.sonLetrasText}>{textoLetras}</Text>
          </View>

          <View style={styles.totalsTable}>
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
        </View>

        {/* Mensaje de Agradecimiento */}
        {datos.mensajeAgradecimiento ? (
          <View style={styles.mensajeBox}>
            <Text style={styles.mensajeText}>{datos.mensajeAgradecimiento}</Text>
          </View>
        ) : null}

        {/* Pie de Página */}
        <View style={styles.footer}>
          <View style={styles.footerLegal}>
            <Text style={styles.footerLegalText}>
              {datos.pieComprobante ||
                "Este documento es un comprobante de control administrativo interno emitido por Amorelo como constancia fehaciente de pago."}
            </Text>
          </View>

          {datos.qrDataUrl && (
            <Image style={styles.qrCode} src={datos.qrDataUrl} />
          )}
        </View>
      </Page>
    </Document>
  );
}
