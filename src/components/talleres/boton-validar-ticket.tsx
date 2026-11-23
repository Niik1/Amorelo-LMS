"use client";

import { useState } from "react";
import { CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validarTicketAction } from "@/server/talleres/acciones";
import { toast } from "sonner";

export function BotonValidarTicket({
  token,
  yaValidado,
}: {
  token: string;
  yaValidado: boolean;
}) {
  const [cargando, setCargando] = useState(false);
  const [validado, setValidado] = useState(yaValidado);

  const handleValidar = async () => {
    setCargando(true);
    try {
      const res = await validarTicketAction(token);
      if (res.ok) {
        setValidado(true);
        toast.success(res.mensaje || "¡Ingreso confirmado correctamente!");
      } else {
        toast.error(res.error || "No se pudo validar el ticket.");
      }
    } catch {
      toast.error("Error de comunicación al validar ticket.");
    } finally {
      setCargando(false);
    }
  };

  if (validado) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
        <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>Ingreso acreditado y asistencia registrada</span>
      </div>
    );
  }

  return (
    <Button
      onClick={handleValidar}
      disabled={cargando}
      className="h-10 gap-2 rounded-full bg-emerald-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all"
    >
      {cargando ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <ShieldCheck className="size-4" />
      )}
      <span>{cargando ? "Validando..." : "Validar Ingreso en Puerta"}</span>
    </Button>
  );
}
