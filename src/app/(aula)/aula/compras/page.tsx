// Aula: Mis Compras y Boletas Oficiales (RF-EST-38).
// Historial de compras, órdenes y descarga de comprobantes electrónicos en PDF.

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  GraduationCap,
  Lock,
  Receipt,
  ShoppingBag,
  Ticket,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ModuloBanner } from "@/components/ui/modulo-banner";
import { obtenerComprasAlumno } from "@/server/aula/consultas";

export default async function MisComprasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect_to=/aula/compras");

  const compras = await obtenerComprasAlumno(user.id);

  // Calcular métricas del alumno
  const totalInvertido = compras.reduce((acc, c) => acc + (c.montoPagado || 0), 0);
  const comprobantesDisponibles = compras.filter((c) => c.comprobante?.disponible).length;
  const saldosPendientes = compras.reduce((acc, c) => acc + (c.saldoPendiente || 0), 0);

  return (
    <main className="flex w-full flex-1 flex-col min-w-0 gap-6 p-4 sm:p-6 max-w-full">
      <ModuloBanner
        titulo="Mis Compras y Comprobantes"
        descripcion="Historial oficial de tus órdenes, abonos, pagos confirmados y boletas electrónicas."
        icono={Receipt}
      />

      {/* Tarjetas de Métricas Resumen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium block">
              Total Invertido
            </span>
            <span className="text-xl sm:text-2xl font-black text-foreground">
              S/ {totalInvertido.toFixed(2)}
            </span>
          </div>
          <div className="size-11 rounded-full bg-[#1e3a8a]/10 dark:bg-blue-500/20 text-[#1e3a8a] dark:text-blue-300 flex items-center justify-center">
            <ShoppingBag className="size-5" />
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium block">
              Comprobantes Disponibles
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {comprobantesDisponibles} {comprobantesDisponibles === 1 ? "boleta" : "boletas"}
            </span>
          </div>
          <div className="size-11 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Receipt className="size-5" />
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium block">
              Saldos por Liquidar
            </span>
            <span
              className={`text-xl sm:text-2xl font-black ${
                saldosPendientes > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-foreground"
              }`}
            >
              S/ {saldosPendientes.toFixed(2)}
            </span>
          </div>
          <div
            className={`size-11 rounded-full flex items-center justify-center ${
              saldosPendientes > 0
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {saldosPendientes > 0 ? (
              <AlertCircle className="size-5" />
            ) : (
              <CheckCircle2 className="size-5" />
            )}
          </div>
        </div>
      </div>

      {compras.length > 0 ? (
        <>
          {/* Vista Móvil: Tarjetas individuales (Sin scroll horizontal) */}
          <div className="flex flex-col gap-4 md:hidden">
            {compras.map((compra) => {
              const tieneSaldo = compra.saldoPendiente > 0;
              const itemPrincipal = compra.items[0];
              const esTaller = compra.tipoOrden === "taller";

              return (
                <div
                  key={compra.id}
                  className="rounded-2xl border bg-card p-4 shadow-xs space-y-3.5 transition-all"
                >
                  {/* Cabecera Móvil: N° Orden, Fecha y Estado */}
                  <div className="flex items-center justify-between border-b pb-2.5 border-border/60">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-foreground text-sm">
                        #{compra.numeroOrden}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(compra.creadoEn).toLocaleDateString("es-PE", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                        compra.estado === "pagada"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                          : tieneSaldo
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {compra.estado === "pagada" ? "Pagada" : "Con Adelanto"}
                    </span>
                  </div>

                  {/* Detalle del Producto */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#1e3a8a]/10 dark:bg-blue-500/20 text-[#1e3a8a] dark:text-blue-300 shrink-0 mt-0.5">
                      {esTaller ? (
                        <Ticket className="size-4" />
                      ) : (
                        <GraduationCap className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-foreground text-sm leading-snug">
                        {itemPrincipal?.descripcion ?? "Adquisición Amorelo"}
                      </h4>
                      {compra.items.length > 1 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          +{compra.items.length - 1} ítem(s) adicional(es)
                        </p>
                      )}
                      <span className="inline-block mt-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/60 px-2 py-0.5 rounded-md">
                        {esTaller ? "Taller Presencial" : "Curso Online"}
                      </span>
                    </div>
                  </div>

                  {/* Resumen Económico */}
                  <div className="rounded-xl bg-muted/40 p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">
                        Total
                      </span>
                      <span className="text-base font-black text-foreground">
                        {compra.moneda === "USD" ? "$" : "S/"}{" "}
                        {compra.total.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-right">
                      {tieneSaldo ? (
                        <div>
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                            Abonado: S/ {compra.montoPagado.toFixed(2)}
                          </span>
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-extrabold block">
                            Resta: S/ {compra.saldoPendiente.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                          <CheckCircle2 className="size-3.5" />
                          100% Cancelado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acción Comprobante */}
                  <div className="pt-0.5">
                    {compra.comprobante ? (
                      compra.comprobante.disponible ? (
                        <Button
                          nativeButton={false}
                          render={
                            <a
                              href={`/api/comprobantes/${compra.comprobante.id}/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          }
                          className="w-full bg-[#1e3a8a] text-white hover:bg-[#16294f] dark:bg-blue-600 font-bold text-xs h-9 shadow-xs justify-center"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Ver Boleta en PDF
                        </Button>
                      ) : (
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-center space-y-0.5">
                          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                            <Lock className="size-3.5 shrink-0" />
                            <span>Comprobante Bloqueado</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Disponible al pagar el 100% de la orden
                          </p>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-2 text-xs text-muted-foreground italic bg-muted/20 rounded-xl">
                        Comprobante no disponible
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vista Desktop/Tablet: Tabla tradicional (>= 768px) */}
          <div className="hidden md:block overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground font-bold">
                  <tr>
                    <th className="px-5 py-3.5">N° Orden</th>
                    <th className="px-5 py-3.5">Detalle / Ítems</th>
                    <th className="px-5 py-3.5">Fecha</th>
                    <th className="px-5 py-3.5">Monto / Pagado</th>
                    <th className="px-5 py-3.5">Estado</th>
                    <th className="px-5 py-3.5 text-right">Comprobante Oficial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {compras.map((compra) => {
                    const tieneSaldo = compra.saldoPendiente > 0;
                    const itemPrincipal = compra.items[0];
                    const esTaller = compra.tipoOrden === "taller";

                    return (
                      <tr
                        key={compra.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {/* N° Orden */}
                        <td className="px-5 py-4 font-mono font-bold text-foreground">
                          #{compra.numeroOrden}
                        </td>

                        {/* Detalle del Producto */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {esTaller ? (
                              <Ticket className="h-4 w-4 shrink-0 text-[#1e3a8a] dark:text-blue-400" />
                            ) : (
                              <GraduationCap className="h-4 w-4 shrink-0 text-[#1e3a8a] dark:text-blue-400" />
                            )}
                            <span className="font-bold text-foreground">
                              {itemPrincipal?.descripcion ?? "Adquisición Amorelo"}
                            </span>
                          </div>

                          {compra.items.length > 1 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              +{compra.items.length - 1} ítem(s) adicional(es)
                            </p>
                          )}

                          <span className="inline-block mt-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            {esTaller ? "Taller Presencial" : "Curso Online"}
                          </span>
                        </td>

                        {/* Fecha de Emisión/Compra */}
                        <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(compra.creadoEn).toLocaleDateString("es-PE", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>

                        {/* Monto y Estado Financiero */}
                        <td className="px-5 py-4">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-foreground text-sm">
                              {compra.moneda === "USD" ? "$" : "S/"}{" "}
                              {compra.total.toFixed(2)}
                            </span>

                            {tieneSaldo ? (
                              <div className="text-[11px] leading-tight">
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                  Abonado: S/ {compra.montoPagado.toFixed(2)}
                                </span>
                                <br />
                                <span className="text-amber-600 dark:text-amber-400 font-bold">
                                  Resta: S/ {compra.saldoPendiente.toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                                100% Cancelado
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Estado de la Orden */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                              compra.estado === "pagada"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                                : tieneSaldo
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {compra.estado === "pagada" ? "Pagada" : "Con Adelanto"}
                          </span>
                        </td>

                        {/* Columna Comprobante / Acción */}
                        <td className="px-5 py-4 text-right">
                          {compra.comprobante ? (
                            compra.comprobante.disponible ? (
                              <div className="inline-flex items-center justify-end">
                                <Button
                                  size="sm"
                                  nativeButton={false}
                                  render={
                                    <a
                                      href={`/api/comprobantes/${compra.comprobante.id}/pdf`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    />
                                  }
                                  className="bg-[#1e3a8a] text-white hover:bg-[#16294f] dark:bg-blue-600 font-bold text-xs h-8 shadow-xs"
                                  title="Ver comprobante oficial en PDF"
                                >
                                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                  Ver Boleta en PDF
                                </Button>
                              </div>
                            ) : (
                              <div className="inline-flex flex-col items-end">
                                <span
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-400"
                                  title={compra.comprobante.motivoBloqueo}
                                >
                                  <Lock className="size-3 shrink-0" />
                                  Comprobante Bloqueado
                                </span>
                                <span className="text-[11px] text-muted-foreground mt-0.5">
                                  Disponible al pagar el 100%
                                </span>
                              </div>
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              No disponible
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card p-12 text-center">
          <div className="size-16 rounded-full bg-[#1e3a8a]/10 dark:bg-blue-500/20 flex items-center justify-center mb-4">
            <Receipt className="h-8 w-8 text-[#1e3a8a] dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            No tienes pagos ni compras registradas
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
            Cuando te matricules a uno de nuestros cursos virtuales o reserves un taller presencial,
            tus comprobantes de pago y boletas electrónicas oficiales aparecerán aquí disponibles para descargar.
          </p>
          <Button
            nativeButton={false}
            render={<Link href="/cursos" />}
            className="mt-6 bg-[#1e3a8a] font-bold text-white shadow-sm hover:bg-[#16294f] dark:bg-blue-600"
          >
            Explorar Cursos Virtuales
          </Button>
        </div>
      )}
    </main>
  );
}
