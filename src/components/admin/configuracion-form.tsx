// Formulario de configuración del negocio. Por ahora edita el tipo de cambio,
// que es una referencia para el precio en dólares: no entra en el cálculo de
// los precios ni modifica el precio en soles.

"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatearMoneda } from "@/lib/precios/calculo";
import {
  esquemaTipoCambio,
  type EntradaTipoCambio,
} from "@/lib/validators/configuracion";
import { actualizarTipoCambio } from "@/server/configuracion/acciones";

function Error({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return <p className="text-destructive mt-1 text-xs font-semibold">{mensaje}</p>;
}

function Ayuda({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground mt-1.5 text-xs">{children}</p>;
}

export function ConfiguracionForm({
  tipoCambio,
  precioUsd,
}: {
  tipoCambio: number;
  precioUsd: number | null;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EntradaTipoCambio>({
    resolver: zodResolver(esquemaTipoCambio),
    defaultValues: { tipo_cambio: tipoCambio },
  });

  const crudo = useWatch({ control, name: "tipo_cambio" });
  const valor = Number(crudo);
  const referencia =
    precioUsd !== null && Number.isFinite(valor) && valor > 0
      ? precioUsd * valor
      : null;

  const onSubmit = async (datos: EntradaTipoCambio) => {
    const r = await actualizarTipoCambio(datos);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success("Tipo de cambio actualizado.");
  };

  return (
    <form
      onSubmit={handleSubmit((d) => void onSubmit(d))}
      noValidate
      className="w-full max-w-2xl"
    >
      <Card className="gap-0 py-0">
        <CardHeader className="border-b px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="bg-muted text-muted-foreground flex size-11 shrink-0 items-center justify-center rounded-2xl">
              <Calculator aria-hidden="true" className="size-5" />
            </span>
            <div>
              <CardTitle className="text-lg font-bold">Tipo de cambio</CardTitle>
              <CardDescription className="mt-0.5">
                Referencia para el precio en dólares. No modifica el precio en
                soles ni el precio en dólares.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-5 px-6 py-6">
          <div>
            <Label htmlFor="tipo_cambio" className="mb-2 block">
              Soles por dólar
            </Label>
            <Input
              id="tipo_cambio"
              type="number"
              min="0.0001"
              step="0.0001"
              inputMode="decimal"
              className="max-w-48 tabular-nums"
              {...register("tipo_cambio")}
            />
            <Ayuda>Ejemplo: 3.43. Se usa solo como referencia en el panel.</Ayuda>
            <Error mensaje={errors.tipo_cambio?.message} />
          </div>

          <div className="bg-muted/40 rounded-2xl border p-4">
            <p className="text-muted-foreground text-[11px] font-bold tracking-[0.14em] uppercase">
              Referencia
            </p>
            {precioUsd === null ? (
              <p className="text-muted-foreground mt-1 text-sm">
                El curso no tiene precio en dólares.
              </p>
            ) : referencia === null ? (
              <p className="text-muted-foreground mt-1 text-sm">
                Ingresá un tipo de cambio válido.
              </p>
            ) : (
              <>
                <p className="mt-1 text-sm">
                  {formatearMoneda(precioUsd, "USD")} × {valor} ={" "}
                  <span className="text-xl font-extrabold tabular-nums">
                    {formatearMoneda(referencia, "PEN")}
                  </span>
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Solo referencia: el precio en dólares se cobra tal cual, sin
                  convertir.
                </p>
              </>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-xs">
            Se guarda en la configuración del negocio.
          </p>
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full rounded-full px-6 sm:w-auto"
          >
            {isSubmitting ? "Guardando…" : "Guardar"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
