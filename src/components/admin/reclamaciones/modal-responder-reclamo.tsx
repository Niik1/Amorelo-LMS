// Modal para registrar la respuesta oficial del proveedor al reclamo o queja.
// Formato horizontal en 2 columnas idéntico a Cursos: CERO scroll en Desktop y adaptativo en Mobile.
// Ejecuta el RPC seguro `responder_reclamo` y sella la atención legal con trazabilidad.

"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Clock,
  FileText,
  Loader2,
  Send,
  User,
} from "lucide-react";
import {
  type ItemReclamoAdmin,
  responderReclamoAdminAction,
} from "@/server/reclamos/acciones-admin";
import { cn } from "@/lib/utils";

interface ModalResponderReclamoProps {
  reclamo: ItemReclamoAdmin | null;
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  onRespuestaExitosa: () => void;
}

export function ModalResponderReclamo({
  reclamo,
  abierto,
  onOpenChange,
  onRespuestaExitosa,
}: ModalResponderReclamoProps) {
  const [respuesta, setRespuesta] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  if (!reclamo) return null;

  const handleOpenChange = (abiertoNuevo: boolean) => {
    if (!abiertoNuevo) {
      setError(null);
    }
    onOpenChange(abiertoNuevo);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!respuesta.trim()) {
      setError("Ingresa la respuesta oficial del proveedor.");
      toast.error("Por favor completa los campos marcados en rojo.");
      return;
    }

    if (respuesta.trim().length < 10) {
      setError("La respuesta debe tener al menos 10 caracteres fundamentados.");
      toast.error("La respuesta debe tener al menos 10 caracteres fundamentados.");
      return;
    }

    setError(null);
    setCargando(true);
    try {
      const res = await responderReclamoAdminAction({
        reclamoId: reclamo.id,
        respuesta: respuesta.trim(),
      });

      if (!res.ok) {
        toast.error(res.error || "No se pudo registrar la respuesta.");
        return;
      }

      toast.success(`Respuesta registrada con éxito para la hoja ${reclamo.numero}.`);
      setRespuesta("");
      setError(null);
      onOpenChange(false);
      onRespuestaExitosa();
    } catch {
      toast.error("Ocurrió un error inesperado al enviar la respuesta.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[96vw] max-w-4xl sm:max-w-4xl lg:max-w-5xl p-0 gap-0 overflow-hidden flex flex-col h-[94vh] lg:h-auto lg:max-h-[90vh] bg-card border-border shadow-2xl">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col h-full lg:h-auto overflow-hidden">
          {/* Cabecera Fija — Estándar Cursos */}
          <DialogHeader className="shrink-0 border-b border-border px-6 py-4 sm:py-5 bg-card">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-icon-accent mb-1 pr-10">
              <Send className="size-4 text-primary dark:text-blue-400" />
              <span className="text-primary dark:text-blue-400">Resolución Oficial INDECOPI</span>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-black text-heading tracking-tight flex items-center justify-between gap-3">
              <span>Responder Reclamación: {reclamo.numero}</span>
              <Badge
                variant="outline"
                className={cn(
                  "font-bold text-xs px-3 py-1",
                  reclamo.tipo === "reclamo"
                    ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                )}
              >
                {reclamo.tipo === "reclamo" ? "RECLAMO" : "QUEJA"}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Pronunciamiento formal y definitivo del proveedor. La respuesta quedará registrada de forma inmutable.
            </DialogDescription>
          </DialogHeader>

          {/* Cuerpo en 2 Columnas: Scrolleable solo en Mobile (< lg), CERO scroll en Desktop (lg) */}
          <div className="flex-1 overflow-y-auto lg:overflow-visible grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 sm:p-6 bg-card">
            {/* Columna Izquierda (5 cols): Resumen del Caso y Pedido del Consumidor */}
            <div className="lg:col-span-5 flex flex-col gap-3.5">
              <div className="rounded-xl border border-border/80 bg-muted/20 dark:bg-slate-900/40 p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-3 text-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary dark:text-blue-400 flex items-center gap-1.5 border-b border-border/60 pb-2">
                    <User className="size-3.5" />
                    <span>Datos del Consumidor</span>
                  </span>

                  <div>
                    <span className="text-muted-foreground block text-[11px]">Consumidor:</span>
                    <strong className="text-foreground text-sm font-bold">{reclamo.nombreCompleto}</strong>
                    <span className="text-muted-foreground block text-[11px] font-mono mt-0.5">
                      {reclamo.tipoDocumento}: {reclamo.numeroDocumento}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[11px]">Bien Reclamado:</span>
                    <p className="font-semibold text-foreground text-xs leading-snug">
                      {reclamo.descripcionBien}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/40">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                      Pedido Concreto del Cliente:
                    </span>
                    <div className="rounded-lg bg-primary/5 p-2.5 text-foreground italic text-xs leading-relaxed border border-primary/20">
                      "{reclamo.pedidoConsumidor}"
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 text-xs">
                  <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                    <Clock className="size-3" />
                    <span>Plazo Legal:</span>
                    <strong className="text-foreground ml-1">15 días hábiles</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Columna Derecha (7 cols): Textarea de Respuesta Oficial y Advertencia */}
            <div className="lg:col-span-7 flex flex-col gap-3.5 justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="texto-respuesta" className="text-xs font-bold text-foreground">
                    Respuesta Oficial y Fundamentos del Proveedor *
                  </Label>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {respuesta.length} caracteres (mínimo 10)
                  </span>
                </div>

                <Textarea
                  id="texto-respuesta"
                  rows={7}
                  disabled={cargando}
                  value={respuesta}
                  onChange={(e) => {
                    setRespuesta(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Detalla aquí la respuesta formal de Amorelo, explicando las acciones adoptadas, la resolución otorgada al cliente o las aclaraciones pertinentes conforme a INDECOPI..."
                  className={cn(
                    "resize-none text-xs sm:text-sm bg-background border-border text-foreground leading-relaxed",
                    error && "border-destructive focus-visible:ring-destructive/30"
                  )}
                  aria-invalid={Boolean(error)}
                />
                {error && (
                  <p className="text-destructive text-xs font-semibold mt-1">
                    {error}
                  </p>
                )}
              </div>

              {/* Advertencia Legal */}
              <div className="flex items-start gap-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  <strong>Aviso legal:</strong> Al registrar esta respuesta, el estado de la hoja cambiará a <strong>Respondido</strong> con sello de fecha y usuario administrador.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Fijo — Idéntico a Cursos */}
          <DialogFooter className="shrink-0 border-t border-border px-6 py-4 bg-muted/30 flex flex-col sm:flex-row items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={cargando}
              onClick={() => onOpenChange(false)}
              className="rounded-full text-xs font-semibold h-10 px-5 cursor-pointer"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={cargando}
              className="rounded-full bg-[#1e3a8a] hover:bg-[#152e6f] text-white text-xs font-bold h-10 px-5 gap-2 cursor-pointer shadow-sm"
            >
              {cargando ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Registrando respuesta...</span>
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  <span>Registrar Respuesta Oficial</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
