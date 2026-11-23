"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertCircle, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MfaDesafioFormProps {
  codigoMfa: string;
  setCodigoMfa: (code: string) => void;
  cargando: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onVolver: () => void;
}

export function MfaDesafioForm({
  codigoMfa,
  setCodigoMfa,
  cargando,
  error,
  onSubmit,
  onVolver,
}: MfaDesafioFormProps) {
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigoMfa.trim().length < 6) {
      setErrorLocal("El código debe contener exactamente 6 dígitos.");
      toast.error("Ingresa el código de 6 dígitos de tu aplicación.");
      return;
    }
    setErrorLocal(null);
    onSubmit(e);
  };
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

        {/* Icono Candado */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
          <Lock className="h-7 w-7" />
        </div>

        <div className="mt-4 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Verificación en dos pasos
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-blue-200/80">
            Ingresa el código de 6 dígitos de tu aplicación de autenticación (Google Authenticator).
          </p>
        </div>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm font-medium text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
          <div>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              placeholder="000000"
              className={cn(
                "h-14 text-center text-3xl font-mono tracking-[0.35em] rounded-xl bg-slate-50/80 text-slate-900 border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-[#081033] dark:border-blue-400/25 dark:text-white dark:focus-visible:ring-blue-400",
                (error || errorLocal) && "border-destructive focus-visible:ring-destructive/30"
              )}
              aria-invalid={Boolean(error || errorLocal)}
              value={codigoMfa}
              onChange={(e) => {
                setCodigoMfa(e.target.value.replace(/\D/g, ""));
                if (errorLocal) setErrorLocal(null);
              }}
            />
            {errorLocal && (
              <p className="mt-1.5 text-center text-xs font-semibold text-destructive">{errorLocal}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={cargando || codigoMfa.length < 6}
            className="mt-2 h-12 w-full rounded-xl text-base font-bold shadow-md transition-all bg-[#1A73E8] hover:bg-[#1557B0] text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 dark:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          >
            {cargando ? "Verificando…" : "Verificar y entrar"}
          </Button>

          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={onVolver}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-blue-300/80 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver a ingresar credenciales
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
