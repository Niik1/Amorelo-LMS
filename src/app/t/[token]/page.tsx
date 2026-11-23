// Página Pública del Ticket de Taller Presencial (Pase Digital VIP).
// Vista limpia independiente sin navbar público, footer ni WhatsApp flotante.
// En Desktop: Diseño horizontal Boarding Pass panorámico en 2 columnas (Zero Scroll).
// En Móvil: Adaptable vertical responsive.

import { notFound } from "next/navigation";
import QRCode from "qrcode";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  Package,
  ShieldCheck,
  Ticket as TicketIcon,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { obtenerAdminId } from "@/server/auth/admin";
import { consultarTicketPorToken } from "@/server/talleres/consultas";
import { BotonValidarTicket } from "@/components/talleres/boton-validar-ticket";
import { AccionesTicket } from "@/components/talleres/acciones-ticket";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { checkTicketRateLimit, obtenerIpServidor } from "@/lib/security/ratelimit";

export const metadata = {
  title: "Ticket de Ingreso Oficial | Amorelo",
  description:
    "Boleto digital de acceso para talleres presenciales de decoración y globos.",
  robots: { index: false, follow: false },
};

function formatearFechaHora(fechaIso: string): {
  fecha: string;
  diaSemana: string;
  hora: string;
} {
  try {
    const d = new Date(fechaIso);
    const fecha = d.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "America/Lima",
    });
    const diaSemana = d.toLocaleDateString("es-PE", {
      weekday: "long",
      timeZone: "America/Lima",
    });
    const hora = d.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Lima",
    });
    return {
      fecha,
      diaSemana: diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1),
      hora,
    };
  } catch {
    return { fecha: fechaIso, diaSemana: "", hora: "" };
  }
}

