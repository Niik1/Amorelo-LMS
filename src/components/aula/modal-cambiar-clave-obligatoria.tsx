"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actualizarClaveInicialAction } from "@/server/auth/acciones";
import { toast } from "sonner";

interface ModalCambiarClaveObligatoriaProps {
  abierto: boolean;
  correoAlumno?: string;
}

export function ModalCambiarClaveObligatoria({
  abierto,
  correoAlumno,
}: ModalCambiarClaveObligatoriaProps) {
  const router = useRouter();
  const [nuevaClave, setNuevaClave] = useState("");
  const [confirmarClave, setConfirmarClave] = useState("");
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!abierto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const claveLimpia = nuevaClave.trim();
    if (claveLimpia.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (claveLimpia !== confirmarClave.trim()) {
      setError("Las contraseñas no coinciden. Asegúrate de escribirlas iguales.");
      return;
    }

    setCargando(true);
    try {
      const res = await actualizarClaveInicialAction(claveLimpia);
      if (!res.ok) {
        setError(res.error);
        setCargando(false);
        return;
      }

      toast.success("¡Contraseña configurada con éxito!", {
        description: "Bienvenida a tu aula virtual.",
      });

      router.refresh();
    } catch {
      setError("Ocurrió un error al guardar tu contraseña. Inténtalo nuevamente.");
      setCargando(false);
    }
  };

  return (
    <Dialog open={abierto}>
      {/* Sin botón 'x' para obligar a definir la contraseña en su primer acceso */}
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl sm:p-8"
      >
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-2 border border-blue-100 dark:bg-blue-950/80 dark:text-blue-400 dark:border-blue-800/50">
            <ShieldCheck className="size-6" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black text-heading">
            Crea tu contraseña definitiva
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
            Por seguridad, para tu primer ingreso debes definir una contraseña personal para acceder a tus cursos.
            {correoAlumno && (
              <span className="block mt-1 font-mono text-xs text-foreground font-semibold">
                {correoAlumno}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs sm:text-sm font-medium text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3.5">
          {/* Nueva Contraseña */}
          <div>
            <label
              htmlFor="modal-nueva-clave"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              NUEVA CONTRASEÑA
            </label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="modal-nueva-clave"
                type={mostrarNueva ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                className="h-11 pl-10 pr-10 rounded-xl text-sm"
                value={nuevaClave}
                onChange={(e) => setNuevaClave(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setMostrarNueva((v) => !v)}
                className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={mostrarNueva ? "Ocultar" : "Mostrar"}
              >
                {mostrarNueva ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar Contraseña */}
          <div>
            <label
              htmlFor="modal-confirmar-clave"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              CONFIRMAR CONTRASEÑA
            </label>
            <div className="relative">
              <KeyRound className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="modal-confirmar-clave"
                type={mostrarConfirmar ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="Repite tu contraseña"
                className="h-11 pl-10 pr-10 rounded-xl text-sm"
                value={confirmarClave}
                onChange={(e) => setConfirmarClave(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmar((v) => !v)}
                className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={mostrarConfirmar ? "Ocultar" : "Mostrar"}
              >
                {mostrarConfirmar ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Validaciones */}
          <div className="rounded-xl bg-muted/40 p-3 text-[11px] text-muted-foreground space-y-1 border border-border">
            <div className="flex items-center gap-1.5">
              <CheckCircle2
                className={`size-3.5 ${
                  nuevaClave.length >= 8 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/40"
                }`}
              />
              <span>Mínimo 8 caracteres</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2
                className={`size-3.5 ${
                  nuevaClave.length > 0 && nuevaClave === confirmarClave
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground/40"
                }`}
              />
              <span>Las contraseñas coinciden</span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={cargando || nuevaClave.length < 8 || nuevaClave !== confirmarClave}
            className="mt-2 h-11 w-full rounded-xl font-bold cursor-pointer"
          >
            {cargando ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span>Guardando...</span>
              </span>
            ) : (
              "Guardar y Continuar"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
