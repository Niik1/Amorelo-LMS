// Aula: Mis Talleres presenciales (RF-EST-30).
// Lista de reservas de talleres presenciales, control de tickets QR y saldos/adelantos.

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  Lock,
  MapPin,
  MessageCircle,
  PackageCheck,
  QrCode,
  Sparkles,
  Ticket,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ModuloBanner } from "@/components/ui/modulo-banner";
import { obtenerTalleresAlumno } from "@/server/aula/consultas";

export default async function MisTalleresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect_to=/aula/talleres");

  const talleresAlumno = await obtenerTalleresAlumno(user.id);

  return (
    <main className="flex w-full flex-1 flex-col min-w-0 gap-6 p-4 sm:p-6 max-w-full">
      <ModuloBanner
        titulo="Mis Talleres Presenciales"
        descripcion="Accede a tus boletos digitales de ingreso VIP, horarios, sedes y estado de tus abonos."
        icono={Ticket}
      />

      {talleresAlumno.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {talleresAlumno.map((item) => {
            const taller = item.taller;
            const orden = item.orden;
            const tieneSaldo = orden?.tieneDeuda;
            const saldoMonto = orden?.saldoPendiente ?? 0;
            const adelantoMonto = orden?.montoPagado ?? 0;
            const totalMonto = orden?.total ?? 0;

            const mensajeWhatsApp = `¡Hola Amorelo! 🎉 Te saluda ${user.user_metadata?.nombre || "alumna"}. Deseo coordinar la liquidación de mi saldo pendiente de S/ ${saldoMonto.toFixed(2)} para el taller "${taller?.nombre || "Taller Presencial"}" vinculado a mi Ticket #${item.ticketCodigo || item.tokenAcceso}. ✨`;
            const urlWhatsApp = `https://wa.me/51924719464?text=${encodeURIComponent(mensajeWhatsApp)}`;

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md flex flex-col justify-between"
              >
                {/* Cabecera del Taller */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1e3a8a]/10 dark:bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-[#1e3a8a] dark:text-blue-300">
                        🎈 Taller Presencial
                      </span>
                      <h3 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
                        {taller?.nombre ?? "Taller Presencial Amorelo"}
                      </h3>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                          item.estado === "confirmada"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {item.estado}
                      </span>
                      {item.asistio && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Asistió en puerta
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Datos de fecha, hora y ubicación */}
                  <div className="rounded-xl bg-muted/40 p-4 space-y-2.5 text-xs sm:text-sm">
                    {taller?.fechaTexto && (
                      <div className="flex items-center gap-2.5 text-foreground font-medium">
                        <CalendarDays className="h-4 w-4 shrink-0 text-[#1e3a8a] dark:text-blue-400" />
                        <span>{taller.fechaTexto}</span>
                      </div>
                    )}

                    {taller?.horarioTexto && (
                      <div className="flex items-center gap-2.5 text-muted-foreground">
                        <Clock className="h-4 w-4 shrink-0 text-[#1e3a8a] dark:text-blue-400" />
                        <span>{taller.horarioTexto}</span>
                      </div>
                    )}

                    {(taller?.lugar || taller?.direccion) && (
                      <div className="flex items-start gap-2.5 text-muted-foreground pt-0.5 border-t border-border/50">
                        <MapPin className="h-4 w-4 shrink-0 text-[#1e3a8a] dark:text-blue-400 mt-0.5" />
                        <div>
                          {taller.lugar && (
                            <p className="font-bold text-foreground">
                              {taller.lugar}
                            </p>
                          )}
                          {taller.direccion && <p>{taller.direccion}</p>}
                          {taller.referencia && (
                            <p className="text-xs italic text-muted-foreground/80 mt-0.5">
                              Ref: {taller.referencia}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {taller?.materialIncluido && (
                      <div className="flex items-center gap-2.5 text-xs text-muted-foreground pt-0.5 border-t border-border/50">
                        <PackageCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{taller.materialIncluido}</span>
                      </div>
                    )}
                  </div>

                  {/* Estado de Pago / Alerta de Saldo Deudor */}
                  {tieneSaldo ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs sm:text-sm">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>Saldo pendiente por liquidar</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs border-y border-amber-500/20 py-2">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">
                            Precio Total
                          </span>
                          <span className="font-bold text-foreground">
                            S/ {totalMonto.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">
                            Adelanto Abonado
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            S/ {adelantoMonto.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">
                            Saldo Pendiente
                          </span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            S/ {saldoMonto.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Has realizado un adelanto para asegurar tu lugar. Recuerda liquidar el saldo de{" "}
                        <strong className="text-foreground">S/ {saldoMonto.toFixed(2)}</strong>{" "}
                        antes de ingresar al taller en la mesa de registro.
                      </p>

                      <Button
                        nativeButton={false}
                        variant="outline"
                        render={
                          <a
                            href={urlWhatsApp}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        }
                        className="w-full text-xs font-bold border-amber-500/40 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300"
                      >
                        <MessageCircle className="mr-2 h-4 w-4 text-emerald-500" />
                        Coordinar Pago de Saldo por WhatsApp
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-400">
                      <Sparkles className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <p className="font-medium">
                        <strong>¡Pago 100% completado!</strong> Tu cupo y kit de materiales están totalmente asegurados.
                      </p>
                    </div>
                  )}
                </div>

                {/* Pie: Ticket de Ingreso y Botón QR */}
                <div className="border-t bg-muted/20 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-[#1e3a8a] dark:text-blue-400" />
                    <span className="text-xs text-muted-foreground">Ticket Oficial:</span>
                    <strong className="font-mono text-sm font-bold text-foreground">
                      {item.ticketCodigo ? `#${item.ticketCodigo}` : "Confirmado"}
                    </strong>
                  </div>

                  {tieneSaldo ? (
                    <div className="flex flex-col sm:items-end gap-1 w-full sm:w-auto">
                      <Button
                        disabled
                        variant="secondary"
                        className="w-full sm:w-auto font-bold opacity-80 cursor-not-allowed bg-muted text-muted-foreground border"
                      >
                        <Lock className="mr-2 h-4 w-4 text-amber-500" />
                        Ticket QR Bloqueado
                      </Button>
                      <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold text-center sm:text-right">
                        Se habilita al liquidar tu saldo restante
                      </span>
                    </div>
                  ) : (
                    <Button
                      nativeButton={false}
                      render={
                        <Link
                          href={`/t/${item.tokenAcceso}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      }
                      className="w-full sm:w-auto bg-[#1e3a8a] font-bold text-white shadow-sm hover:bg-[#16294f] dark:bg-blue-600"
                    >
                      <QrCode className="mr-2 h-4 w-4" />
                      Ver Ticket de Ingreso (QR)
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card p-12 text-center">
          <div className="size-16 rounded-full bg-[#1e3a8a]/10 dark:bg-blue-500/20 flex items-center justify-center mb-4">
            <Ticket className="h-8 w-8 text-[#1e3a8a] dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            No tienes talleres presenciales inscritos actualmente
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
            Cuando te inscribas a uno de nuestros talleres presenciales de decoración y globos en Lima,
            aquí podrás consultar tu pase digital VIP, ubicación y ticket con código QR.
          </p>
          <Button
            nativeButton={false}
            render={<Link href="/presencial" />}
            className="mt-6 bg-[#1e3a8a] font-bold text-white shadow-sm hover:bg-[#16294f] dark:bg-blue-600"
          >
            <Compass className="mr-2 h-4 w-4" />
            Explorar Próximos Talleres Presenciales
          </Button>
        </div>
      )}
    </main>
  );
}
