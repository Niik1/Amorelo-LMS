// Generador de Ticket de Taller Presencial en PDF con Código QR (Fase 4.1).
// Utiliza @react-pdf/renderer y qrcode para generar el archivo binario imprimible.

import "server-only";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import QRCode from "qrcode";
import type { DatosTicket } from "./consultas";
import type { EntradaConfiguracionComprobante } from "@/lib/validators/configuracion";
import { obtenerConfiguracionComprobanteAction } from "@/server/configuracion/acciones";
import { prepararLogoParaPdf } from "@/lib/pdf/logo-pdf";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#f8fafc",
    fontFamily: "Helvetica",
    padding: 30,
    color: "#0f172a",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  // Cabecera institucional Amorelo
  header: {
    backgroundColor: "#1e3a8a",
    paddingVertical: 20,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "heavy",
    letterSpacing: 0.8,
    lineHeight: 1.2,
    marginBottom: 3,
  },
  headerLogo: {
    maxWidth: 200,
    maxHeight: 60,
    objectFit: "contain",
    objectPosition: "left",
    marginBottom: 6,
  },
  headerRuc: {
    color: "#bfdbfe",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.25,
    marginBottom: 2,
  },
  headerSubtitle: {
    color: "#93c5fd",
    fontSize: 8.5,
    lineHeight: 1.3,
  },
  badgePill: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  // Cuerpo del Ticket
  body: {
    padding: 24,
  },
  workshopTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 6,
  },
  attendeeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  attendeeLabel: {
    fontSize: 9,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  attendeeName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0f172a",
  },
  ticketCodeBox: {
    alignItems: "flex-end",
  },
  ticketCode: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Courier",
    color: "#1e3a8a",
  },
  // Rejilla de información del evento (Fecha, Lugar, Material)
  infoGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  infoCol: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e293b",
    lineHeight: 1.3,
  },
  infoSub: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },
  // Línea de perforación decorativa
  perforationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  perforationLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    borderBottomStyle: "dashed",
  },
  // Sección QR de Acceso
  qrSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#faf5ff",
    borderWidth: 1,
    borderColor: "#e9d5ff",
    borderRadius: 12,
    padding: 16,
  },
  qrImage: {
    width: 110,
    height: 110,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d8b4fe",
    backgroundColor: "#ffffff",
  },
  qrInfo: {
    flex: 1,
    marginLeft: 16,
  },
  qrTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#581c87",
    marginBottom: 4,
  },
  qrDesc: {
    fontSize: 9,
    color: "#6b21a8",
    lineHeight: 1.4,
    marginBottom: 6,
  },
  statusConfirmed: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    fontSize: 8,
    fontWeight: "bold",
    alignSelf: "flex-start",
  },
  statusPending: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    fontSize: 8,
    fontWeight: "bold",
    alignSelf: "flex-start",
  },
  // Pie de página
  footer: {
    backgroundColor: "#f8fafc",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#94a3b8",
  },
});

function formatearFechaHora(fechaIso: string): { fecha: string; hora: string } {
  try {
    const d = new Date(fechaIso);
    const fecha = d.toLocaleDateString("es-PE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "America/Lima",
    });
    const hora = d.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Lima",
    });
    return {
      fecha: fecha.charAt(0).toUpperCase() + fecha.slice(1),
      hora,
    };
  } catch {
    return { fecha: fechaIso, hora: "" };
  }
}

