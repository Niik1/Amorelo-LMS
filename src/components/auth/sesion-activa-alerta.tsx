"use client";

import Image from "next/image";
import { AlertCircle, Laptop, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SesionActivaAlertaProps {
  sesionPrevia: {
    dispositivo: string;
    navegador: string;
    iniciadaEn: string;
  };
  cargando: boolean;
  error?: string | null;
  onConfirmarExpulsion: () => void;
  onCancelar: () => void;
}

export function SesionActivaAlerta({
  sesionPrevia,
  cargando,
  error,
  onConfirmarExpulsion,
  onCancelar,
}: SesionActivaAlertaProps) {
  return (
    <div className="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 dark:bg-[#0D1A4F]">
      <div className="mx-auto w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex justify-center mb-5">
          <div className="relative size-14 sm:size-16 transition-transform duration-300 hover:scale-105">
            <Image
              src="/images/logos/logo-A.svg"
              alt="Amorelo"
              width={64}
              height={64}
              priority
              className="h-full w-full object-contain drop-shadow-sm dark:hidden"
            />
            <Image
              src="/images/logo/logoA.svg"
              alt="Amorelo"
              width={64}
              height={64}
              priority
              className="hidden h-full w-full object-contain drop-shadow-sm dark:block"
            />
          </div>
        </div>

        {/* Icono de Alerta de Seguridad */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 dark:bg-amber-400/10 dark:text-amber-400">
          <ShieldAlert className="h-8 w-8" />
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm font-medium text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Sesión activa detectada
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-blue-200/80">
            Ya tienes una sesión abierta en otro equipo:
          </p>

          <div className="mt-4 inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:border-blue-400/20 dark:bg-[#081033] dark:text-slate-200">
            <Laptop className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>
              {sesionPrevia.dispositivo} · {sesionPrevia.navegador}
            </span>
          </div>

          <p className="mt-4 text-xs leading-normal text-slate-500 dark:text-blue-200/70">
            Por política de seguridad de la plataforma, solo puedes tener una sesión activa a la vez. ¿Deseas cerrar esa sesión anterior para entrar aquí?
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            type="button"
            className="h-12 w-full rounded-xl text-sm sm:text-base font-bold shadow-md transition-all bg-[#1A73E8] hover:bg-[#1557B0] text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            disabled={cargando}
            onClick={onConfirmarExpulsion}
          >
            {cargando ? "Cerrando sesión previa…" : "Sí, cerrar sesión anterior y entrar"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl border-slate-300 dark:border-blue-400/30 dark:bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-blue-900/30 font-semibold"
            disabled={cargando}
            onClick={onCancelar}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
