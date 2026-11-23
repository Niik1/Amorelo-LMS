"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actualizarClaveInicialAction } from "@/server/auth/acciones";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CambiarClaveInicialFormProps {
  correoAlumno: string;
  destinoFinal: string;
}

export function CambiarClaveInicialForm({
  correoAlumno,
  destinoFinal,
}: CambiarClaveInicialFormProps) {
  const router = useRouter();
  const [nuevaClave, setNuevaClave] = useState("");
  const [confirmarClave, setConfirmarClave] = useState("");
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nuevosErrores: Record<string, string> = {};
    const claveLimpia = nuevaClave.trim();
    if (claveLimpia.length < 8) {
      nuevosErrores.nuevaClave = "La contraseña debe tener al menos 8 caracteres.";
    }

    if (claveLimpia !== confirmarClave.trim()) {
      nuevosErrores.confirmarClave = "Las contraseñas no coinciden. Asegúrate de escribirlas iguales.";
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      toast.error("Por favor completa los campos marcados en rojo.");
      return;
    }

    setErrores({});
    setCargando(true);
    try {
      const res = await actualizarClaveInicialAction(claveLimpia);
      if (!res.ok) {
        setError(res.error);
        toast.error(res.error || "No se pudo actualizar la contraseña.");
        setCargando(false);
        return;
      }

      toast.success("¡Contraseña configurada con éxito!", {
        description: "Bienvenida a tu aula virtual.",
      });

      router.push(destinoFinal);
      router.refresh();
    } catch {
      const msg = "Ocurrió un error al guardar tu contraseña. Inténtalo nuevamente.";
      setError(msg);
      toast.error(msg);
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

        {/* Encabezado */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-3 border border-blue-200/60 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700/50">
            <ShieldCheck className="size-3.5 text-blue-600 dark:text-blue-400" />
            <span>Primer inicio de sesión</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Crea tu contraseña
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed dark:text-blue-200/70">
            Por tu seguridad, define una contraseña personal para acceder a tu aula virtual y cursos.
          </p>
          {correoAlumno && (
            <p className="mt-1 font-mono text-[11px] text-slate-400 dark:text-blue-300/60">
              {correoAlumno}
            </p>
          )}
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-xs sm:text-sm font-medium text-red-600 dark:text-red-400">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario con Validación Moderna */}
        <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
          {/* Nueva Contraseña */}
          <div>
            <label
              htmlFor="nueva-clave"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-blue-300/80"
            >
              NUEVA CONTRASEÑA
            </label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400 dark:text-blue-300/60" />
              <Input
                id="nueva-clave"
                type={mostrarNueva ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                className={cn(
                  "h-12 pl-10 pr-10 rounded-xl bg-slate-50/80 text-slate-900 border-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-[#081033] dark:border-blue-400/25 dark:text-white dark:placeholder:text-blue-300/40 dark:focus-visible:ring-blue-400 text-sm",
                  errores.nuevaClave && "border-destructive focus-visible:ring-destructive/30"
                )}
                aria-invalid={Boolean(errores.nuevaClave)}
                value={nuevaClave}
                onChange={(e) => {
                  setNuevaClave(e.target.value);
                  if (errores.nuevaClave) setErrores((prev) => ({ ...prev, nuevaClave: "" }));
                }}
              />
              <button
                type="button"
                onClick={() => setMostrarNueva((v) => !v)}
                className="absolute top-1/2 right-3.5 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-blue-300/60 dark:hover:text-blue-200 cursor-pointer"
                aria-label={mostrarNueva ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {mostrarNueva ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errores.nuevaClave && (
              <p className="mt-1.5 text-xs font-semibold text-destructive">{errores.nuevaClave}</p>
            )}
          </div>

          {/* Confirmar Contraseña */}
          <div>
            <label
              htmlFor="confirmar-clave"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-blue-300/80"
            >
              CONFIRMAR CONTRASEÑA
            </label>
            <div className="relative">
              <KeyRound className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400 dark:text-blue-300/60" />
              <Input
                id="confirmar-clave"
                type={mostrarConfirmar ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repite tu contraseña"
                className={cn(
                  "h-12 pl-10 pr-10 rounded-xl bg-slate-50/80 text-slate-900 border-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-[#081033] dark:border-blue-400/25 dark:text-white dark:placeholder:text-blue-300/40 dark:focus-visible:ring-blue-400 text-sm",
                  errores.confirmarClave && "border-destructive focus-visible:ring-destructive/30"
                )}
                aria-invalid={Boolean(errores.confirmarClave)}
                value={confirmarClave}
                onChange={(e) => {
                  setConfirmarClave(e.target.value);
                  if (errores.confirmarClave) setErrores((prev) => ({ ...prev, confirmarClave: "" }));
                }}
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmar((v) => !v)}
                className="absolute top-1/2 right-3.5 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-blue-300/60 dark:hover:text-blue-200 cursor-pointer"
                aria-label={mostrarConfirmar ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {mostrarConfirmar ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errores.confirmarClave && (
              <p className="mt-1.5 text-xs font-semibold text-destructive">{errores.confirmarClave}</p>
            )}
          </div>

          {/* Requisitos visuales */}
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-[11px] text-slate-600 dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-blue-200/80 space-y-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2
                className={`size-3.5 ${
                  nuevaClave.length >= 8 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-300 dark:text-slate-600"
                }`}
              />
              <span>Mínimo 8 caracteres</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2
                className={`size-3.5 ${
                  nuevaClave.length > 0 && nuevaClave === confirmarClave
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-300 dark:text-slate-600"
                }`}
              />
              <span>Las contraseñas coinciden</span>
            </div>
          </div>

          {/* Botón de Enviar */}
          <Button
            type="submit"
            disabled={cargando || nuevaClave.length < 8 || nuevaClave !== confirmarClave}
            className="mt-2 h-12 w-full rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all dark:bg-blue-500 dark:hover:bg-blue-600 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {cargando ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span>Guardando contraseña...</span>
              </span>
            ) : (
              "Guardar y Entrar al Aula Virtual"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
