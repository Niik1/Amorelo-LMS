"use client";

import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Circle,
  ArrowRight,
  BookOpen,
  Award,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EstadoProyecto } from "@/server/aula/proyectos";

export interface ItemProyectoAvance {
  id: string;
  leccion_id: string;
  titulo_proyecto: string;
  es_obligatorio: boolean;
  moduloId: string;
  leccionOrden: number;
  leccionTitulo: string;
  cursoSlug: string;
  estado: EstadoProyecto;
  fecha_envio_whatsapp: string | null;
  fecha_aprobacion: string | null;
  comentarios_admin: string | null;
}

export interface CursoConProyectosResumen {
  cursoId: string;
  cursoNombre: string;
  cursoSlug: string;
  matriculaId: string;
  resumen: {
    totalProyectos: number;
    proyectosObligatorios: number;
    aprobadosCount: number;
    todosAprobados: boolean;
    proyectos: ItemProyectoAvance[];
  };
}

interface IndicadorAvanceProyectosProps {
  cursosConProyectos: CursoConProyectosResumen[];
}

export function IndicadorAvanceProyectos({
  cursosConProyectos,
}: IndicadorAvanceProyectosProps) {
  if (cursosConProyectos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-500" />
        <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
          Avance de Proyectos Prácticos para Constancias
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {cursosConProyectos.map((cursoItem) => {
          const { cursoId, cursoNombre, cursoSlug, resumen } = cursoItem;
          const totalObligatorios = resumen.proyectosObligatorios;
          const aprobados = resumen.aprobadosCount;
          const porcentaje =
            totalObligatorios > 0
              ? Math.min(100, Math.round((aprobados / totalObligatorios) * 100))
              : 100;

          return (
            <div
              key={cursoId}
              className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-all"
            >
              {/* Cabecera del Curso */}
              <div className="border-b bg-muted/30 p-4 sm:p-5 dark:bg-muted/10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1e3a8a]/10 text-[#1e3a8a] dark:bg-blue-400/20 dark:text-blue-300">
                      <BookOpen className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-extrabold text-foreground">
                        {cursoNombre}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {totalObligatorios}{" "}
                        {totalObligatorios === 1
                          ? "proyecto obligatorio requerido"
                          : "proyectos obligatorios requeridos"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-auto">
                    <span className="text-xs font-bold text-muted-foreground">
                      {aprobados} de {totalObligatorios} aprobados
                    </span>
                    <Badge
                      className={`font-bold ${
                        resumen.todosAprobados
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                      }`}
                    >
                      {porcentaje}%
                    </Badge>
                  </div>
                </div>

                {/* Barra de progreso visual */}
                <div className="mt-3.5 space-y-1.5">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        resumen.todosAprobados
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {resumen.todosAprobados ? (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        ✓ ¡Excelente trabajo! Todos los proyectos obligatorios de este curso han sido aprobados por Amorelo.
                      </span>
                    ) : (
                      <span>
                        Para desbloquear tu Constancia Oficial, el equipo de Amorelo debe revisar y aprobar todos los proyectos prácticos del curso.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Lista de Proyectos del Curso */}
              <div className="divide-y divide-border/60">
                {resumen.proyectos.map((proy, idx) => {
                  const urlLeccion = proy.moduloId && proy.leccion_id
                    ? `/aula/cursos/${cursoSlug}/${proy.moduloId}/${proy.leccion_id}`
                    : `/aula/cursos/${cursoSlug}`;

                  return (
                    <div
                      key={proy.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-5 transition-colors hover:bg-muted/20"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 shrink-0">
                          {proy.estado === "aprobado" ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : proy.estado === "enviado_whatsapp" ? (
                            <Clock className="h-5 w-5 text-amber-500" />
                          ) : proy.estado === "observado" ? (
                            <AlertCircle className="h-5 w-5 text-rose-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground/40" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-foreground">
                              {idx + 1}. {proy.titulo_proyecto}
                            </h4>
                            {proy.es_obligatorio ? (
                              <Badge
                                className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700/60 text-[10px] font-extrabold shadow-none hover:bg-amber-100"
                              >
                                Obligatorio
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-semibold text-muted-foreground"
                              >
                                Opcional
                              </Badge>
                            )}
                          </div>

                          {/* Estado explicativo */}
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                            {proy.estado === "aprobado" && (
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                Aprobado por Amorelo 🎉
                              </span>
                            )}
                            {proy.estado === "enviado_whatsapp" && (
                              <span className="font-semibold text-amber-600 dark:text-amber-400">
                                Enviado por WhatsApp • En revisión por Amorelo
                              </span>
                            )}
                            {proy.estado === "observado" && (
                              <span className="font-semibold text-rose-600 dark:text-rose-400">
                                Tiene observaciones para corregir
                              </span>
                            )}
                            {proy.estado === "pendiente" && (
                              <span className="text-muted-foreground">
                                Pendiente de elaboración y envío
                              </span>
                            )}
                          </div>

                          {/* Notas de corrección si las hay */}
                          {proy.estado === "observado" && proy.comentarios_admin && (
                            <div className="mt-2 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 p-2.5 text-xs text-rose-900 dark:text-rose-200">
                              <span className="font-bold">Observación de Amorelo:</span>{" "}
                              {proy.comentarios_admin}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Botón de acceso a la lección */}
                      <div className="self-end sm:self-center shrink-0">
                        <Button
                          variant="default"
                          nativeButton={false}
                          className="h-10 px-4 gap-2 bg-[#1e3a8a] text-sm font-bold text-white shadow-sm hover:bg-[#16294f] dark:bg-blue-600 dark:hover:bg-blue-700"
                          render={<Link href={urlLeccion} />}
                        >
                          <span>
                            {proy.estado === "aprobado"
                              ? "Ver práctica"
                              : proy.estado === "enviado_whatsapp"
                              ? "Ver entrega"
                              : "Ir al proyecto"}
                          </span>
                          <ArrowRight className="h-4 w-4 text-white" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
