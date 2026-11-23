"use client";

import * as React from "react";
import { Loader2, ImageIcon, FileText, UploadCloud } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface CargaMultimediaOverlayProps {
  cargando: boolean;
  progreso?: number; // 0 a 100. Si es undefined, muestra animación continua / indeterminate
  mensaje?: string;
  tipo?: "imagen" | "pdf";
  className?: string;
}

export function CargaMultimediaOverlay({
  cargando,
  progreso,
  mensaje = "Cargando archivo...",
  tipo = "imagen",
  className,
}: CargaMultimediaOverlayProps) {
  if (!cargando) return null;

  const tieneProgreso = typeof progreso === "number" && !isNaN(progreso);
  const porcentaje = tieneProgreso ? Math.min(Math.max(Math.round(progreso), 0), 100) : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center select-none",
        "bg-background/85 backdrop-blur-xs animate-in fade-in-50 duration-200",
        className
      )}
    >
      <div className="flex flex-col items-center gap-2.5 max-w-[240px] w-full">
        {/* Icono con animación */}
        <div className="relative flex items-center justify-center">
          <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
            {tipo === "pdf" ? (
              <FileText className="size-5 animate-pulse" />
            ) : tieneProgreso ? (
              <UploadCloud className="size-5 animate-bounce" />
            ) : (
              <ImageIcon className="size-5 animate-pulse" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5 shadow-xs">
            <Loader2 className="size-3.5 animate-spin text-primary" />
          </div>
        </div>

        {/* Mensaje de Estado */}
        <div className="space-y-1 w-full">
          <p className="text-xs font-bold text-foreground leading-snug line-clamp-2">
            {mensaje}
          </p>

          {/* Barra de Progreso y Porcentaje si aplica */}
          {tieneProgreso ? (
            <div className="space-y-1.5 pt-1 w-full">
              <Progress value={porcentaje!} className="h-1.5 w-full bg-muted shadow-inner" />
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <span className="tracking-tight">Progreso</span>
                <span className="font-mono text-primary font-bold">{porcentaje}%</span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">Por favor espera un momento...</p>
          )}
        </div>
      </div>
    </div>
  );
}
