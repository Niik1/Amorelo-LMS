"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Turnstile } from "@marsidev/react-turnstile";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { solicitarRecuperacionClave } from "@/server/auth/acciones";

interface RecuperarClaveFormProps {
  onVolver: () => void;
  correoInicial?: string;
}

export function RecuperarClaveForm({
  onVolver,
  correoInicial = "",
}: RecuperarClaveFormProps) {
  const [correo, setCorreo] = useState(correoInicial);
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCorreo, setErrorCorreo] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAFWwmHbkuBJ4vo6E";

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorCorreo(null);

    const correoLimpio = correo.trim();
    if (!correoLimpio) {
      setErrorCorreo("Ingresa tu correo electrónico.");
      toast.error("Ingresa tu correo electrónico.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
      setErrorCorreo("Ingresa un correo electrónico válido.");
      toast.error("Ingresa un correo electrónico válido.");
      return;
    }

    setCargando(true);

    try {
      const origin = window.location.origin;
      const res = await solicitarRecuperacionClave(
        correoLimpio,
        origin,
        turnstileToken || undefined
      );

      if (!res.ok) {
        setError(res.mensaje);
        toast.error(res.mensaje || "No se pudo procesar tu solicitud.");
        setCargando(false);
        return;
      }

      toast.success("Correo de recuperación enviado", {
        description: "Revisa tu bandeja de entrada o carpeta de spam.",
      });
      setEnviado(true);
    } catch {
      const msg = "No se pudo procesar tu solicitud. Por favor intenta más tarde.";
      setError(msg);
      toast.error(msg);
    } finally {
      setCargando(false);
    }
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

        {enviado ? (
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Correo enviado
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-blue-200/80">
              Si existe una cuenta asociada a{" "}
              <strong className="text-slate-900 dark:text-white font-semibold">
                {correo}
              </strong>
              , recibirás un enlace de un solo uso para restablecer tu contraseña.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Button
                type="button"
                onClick={onVolver}
                className="h-12 w-full rounded-xl text-base font-bold shadow-md transition-all bg-[#1A73E8] hover:bg-[#1557B0] text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
              >
                Volver al inicio de sesión
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Recuperar contraseña
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-blue-200/70">
                Ingresa tu correo y te enviaremos un enlace seguro para crear una nueva clave.
              </p>
            </div>

            {error && (
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm font-medium text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRecuperar} noValidate className="mt-6 flex flex-col gap-4">
              <div>
                <label
                  htmlFor="recuperar-correo"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-blue-300/80"
                >
                  CORREO ELECTRÓNICO
                </label>
                <div className="relative">
                  <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-blue-300/60" />
                  <Input
                    id="recuperar-correo"
                    type="email"
                    placeholder="tu@correo.com"
                    className={cn(
                      "h-12 pl-10 rounded-xl bg-slate-50/80 text-slate-900 border-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-[#081033] dark:border-blue-400/25 dark:text-white dark:placeholder:text-blue-300/40 dark:focus-visible:ring-blue-400",
                      errorCorreo && "border-destructive focus-visible:ring-destructive/30"
                    )}
                    aria-invalid={Boolean(errorCorreo)}
                    value={correo}
                    onChange={(e) => {
                      setCorreo(e.target.value);
                      if (errorCorreo) setErrorCorreo(null);
                    }}
                  />
                </div>
                {errorCorreo && (
                  <p className="mt-1.5 text-xs font-semibold text-destructive">{errorCorreo}</p>
                )}
              </div>

              {/* Widget Cloudflare Turnstile anti-bots */}
              {siteKey && (
                <div className="my-2 flex justify-center overflow-hidden">
                  <Turnstile
                    siteKey={siteKey}
                    onSuccess={(token) => setTurnstileToken(token)}
                    onExpire={() => setTurnstileToken(null)}
                    options={{ theme: "auto", size: "flexible" }}
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={cargando}
                className="mt-3 h-12 w-full rounded-xl text-base font-bold shadow-md transition-all bg-[#1A73E8] hover:bg-[#1557B0] text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 dark:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              >
                {cargando ? "Enviando enlace…" : "Enviar enlace de recuperación"}
              </Button>

              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={onVolver}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-blue-300/80 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Volver a iniciar sesión
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
