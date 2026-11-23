// Plantilla vectorial oficial de Certificado Amorelo en PDF con @react-pdf/renderer.
// Ultra liviana (aprox 40-90 KB).

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

export type DatosPlantillaCertificado = {
  codigoVerificacion: string;
  qrDataUrl: string;
  tipo: "finalizacion" | "participacion";
  nombreAlumno: string;
  documentoAlumno?: string | null;
  tituloCursoOTaller: string;
  horasAcademicas?: number | null;
  fechaEmisionTexto: string; // ej: "5 de noviembre de 2026"
  urlVerificacion: string;
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FDFBF7",
    padding: 24,
    fontFamily: "Helvetica",
    position: "relative",
  },
  outerBorder: {
    borderWidth: 2,
    borderColor: "#1F3A6E",
    height: "100%",
    padding: 6,
    position: "relative",
  },
  innerBorder: {
    borderWidth: 1,
    borderColor: "#D4AF37",
    height: "100%",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginBottom: 10,
  },
  brandName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 4,
    color: "#1F3A6E",
    textTransform: "uppercase",
  },
  brandSubtitle: {
    fontSize: 8,
    letterSpacing: 2,
    color: "#D4AF37",
    marginTop: 2,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  certTypeBadge: {
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#1F3A6E",
  },
  certTypeBadgeText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  body: {
    alignItems: "center",
    textAlign: "center",
    marginVertical: "auto",
  },
  otorgadoTexto: {
    fontSize: 10,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 8,
    fontFamily: "Helvetica",
  },
  studentName: {
    fontSize: 28,
    fontFamily: "Times-Bold",
    color: "#1F3A6E",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  documentoTexto: {
    fontSize: 10,
    color: "#475569",
    marginBottom: 12,
    fontFamily: "Helvetica",
  },
  dividerLine: {
    width: 140,
    height: 1.5,
    backgroundColor: "#D4AF37",
    marginBottom: 14,
  },
  motivoTexto: {
    fontSize: 11,
    color: "#334155",
    lineHeight: 1.5,
    maxWidth: 520,
    textAlign: "center",
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 18,
    fontFamily: "Times-Bold",
    color: "#1F3A6E",
    marginBottom: 8,
    textAlign: "center",
    maxWidth: 540,
    letterSpacing: 0.5,
  },
  horasTexto: {
    fontSize: 10,
    color: "#64748B",
    fontFamily: "Helvetica-Oblique",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#E2E8F0",
  },
  signatureBlock: {
    alignItems: "center",
    width: 180,
  },
  signatureLine: {
    width: 160,
    height: 1,
    backgroundColor: "#475569",
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1F3A6E",
  },
  signatureTitle: {
    fontSize: 7.5,
    color: "#64748B",
  },
  dateBlock: {
    alignItems: "center",
    width: 200,
  },
  dateText: {
    fontSize: 9,
    color: "#475569",
    fontFamily: "Helvetica",
  },
  originText: {
    fontSize: 7.5,
    color: "#94A3B8",
    marginTop: 2,
  },
  qrBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qrImage: {
    width: 52,
    height: 52,
  },
  qrMeta: {
    display: "flex",
    flexDirection: "column",
  },
  qrCodeLabel: {
    fontSize: 6.5,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  qrCodeValue: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#1F3A6E",
    marginTop: 1,
    letterSpacing: 0.5,
  },
  qrVerifyNote: {
    fontSize: 6,
    color: "#94A3B8",
    marginTop: 2,
    maxWidth: 90,
  },
});

export function PlantillaCertificadoPdf({
  codigoVerificacion,
  qrDataUrl,
  tipo,
  nombreAlumno,
  documentoAlumno,
  tituloCursoOTaller,
  horasAcademicas,
  fechaEmisionTexto,
}: DatosPlantillaCertificado) {
  const tipoTitulo =
    tipo === "finalizacion"
      ? "Constancia de Finalización"
      : "Constancia de Participación";

  const tipoMotivo =
    tipo === "finalizacion"
      ? "Por haber culminado con éxito y aprobado satisfactoriamente todos los módulos y evaluaciones del curso:"
      : "Por su destacada asistencia y activa participación práctica en el taller presencial:";

  return (
    <Document title={`${tipoTitulo} - ${nombreAlumno}`} author="Amorelo">
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.outerBorder}>
          <View style={styles.innerBorder}>
            {/* Cabecera Oficial */}
            <View style={styles.header}>
              <Text style={styles.brandName}>A M O R E L O</Text>
              <Text style={styles.brandSubtitle}>Academia & Eventos Creativos</Text>
              <View style={styles.certTypeBadge}>
                <Text style={styles.certTypeBadgeText}>{tipoTitulo}</Text>
              </View>
            </View>

            {/* Contenido / Cuerpo Principal */}
            <View style={styles.body}>
              <Text style={styles.otorgadoTexto}>Otorgado con distinción a</Text>
              <Text style={styles.studentName}>{nombreAlumno}</Text>
              {documentoAlumno ? (
                <Text style={styles.documentoTexto}>Documento de Identidad: {documentoAlumno}</Text>
              ) : null}

              <View style={styles.dividerLine} />

              <Text style={styles.motivoTexto}>{tipoMotivo}</Text>
              <Text style={styles.courseTitle}>{tituloCursoOTaller}</Text>

              {horasAcademicas && horasAcademicas > 0 ? (
                <Text style={styles.horasTexto}>
                  Acreditando una carga lectiva de {horasAcademicas} horas académicas.
                </Text>
              ) : null}
            </View>

            {/* Pie de Página: Firma, Fecha y QR de Validación */}
            <View style={styles.footer}>
              {/* Firma Directora */}
              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureName}>Dirección Académica</Text>
                <Text style={styles.signatureTitle}>Amorelo Eventos</Text>
              </View>

              {/* Fecha y Lugar */}
              <View style={styles.dateBlock}>
                <Text style={styles.dateText}>Emitido el {fechaEmisionTexto}</Text>
                <Text style={styles.originText}>Lima, Perú — Constancia Oficial</Text>
              </View>

              {/* QR y Código Único */}
              <View style={styles.qrBlock}>
                {qrDataUrl ? (
                  <Image src={qrDataUrl} style={styles.qrImage} />
                ) : null}
                <View style={styles.qrMeta}>
                  <Text style={styles.qrCodeLabel}>CÓDIGO ÚNICO</Text>
                  <Text style={styles.qrCodeValue}>{codigoVerificacion}</Text>
                  <Text style={styles.qrVerifyNote}>Escanea el QR para verificar autenticidad</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