export function TicketPdfDocument({
  ticket,
  qrDataUrl,
  configuracion,
  logoDataUri,
}: {
  ticket: DatosTicket;
  qrDataUrl: string;
  configuracion?: EntradaConfiguracionComprobante;
  logoDataUri?: string | null;
}) {
  const { fecha: fechaInicio, hora: horaInicio } = formatearFechaHora(
    ticket.fecha_inicio
  );
  const { hora: horaFin } = formatearFechaHora(ticket.fecha_fin);

  const esConfirmado = ticket.estado === "confirmada";

  return (
    <Document
      title={`Ticket-${ticket.ticket_codigo}`}
      author={configuracion?.razon_social || "Amorelo"}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.card}>
          {/* Cabecera */}
          <View style={styles.header}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              {logoDataUri ? (
                <Image style={styles.headerLogo} src={logoDataUri} />
              ) : null}
              <Text style={styles.brandName}>
                {configuracion?.razon_social || "AMORELO"}
              </Text>
              {configuracion?.ruc ? (
                <Text style={styles.headerRuc}>RUC {configuracion.ruc}</Text>
              ) : null}
              <Text style={styles.headerSubtitle}>
                {configuracion?.nombre_comercial ||
                  "Taller Presencial de Decoración y Globos"}
              </Text>
            </View>
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>Ticket de Ingreso</Text>
            </View>
          </View>

          {/* Cuerpo */}
          <View style={styles.body}>
            <Text style={styles.workshopTitle}>{ticket.taller_nombre}</Text>

            {/* Fila Asistente y Código */}
            <View style={styles.attendeeRow}>
              <View>
                <Text style={styles.attendeeLabel}>Asistente Acreditado</Text>
                <Text style={styles.attendeeName}>{ticket.asistente_nombre}</Text>
              </View>
              <View style={styles.ticketCodeBox}>
                <Text style={styles.attendeeLabel}>Código de Entrada</Text>
                <Text style={styles.ticketCode}>{ticket.ticket_codigo}</Text>
              </View>
            </View>

            {/* Cuadrícula de Información */}
            <View style={styles.infoGrid}>
              {/* Fecha y Hora */}
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Fecha y Horario</Text>
                <Text style={styles.infoValue}>{fechaInicio}</Text>
                <Text style={styles.infoSub}>
                  {horaInicio} {horaFin ? `- ${horaFin}` : ""}
                </Text>
              </View>

              {/* Sede y Dirección */}
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Lugar del Evento</Text>
                <Text style={styles.infoValue}>{ticket.lugar}</Text>
                {ticket.direccion && (
                  <Text style={styles.infoSub}>{ticket.direccion}</Text>
                )}
                {ticket.referencia && (
                  <Text style={[styles.infoSub, { fontStyle: "italic" }]}>
                    Ref: {ticket.referencia}
                  </Text>
                )}
              </View>
            </View>

            {/* Material Incluido */}
            {ticket.material_incluido && (
              <View
                style={{
                  backgroundColor: "#eff6ff",
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#bfdbfe",
                }}
              >
                <Text style={[styles.infoLabel, { color: "#1e40af" }]}>
                  Material y Beneficios Incluidos
                </Text>
                <Text style={{ fontSize: 9, color: "#1e3a8a", lineHeight: 1.3 }}>
                  {ticket.material_incluido}
                </Text>
              </View>
            )}

            {/* Línea de Perforación */}
            <View style={styles.perforationContainer}>
              <View style={styles.perforationLine} />
            </View>

            {/* Sección Código QR */}
            <View style={styles.qrSection}>
              <Image src={qrDataUrl} style={styles.qrImage} />
              <View style={styles.qrInfo}>
                <Text style={styles.qrTitle}>Control de Acceso en Puerta</Text>
                <Text style={styles.qrDesc}>
                  Muestra este código QR desde tu celular o impreso al ingresar al
                  taller. El personal escaneará el código para registrar tu
                  asistencia oficial.
                </Text>
                {esConfirmado ? (
                  <Text style={styles.statusConfirmed}>Cupo 100% Confirmado</Text>
                ) : (
                  <Text style={styles.statusPending}>
                    Saldo Pendiente: S/ {ticket.saldo_pendiente.toFixed(2)}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Pie de Página */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Orden: {ticket.numero_orden} • Válido únicamente para la fecha y
              sede indicadas.
            </Text>
            <Text style={styles.footerText}>
              {configuracion?.sitio_web || "www.amorelo.com"}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Genera el Buffer binario del Ticket en PDF listo para enviar por Resend o descargar.
 */
export async function generarTicketPdfBuffer(
  ticket: DatosTicket,
  urlValidacion: string
): Promise<Buffer> {
  const configuracion = await obtenerConfiguracionComprobanteAction();

  // Generar imagen QR en Base64 y procesar logo compatible en paralelo
  const [qrDataUrl, logoDataUri] = await Promise.all([
    QRCode.toDataURL(urlValidacion, {
      margin: 1,
      width: 320,
      errorCorrectionLevel: "M",
      color: {
        dark: "#1e3a8a",
        light: "#ffffff",
      },
    }),
    prepararLogoParaPdf(configuracion.logo_url),
  ]);

  const doc = (
    <TicketPdfDocument
      ticket={ticket}
      qrDataUrl={qrDataUrl}
      configuracion={configuracion}
      logoDataUri={logoDataUri}
    />
  );
  const buffer = await renderToBuffer(doc);
  return buffer;
}
