"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, CheckCircle2, AlertCircle, ListChecks } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { QuizAdmin, PreguntaAdmin, OpcionAdmin } from "@/server/admin/quizzes";

export function ErrorCampo({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return <p className="text-destructive mt-1 text-xs font-semibold">{mensaje}</p>;
}

export interface EditorQuizData {
  porcentajeMinimo: number;
  intentosPermitidos: number | null;
  preguntas: PreguntaAdmin[];
}

interface EditorQuizProps {
  quizInicial?: QuizAdmin | null;
  onChange: (datos: EditorQuizData) => void;
  errores?: Record<string, string>;
  onClearError?: (key: string) => void;
}

export function EditorQuiz({ quizInicial, onChange, errores, onClearError }: EditorQuizProps) {
  const [porcentajeMinimo, setPorcentajeMinimo] = useState<number | "">(
    quizInicial?.porcentaje_minimo ?? 80
  );
  const [esLimitado, setEsLimitado] = useState<boolean>(
    Boolean(quizInicial?.intentos_permitidos !== null && quizInicial?.intentos_permitidos !== undefined)
  );
  const [numIntentos, setNumIntentos] = useState<number | "">(
    quizInicial?.intentos_permitidos ?? 3
  );

  const [preguntas, setPreguntas] = useState<PreguntaAdmin[]>(() => {
    if (quizInicial?.preguntas && quizInicial.preguntas.length > 0) {
      return quizInicial.preguntas;
    }
    // Pregunta inicial por defecto
    return [
      {
        enunciado: "",
        orden: 1,
        explicacion: "",
        opciones: [
          { texto_opcion: "", es_correcta: true },
          { texto_opcion: "", es_correcta: false },
        ],
      },
    ];
  });

  // Notificar al componente padre cada vez que cambien los datos
  useEffect(() => {
    const minFinal =
      typeof porcentajeMinimo === "number" && porcentajeMinimo > 0
        ? porcentajeMinimo
        : 80;
    const intentosFinal = esLimitado
      ? typeof numIntentos === "number" && numIntentos > 0
        ? numIntentos
        : 3
      : null;

    onChange({
      porcentajeMinimo: minFinal,
      intentosPermitidos: intentosFinal,
      preguntas,
    });
  }, [porcentajeMinimo, esLimitado, numIntentos, preguntas, onChange]);

  // Manejadores de Preguntas
  const agregarPregunta = () => {
    setPreguntas((prev) => [
      ...prev,
      {
        enunciado: "",
        orden: prev.length + 1,
        explicacion: "",
        opciones: [
          { texto_opcion: "", es_correcta: true },
          { texto_opcion: "", es_correcta: false },
        ],
      },
    ]);
  };

  const eliminarPregunta = (indexPregunta: number) => {
    if (preguntas.length <= 1) return;
    setPreguntas((prev) =>
      prev
        .filter((_, idx) => idx !== indexPregunta)
        .map((p, idx) => ({ ...p, orden: idx + 1 }))
    );
  };

  const actualizarEnunciado = (indexPregunta: number, valor: string) => {
    setPreguntas((prev) => {
      const copia = [...prev];
      copia[indexPregunta] = { ...copia[indexPregunta], enunciado: valor };
      return copia;
    });
  };

  const actualizarExplicacion = (indexPregunta: number, valor: string) => {
    setPreguntas((prev) => {
      const copia = [...prev];
      copia[indexPregunta] = { ...copia[indexPregunta], explicacion: valor };
      return copia;
    });
  };

  // Manejadores de Alternativas
  const agregarOpcion = (indexPregunta: number) => {
    setPreguntas((prev) => {
      const copia = [...prev];
      const preg = copia[indexPregunta];
      if (preg.opciones.length >= 6) return prev;
      copia[indexPregunta] = {
        ...preg,
        opciones: [...preg.opciones, { texto_opcion: "", es_correcta: false }],
      };
      return copia;
    });
  };

  const eliminarOpcion = (indexPregunta: number, indexOpcion: number) => {
    setPreguntas((prev) => {
      const copia = [...prev];
      const preg = copia[indexPregunta];
      if (preg.opciones.length <= 2) return prev; // Mínimo 2 opciones requeridas
      const nuevasOpciones = preg.opciones.filter((_, idx) => idx !== indexOpcion);

      // Si la eliminada era la correcta, poner la primera como correcta
      const hayCorrecta = nuevasOpciones.some((op) => op.es_correcta);
      if (!hayCorrecta && nuevasOpciones.length > 0) {
        nuevasOpciones[0].es_correcta = true;
      }

      copia[indexPregunta] = { ...preg, opciones: nuevasOpciones };
      return copia;
    });
  };

  const actualizarTextoOpcion = (
    indexPregunta: number,
    indexOpcion: number,
    valor: string
  ) => {
    setPreguntas((prev) => {
      const copia = [...prev];
      const preg = copia[indexPregunta];
      const opciones = [...preg.opciones];
      opciones[indexOpcion] = { ...opciones[indexOpcion], texto_opcion: valor };
      copia[indexPregunta] = { ...preg, opciones };
      return copia;
    });
  };

  const marcarOpcionCorrecta = (indexPregunta: number, indexOpcion: number) => {
    setPreguntas((prev) => {
      const copia = [...prev];
      const preg = copia[indexPregunta];
      const opciones = preg.opciones.map((op, idx) => ({
        ...op,
        es_correcta: idx === indexOpcion,
      }));
      copia[indexPregunta] = { ...preg, opciones };
      return copia;
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Parámetros de Calificación y Reglas */}
      <div className="rounded-xl border border-border/80 bg-muted/30 dark:bg-muted/15 dark:border-slate-800 p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <HelpCircle className="h-4 w-4 text-[#1e3a8a] dark:text-blue-400" />
          <span>Configuración de Calificación</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Porcentaje mínimo para aprobar */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Porcentaje mínimo para aprobar (%)
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={100}
                value={porcentajeMinimo}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setPorcentajeMinimo("");
                    return;
                  }
                  const num = parseInt(val, 10);
                  if (!isNaN(num)) {
                    setPorcentajeMinimo(Math.min(100, Math.max(0, num)));
                  }
                }}
                onBlur={() => {
                  if (porcentajeMinimo === "" || porcentajeMinimo === 0) {
                    setPorcentajeMinimo(80);
                  }
                }}
                className="w-24 text-center font-bold"
              />
              <span className="text-xs text-muted-foreground">
                (Recomendado: 80% para asegurar aprendizaje)
              </span>
            </div>
          </div>

          {/* Límite de intentos */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2">
              Límite de Intentos
            </label>
            <RadioGroup
              value={esLimitado ? "limitado" : "ilimitado"}
              onValueChange={(val) => setEsLimitado(val === "limitado")}
              className="flex flex-wrap items-center gap-4"
            >
              <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer select-none">
                <RadioGroupItem value="ilimitado" />
                <span>Ilimitados</span>
              </label>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer select-none">
                  <RadioGroupItem value="limitado" />
                  <span>Máximo:</span>
                </label>
                {esLimitado && (
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={numIntentos}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setNumIntentos("");
                        return;
                      }
                      const num = parseInt(val, 10);
                      if (!isNaN(num)) {
                        setNumIntentos(Math.min(50, Math.max(1, num)));
                      }
                    }}
                    onBlur={() => {
                      if (numIntentos === "" || numIntentos === 0) {
                        setNumIntentos(3);
                      }
                    }}
                    className="w-16 h-8 text-center text-xs font-bold"
                  />
                )}
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>

      {/* 2. Constructor de Preguntas */}
      <div className="space-y-4">
        {errores?.quiz && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive font-semibold flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errores.quiz}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-[#1e3a8a] dark:text-blue-400" />
            <h4 className="text-sm font-extrabold text-foreground">
              Preguntas de la Evaluación ({preguntas.length})
            </h4>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={agregarPregunta}
            className="text-xs font-bold gap-1.5 text-blue-800 bg-blue-50/90 border-blue-200 hover:bg-blue-100 dark:text-blue-200 dark:bg-blue-500/20 dark:border-blue-400/40 dark:hover:bg-blue-500/30 cursor-pointer shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Agregar Pregunta</span>
          </Button>
        </div>

        {/* Lista de Preguntas */}
        <div className="space-y-4">
          {preguntas.map((pregunta, indexPreg) => {
            const numOpciones = pregunta.opciones.length;
            const tieneCorrecta = pregunta.opciones.some((o) => o.es_correcta);

            return (
              <div
                key={indexPreg}
                className="rounded-2xl border border-border/80 bg-card dark:bg-slate-900/40 dark:border-slate-800 p-4 sm:p-5 space-y-4 shadow-2xs relative transition-all"
              >
                {/* Cabecera de la Pregunta */}
                <div className="flex items-center justify-between gap-2 border-b dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1e3a8a] dark:bg-blue-600 text-[11px] font-extrabold text-white shadow-xs">
                      {indexPreg + 1}
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      Pregunta #{indexPreg + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!tieneCorrecta && (
                      <Badge variant="destructive" className="text-[10px] gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Marca una respuesta correcta
                      </Badge>
                    )}
                    {preguntas.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => eliminarPregunta(indexPreg)}
                        className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:text-rose-400 cursor-pointer"
                        title="Eliminar esta pregunta"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Enunciado de la Pregunta */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Enunciado de la Pregunta *
                  </label>
                  <Input
                    placeholder="Ej: ¿A cuántos grados se debe calibrar el inflador de globos?"
                    value={pregunta.enunciado}
                    onChange={(e) => {
                      actualizarEnunciado(indexPreg, e.target.value);
                      onClearError?.(`quiz_p_${indexPreg}_enunciado`);
                    }}
                    className={cn(
                      "text-xs sm:text-sm font-medium",
                      errores?.[`quiz_p_${indexPreg}_enunciado`] &&
                        "border-destructive focus-visible:ring-destructive/30"
                    )}
                    aria-invalid={Boolean(errores?.[`quiz_p_${indexPreg}_enunciado`])}
                  />
                  <ErrorCampo mensaje={errores?.[`quiz_p_${indexPreg}_enunciado`]} />
                </div>

                {/* Alternativas de Respuesta */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Alternativas (marca el círculo de la respuesta correcta)
                    </label>
                    {numOpciones < 6 && (
                      <button
                        type="button"
                        onClick={() => agregarOpcion(indexPreg)}
                        className="text-[11px] font-bold text-[#1e3a8a] dark:text-blue-400 hover:text-[#16294f] dark:hover:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Añadir alternativa</span>
                      </button>
                    )}
                  </div>

                  <RadioGroup
                    value={String(pregunta.opciones.findIndex((o) => o.es_correcta))}
                    onValueChange={(val) => {
                      marcarOpcionCorrecta(indexPreg, Number(val));
                      onClearError?.(`quiz_p_${indexPreg}_correcta`);
                    }}
                    className="space-y-2 gap-0"
                  >
                    {pregunta.opciones.map((opcion, indexOp) => {
                      const errOpcion = errores?.[`quiz_p_${indexPreg}_op_${indexOp}`];
                      return (
                        <div key={indexOp} className="space-y-1">
                          <div
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-xl border transition-all",
                              errOpcion
                                ? "border-destructive bg-destructive/5"
                                : opcion.es_correcta
                                ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30 dark:border-emerald-500/60"
                                : "border-border/80 bg-muted/10 hover:bg-muted/30 dark:bg-muted/15 dark:border-slate-800 dark:hover:bg-muted/30"
                            )}
                          >
                            {/* Radio para marcar correcta */}
                            <label
                              className="flex items-center justify-center p-1.5 cursor-pointer"
                              title={opcion.es_correcta ? "Respuesta Correcta" : "Marcar como correcta"}
                            >
                              <RadioGroupItem
                                value={String(indexOp)}
                                className={
                                  opcion.es_correcta
                                    ? "data-checked:bg-emerald-600 data-checked:border-emerald-600 dark:data-checked:bg-emerald-500 dark:data-checked:border-emerald-500"
                                    : ""
                                }
                              />
                            </label>

                            {/* Texto de la opción */}
                            <Input
                              placeholder={`Alternativa ${String.fromCharCode(65 + indexOp)}...`}
                              value={opcion.texto_opcion}
                              onChange={(e) => {
                                actualizarTextoOpcion(indexPreg, indexOp, e.target.value);
                                onClearError?.(`quiz_p_${indexPreg}_op_${indexOp}`);
                              }}
                              className="text-xs h-8 flex-1 bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-emerald-500"
                            />

                            {/* Insignia visual si es correcta */}
                            {opcion.es_correcta && (
                              <span className="shrink-0 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 pr-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                Correcta
                              </span>
                            )}

                            {/* Botón eliminar alternativa */}
                            {numOpciones > 2 && (
                              <button
                                type="button"
                                onClick={() => eliminarOpcion(indexPreg, indexOp)}
                                className="p-1 text-muted-foreground hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                title="Eliminar alternativa"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          <ErrorCampo mensaje={errOpcion} />
                        </div>
                      );
                    })}
                  </RadioGroup>
                  <ErrorCampo mensaje={errores?.[`quiz_p_${indexPreg}_correcta`]} />
                  <ErrorCampo mensaje={errores?.[`quiz_p_${indexPreg}`]} />
                </div>

                {/* Explicación Didáctica Opcional */}
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Explicación pedagógica retroalimentativa (opcional — se muestra si la alumna falla o aprueba)
                  </label>
                  <Textarea
                    placeholder="Ej: Recuerda que la calibración correcta garantiza la durabilidad del látex y previene roturas imprevistas durante la instalación..."
                    value={pregunta.explicacion || ""}
                    onChange={(e) => actualizarExplicacion(indexPreg, e.target.value)}
                    rows={2}
                    className="text-xs resize-none"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Botón inferior para agregar más preguntas */}
        <Button
          type="button"
          variant="outline"
          onClick={agregarPregunta}
          className="w-full border-dashed py-5 text-xs font-bold gap-2 text-muted-foreground hover:text-foreground hover:border-foreground/40 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-muted/20 dark:text-slate-300 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar otra pregunta</span>
        </Button>
      </div>
    </div>
  );
}