export default async function PaginaTicketPublico({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  // 1. Rate Limit por IP (30 consultas / minuto para evitar saturación)
  const ip = await obtenerIpServidor();
  const rateCheck = await checkTicketRateLimit(ip);
  if (!rateCheck.ok) {
    return (
      <main className="flex min-h-svh w-full flex-col items-center justify-center bg-slate-100/70 p-4 py-8 dark:bg-slate-950/70">
        <div className="max-w-md w-full rounded-3xl border bg-card p-8 shadow-xl text-center space-y-3">
          <div className="size-12 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="size-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Acceso temporalmente pausado</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Has realizado demasiadas solicitudes en poco tiempo. Por seguridad, por favor espera un momento antes de volver a consultar tu boleto.
          </p>
        </div>
      </main>
    );
  }

  const { token } = await params;
  const ticket = await consultarTicketPorToken(token);

  if (!ticket) {
    notFound();
  }

  // Verificar si quien abre el enlace es un Administrador autenticado
  const supabase = await createClient();
  const adminId = await obtenerAdminId(supabase as any);
  const esAdmin = Boolean(adminId);

  // Generar QR en base64 para mostrar en pantalla sin descargas
  const qrDataUrl = await QRCode.toDataURL(`https://amorelo.pe/t/${token}`, {
    margin: 1,
    width: 320,
    errorCorrectionLevel: "M",
    color: {
      dark: "#1e3a8a",
      light: "#ffffff",
    },
  });

  const { fecha: fechaInicio, diaSemana, hora: horaInicio } =
    formatearFechaHora(ticket.fecha_inicio);
  const { hora: horaFin } = formatearFechaHora(ticket.fecha_fin);

  const esConfirmada = ticket.estado === "confirmada";
  const esVencida = ticket.estado === "vencida";
  const yaValidado = Boolean(ticket.validado_en);

  return (
    <main className="flex min-h-svh w-full flex-col items-center justify-center bg-slate-100/70 p-4 py-8 sm:p-6 lg:p-10 dark:bg-slate-950/70">
      <div className="flex w-full max-w-5xl flex-col gap-4">
        {/* Banner de Cupo Liberado / Plazo Vencido si corresponde */}
        {esVencida && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-50 p-4 text-xs shadow-sm dark:border-rose-800/40 dark:bg-rose-950/60">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <TicketIcon className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-rose-950 dark:text-rose-200 text-sm">
                Cupo liberado por vencimiento de plazo
              </span>
              <p className="text-rose-900/90 dark:text-rose-300/90 mt-0.5 leading-relaxed">
                El plazo otorgado para completar el saldo pendiente de este ticket ha expirado. El cupo ha sido liberado para permitir el acceso a otros asistentes según los términos y condiciones del taller. Si ya realizaste el pago restante, comunícate con la administración de Amorelo.
              </p>
            </div>
          </div>
        )}

        {/* Barra Administrativa en caso de ser Admin */}
        {esAdmin && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-blue-500/30 bg-blue-50/90 dark:bg-blue-950/50 dark:border-blue-800/40 p-3.5 px-5 text-xs shadow-sm w-full">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="size-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-900 dark:text-blue-300">
                    Panel de Control en Puerta (Admin)
                  </span>
                  <span className="rounded-full bg-blue-600/15 px-2 py-0.5 text-[10px] font-extrabold uppercase text-blue-700 dark:text-blue-300">
                    Amorelo Staff
                  </span>
                </div>
                <span className="text-muted-foreground text-[11px]">
                  {esVencida
                    ? "Reserva con estado VENCIDA — Cupo liberado"
                    : yaValidado
                    ? `Validado el ${new Date(ticket.validado_en!).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`
                    : "Listo para registrar ingreso"}
                </span>
              </div>
            </div>
            <BotonValidarTicket token={token} yaValidado={yaValidado} />
          </div>
        )}

        {/* Tarjeta Boleto VIP (Estilo Boarding Pass Panorámico) */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl transition-all w-full">
          {/* Cabecera Azul Marina Completa a todo lo ancho */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[#1e3a8a] via-[#1e40af] to-[#1e3a8a] p-6 sm:p-7 text-white shadow-inner">
            {/* Efecto decorativo sutil de fondo */}
            <div className="pointer-events-none absolute -top-12 -right-12 size-48 rounded-full bg-white/5 blur-2xl" />

            <div className="relative z-10 flex flex-col gap-4">
              {/* Fila 1: Título y categoría */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-200/90">
                    Taller Presencial Amorelo
                  </span>
                  <h1 className="mt-1 text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight tracking-tight text-white">
                    {ticket.taller_nombre}
                  </h1>
                </div>
                <div className="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md shadow-sm border border-white/15">
                  <TicketIcon className="size-5 sm:size-6 text-white" />
                </div>
              </div>

              {/* Fila 2: Píldora de estado y Código de Ticket a los extremos */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/15">
                <div className="flex items-center gap-2">
                  {yaValidado ? (
                    <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 px-3 py-1 shadow-sm">
                      <CheckCircle2 className="size-3.5" />
                      <span>Ingreso Validado</span>
                    </Badge>
                  ) : esVencida ? (
                    <Badge className="bg-rose-600 hover:bg-rose-600 text-white font-bold text-xs px-3 py-1 shadow-sm">
                      Cupo Liberado (Plazo Vencido)
                    </Badge>
                  ) : esConfirmada ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-bold text-xs px-3 py-1 shadow-sm">
                      Cupo 100% Confirmado
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-amber-500/25 text-amber-100 font-bold text-xs border border-amber-300/30 px-3 py-1 shadow-sm"
                    >
                      Saldo Pendiente: S/ {ticket.saldo_pendiente.toFixed(2)}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-blue-200/80 font-medium hidden sm:inline">
                    Código de Ticket:
                  </span>
                  <span className="font-mono text-sm sm:text-base font-extrabold tracking-wider bg-white/15 px-3 py-1 rounded-xl text-white border border-white/15 shadow-inner">
                    {ticket.ticket_codigo}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cuerpo del Boleto: 2 Columnas en Desktop (lg:grid-cols-12), 1 en Móvil */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-7">
            {/* Columna Izquierda (Datos del Asistente, Horario, Ubicación y Botones) */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-5">
              <div className="flex flex-col gap-4">
                {/* Datos del Asistente */}
                <div className="flex items-center gap-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/90 p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                    <User className="size-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Asistente Acreditado
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                      {ticket.asistente_nombre}
                    </span>
                  </div>
                </div>

                {/* Fecha y Sede en 2 columnas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Fecha y Horario */}
                  <div className="flex flex-col gap-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 text-xs bg-slate-50/50 dark:bg-slate-900/80 shadow-sm">
                    <div className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400">
                      <Calendar className="size-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="uppercase text-[10px] tracking-wider">Fecha y Hora</span>
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                      {diaSemana}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 text-xs font-medium">
                      {fechaInicio}
                    </span>
                    <div className="mt-1 flex items-center gap-1.5 font-bold text-blue-600 dark:text-sky-300 text-xs">
                      <Clock className="size-3.5 text-blue-600 dark:text-sky-400" />
                      <span>
                        {horaInicio} {horaFin ? `a ${horaFin}` : ""}
                      </span>
                    </div>
                  </div>

                  {/* Sede y Ubicación */}
                  <div className="flex flex-col gap-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 text-xs bg-slate-50/50 dark:bg-slate-900/80 shadow-sm">
                    <div className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400">
                      <MapPin className="size-3.5 text-rose-500 dark:text-rose-400" />
                      <span className="uppercase text-[10px] tracking-wider">Lugar del Taller</span>
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                      {ticket.lugar}
                    </span>
                    {ticket.direccion && (
                      <span className="text-slate-600 dark:text-slate-300 text-xs line-clamp-2">
                        {ticket.direccion}
                      </span>
                    )}
                    {ticket.referencia && (
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] italic">
                        Ref: {ticket.referencia}
                      </span>
                    )}
                  </div>
                </div>

                {/* Material Incluido si aplica */}
                {ticket.material_incluido && (
                  <div className="flex items-start gap-2.5 rounded-2xl border border-blue-500/25 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-800/40 p-3.5 text-xs shadow-sm">
                    <Package className="size-4 shrink-0 text-blue-600 dark:text-blue-300 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-bold text-blue-900 dark:text-blue-200">
                        Material Incluido
                      </span>
                      <span className="text-slate-600 dark:text-slate-300 text-xs mt-0.5 leading-relaxed">
                        {ticket.material_incluido}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de Acción */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <AccionesTicket
                  token={token}
                  ticketCodigo={ticket.ticket_codigo}
                  tallerNombre={ticket.taller_nombre}
                  fechaInicio={ticket.fecha_inicio}
                  fechaFin={ticket.fecha_fin}
                  lugar={ticket.lugar}
                  direccion={ticket.direccion}
                  mapsUrl={ticket.maps_url}
                  esVencida={esVencida}
                  className="justify-center sm:justify-start"
                />
              </div>
            </div>

            {/* Columna Derecha (Código QR en Grande y Mensaje de Puerta) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center gap-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 p-6 text-center border border-slate-200/80 dark:border-slate-800/80 shadow-inner">
              <div className="relative overflow-hidden rounded-2xl border-2 border-[#1e3a8a] dark:border-blue-500/40 bg-white p-3 shadow-md dark:shadow-2xl dark:shadow-blue-950/50 transition-transform hover:scale-[1.02]">
                <img
                  src={qrDataUrl}
                  alt={`QR de acceso para ${ticket.ticket_codigo}`}
                  className={cn(
                    "size-52 sm:size-56 object-contain",
                    (esVencida || ticket.saldo_pendiente > 0) && "opacity-25 grayscale"
                  )}
                />
                {esVencida ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-white/70 dark:bg-black/60 backdrop-blur-[1px]">
                    <span className="font-black text-rose-600 text-xs uppercase tracking-widest text-center px-2 py-1 rounded bg-rose-50 border border-rose-300">
                      Cupo Liberado
                    </span>
                    <span className="text-[10px] font-bold text-rose-950 dark:text-rose-200 mt-1 text-center">
                      Plazo expirado
                    </span>
                  </div>
                ) : ticket.saldo_pendiente > 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-white/85 dark:bg-slate-950/85 backdrop-blur-[2px]">
                    <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 mb-2 border border-amber-500/30">
                      <Lock className="size-5" />
                    </div>
                    <span className="font-black text-amber-700 dark:text-amber-400 text-xs uppercase tracking-wider text-center px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700">
                      QR Bloqueado
                    </span>
                    <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 mt-1 text-center">
                      Saldo restante: S/ {ticket.saldo_pendiente.toFixed(2)}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-1 items-center max-w-xs">
                <span className="font-mono text-base font-extrabold tracking-widest text-[#1e3a8a] dark:text-blue-400">
                  {ticket.ticket_codigo}
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {esVencida
                    ? "Este boleto se encuentra inactivo. Comunícate con la organización para cualquier consulta sobre tu reserva."
                    : ticket.saldo_pendiente > 0
                    ? `Tienes un adelanto registrado. Para desbloquear tu código QR y acceder a sala, liquida el saldo de S/ ${ticket.saldo_pendiente.toFixed(2)} antes del evento o en mesa de registro.`
                    : "Muestra este código QR en la entrada del evento para validar tu asistencia oficial."}
                </p>
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-800/90 px-2.5 py-0.5 rounded-full border border-slate-300/80 dark:border-slate-700">
                  Pase Personal e Intransferible
                </span>
              </div>
            </div>
          </div>

          {/* Pie de Boleto */}
          <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 px-6 py-3.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Orden: #{ticket.numero_orden}</span>
            <span>El taller de Amorelo • Lima, Perú</span>
          </div>
        </div>
      </div>
    </main>
  );
}
