// Plantilla PDF vectorial para la Hoja de Reclamación Oficial INDECOPI (Ley N° 29571).
// Formato A4 Vertical generado en memoria con @react-pdf/renderer (Cero Storage en Buckets).

import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ItemReclamoAdmin } from "./acciones-admin";
import type { EntradaConfiguracionComprobante } from "@/lib/validators/configuracion";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 30,
    fontSize: 8.5,
    color: "#0f172a",
    lineHeight: 1.25,
  },
  // Cabecera Principal Membretada
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: "#1e3a8a",
    paddingBottom: 10,
  },
  brandCol: {
    width: "55%",
    justifyContent: "flex-start",
  },
  brandLogo: {
    maxWidth: 150,
    maxHeight: 46,
    objectFit: "contain",
    objectPosition: "left",
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a8a",
    letterSpacing: 0.5,
    lineHeight: 1.25,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
    lineHeight: 1.3,
    marginBottom: 3,
  },
  brandMeta: {
    fontSize: 7.5,
    color: "#64748b",
    lineHeight: 1.35,
    marginBottom: 1.5,
  },
  sheetMetaBox: {
    width: "42%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 6,
    padding: 6,
    justifyContent: "center",
  },
  sheetTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a8a",
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  sheetNumberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingTop: 3,
  },
  sheetNumberLabel: {
    fontSize: 8,
    color: "#475569",
    fontFamily: "Helvetica",
  },
  sheetNumberValue: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  sheetDateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  legalNoticeBanner: {
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginBottom: 8,
    textAlign: "center",
  },
  legalNoticeText: {
    fontSize: 7,
    color: "#475569",
    fontFamily: "Helvetica-Oblique",
    textAlign: "center",
  },
  // Secciones enmarcadas
  sectionCard: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 5,
    marginBottom: 6,
    overflow: "hidden",
  },
  sectionHeader: {
    backgroundColor: "#1e3a8a",
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionHeaderTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase",
  },
  sectionHeaderBadge: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#bfdbfe",
  },
  sectionBody: {
    padding: 6,
  },
  gridRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  gridCol2: {
    width: "50%",
    paddingRight: 6,
  },
  gridCol3: {
    width: "33.33%",
    paddingRight: 6,
  },
  gridCol4: {
    width: "25%",
    paddingRight: 4,
  },
  fieldLabel: {
    fontSize: 7,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 1,
  },
  fieldValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  fieldValueRegular: {
    fontSize: 8,
    color: "#0f172a",
  },
  boxContent: {
    backgroundColor: "#f8fafc",
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 5,
    marginTop: 2,
    marginBottom: 4,
  },
  boxContentText: {
    fontSize: 7.5,
    color: "#1e293b",
    lineHeight: 1.3,
  },
  // Tipo selector checkboxes
  typeSelectorRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  checkboxBox: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: "#1e3a8a",
    borderRadius: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#1e3a8a",
  },
  checkboxCheckMark: {
    color: "#ffffff",
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
  },
  checkboxLabel: {
    fontSize: 7.5,
    color: "#334155",
  },
  // Firmas y Pie
  footerSection: {
    marginTop: 6,
    paddingTop: 4,
  },
  signaturesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 8,
  },
  signatureBox: {
    width: "45%",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#94a3b8",
    paddingTop: 4,
  },
  signatureTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
    textTransform: "uppercase",
  },
  signatureSubtitle: {
    fontSize: 6.5,
    color: "#64748b",
    marginTop: 1,
  },
  legalDisclaimer: {
    borderTopWidth: 0.5,
    borderTopColor: "#cbd5e1",
    paddingTop: 4,
    textAlign: "center",
  },
  legalDisclaimerText: {
    fontSize: 6.5,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 1.25,
  },
});

