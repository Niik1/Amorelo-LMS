"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PAISES, type PaisItem, obtenerIsoDePais } from "@/lib/paises/paises";
import { cn } from "@/lib/utils";

export const REGLAS_TELEFONO_PAIS: Record<string, { digitos: number; placeholder: string }> = {
  PE: { digitos: 9, placeholder: "987654321" },
  CO: { digitos: 10, placeholder: "3001234567" },
  MX: { digitos: 10, placeholder: "5512345678" },
  CL: { digitos: 9, placeholder: "912345678" },
  EC: { digitos: 9, placeholder: "991234567" },
  AR: { digitos: 10, placeholder: "1112345678" },
  BO: { digitos: 8, placeholder: "71234567" },
  US: { digitos: 10, placeholder: "2025550123" },
  ES: { digitos: 9, placeholder: "612345678" },
  PA: { digitos: 8, placeholder: "61234567" },
  CR: { digitos: 8, placeholder: "81234567" },
  DO: { digitos: 10, placeholder: "8091234567" },
  UY: { digitos: 8, placeholder: "99123456" },
  PY: { digitos: 9, placeholder: "981123456" },
  GT: { digitos: 8, placeholder: "51234567" },
};

export function obtenerReglaTelefono(codigoIso: string) {
  return REGLAS_TELEFONO_PAIS[codigoIso] || { digitos: 9, placeholder: "987654321" };
}

export function SelectorTelefonoAdmin({
  paisSeleccionado,
  onCambiarPais,
  valorTelefono,
  onCambiarTelefono,
  id,
  hasError,
  className,
}: {
  paisSeleccionado: string;
  onCambiarPais: (codigoIso: string) => void;
  valorTelefono: string;
  onCambiarTelefono: (valor: string) => void;
  id?: string;
  hasError?: boolean;
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);

  const isoActual = obtenerIsoDePais(paisSeleccionado);
  const paisActual =
    PAISES.find((p) => p.codigoIso === isoActual) ?? PAISES[0];
  const regla = obtenerReglaTelefono(isoActual);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo permitir números
    const soloNumeros = e.target.value.replace(/\D/g, "");
    onCambiarTelefono(soloNumeros.slice(0, regla.digitos));
  };

  return (
    <div
      className={cn(
        "flex h-10 w-full rounded-xl border bg-card overflow-hidden transition-colors focus-within:ring-3",
        hasError
          ? "border-destructive focus-within:border-destructive focus-within:ring-destructive/30"
          : "border-input focus-within:ring-ring/30 focus-within:border-primary",
        className
      )}
    >
      {/* Selector de País con Popover en Portal (Cero doble scroll, flota encima del modal) */}
      <Popover open={abierto} onOpenChange={setAbierto}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className="flex h-full items-center gap-1.5 border-r border-input bg-muted/40 px-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
              aria-label="Seleccionar país y código telefónico"
            >
              <span className="text-base leading-none" role="img" aria-label={paisActual.nombre}>
                {paisActual.bandera}
              </span>
              <span className="font-mono font-bold text-foreground text-xs">
                {paisActual.prefijo}
              </span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>
          }
        />

        <PopoverContent
          align="start"
          className="w-64 p-1.5 max-h-64 overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-xl z-50"
        >
          <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Selecciona País
          </div>
          <div className="space-y-0.5 mt-1">
            {PAISES.map((p) => {
              const seleccionado = p.codigoIso === paisSeleccionado;
              return (
                <button
                  key={p.codigoIso}
                  type="button"
                  onClick={() => {
                    onCambiarPais(p.codigoIso);
                    setAbierto(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left",
                    seleccionado
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="text-base leading-none">{p.bandera}</span>
                    <span className="truncate">{p.nombre}</span>
                  </span>
                  <span
                    className={cn(
                      "font-mono text-xs tabular-nums ml-2 shrink-0",
                      seleccionado ? "text-primary-foreground/90 font-bold" : "text-muted-foreground"
                    )}
                  >
                    {p.prefijo}
                  </span>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Input de número telefónico solo números y maxLength dinámico */}
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        maxLength={regla.digitos}
        placeholder={regla.placeholder}
        value={valorTelefono}
        onChange={handleInputChange}
        className="flex-1 h-full bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border-0 font-medium"
      />
    </div>
  );
}
