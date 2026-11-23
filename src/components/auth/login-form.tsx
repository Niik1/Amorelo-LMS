"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AlertCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LoginFormProps {
  correo: string;
  setCorreo: (value: string) => void;
  clave: string;
  setClave: (value: string) => void;
  mostrarClave: boolean;
  setMostrarClave: (show: boolean | ((prev: boolean) => boolean)) => void;
  recordarSesion: boolean;
  setRecordarSesion: (remember: boolean) => void;
  cargando: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onOlvideClave: () => void;
  onTurnstileSuccess?: (token: string) => void;
  onTurnstileExpire?: () => void;
}

export function LoginForm({
  correo,
  setCorreo,
  clave,
  setClave,
  mostrarClave,
  setMostrarClave,
  recordarSesion,
  setRecordarSesion,
  cargando,
  error,
  onSubmit,
  onOlvideClave,
  onTurnstileSuccess,
  onTurnstileExpire,
}: LoginFormProps) {
  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAFWwmHbkuBJ4vo6E";
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  useEffect(() => {
    if (error) {
      turnstileRef.current?.reset();
      onTurnstileExpire?.();
      // Marcado visual de campos si el error proviene del servidor
      const errLower = error.toLowerCase();
      if (errLower.includes("correo") || errLower.includes("contraseña") || errLower.includes("credenciales")) {
        setErrores({
          correo: "Verifica tu correo electrónico",
          clave: "Verifica tu contraseña",
        });
      }
    }
  }, [error, onTurnstileExpire]);

  const handleValidarYEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevosErrores: Record<string, string> = {};

    const correoLimpio = correo.trim();
    if (!correoLimpio) {
      nuevosErrores.correo = "Ingresa tu correo electrónico.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
      nuevosErrores.correo = "Ingresa un correo electrónico válido.";
    }

    if (!clave) {
      nuevosErrores.clave = "Ingresa tu contraseña.";
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      toast.error("Por favor completa los campos marcados en rojo.");
      return;
    }

    setErrores({});
    onSubmit(e);
  };

  return (
    <div className="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 dark:bg-[#0D1A4F]">
      <div className="mx-auto w-full max-w-[420px]">
        {/* Logo reactivo a Modo Claro y Modo Oscuro */}
        <div className="flex justify-center mb-5">
          <div className="relative size-14 sm:size-16 transition-transform duration-300 hover:scale-105">
            {/* Modo Claro */}
            <Image
              src="/images/logos/logo-A.svg"
              alt="Amorelo"
              width={64}
              height={64}
              priority
              className="h-full w-full object-contain drop-shadow-sm dark:hidden"
            />
            {/* Modo Oscuro */}
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

        {/* Encabezado */}
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Iniciar sesión
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-blue-200/70">
            Ingresa con tu correo y contraseña.
          </p>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm font-medium text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario con Validación Moderna */}
        <form onSubmit={handleValidarYEnviar} noValidate className="mt-6 flex flex-col gap-4">
          {/* Campo Correo */}
          <div>
            <label
              htmlFor="login-correo"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-blue-300/80"
            >
              CORREO ELECTRÓNICO
            </label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-blue-300/60" />
              <Input
                id="login-correo"
                type="email"
                autoComplete="username"
                placeholder="tu@correo.com"
                className={cn(
                  "h-12 pl-10 rounded-xl bg-slate-50/80 text-slate-900 border-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-[#081033] dark:border-blue-400/25 dark:text-white dark:placeholder:text-blue-300/40 dark:focus-visible:ring-blue-400",
                  errores.correo && "border-destructive focus-visible:ring-destructive/30"
                )}
                aria-invalid={Boolean(errores.correo)}
                value={correo}
                onChange={(e) => {
                  setCorreo(e.target.value);
                  if (errores.correo) setErrores((prev) => ({ ...prev, correo: "" }));
                }}
              />
            </div>
            {errores.correo && (
              <p className="mt-1.5 text-xs font-semibold text-destructive">{errores.correo}</p>
            )}
          </div>

          {/* Campo Contraseña */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="login-clave"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-blue-300/80"
              >
                CONTRASEÑA
              </label>
              <button
                type="button"
                onClick={onOlvideClave}
                className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-blue-300/60" />
              <Input
                id="login-clave"
                type={mostrarClave ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Tu contraseña"
                className={cn(
                  "h-12 pl-10 pr-10 rounded-xl bg-slate-50/80 text-slate-900 border-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-[#081033] dark:border-blue-400/25 dark:text-white dark:placeholder:text-blue-300/40 dark:focus-visible:ring-blue-400",
                  errores.clave && "border-destructive focus-visible:ring-destructive/30"
                )}
                aria-invalid={Boolean(errores.clave)}
                value={clave}
                onChange={(e) => {
                  setClave(e.target.value);
                  if (errores.clave) setErrores((prev) => ({ ...prev, clave: "" }));
                }}
              />
              <button
                type="button"
                onClick={() => setMostrarClave((prev) => !prev)}
                aria-label={
                  mostrarClave ? "Ocultar contraseña" : "Ver contraseña"
                }
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-700 transition-colors focus-visible:outline-none dark:text-blue-300/60 dark:hover:text-white"
              >
                {mostrarClave ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {errores.clave && (
              <p className="mt-1.5 text-xs font-semibold text-destructive">{errores.clave}</p>
            )}
          </div>

          {/* Checkbox: Mantener sesión iniciada */}
          <div className="mt-1 flex items-center space-x-2.5">
            <Checkbox
              id="recordar-sesion"
              checked={recordarSesion}
              onCheckedChange={(checked) =>
                setRecordarSesion(Boolean(checked))
              }
              className="rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 dark:border-blue-400/30 dark:data-[state=checked]:bg-white dark:data-[state=checked]:text-slate-900"
            />
            <label
              htmlFor="recordar-sesion"
              className="text-xs font-medium text-slate-700 select-none cursor-pointer dark:text-blue-200/90"
            >
              Mantener la sesión iniciada en este equipo
            </label>
          </div>

          {/* Widget Cloudflare Turnstile anti-bots */}
          {siteKey && (
            <div className="my-2 flex justify-center overflow-hidden">
              <Turnstile
                ref={turnstileRef}
                siteKey={siteKey}
                onSuccess={(token) => onTurnstileSuccess?.(token)}
                onExpire={() => onTurnstileExpire?.()}
                options={{ theme: "auto", size: "flexible" }}
              />
            </div>
          )}

          {/* Botón Principal "Entrar" */}
          <Button
            type="submit"
            disabled={cargando}
            className="mt-3 h-12 w-full rounded-xl text-base font-bold shadow-md transition-all bg-[#1A73E8] hover:bg-[#1557B0] text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 dark:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          >
            {cargando ? "Iniciando sesión…" : "Entrar"}
          </Button>
        </form>

        {/* Texto informativo inferior */}
        <div className="mt-6 border-t border-slate-200/80 pt-4 text-center dark:border-blue-400/20">
          <p className="text-xs leading-relaxed text-slate-500 dark:text-blue-200/70">
            ¿No tienes una cuenta aún? Las cuentas de alumno se crean automáticamente al comprar un curso virtual en la plataforma.
          </p>
          <p className="mt-2 text-xs text-slate-600 dark:text-blue-200/90">
            ¿Problemas para entrar?{" "}
            <a
              href="https://wa.me/51945729551?text=Hola,%20tengo%20problemas%20para%20iniciar%20sesi%C3%B3n"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Escríbenos por WhatsApp
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