function formatearFecha(fechaStr: string | null): string {
  if (!fechaStr) return "-";
  try {
    const d = new Date(fechaStr);
    return new Intl.DateTimeFormat("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return fechaStr;
  }
}

export function PlantillaHojaReclamoPdf({
  reclamo,
  configuracion,
  logoDataUri,
}: {
  reclamo: ItemReclamoAdmin;
  configuracion?: EntradaConfiguracionComprobante;
  logoDataUri?: string | null;
}) {
  const esReclamo = reclamo.tipo === "reclamo";
  const esProducto = reclamo.bienContratado === "producto";
  const tieneRespuesta = Boolean(reclamo.respuesta && reclamo.respuesta.trim());

  return (
    <Document
      title={`Hoja de Reclamacion ${reclamo.numero} - ${configuracion?.razon_social || "Amorelo"}`}
      author={configuracion?.razon_social || "Amorelo"}
      subject="Libro de Reclamaciones Virtual - Ley N° 29571"
      keywords="Libro de Reclamaciones, INDECOPI, Amorelo, Reclamo, Queja"
    >
      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* Cabecera Membretada */}
        <View style={styles.headerContainer}>
          <View style={styles.brandCol}>
            {logoDataUri ? (
              <Image style={styles.brandLogo} src={logoDataUri} />
            ) : null}
            <Text style={styles.brandTitle}>
              {configuracion?.razon_social || "AMORELO"}
            </Text>
            {configuracion?.nombre_comercial ? (
              <Text style={styles.brandSubtitle}>
                {configuracion.nombre_comercial}
              </Text>
            ) : null}
            {configuracion?.ruc ? (
              <Text style={styles.brandMeta}>RUC: {configuracion.ruc}</Text>
            ) : null}
            <Text style={styles.brandMeta}>
              {[
                configuracion?.direccion,
                configuracion?.telefono ? `WhatsApp: ${configuracion.telefono}` : null,
              ]
                .filter(Boolean)
                .join(" • ")}
            </Text>
            <Text style={styles.brandMeta}>
              {[
                configuracion?.correo ? `Correo: ${configuracion.correo}` : null,
                configuracion?.sitio_web,
              ]
                .filter(Boolean)
                .join(" • ")}
            </Text>
          </View>

          <View style={styles.sheetMetaBox}>
            <Text style={styles.sheetTitle}>Libro de Reclamaciones</Text>
            <View style={styles.sheetNumberRow}>
              <Text style={styles.sheetNumberLabel}>HOJA N°:</Text>
              <Text style={styles.sheetNumberValue}>{reclamo.numero}</Text>
            </View>
            <View style={styles.sheetDateRow}>
              <Text style={styles.sheetNumberLabel}>Fecha de Registro:</Text>
              <Text style={styles.fieldValue}>{formatearFecha(reclamo.creadoEn)}</Text>
            </View>
          </View>
        </View>

        {/* Mensaje Legal INDECOPI */}
        <View style={styles.legalNoticeBanner}>
          <Text style={styles.legalNoticeText}>
            Conforme a lo establecido en el Código de Protección y Defensa del Consumidor (Ley N° 29571) y el D.S. N° 011-2011-PCM.
          </Text>
        </View>

        {/* 1. Identificación del Consumidor Reclamante */}
        <View style={styles.sectionCard} wrap={false}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle}>1. Identificación del Consumidor Reclamante</Text>
            <Text style={styles.sectionHeaderBadge}>
              {reclamo.tipoDocumento}: {reclamo.numeroDocumento}
            </Text>
          </View>

          <View style={styles.sectionBody}>
            <View style={styles.gridRow}>
              <View style={styles.gridCol2}>
                <Text style={styles.fieldLabel}>Nombres y Apellidos:</Text>
                <Text style={styles.fieldValue}>{reclamo.nombreCompleto}</Text>
              </View>
              <View style={styles.gridCol2}>
                <Text style={styles.fieldLabel}>Documento de Identidad:</Text>
                <Text style={styles.fieldValue}>
                  {reclamo.tipoDocumento} N° {reclamo.numeroDocumento}
                </Text>
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={styles.gridCol2}>
                <Text style={styles.fieldLabel}>Domicilio Registrado:</Text>
                <Text style={styles.fieldValueRegular}>{reclamo.domicilio}</Text>
              </View>
              <View style={styles.gridCol4}>
                <Text style={styles.fieldLabel}>Teléfono de Contacto:</Text>
                <Text style={styles.fieldValueRegular}>{reclamo.telefono || "No especificado"}</Text>
              </View>
              <View style={styles.gridCol4}>
                <Text style={styles.fieldLabel}>Correo Electrónico:</Text>
                <Text style={styles.fieldValueRegular}>{reclamo.correo}</Text>
              </View>
            </View>

            {reclamo.esMenorEdad && (
              <View style={[styles.boxContent, { backgroundColor: "#fffbeb", borderColor: "#fde68a" }]}>
                <Text style={[styles.fieldLabel, { color: "#b45309" }]}>Representante Legal (Menor de Edad):</Text>
                <Text style={styles.fieldValue}>
                  {reclamo.representanteNombre} (Doc: {reclamo.representanteDocumento})
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 2. Identificación del Bien Contratado */}
        <View style={styles.sectionCard} wrap={false}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle}>2. Identificación del Bien Contratado</Text>
            <Text style={styles.sectionHeaderBadge}>
              Monto: {reclamo.montoReclamado !== null ? `${reclamo.moneda || "PEN"} ${Number(reclamo.montoReclamado).toFixed(2)}` : "No especificado"}
            </Text>
          </View>

          <View style={styles.sectionBody}>
            <View style={styles.typeSelectorRow}>
              <View style={styles.checkboxItem}>
                <View style={[styles.checkboxBox, esProducto ? styles.checkboxChecked : {}]}>
                  {esProducto && <Text style={styles.checkboxCheckMark}>X</Text>}
                </View>
                <Text style={styles.checkboxLabel}>PRODUCTO</Text>
              </View>

              <View style={styles.checkboxItem}>
                <View style={[styles.checkboxBox, !esProducto ? styles.checkboxChecked : {}]}>
                  {!esProducto && <Text style={styles.checkboxCheckMark}>X</Text>}
                </View>
                <Text style={styles.checkboxLabel}>SERVICIO</Text>
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={{ width: "100%" }}>
                <Text style={styles.fieldLabel}>Descripción del Producto o Servicio Adquirido:</Text>
                <Text style={styles.fieldValue}>{reclamo.descripcionBien}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3. Detalle de la Reclamación y Pedido Concreto */}
        <View style={styles.sectionCard} wrap={false}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle}>3. Detalle de la Reclamación y Pedido del Consumidor</Text>
            <Text style={styles.sectionHeaderBadge}>
              {esReclamo ? "MODALIDAD: RECLAMO" : "MODALIDAD: QUEJA"}
            </Text>
          </View>

          <View style={styles.sectionBody}>
            <View style={styles.typeSelectorRow}>
              <View style={styles.checkboxItem}>
                <View style={[styles.checkboxBox, esReclamo ? styles.checkboxChecked : {}]}>
                  {esReclamo && <Text style={styles.checkboxCheckMark}>X</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  RECLAMO (Disconformidad relacionada a los productos o servicios contratados)
                </Text>
              </View>

              <View style={styles.checkboxItem}>
                <View style={[styles.checkboxBox, !esReclamo ? styles.checkboxChecked : {}]}>
                  {!esReclamo && <Text style={styles.checkboxCheckMark}>X</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  QUEJA (Malestar o descontento respecto a la atención recibida)
                </Text>
              </View>
            </View>

            <View style={{ marginBottom: 4 }}>
              <Text style={styles.fieldLabel}>Detalle narrado por el consumidor:</Text>
              <View style={styles.boxContent}>
                <Text style={styles.boxContentText}>{reclamo.detalle}</Text>
              </View>
            </View>

            <View>
              <Text style={styles.fieldLabel}>Pedido concreto solicitado por el consumidor:</Text>
              <View style={[styles.boxContent, { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }]}>
                <Text style={[styles.boxContentText, { fontFamily: "Helvetica-Bold", color: "#1e3a8a" }]}>
                  {reclamo.pedidoConsumidor}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 4. Acciones Adoptadas por el Proveedor (Respuesta Oficial) */}
        <View style={styles.sectionCard} wrap={false}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle}>4. Acciones Adoptadas por el Proveedor (Respuesta Oficial)</Text>
            <Text style={styles.sectionHeaderBadge}>
              {tieneRespuesta ? "ESTADO: ATENDIDO" : "ESTADO: PENDIENTE"}
            </Text>
          </View>

          <View style={styles.sectionBody}>
            {tieneRespuesta ? (
              <View>
                <View style={styles.gridRow}>
                  <View style={styles.gridCol2}>
                    <Text style={styles.fieldLabel}>Fecha de Respuesta Oficial:</Text>
                    <Text style={styles.fieldValue}>{formatearFecha(reclamo.respondidoEn)}</Text>
                  </View>
                  <View style={styles.gridCol2}>
                    <Text style={styles.fieldLabel}>Atendido por:</Text>
                    <Text style={styles.fieldValue}>Representante Amorelo</Text>
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Resolución y Descargo Formal:</Text>
                <View style={[styles.boxContent, { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }]}>
                  <Text style={[styles.boxContentText, { color: "#14532d" }]}>{reclamo.respuesta}</Text>
                </View>
              </View>
            ) : (
              <View style={[styles.boxContent, { backgroundColor: "#fffbeb", borderColor: "#fde68a" }]}>
                <Text style={[styles.boxContentText, { color: "#92400e", fontFamily: "Helvetica-Bold" }]}>
                  Caso en proceso de atención dentro del plazo legal.
                </Text>
                <Text style={[styles.boxContentText, { color: "#78350f", marginTop: 2 }]}>
                  Conforme a la normativa vigente, el proveedor dispone de un plazo máximo improrrogable de quince (15) días hábiles (vence el {formatearFecha(reclamo.fechaLimiteRespuesta)}) para emitir y notificar el descargo formal al correo registrado.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Firmas Legales y Pie de Página */}
        <View style={styles.footerSection} wrap={false}>
          <View style={styles.signaturesRow}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>Firma del Consumidor Reclamante</Text>
              <Text style={styles.signatureSubtitle}>(O confirmación electrónica vía web)</Text>
            </View>

            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>Firma del Proveedor / Representante</Text>
              <Text style={styles.signatureSubtitle}>
                {configuracion?.razon_social || "Amorelo"}
                {configuracion?.nombre_comercial ? ` (${configuracion.nombre_comercial})` : ""}
              </Text>
            </View>
          </View>

          <View style={styles.legalDisclaimer}>
            <Text style={styles.legalDisclaimerText}>
              * La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.
            </Text>
            <Text style={styles.legalDisclaimerText}>
              * El proveedor deberá dar respuesta al reclamo o queja en un plazo no mayor a quince (15) días hábiles, de acuerdo con la Ley N° 29571 y modificatorias.
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
