"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NuevaClavePage() {
  const router = useRouter();
  const [clave, setClave] = useState("");
  const [confirmarClave, setConfirmarClave] = useState("");
  const [cargando, setCargando] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [sesionValida, setSesionValida] = useState<boolean | null>(null);

  useEffect(() => {
    async function verificarSesion() {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      setSesionValida(!!data.session);
    }
    void verificarSesion();
  }, []);

  const handleActualizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nuevosErrores: Record<string, string> = {};
    if (clave.length < 8) {
      nuevosErrores.clave = "La contraseña debe tener al menos 8 caracteres.";
    }

    if (clave !== confirmarClave) {
      nuevosErrores.confirmarClave = "Las contraseñas no coinciden.";
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      toast.error("Por favor completa los campos marcados en rojo.");
      return;
    }

    setErrores({});
    setCargando(true);
    try {
      const supabase = createClient();
      const { error: updateErr } = await supabase.auth.updateUser({
        password: clave,
      });

      if (updateErr) {
        setError(updateErr.message);
        toast.error(updateErr.message || "Error al actualizar la contraseña.");
        setCargando(false);
        return;
      }

      toast.success("¡Contraseña actualizada con éxito!", {
        description: "Ya puedes iniciar sesión con tu nueva clave.",
      });
      setCompletado(true);
    } catch {
      const msg = "Error actualizando la contraseña. Solicita un nuevo enlace.";
      setError(msg);
      toast.error(msg);
    } finally {
      setCargando(false);
    }
  };

  if (sesionValida === false) {
    return (
      <main className="flex min-h-[calc(100vh-200px)] flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-xl sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-xl font-bold">Enlace expirado o inválido</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            El enlace de recuperación ya fue utilizado o ha caducado por seguridad.
          </p>
          <div className="mt-6">
            <Link href="/recuperar">
              <Button className="w-full font-bold">Solicitar nuevo enlace</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-200px)] flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl sm:p-8">
        {completado ? (
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">Contraseña actualizada</h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Tu clave se ha guardado exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <div className="mt-6">
              <Link href="/login">
                <Button className="w-full font-bold">Iniciar sesión ahora</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Crea tu nueva contraseña
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Ingresa una contraseña segura de al menos 8 caracteres.
              </p>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleActualizar} noValidate className="mt-6 flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    className={cn(
                      "h-11 pl-10",
                      errores.clave && "border-destructive focus-visible:ring-destructive/30"
                    )}
                    aria-invalid={Boolean(errores.clave)}
                    value={clave}
                    onChange={(e) => {
                      setClave(e.target.value);
                      if (errores.clave) setErrores((prev) => ({ ...prev, clave: "" }));
                    }}
                  />
                </div>
                {errores.clave && (
                  <p className="mt-1.5 text-xs font-semibold text-destructive">{errores.clave}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Confirmar nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    type="password"
                    placeholder="Repite la contraseña"
                    className={cn(
                      "h-11 pl-10",
                      errores.confirmarClave && "border-destructive focus-visible:ring-destructive/30"
                    )}
                    aria-invalid={Boolean(errores.confirmarClave)}
                    value={confirmarClave}
                    onChange={(e) => {
                      setConfirmarClave(e.target.value);
                      if (errores.confirmarClave) setErrores((prev) => ({ ...prev, confirmarClave: "" }));
                    }}
                  />
                </div>
                {errores.confirmarClave && (
                  <p className="mt-1.5 text-xs font-semibold text-destructive">{errores.confirmarClave}</p>
                )}
              </div>

              <Button type="submit" disabled={cargando} className="mt-2 h-11 font-bold">
                {cargando ? "Guardando…" : "Establecer nueva contraseña"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
