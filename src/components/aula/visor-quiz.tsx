"use client";

import { useState, useRef } from "react";
import confetti from "canvas-confetti";
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Award,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  calificarIntentoQuiz,
  type DetalleQuizEstudiante,
} from "@/server/aula/quizzes";
import { toast } from "sonner";

interface VisorQuizProps {
  quiz: DetalleQuizEstudiante;
  matriculaId: string;
  leccionId: string;
  moduloTitulo: string;
  leccionTitulo: string;
}

type FaseQuiz = "portada" | "evaluando" | "resultado";

function scrollAlTecho() {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  document.documentElement.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  document.body.scrollTo({ top: 0, left: 0, behavior: "smooth" });

  // Si el aula virtual tuviera un contenedor con overflow propio
  const contenedorConScroll = document.querySelector("main");
  if (contenedorConScroll && contenedorConScroll.scrollTop > 0) {
    contenedorConScroll.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }
}

export function VisorQuiz({
  quiz,
  matriculaId,
  leccionId,
  moduloTitulo,
  leccionTitulo,
}: VisorQuizProps) {
  const topVisorRef = useRef<HTMLDivElement>(null);
  const [fase, setFase] = useState<FaseQuiz>("portada");
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [intentosCount, setIntentosCount] = useState(quiz.intentosRealizados);
  const [haAprobadoEstado, setHaAprobadoEstado] = useState(quiz.haAprobado);

  const [resultado, setResultado] = useState<{
    puntaje: number;
    aprobado: boolean;
    porcentajeMinimo: number;
    aciertos: number;
    totalPreguntas: number;
    retroalimentacion: Array<{
      preguntaId: string;
      esCorrecta: boolean;
      explicacion: string | null;
    }>;
  } | null>(null);

  const intentosPermitidos = quiz.intentos_permitidos;
  const tieneIntentosDisponibles =
    intentosPermitidos === null || intentosCount < intentosPermitidos;

  const totalPreguntas = quiz.preguntas.length;
  const respondidasCount = Object.keys(respuestas).length;
  const progresoPorcentaje =
    totalPreguntas > 0 ? Math.round((respondidasCount / totalPreguntas) * 100) : 0;

  const seleccionarOpcion = (preguntaId: string, opcionId: string) => {
    setRespuestas((prev) => ({
      ...prev,
      [preguntaId]: opcionId,
    }));
  };

  const iniciarEvaluacion = () => {
    setRespuestas({});
    setResultado(null);
    setFase("evaluando");
    setTimeout(scrollAlTecho, 50);
  };

  const handleEnviarRespuestas = async () => {
    if (respondidasCount < totalPreguntas) {
      const faltan = totalPreguntas - respondidasCount;
      const confirma = window.confirm(
        `Aún tienes ${faltan} ${
          faltan === 1 ? "pregunta sin responder" : "preguntas sin responder"
        }. ¿Deseas enviar y calificar de todos modos?`
      );
      if (!confirma) return;
    }

    setEnviando(true);
    try {
      const res = await calificarIntentoQuiz({
        quizId: quiz.id,
        matriculaId,
        leccionId,
        respuestas,
      });

      if (!res.ok) {
        toast.error(res.error || "Error al calificar la evaluación.");
        return;
      }

      setResultado({
        puntaje: res.puntaje!,
        aprobado: res.aprobado!,
        porcentajeMinimo: res.porcentajeMinimo!,
        aciertos: res.aciertos!,
        totalPreguntas: res.totalPreguntas!,
        retroalimentacion: res.retroalimentacion || [],
      });

      setIntentosCount((prev) => prev + 1);
      if (res.aprobado) {
        setHaAprobadoEstado(true);
        try {
          confetti({
            particleCount: 110,
            spread: 70,
            origin: { y: 0.6 },
          });
          setTimeout(() => {
            confetti({
              particleCount: 50,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
            });
            confetti({
              particleCount: 50,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
            });
          }, 300);
        } catch (e) {
          console.error("Error al disparar confeti:", e);
        }
        toast.success("¡Felicitaciones! Has aprobado el cuestionario con éxito.");
      } else {
        toast.error("No alcanzaste el puntaje mínimo requerido. ¡Repasa la clase y vuelve a intentarlo!");
      }

      setFase("resultado");
      setTimeout(scrollAlTecho, 50);
    } catch {
      toast.error("Ocurrió un error al procesar tus respuestas.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div ref={topVisorRef} className="flex flex-col gap-6 scroll-mt-6">
      {/* ========================================================
          FASE 1: PORTADA / PRESENTACIÓN DEL CUESTIONARIO
         ======================================================== */}
      {fase === "portada" && (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          {/* Cabecera de la Portada */}
          <div className="border-b bg-muted/30 p-5 sm:p-6 dark:bg-muted/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1e3a8a]/10 text-[#1e3a8a] dark:bg-blue-400/20 dark:text-blue-300">
                  <HelpCircle className="h-5 w-5" />
                </span>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#1e3a8a] dark:text-blue-400 block">
                    {moduloTitulo} • {leccionTitulo}
                  </span>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                    {quiz.titulo}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-700/60 font-extrabold text-xs">
                  Mínimo {quiz.porcentaje_minimo}% para aprobar
                </Badge>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7 space-y-6">
            {/* Mensaje de descripción */}
            {quiz.descripcion && (
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {quiz.descripcion}
              </p>
            )}

            {/* Fichas informativas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3.5">
                <BookOpen className="h-5 w-5 text-[#1e3a8a] dark:text-blue-400 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Total Preguntas
                  </span>
                  <span className="text-sm font-extrabold text-foreground">
                    {totalPreguntas} preguntas
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3.5">
                <Award className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Nota Aprobatoria
                  </span>
                  <span className="text-sm font-extrabold text-foreground">
                    {quiz.porcentaje_minimo}% de aciertos
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3.5">
                <Clock className="h-5 w-5 text-indigo-500 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Intentos Realizados
                  </span>
                  <span className="text-sm font-extrabold text-foreground">
                    {intentosCount}{" "}
                    {intentosPermitidos !== null ? `de ${intentosPermitidos}` : "(Ilimitados)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Banner de estado previo si ya intentó */}
            {haAprobadoEstado && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <span className="font-extrabold block text-sm text-emerald-800 dark:text-emerald-300">
                    ¡Ya has aprobado este cuestionario! 🎉
                  </span>
                  Esta lección ya se encuentra acreditada como completada en tu avance académico.
                  Si deseas practicar o reforzar conceptos, puedes volver a realizarlo en cualquier momento.
                </div>
              </div>
            )}

            {!haAprobadoEstado && quiz.ultimoIntento && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <span className="font-extrabold block text-sm text-amber-800 dark:text-amber-300">
                    Último intento: {quiz.ultimoIntento.puntaje}% (Requiere {quiz.porcentaje_minimo}%)
                  </span>
                  Aún no has alcanzado el puntaje mínimo de aprobación. Te recomendamos repasar los
                  videos del módulo y volver a intentarlo cuando estés lista.
                </div>
              </div>
            )}

            {/* Botón de acción */}
            <div className="pt-2">
              {tieneIntentosDisponibles ? (
                <Button
                  onClick={iniciarEvaluacion}
                  className="w-full sm:w-auto h-11 px-6 bg-[#1e3a8a] text-sm font-bold text-white shadow-sm hover:bg-[#16294f] gap-2 cursor-pointer dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {intentosCount === 0
                      ? "Comenzar Evaluación"
                      : "Volver a realizar el cuestionario"}
                  </span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-800 dark:text-rose-200">
                  Has alcanzado el límite máximo de {intentosPermitidos} intentos permitidos para esta evaluación.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          FASE 2: EVALUACIÓN EN CURSO (PREGUNTAS ACTIVAS)
         ======================================================== */}
      {fase === "evaluando" && (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm space-y-6">
          {/* Cabecera fija de la evaluación con barra de avance */}
          <div className="border-b bg-muted/30 p-4 sm:p-5 dark:bg-muted/10 sticky top-0 z-10 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1e3a8a] dark:text-blue-400 block">
                  Cuestionario en curso
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-foreground">
                  {quiz.titulo}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-extrabold text-muted-foreground">
                  {respondidasCount} de {totalPreguntas} respondidas
                </span>
                <Badge className="bg-[#1e3a8a] dark:bg-blue-600 text-white font-bold text-xs">
                  {progresoPorcentaje}%
                </Badge>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[#1e3a8a] dark:bg-blue-500 transition-all duration-300"
                style={{ width: `${progresoPorcentaje}%` }}
              />
            </div>
          </div>

          {/* Lista de Preguntas */}
          <div className="p-4 sm:p-6 space-y-6">
            {quiz.preguntas.map((pregunta, indexPreg) => {
              const opcionSeleccionada = respuestas[pregunta.id];

              return (
                <div
                  key={pregunta.id}
                  className="rounded-2xl border bg-card p-5 sm:p-6 space-y-4 shadow-2xs transition-all hover:border-border/80"
                >
                  {/* Número y Enunciado */}
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#1e3a8a] dark:bg-blue-600 text-xs font-extrabold text-white mt-0.5 shadow-xs">
                      {indexPreg + 1}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug">
                      {pregunta.enunciado}
                    </h3>
                  </div>

                  {/* Alternativas */}
                  <div className="space-y-2.5 pt-1 pl-0 sm:pl-10">
                    {pregunta.opciones.map((opcion, indexOp) => {
                      const estaMarcada = opcionSeleccionada === opcion.id;
                      const letra = String.fromCharCode(65 + indexOp);

                      return (
                        <button
                          key={opcion.id}
                          type="button"
                          onClick={() => seleccionarOpcion(pregunta.id, opcion.id)}
                          className={`w-full text-left flex items-center gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer ${
                            estaMarcada
                              ? "border-[#1e3a8a] bg-[#1e3a8a]/10 text-foreground ring-2 ring-[#1e3a8a]/20 dark:border-blue-400 dark:bg-blue-500/15 dark:ring-blue-400/30"
                              : "border-border bg-card hover:bg-muted/40 text-foreground"
                          }`}
                        >
                          {/* Letra / Radio visual */}
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                              estaMarcada
                                ? "bg-[#1e3a8a] text-white dark:bg-blue-500"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {letra}
                          </span>

                          <span className="text-xs sm:text-sm font-medium flex-1">
                            {opcion.texto}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Barra de envío */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t">
              <div className="text-xs text-muted-foreground">
                {respondidasCount === totalPreguntas ? (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    ¡Has respondido todas las preguntas! Ya puedes calificar.
                  </span>
                ) : (
                  <span>
                    Tienes {totalPreguntas - respondidasCount} de {totalPreguntas} preguntas pendientes.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFase("portada")}
                  disabled={enviando}
                  className="text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  onClick={handleEnviarRespuestas}
                  disabled={enviando}
                  className="h-10 px-6 bg-[#1e3a8a] text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#16294f] dark:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer gap-2"
                >
                  {enviando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Calificando evaluación...</span>
                    </>
                  ) : (
                    <>
                      <span>Finalizar y Calificar</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          FASE 3: RESULTADOS Y RETROALIMENTACIÓN PEDAGÓGICA
         ======================================================== */}
      {fase === "resultado" && resultado && (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm space-y-6">
          {/* Tarjeta de Calificación Principal */}
          <div
            className={`p-6 sm:p-8 text-center space-y-3 ${
              resultado.aprobado
                ? "bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-950 dark:text-emerald-200"
                : "bg-rose-500/10 border-b border-rose-500/20 text-rose-950 dark:text-rose-200"
            }`}
          >
            <div className="inline-flex p-3 rounded-2xl bg-card shadow-xs">
              {resultado.aprobado ? (
                <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="h-10 w-10 text-rose-600 dark:text-rose-400" />
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              {resultado.aprobado
                ? "¡Felicitaciones! Has aprobado la evaluación 🎉"
                : "No alcanzaste la nota mínima de aprobación"}
            </h2>

            <div className="flex items-center justify-center gap-4 py-2">
              <div className="rounded-xl bg-card border px-4 py-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Tu Calificación
                </span>
                <span
                  className={`text-2xl font-black ${
                    resultado.aprobado ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {resultado.puntaje}%
                </span>
              </div>

              <div className="rounded-xl bg-card border px-4 py-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Aciertos
                </span>
                <span className="text-2xl font-black text-foreground">
                  {resultado.aciertos} / {resultado.totalPreguntas}
                </span>
              </div>

              <div className="rounded-xl bg-card border px-4 py-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Requerido
                </span>
                <span className="text-2xl font-black text-muted-foreground">
                  {resultado.porcentajeMinimo}%
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
              {resultado.aprobado
                ? "Tu resultado ha sido guardado exitosamente y la lección quedó marcada como completada para tu Constancia Oficial."
                : "Para proteger la calidad de tu aprendizaje y de tu certificación, las respuestas no se revelan hasta que alcances la nota mínima de aprobación. ¡Repasa la clase y vuelve a intentarlo!"}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {tieneIntentosDisponibles && (
                <Button
                  onClick={iniciarEvaluacion}
                  variant={resultado.aprobado ? "outline" : "default"}
                  className={`text-xs font-bold gap-2 cursor-pointer ${
                    !resultado.aprobado
                      ? "bg-[#1e3a8a] text-white hover:bg-[#16294f] dark:bg-blue-600"
                      : ""
                  }`}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Volver a rendir cuestionario</span>
                </Button>
              )}

              <Button
                onClick={() => {
                  setFase("portada");
                  setTimeout(scrollAlTecho, 50);
                }}
                variant="outline"
                className="text-xs font-bold cursor-pointer"
              >
                Volver a la portada
              </Button>
            </div>
          </div>

          {/* Si NO APROBÓ: Panel Pedagógico Protector sin revelar respuestas */}
          {!resultado.aprobado ? (
            <div className="p-6 sm:p-8 rounded-2xl border border-dashed bg-muted/20 text-center space-y-3 m-4 sm:m-6">
              <div className="inline-flex p-3 rounded-full bg-blue-500/10 text-[#1e3a8a] dark:text-blue-400">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-foreground">
                ¡El verdadero aprendizaje requiere repaso y dedicación!
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Para garantizar que domines la técnica antes de obtener tu constancia, las respuestas correctas se mantienen reservadas. Te sugerimos repasar los videos y materiales de esta clase antes de rendir tu siguiente intento.
              </p>
              {tieneIntentosDisponibles && (
                <div className="pt-2">
                  <Button
                    onClick={iniciarEvaluacion}
                    className="bg-[#1e3a8a] text-white hover:bg-[#16294f] dark:bg-blue-600 dark:hover:bg-blue-700 text-xs font-bold gap-2 cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reintentar Evaluación Ahora</span>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Si APROBÓ: Mostrar la revisión detallada con retroalimentación para consolidar el conocimiento */
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wide">
                  Revisión Detallada de Preguntas y Retroalimentación
                </h3>
              </div>

              <div className="space-y-4">
                {quiz.preguntas.map((pregunta, indexPreg) => {
                  const retro = resultado.retroalimentacion.find(
                    (r) => r.preguntaId === pregunta.id
                  );
                  const esAcierto = Boolean(retro?.esCorrecta);
                  const opcionElegidaId = respuestas[pregunta.id];
                  const opcionElegida = pregunta.opciones.find(
                    (o) => o.id === opcionElegidaId
                  );

                  return (
                    <div
                      key={pregunta.id}
                      className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${
                        esAcierto
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-rose-500/30 bg-rose-500/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-card border text-xs font-bold text-foreground mt-0.5">
                            {indexPreg + 1}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-foreground">
                            {pregunta.enunciado}
                          </h4>
                        </div>

                        <Badge
                          className={`text-[10px] font-bold shrink-0 ${
                            esAcierto
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                          }`}
                        >
                          {esAcierto ? "Correcta" : "Incorrecta"}
                        </Badge>
                      </div>

                      {/* Tu respuesta */}
                      <div className="text-xs space-y-1 pl-8">
                        <p className="text-muted-foreground">
                          Tu respuesta:{" "}
                          <span className="font-bold text-foreground">
                            {opcionElegida ? opcionElegida.texto : "(Sin responder)"}
                          </span>
                        </p>

                        {/* Explicación pedagógica si la hay */}
                        {retro?.explicacion && (
                          <div className="mt-2 rounded-xl bg-card border p-3 text-xs text-muted-foreground leading-relaxed">
                            <span className="font-bold text-foreground block mb-0.5">
                              💡 Retroalimentación de Amorelo:
                            </span>
                            {retro.explicacion}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
