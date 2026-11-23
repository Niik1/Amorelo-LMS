"use client";

import { useState, useTransition } from "react";
import { Sparkles, Edit3, Loader2, Megaphone, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { EntradaMensajeBanner } from "@/lib/validators/configuracion";
import { guardarMensajeBannerAction } from "@/server/configuracion/acciones";
import { cn } from "@/lib/utils";

interface AdminMensajeBannerHeroProps {
  mensajeInicial: EntradaMensajeBanner;
}

export function AdminMensajeBannerHero({
  mensajeInicial,
}: AdminMensajeBannerHeroProps) {
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState(mensajeInicial.mensaje);
  const [autor, setAutor] = useState(mensajeInicial.autor || "Brayan Rodriguez");
  const [activo, setActivo] = useState(mensajeInicial.activo ?? true);
  const [actual, setActual] = useState<EntradaMensajeBanner>(mensajeInicial);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGuardar = () => {
    if (!mensaje.trim()) {
      setErrorMensaje("Por favor, ingresa un mensaje para las alumnas.");
      toast.error("Por favor, ingresa un mensaje.");
      return;
    }

    setErrorMensaje(null);
    startTransition(async () => {
      const res = await guardarMensajeBannerAction({
        mensaje: mensaje.trim(),
        autor: autor.trim() || "Brayan Rodriguez",
        activo,
      });

      if (res.ok) {
        setActual({
          mensaje: mensaje.trim(),
          autor: autor.trim() || "Brayan Rodriguez",
          activo,
        });
        toast.success("¡Mensaje del banner actualizado con éxito!");
        setAbierto(false);
      } else {
        toast.error(res.error || "No se pudo guardar el mensaje.");
      }
    });
  };

  const abrirModal = () => {
    setMensaje(actual.mensaje);
    setAutor(actual.autor || "Brayan Rodriguez");
    setActivo(actual.activo ?? true);
    setErrorMensaje(null);
    setAbierto(true);
  };

  return (
    <>
      <div className="relative mt-6 flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-5 text-white shadow-sm backdrop-blur-md transition-all lg:mt-0 lg:max-w-xl shrink-0">
        {/* Cabecera informativa */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-amber-200">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Mensaje a las Alumnas</span>
          </div>
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium ${
              actual.activo
                ? "text-emerald-300"
                : "text-amber-300/80 line-through"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                actual.activo ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            {actual.activo ? "Visible en Aula" : "Pausado"}
          </span>
        </div>

        {/* Vista previa del mensaje completo */}
        <div className="relative z-10 my-3">
          <p className="text-sm font-medium italic leading-relaxed text-blue-50 break-words sm:text-[15px]">
            “{actual.mensaje}”
          </p>
          <p className="mt-1.5 text-right text-xs font-bold text-white/80">
            — {actual.autor}
          </p>
        </div>

        {/* Botón de acción rápida */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-3">
          <p className="text-[11px] text-white/60">
            Permanece fijo hasta que decidas cambiarlo.
          </p>
          <Button
            type="button"
            onClick={abrirModal}
            size="sm"
            className="rounded-full bg-white text-xs font-bold text-[#1e3a8a] shadow hover:bg-slate-100"
          >
            <Edit3 className="mr-1.5 h-3.5 w-3.5" />
            Editar mensaje
          </Button>
        </div>
      </div>

      {/* Modal para editar el mensaje */}
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="sm:max-w-lg dark:bg-slate-950 dark:border-slate-800">
          <DialogHeader className="pr-9 sm:pr-8">
            <div className="mb-1 inline-flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-blue-600 dark:text-amber-400 shrink-0" />
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Mensaje Motivacional / Anuncio
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Escribe el mensaje que verán todas las alumnas al ingresar a su aula
              virtual. Este mensaje se mantendrá visible indefinidamente hasta que
              vuelvas a modificarlo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="mensaje-texto" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Mensaje para las alumnas:
                </Label>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {mensaje.length}/500 caracteres
                </span>
              </div>
              <Textarea
                id="mensaje-texto"
                value={mensaje}
                onChange={(e) => {
                  setMensaje(e.target.value.slice(0, 500));
                  if (errorMensaje) setErrorMensaje(null);
                }}
                rows={4}
                placeholder="Ej. ¡Hola chicas! Que tengan un bendecido día. Recuerden que la práctica hace al maestro... ¡A romperla hoy con los globos! 🎈✨"
                className={cn(
                  "text-sm leading-relaxed bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-blue-500",
                  errorMensaje && "border-destructive focus-visible:ring-destructive/30"
                )}
                aria-invalid={Boolean(errorMensaje)}
                disabled={isPending}
              />
              {errorMensaje && (
                <p className="text-destructive text-xs font-semibold mt-1">
                  {errorMensaje}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mensaje-autor" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Firma o autor:
              </Label>
              <Input
                id="mensaje-autor"
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
                placeholder="Brayan Rodriguez"
                className="text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-blue-500"
                disabled={isPending}
              />
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
              <Checkbox
                id="mensaje-activo"
                checked={activo}
                onCheckedChange={(checked) => setActivo(Boolean(checked))}
                disabled={isPending}
                className="dark:border-slate-600 data-[state=checked]:dark:bg-blue-600 data-[state=checked]:dark:border-blue-600"
              />
              <div className="grid gap-0.5 leading-none">
                <Label
                  htmlFor="mensaje-activo"
                  className="cursor-pointer text-xs font-bold text-slate-900 dark:text-white"
                >
                  Mostrar este mensaje a las alumnas
                </Label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Si lo desmarcas, el mensaje se ocultará en el aula virtual sin borrarse.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAbierto(false)}
              disabled={isPending}
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleGuardar}
              disabled={isPending}
              className="font-bold bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white shadow-md dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Guardar y Publicar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
