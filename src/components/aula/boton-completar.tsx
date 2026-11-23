// Botón para marcar/desmarcar una lección como completada (RF-EST-34).

"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleLeccionCompletada } from "@/server/aula/progreso";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function BotonCompletar({
  leccionId,
  completadaInicial,
  tipoContenido,
}: {
  leccionId: string;
  completadaInicial: boolean;
  tipoContenido?: string;
}) {
  const [completada, setCompletada] = useState(completadaInicial);
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  // Para quizzes y proyectos la acreditación se realiza al aprobar
  if (tipoContenido === "quiz" || tipoContenido === "proyecto") {
    if (completada) {
      return (
        <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            {tipoContenido === "quiz" ? "Evaluación Aprobada" : "Proyecto Aprobado"}
          </span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-3.5 py-2 text-xs font-semibold text-muted-foreground">
        <Circle className="h-4 w-4 text-muted-foreground/60 shrink-0" />
        <span>
          {tipoContenido === "quiz"
            ? "Se completa al aprobar la evaluación"
            : "Se completa al ser validado por Amorelo"}
        </span>
      </div>
    );
  }

  const toggle = async () => {
    setCargando(true);
    try {
      const res = await toggleLeccionCompletada(leccionId);
      if (res.ok) {
        setCompletada(res.completada);
        if (res.cursoCompletado && res.certificado) {
          toast.success("¡Felicitaciones! Has completado el 100% del curso.", {
            description: "Tu certificado oficial ha sido emitido con éxito.",
            duration: 8000,
            action: {
              label: "Ver Certificado",
              onClick: () => router.push("/aula/certificados"),
            },
          });
        }
        router.refresh();
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <Button
      variant={completada ? "default" : "outline"}
      className={
        completada
          ? "bg-emerald-600 font-bold text-white hover:bg-emerald-700 dark:bg-emerald-600"
          : "font-bold"
      }
      onClick={() => void toggle()}
      disabled={cargando}
    >
      {cargando ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : completada ? (
        <CheckCircle2 className="mr-2 h-4 w-4" />
      ) : (
        <Circle className="mr-2 h-4 w-4" />
      )}
      {completada ? "Completada" : "Marcar como vista"}
    </Button>
  );
}
