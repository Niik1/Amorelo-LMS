// Modal para emitir certificados oficiales a los asistentes de talleres presenciales.
// Solo permite emitir a quienes tienen registrada la asistencia física en puerta.
// Diseño en 2 columnas: Columna 1 (Taller + KPIs apilados) y Columna 2 (Asistentes registrados con scroll interno condicional).

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Award, CheckCircle2, Loader2, Sparkles, UserCheck, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  emitirCertificadosTallerMasivoAction,
  emitirCertificadoTallerIndividualAction,
  type TallerConAsistentes,
} from "@/server/certificados/acciones-admin";

interface ModalEmitirTallerProps {
  talleres: TallerConAsistentes[];
  abierto: boolean;
  onOpenChange: (open: boolean) => void;
  onCompletado: () => void;
}

export function ModalEmitirTaller({
  talleres,
  abierto,
  onOpenChange,
  onCompletado,
}: ModalEmitirTallerProps) {
  const [tallerSeleccionadoId, setTallerSeleccionadoId] = useState<string>(
    talleres[0]?.id || ""
  );
  const [cargandoLote, setCargandoLote] = useState(false);
  const [cargandoIndividualId, setCargandoIndividualId] = useState<string | null>(null);

  const tallerActual = talleres.find((t) => t.id === tallerSeleccionadoId) || talleres[0];

  const handleEmitirLote = async () => {
    if (!tallerActual) return;
    if (tallerActual.pendientesEmision === 0) {
      toast.info("No hay asistentes con ingreso en puerta pendientes de certificado.");
      return;
    }

    setCargandoLote(true);
    try {
      const res = await emitirCertificadosTallerMasivoAction(tallerActual.id);
      if (res.ok) {
        toast.success(`Se emitieron ${res.emitidos} certificados oficiales`, {
          description: res.omitidos > 0 ? `${res.omitidos} ya contaban con certificado.` : undefined,
        });
        onCompletado();
        onOpenChange(false);
      } else {
        toast.error(res.error || "No se pudieron emitir los certificados.");
      }
    } catch {
      toast.error("Error inesperado al emitir los certificados.");
    } finally {
      setCargandoLote(false);
    }
  };

  const handleEmitirIndividual = async (reservaId: string, nombre: string) => {
    setCargandoIndividualId(reservaId);
    try {
      const res = await emitirCertificadoTallerIndividualAction(reservaId);
      if (res.ok) {
        toast.success(`Certificado emitido para ${nombre}`, {
          description: `Código: ${res.codigo}`,
        });
        onCompletado();
      } else {
        toast.error(res.error || "Error al emitir el certificado.");
      }
    } catch {
      toast.error("Error al emitir certificado individual.");
    } finally {
      setCargandoIndividualId(null);
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-3xl lg:max-w-5xl xl:max-w-6xl p-0 gap-0 overflow-hidden flex flex-col max-h-[92vh] rounded-3xl border shadow-2xl bg-card">
        {/* Cabecera Fija */}
        <DialogHeader className="shrink-0 border-b px-6 py-4 sm:py-5 bg-card">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-icon-accent mb-1">
            <Award className="size-4" />
            <span>GESTIÓN DE CERTIFICACIONES PRESENCIALES</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black text-heading tracking-tight">
            Emitir Certificados de Taller Presencial
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Certifica la asistencia física de los alumnos que validaron su ingreso en puerta con código QR.
          </DialogDescription>
        </DialogHeader>

        {/* Contenido en 2 Columnas Balanceadas para Desktop */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* COLUMNA 1 (Izquierda): Taller y KPIs apilados verticalmente */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <span className="size-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <h3 className="text-sm font-bold text-heading uppercase tracking-wide">
                  Taller y Asistencia en Puerta
                </h3>
              </div>

              <div>
                <Label htmlFor="selector-taller" className="mb-1.5 block text-xs font-bold text-heading">
                  Seleccionar Taller *
                </Label>
                <Select
                  value={tallerActual?.id || ""}
                  items={talleres.map((t) => ({
                    value: t.id,
                    label: `${t.nombre} (${t.pendientesEmision} pendientes)`,
                  }))}
                  onValueChange={(val) => setTallerSeleccionadoId(val || "")}
                >
                  <SelectTrigger
                    id="selector-taller"
                    className="h-11 w-full rounded-xl border-border bg-card text-sm font-semibold"
                  >
                    <SelectValue placeholder="Selecciona un taller" />
                  </SelectTrigger>
                  <SelectContent
                    align="start"
                    alignItemWithTrigger={false}
                    className="w-[var(--anchor-width)] sm:w-max min-w-[var(--anchor-width)] max-w-[calc(100vw-2.5rem)] sm:max-w-lg rounded-2xl shadow-xl overflow-hidden"
                  >
                    {talleres.map((t) => (
                      <SelectItem
                        key={t.id}
                        value={t.id}
                        title={t.nombre}
                        className="text-xs font-medium cursor-pointer py-2.5"
                      >
                        <span className="block truncate flex-1 min-w-0">
                          {t.nombre} — <strong className="text-primary font-bold">({t.pendientesEmision} pendientes)</strong>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* KPIs apilados verticalmente uno encima del otro */}
              {tallerActual ? (
                <div className="flex flex-col gap-2.5 pt-1">
                  {/* KPI 1: Ingreso en Puerta */}
                  <div className="p-3.5 rounded-2xl border bg-card/60 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <UserCheck className="size-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Ingreso en Puerta
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Asistentes validados por QR
                        </span>
                      </div>
                    </div>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {tallerActual.asistieronPuerta}
                    </p>
                  </div>

                  {/* KPI 2: Ya Emitidos */}
                  <div className="p-3.5 rounded-2xl border bg-card/60 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Award className="size-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Certificados Emitidos
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Activos y verificables
                        </span>
                      </div>
                    </div>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
                      {tallerActual.certificadosEmitidos}
                    </p>
                  </div>

                  {/* KPI 3: Pendientes de Emisión */}
                  <div className="p-3.5 rounded-2xl border bg-card/60 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Sparkles className="size-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Pendientes de Emisión
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Listos para certificar hoy
                        </span>
                      </div>
                    </div>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                      {tallerActual.pendientesEmision}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* COLUMNA 2 (Derecha): Asistentes Registrados con scroll interno condicional */}
            <div className="lg:col-span-7 space-y-3 flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <span className="size-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h3 className="text-sm font-bold text-heading uppercase tracking-wide">
                    Asistentes Registrados {tallerActual ? `(${tallerActual.asistentes.length})` : ""}
                  </h3>
                </div>
                <span className="text-[11px] text-muted-foreground hidden sm:block">
                  Solo los validados en puerta pueden recibir certificado
                </span>
              </div>

              {/* Lista con scroll inteligente interno si son muchos */}
              <div className="divide-y divide-border rounded-2xl border bg-card overflow-hidden max-h-72 lg:max-h-[350px] overflow-y-auto">
                {!tallerActual || tallerActual.asistentes.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center min-h-[160px]">
                    <UserCheck className="size-8 opacity-30 mb-2" />
                    <span>No hay asistentes inscritos en este taller.</span>
                  </div>
                ) : (
                  tallerActual.asistentes.map((a) => (
                    <div
                      key={a.reservaId}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-heading text-sm">
                            {a.nombres} {a.apellidos}
                          </span>
                          {a.numeroDocumento ? (
                            <span className="text-[11px] text-muted-foreground font-mono">
                              ({a.tipoDocumento || "Doc"}: {a.numeroDocumento})
                            </span>
                          ) : null}
                        </div>
                        <span className="text-[11px] text-muted-foreground font-mono">{a.correo}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {a.yaTieneCertificado ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold text-xs">
                            <CheckCircle2 className="mr-1 size-3.5" />
                            Emitido ({a.codigoCertificado})
                          </Badge>
                        ) : a.asistio ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleEmitirIndividual(a.reservaId, `${a.nombres} ${a.apellidos}`)
                            }
                            disabled={cargandoIndividualId === a.reservaId || cargandoLote}
                            className="h-8 rounded-xl border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold text-xs cursor-pointer shadow-xs"
                          >
                            {cargandoIndividualId === a.reservaId ? (
                              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="mr-1.5 size-3.5 text-emerald-600" />
                            )}
                            <span>Emitir certificado</span>
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-slate-400 border-slate-300 dark:border-slate-700 text-xs font-semibold">
                            <XCircle className="mr-1 size-3.5 text-slate-400" />
                            No ingresó en puerta
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Fijo con estilo de Matricular Manual */}
        <div className="sticky bottom-0 shrink-0 z-10 border-t bg-card px-6 py-4 flex flex-col-reverse sm:flex-row items-center sm:justify-between gap-3 shadow-lg">
          <span className="text-xs text-muted-foreground hidden sm:block">
            Los certificados se emiten con código QR y validación oficial en línea.
          </span>
          <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={cargandoLote}
              className="w-full sm:w-auto rounded-xl font-bold cursor-pointer"
            >
              Cerrar
            </Button>

            <Button
              type="button"
              onClick={handleEmitirLote}
              disabled={
                cargandoLote ||
                !tallerActual ||
                tallerActual.pendientesEmision === 0
              }
              className="w-full sm:w-auto rounded-xl font-bold bg-[#1e3a8a] text-white hover:bg-[#1e3a8a]/90 cursor-pointer shadow-md disabled:opacity-50"
            >
              {cargandoLote ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  <span>Emitiendo certificados...</span>
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" />
                  <span>Emitir {tallerActual?.pendientesEmision || 0} pendientes en lote</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
