// Formulario de cupones (crear y editar). Es el cuerpo de un diálogo: la
// cabecera (título y subtítulo) la pone el diálogo, y acá viven los campos con
// scroll propio más el pie fijo con vista previa y acciones.

"use client";

import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  esquemaCupon,
  type EntradaCupon,
} from "@/lib/validators/coupon";
import type { CuponEditable } from "@/lib/cupones/tipos";
import { formatearDescuento } from "@/lib/cupones/vista";
import { actualizarCupon, crearCupon } from "@/server/cupones/acciones";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { cn } from "@/lib/utils";

function aFechaInput(iso: string | null): string {
  return iso ? iso.slice(0, 16) : "";
}

function Error({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return <p className="text-destructive mt-1 text-xs font-semibold">{mensaje}</p>;
}

function Ayuda({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground mt-1.5 text-xs">{children}</p>;
}

function VistaPrevia({
  codigo,
  descuento,
  completa,
}: {
  codigo: string;
  descuento: string;
  completa: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-bold whitespace-nowrap transition-colors",
        completa
          ? "border-blue-500/30 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/20 dark:text-blue-300 shadow-2xs font-mono font-bold"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      <span className="tracking-wide">{codigo}</span>
      <span
        aria-hidden="true"
        className={cn(
          "h-3.5 w-px",
          completa ? "bg-blue-500/30 dark:bg-blue-400/30" : "bg-border",
        )}
      />
      <span className="tabular-nums">{descuento}</span>
    </span>
  );
}

export function CuponForm({
  cupon,
  onExito,
  onCancelar,
}: {
  cupon?: CuponEditable;
  onExito?: () => void;
  onCancelar: () => void;
}) {
  const editando = !!cupon;
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EntradaCupon>({
    resolver: zodResolver(esquemaCupon),
    defaultValues: {
      codigo: cupon?.codigo ?? "",
      tipo_descuento: "porcentaje",
      valor_descuento: cupon ? Number(cupon.valor_descuento) : undefined,
      valido_desde: aFechaInput(cupon?.valido_desde ?? null) || undefined,
      valido_hasta: aFechaInput(cupon?.valido_hasta ?? null) || undefined,
      usos_maximos: cupon?.usos_maximos ?? undefined,
    },
  });

  const codigoVista = (useWatch({ control, name: "codigo" }) ?? "")
    .trim()
    .toUpperCase();
  const valorVista = Number(useWatch({ control, name: "valor_descuento" }));
  const validoDesde = useWatch({ control, name: "valido_desde" });
  const validoHasta = useWatch({ control, name: "valido_hasta" });
  const tieneValor = Number.isFinite(valorVista) && valorVista > 0;
  const completa = codigoVista.length > 0 && tieneValor;

  // Los cupones históricos de monto fijo no se convierten a porcentaje: el
  // valor cambiaría de significado. Se dejan inactivos y se crea uno nuevo.
  if (cupon && cupon.tipo_descuento !== "porcentaje") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 px-6 py-6">
          <p className="font-semibold">Cupón de monto fijo</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Los cupones ahora solo admiten porcentaje. Este cupón histórico no
            se puede editar: desactivalo y creá uno nuevo.
          </p>
        </div>
        <div className="bg-popover flex shrink-0 justify-end border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onCancelar}
            className="w-full px-5 sm:w-auto"
          >
            Cerrar
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (datos: EntradaCupon) => {
    const r = editando
      ? await actualizarCupon(cupon.id, datos)
      : await crearCupon(datos);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success(editando ? "Cupón actualizado." : "Cupón creado.");
    if (editando) {
      onExito?.();
      return;
    }
    reset({ codigo: "", tipo_descuento: "porcentaje" });
    onExito?.();
  };

  return (
    <form
      onSubmit={handleSubmit(
        (d) => void onSubmit(d),
        () => {
          toast.error("Por favor completa los campos marcados en rojo.");
        }
      )}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <input type="hidden" {...register("tipo_descuento")} />
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Columna 1: Código y Porcentaje */}
          <div className="flex flex-col gap-6">
            <div>
              <Label htmlFor="codigo" className="mb-2 block text-xs font-bold text-heading">
                Código del Cupón *
              </Label>
              <Input
                id="codigo"
                placeholder="LIVE60"
                autoComplete="off"
                className={cn(
                  "uppercase font-mono font-bold tracking-wider",
                  errors.codigo && "border-destructive focus-visible:ring-destructive/30"
                )}
                aria-invalid={Boolean(errors.codigo)}
                {...register("codigo")}
              />
              <Ayuda>Mayúsculas, sin espacios. Ej. LIVE60 (mínimo 3 caracteres).</Ayuda>
              <Error mensaje={errors.codigo?.message} />
            </div>
            <div>
              <Label htmlFor="valor" className="mb-2 block text-xs font-bold text-heading">
                Porcentaje de descuento (%) *
              </Label>
              <Input
                id="valor"
                type="number"
                min="1"
                max="100"
                step="any"
                placeholder="30"
                className={cn(
                  "font-bold tabular-nums",
                  errors.valor_descuento && "border-destructive focus-visible:ring-destructive/30"
                )}
                aria-invalid={Boolean(errors.valor_descuento)}
                {...register("valor_descuento")}
              />
              <Ayuda>Entre 1 y 100. Solo se permiten porcentajes.</Ayuda>
              <Error mensaje={errors.valor_descuento?.message} />
            </div>
          </div>

          {/* Columna 2: Límite de Usos y Vigencia */}
          <div className="flex flex-col gap-6">
            <div>
              <Label htmlFor="usos" className="mb-2 block text-xs font-bold text-heading">
                Límite de usos (opcional)
              </Label>
              <Input
                id="usos"
                type="number"
                min="1"
                step="1"
                placeholder="100"
                className={cn(
                  errors.usos_maximos && "border-destructive focus-visible:ring-destructive/30"
                )}
                aria-invalid={Boolean(errors.usos_maximos)}
                {...register("usos_maximos")}
              />
              <Ayuda>Vacío = usos ilimitados.</Ayuda>
              <Error mensaje={errors.usos_maximos?.message} />
            </div>
            <div>
              <Label htmlFor="desde" className="mb-2 block text-xs font-bold text-heading">
                Válido desde (opcional)
              </Label>
              <DateTimePicker
                id="desde"
                value={validoDesde}
                onChange={(val) => setValue("valido_desde", val || undefined, { shouldValidate: true })}
                placeholder="Sin fecha de inicio..."
                className={cn(errors.valido_desde && "border-destructive focus-visible:ring-destructive/30")}
              />
              <Ayuda>Vacío = sin fecha de inicio.</Ayuda>
              <Error mensaje={errors.valido_desde?.message} />
            </div>
            <div>
              <Label htmlFor="hasta" className="mb-2 block text-xs font-bold text-heading">
                Válido hasta (opcional)
              </Label>
              <DateTimePicker
                id="hasta"
                value={validoHasta}
                onChange={(val) => setValue("valido_hasta", val || undefined, { shouldValidate: true })}
                placeholder="Sin fecha de fin..."
                className={cn(errors.valido_hasta && "border-destructive focus-visible:ring-destructive/30")}
              />
              <Ayuda>Vacío = sin fecha de fin.</Ayuda>
              <Error mensaje={errors.valido_hasta?.message} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card flex shrink-0 flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground text-xs sm:text-[13px] font-semibold">
            Vista previa:
          </span>
          <VistaPrevia
            codigo={codigoVista || "CÓDIGO"}
            descuento={
              tieneValor
                ? `${formatearDescuento("porcentaje", valorVista)} OFF`
                : "— OFF"
            }
            completa={completa}
          />
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onCancelar}
            className="w-full sm:w-auto rounded-xl font-bold cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full sm:w-auto rounded-xl font-bold bg-[#1e3a8a] text-white hover:bg-[#1e3a8a]/90 cursor-pointer shadow-md"
          >
            {isSubmitting
              ? editando
                ? "Guardando…"
                : "Creando…"
              : editando
                ? "Guardar cambios"
                : "Crear cupón"}
          </Button>
        </div>
      </div>
    </form>
  );
}
