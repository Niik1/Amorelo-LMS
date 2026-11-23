// Modal de visualización detallada de Hoja de Reclamación (Formato Oficial INDECOPI).
// Estructura en columnas idéntica a los modales de Cursos: CERO scroll en Desktop y adaptativo en Mobile.
// Soporte completo para Modo Claro y Modo Oscuro con tokens del sistema.

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  MapPin,
  MessageSquareWarning,
  Phone,
  Printer,
  Send,
  ShieldAlert,
  User,
} from "lucide-react";
import { type ItemReclamoAdmin } from "@/server/reclamos/acciones-admin";
import { cn } from "@/lib/utils";

interface ModalDetalleReclamoProps {
  reclamo: ItemReclamoAdmin | null;
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  onAbrirResponder?: (reclamo: ItemReclamoAdmin) => void;
}

export function ModalDetalleReclamo({
  reclamo,
  abierto,
  onOpenChange,
  onAbrirResponder,
}: ModalDetalleReclamoProps) {
  if (!reclamo) return null;

  const esPendiente = reclamo.estado === "pendiente" || reclamo.estado === "en_proceso";
  const esReclamo = reclamo.tipo === "reclamo";

  const formatearFecha = (fechaStr: string | null) => {
    if (!fechaStr) return "-";
    try {
      const d = new Date(fechaStr);
      return new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return fechaStr;
    }
  };

  // Cálculo de SLA
  const calcularSla = (fechaLimiteStr: string, respondido: boolean) => {
    if (respondido) return { dias: 0, estado: "respondido" as const };
    try {
      const ahora = new Date().getTime();
      const limite = new Date(fechaLimiteStr).getTime();
      const diffMs = limite - ahora;
      const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDias < 0) return { dias: Math.abs(diffDias), estado: "vencido" as const };
      if (diffDias <= 5) return { dias: diffDias, estado: "por_vencer" as const };
      return { dias: diffDias, estado: "en_plazo" as const };
    } catch {
      return { dias: 0, estado: "en_plazo" as const };
    }
  };

  const sla = calcularSla(reclamo.fechaLimiteRespuesta, !esPendiente);

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[1440px] sm:max-w-7xl 2xl:max-w-[1480px] p-0 gap-0 overflow-hidden flex flex-col h-[94vh] lg:h-auto lg:max-h-[92vh] bg-card border-border shadow-2xl">
        {/* Cabecera Fija — Idéntica a Cursos */}
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 sm:py-5 bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 pr-10">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-icon-accent mb-1">
                <MessageSquareWarning className="size-4 text-primary dark:text-blue-400" />
                <span className="text-primary dark:text-blue-400">Libro de Reclamaciones Virtual</span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black text-heading tracking-tight flex items-center gap-2">
                <span>Hoja de Reclamación:</span>
                <span className="font-mono text-primary dark:text-blue-400">{reclamo.numero}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Conforme a las disposiciones del Código de Protección y Defensa del Consumidor (Ley N° 29571).
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "font-bold text-xs px-3 py-1",
                  esReclamo
                    ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                )}
              >
                {esReclamo ? "RECLAMO" : "QUEJA"}
              </Badge>

              <Badge
                variant="outline"
                className={cn(
                  "font-bold text-xs px-3 py-1",
                  esPendiente
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                )}
              >
                {reclamo.estado.toUpperCase()}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Cuerpo en 2 Columnas: Scrolleable solo en Mobile (< lg), CERO scroll en Desktop (lg) */}
        <div className="flex-1 overflow-y-auto lg:overflow-visible grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 sm:p-6 bg-card">
          {/* Columna Principal Izquierda (7 columnas): Secciones 1, 2 y 3 */}
          <div className="lg:col-span-7 flex flex-col gap-3.5">
            {/* 1. Identificación del Consumidor */}
            <div className="rounded-xl border border-border/80 bg-muted/20 dark:bg-slate-900/40 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-primary dark:text-blue-400 flex items-center gap-1.5">
                  <User className="size-3.5" />
                  <span>1. Identificación del Consumidor Reclamante</span>
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {reclamo.tipoDocumento}: <strong>{reclamo.numeroDocumento}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Nombres y Apellidos:</span>
                  <strong className="text-foreground text-sm font-bold">{reclamo.nombreCompleto}</strong>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Correo Electrónico:</span>
                  <span className="text-foreground font-medium flex items-center gap-1 truncate">
                    <Mail className="size-3 text-muted-foreground shrink-0" />
                    <span>{reclamo.correo}</span>
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Teléfono de Contacto:</span>
                  <span className="text-foreground font-medium flex items-center gap-1">
                    <Phone className="size-3 text-muted-foreground shrink-0" />
                    <span>{reclamo.telefono || "No especificado"}</span>
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Domicilio Registrado:</span>
                  <span className="text-foreground font-medium flex items-center gap-1 truncate" title={reclamo.domicilio}>
                    <MapPin className="size-3 text-muted-foreground shrink-0" />
                    <span>{reclamo.domicilio}</span>
                  </span>
                </div>
              </div>

              {reclamo.esMenorEdad && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="size-3 shrink-0" />
                  <span>Menor de edad. Representante: <strong>{reclamo.representanteNombre}</strong> ({reclamo.representanteDocumento})</span>
                </div>
              )}
            </div>

            {/* 2. Identificación del Bien Contratado */}
            <div className="rounded-xl border border-border/80 bg-muted/20 dark:bg-slate-900/40 p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-primary dark:text-blue-400 flex items-center gap-1.5">
                  <FileText className="size-3.5" />
                  <span>2. Identificación del Bien Contratado</span>
                </span>
                <span className="text-xs font-semibold text-foreground">
                  Monto:{" "}
                  {reclamo.montoReclamado !== null
                    ? `${reclamo.moneda || "PEN"} ${Number(reclamo.montoReclamado).toFixed(2)}`
                    : "No especificado"}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <span className="text-muted-foreground text-[11px]">Producto o Servicio:</span>
                  <p className="font-semibold text-foreground">{reclamo.descripcionBien}</p>
                </div>
                <div className="shrink-0">
                  <Badge variant="secondary" className="capitalize text-[11px]">
                    {reclamo.bienContratado}
                  </Badge>
                </div>
              </div>
            </div>

            {/* 3. Detalle de la Reclamación y Pedido */}
            <div className="rounded-xl border border-border/80 bg-muted/20 dark:bg-slate-900/40 p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-primary dark:text-blue-400 flex items-center gap-1.5">
                  <ShieldAlert className="size-3.5" />
                  <span>3. Detalle de la Reclamación y Pedido Concreto</span>
                </span>
                <span className="text-[11px] text-muted-foreground italic">
                  {reclamo.tipo === "reclamo" ? "Disconformidad con el bien" : "Descontento con la atención"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                    Detalle narrado por el consumidor:
                  </span>
                  <div className="rounded-lg bg-background/80 p-2.5 text-foreground leading-relaxed border border-border/60 text-xs">
                    {reclamo.detalle}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                    Pedido concreto solicitado:
                  </span>
                  <div className="rounded-lg bg-primary/5 p-2.5 text-foreground font-medium leading-relaxed border border-primary/20 text-xs">
                    {reclamo.pedidoConsumidor}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Lateral Derecha (5 columnas): Widget de Metadatos y Respuesta Oficial */}
          <div className="lg:col-span-5 flex flex-col gap-3.5">
            {/* Widget Lateral Metadatos y Plazos SLA */}
            <div className="rounded-xl border border-border/80 bg-muted/20 dark:bg-slate-900/40 p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-primary dark:text-blue-400 flex items-center gap-1.5 border-b border-border/60 pb-2">
                <Clock className="size-3.5" />
                <span>Control de Plazos y Trazabilidad SLA</span>
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    <span>Fecha de Registro:</span>
                  </span>
                  <strong className="text-foreground">{formatearFecha(reclamo.creadoEn)}</strong>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    <span>Plazo Límite Legal:</span>
                  </span>
                  <strong className="text-foreground">{formatearFecha(reclamo.fechaLimiteRespuesta)}</strong>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="size-3.5" />
                    <span>Proveedor:</span>
                  </span>
                  <span className="text-foreground font-semibold">Amorelo</span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-muted-foreground font-semibold">Semáforo SLA:</span>
                  {!esPendiente ? (
                    <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1 font-bold">
                      <CheckCircle2 className="size-3" />
                      <span>Atendido</span>
                    </Badge>
                  ) : sla.estado === "vencido" ? (
                    <Badge variant="destructive" className="bg-rose-600 text-white gap-1 font-bold">
                      <AlertCircle className="size-3" />
                      <span>Vencido hace {sla.dias}d</span>
                    </Badge>
                  ) : sla.estado === "por_vencer" ? (
                    <Badge variant="outline" className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 gap-1 font-bold">
                      <Clock className="size-3" />
                      <span>Vence en {sla.dias}d</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1 font-semibold">
                      <span>{sla.dias}d restantes</span>
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Acciones y Respuesta del Proveedor */}
            <div className="rounded-xl border border-border/80 bg-muted/20 dark:bg-slate-900/40 p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary dark:text-blue-400 flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5" />
                    <span>4. Respuesta Oficial del Proveedor</span>
                  </span>
                </div>

                {reclamo.respuesta ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                      <span>Respondido: {formatearFecha(reclamo.respondidoEn)}</span>
                      {reclamo.respuestaEnviadaEn && (
                        <span className="text-emerald-600 font-semibold">Notificación enviada</span>
                      )}
                    </div>
                    <div className="rounded-lg bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 p-3 text-foreground leading-relaxed text-xs">
                      {reclamo.respuesta}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-center space-y-2 text-xs">
                    <p className="font-bold text-amber-700 dark:text-amber-300">
                      Pendiente de Respuesta
                    </p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      El proveedor aún no ha registrado la respuesta formal en el Libro de Reclamaciones.
                    </p>
                  </div>
                )}
              </div>

              {esPendiente && onAbrirResponder && (
                <Button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onAbrirResponder(reclamo);
                  }}
                  className="w-full rounded-full bg-[#1e3a8a] hover:bg-[#152e6f] text-white font-bold text-xs h-10 gap-2 cursor-pointer shadow-sm mt-3"
                >
                  <Send className="size-3.5" />
                  <span>Redactar Respuesta Oficial</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Fijo — Idéntico a Cursos */}
        <DialogFooter className="shrink-0 border-t border-border px-6 py-4 bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              window.open(`/api/reclamaciones/${reclamo.id}/pdf`, "_blank");
            }}
            className="rounded-full text-xs font-semibold gap-2 border-border h-10 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Printer className="size-4 text-primary dark:text-blue-400" />
            <span>Imprimir Hoja Oficial (PDF A4)</span>
          </Button>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full text-xs font-semibold h-10 px-5 cursor-pointer"
            >
              Cerrar
            </Button>

            {esPendiente && onAbrirResponder && (
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onAbrirResponder(reclamo);
                }}
                className="rounded-full bg-[#1e3a8a] hover:bg-[#152e6f] text-white font-bold text-xs h-10 px-5 gap-2 cursor-pointer"
              >
                <Send className="size-3.5" />
                <span>Responder Reclamación</span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
