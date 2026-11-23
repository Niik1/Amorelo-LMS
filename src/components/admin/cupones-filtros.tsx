// Barra de filtros del módulo de cupones. Controlada: el estado vive en la
// tabla, acá solo se dibuja y se avisa cada cambio.

"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  hayFiltros,
  type Filtros,
} from "@/lib/cupones/vista";

const ESTADOS = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "activos", etiqueta: "Activos" },
  { valor: "inactivos", etiqueta: "Inactivos" },
] as const;

const VIGENCIAS: { valor: Filtros["vigencia"]; etiqueta: string }[] = [
  { valor: "cualquiera", etiqueta: "Cualquiera" },
  { valor: "vigentes", etiqueta: "Vigentes" },
  { valor: "vencidos", etiqueta: "Vencidos" },
  { valor: "sin_fecha", etiqueta: "Sin fecha" },
];

const USOS: { valor: Filtros["usos"]; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "con_limite", etiqueta: "Con límite" },
  { valor: "sin_limite", etiqueta: "Sin límite" },
  { valor: "agotados", etiqueta: "Agotados" },
];

function CampoSelect<T extends string>({
  id,
  etiqueta,
  valor,
  opciones,
  onCambio,
}: {
  id: string;
  etiqueta: string;
  valor: T;
  opciones: { valor: T; etiqueta: string }[];
  onCambio: (nuevo: T) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id} className="text-[13px] font-medium">
        {etiqueta}
      </Label>
      <Select
        value={valor}
        items={opciones.map((o) => ({ value: o.valor, label: o.etiqueta }))}
        onValueChange={(v) => onCambio(v as T)}
      >
        <SelectTrigger
          id={id}
          className="h-10 w-full rounded-xl border-border bg-card"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opciones.map((o) => (
            <SelectItem key={o.valor} value={o.valor}>
              {o.etiqueta}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function CuponesFiltros({
  valor,
  conteos,
  onCambio,
  onLimpiar,
}: {
  valor: Filtros;
  conteos: { todos: number; activos: number; inactivos: number };
  onCambio: <K extends keyof Filtros>(campo: K, nuevo: Filtros[K]) => void;
  onLimpiar: () => void;
}) {
  const limpiable = hayFiltros(valor);

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-col gap-5 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative w-full lg:max-w-md">
            <Search
              aria-hidden="true"
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              type="search"
              value={valor.q}
              onChange={(e) => onCambio("q", e.target.value)}
              placeholder="Buscar por código…"
              aria-label="Buscar cupón por código"
              className="h-10 rounded-xl border-border bg-card pr-3 pl-9"
            />
          </div>

          <div
            role="group"
            aria-label="Filtrar por estado"
            className="flex flex-wrap items-center gap-2"
          >
            {ESTADOS.map((e) => {
              const activo = valor.estado === e.valor;
              return (
                <button
                  key={e.valor}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => onCambio("estado", e.valor)}
                  className={cn(
                    "focus-visible:ring-ring/30 inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-3",
                    activo
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-muted",
                  )}
                >
                  {e.etiqueta}
                  <span
                    className={cn(
                      "tabular-nums",
                      activo ? "text-primary-foreground/80" : "text-muted-foreground",
                    )}
                  >
                    ({conteos[e.valor]})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[repeat(2,minmax(0,1fr))_auto] xl:items-end">
          <CampoSelect
            id="filtro-vigencia"
            etiqueta="Vigencia"
            valor={valor.vigencia}
            opciones={VIGENCIAS}
            onCambio={(v) => onCambio("vigencia", v)}
          />
          <CampoSelect
            id="filtro-usos"
            etiqueta="Usos"
            valor={valor.usos}
            opciones={USOS}
            onCambio={(v) => onCambio("usos", v)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!limpiable}
            onClick={onLimpiar}
            className="text-muted-foreground hover:text-foreground h-10 justify-self-start px-3 disabled:opacity-70 sm:col-span-2 xl:col-span-1 xl:justify-self-auto"
          >
            Limpiar filtros
          </Button>
        </div>
      </div>
    </Card>
  );
}
