// Componente contenedor reutilizable para Tablas en el Panel Admin y módulos del sistema.
// Estandariza la tarjeta contenedora, cabecera con contador, estado vacío y paginación.

"use client";

import { type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PaginacionConfig {
  paginaActual: number;
  totalPaginas: number;
  onCambiarPagina: (nuevaPagina: number) => void;
}

export interface TablaContenedorCardProps {
  titulo: string;
  totalRegistros?: number;
  registrosFiltrados?: number;
  accionesHeader?: ReactNode;
  estaVacio?: boolean;
  iconoVacio?: LucideIcon;
  mensajeVacio?: string;
  submensajeVacio?: string;
  accionVacio?: ReactNode;
  paginacion?: PaginacionConfig;
  children: ReactNode;
  className?: string;
}

export function TablaContenedorCard({
  titulo,
  totalRegistros,
  registrosFiltrados,
  accionesHeader,
  estaVacio = false,
  iconoVacio: IconoVacio,
  mensajeVacio = "No se encontraron registros.",
  submensajeVacio,
  accionVacio,
  paginacion,
  children,
  className,
}: TablaContenedorCardProps) {
  const mostrarConteo =
    registrosFiltrados !== undefined && totalRegistros !== undefined;

  return (
    <Card className={cn("gap-0 py-0 overflow-hidden shadow-xs", className)}>
      {/* Cabecera Interna Estandarizada */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6 border-b border-border/60 bg-card">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-bold text-heading">{titulo}</h2>
          {mostrarConteo && (
            <span
              aria-live="polite"
              className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium tabular-nums"
            >
              Mostrando {registrosFiltrados} de {totalRegistros}
            </span>
          )}
        </div>

        {accionesHeader && (
          <div className="flex items-center gap-2">{accionesHeader}</div>
        )}
      </div>

      {/* Contenido: Estado Vacío o Tabla */}
      {estaVacio ? (
        <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
          {IconoVacio && <IconoVacio className="size-9 opacity-40 mb-1" />}
          <p className="text-sm font-semibold text-foreground">{mensajeVacio}</p>
          {submensajeVacio && (
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {submensajeVacio}
            </p>
          )}
          {accionVacio && <div className="mt-2">{accionVacio}</div>}
        </div>
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}

      {/* Paginación Inferior Opcional */}
      {paginacion && paginacion.totalPaginas > 1 && !estaVacio && (
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/20 text-xs">
          <span className="text-muted-foreground">
            Página <strong>{paginacion.paginaActual}</strong> de{" "}
            <strong>{paginacion.totalPaginas}</strong>
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={paginacion.paginaActual === 1}
              onClick={() => paginacion.onCambiarPagina(Math.max(1, paginacion.paginaActual - 1))}
              className="h-8 rounded-full px-3 text-xs font-semibold cursor-pointer"
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={paginacion.paginaActual >= paginacion.totalPaginas}
              onClick={() =>
                paginacion.onCambiarPagina(
                  Math.min(paginacion.totalPaginas, paginacion.paginaActual + 1)
                )
              }
              className="h-8 rounded-full px-3 text-xs font-semibold cursor-pointer"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
