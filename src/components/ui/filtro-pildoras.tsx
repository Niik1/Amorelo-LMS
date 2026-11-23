// Componente reutilizable de Filtro por Píldoras para el Panel Admin y Aula Virtual.
// Mantiene consistencia total en botones de píldora interactivos (Estados, Períodos de fecha, etc.)

"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface OpcionPildora {
  id: string;
  label: string;
  conteo?: number;
}

export interface FiltroPildorasProps {
  etiqueta?: string;
  opciones: readonly OpcionPildora[] | OpcionPildora[];
  valorActual: string;
  onCambio: (nuevoValor: string) => void;
  ariaLabel?: string;
  className?: string;
}

export function FiltroPildoras({
  etiqueta,
  opciones,
  valorActual,
  onCambio,
  ariaLabel,
  className,
}: FiltroPildorasProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {etiqueta && (
        <Label className="text-[13px] font-medium text-foreground">
          {etiqueta}
        </Label>
      )}

      <div
        role="group"
        aria-label={ariaLabel ?? etiqueta ?? "Filtro de opciones"}
        className="flex flex-wrap items-center gap-2"
      >
        {opciones.map((opcion) => {
          const activo = valorActual === opcion.id;

          return (
            <button
              key={opcion.id}
              type="button"
              aria-pressed={activo}
              onClick={() => onCambio(opcion.id)}
              className={cn(
                "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/30 cursor-pointer",
                activo
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "border-border bg-card hover:bg-muted text-foreground"
              )}
            >
              <span>{opcion.label}</span>
              {opcion.conteo !== undefined && (
                <span
                  className={cn(
                    "tabular-nums text-xs",
                    activo ? "text-primary-foreground/80 font-medium" : "text-muted-foreground font-normal"
                  )}
                >
                  ({opcion.conteo})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
