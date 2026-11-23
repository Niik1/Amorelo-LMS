"use client";

import * as React from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Circle,
  FileText,
  Image as ImageIcon,
  Play,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import type { ModuloConLecciones } from "@/server/aula/consultas";

interface TemarioLateralProps {
  modulos: ModuloConLecciones[];
  leccionActivaId: string;
  slug: string;
  totalLecciones: number;
  leccionesCompletadas: number;
  porcentajeAvance: number;
}

export function TemarioLateral({
  modulos,
  leccionActivaId,
  slug,
  totalLecciones,
  leccionesCompletadas,
  porcentajeAvance,
}: TemarioLateralProps) {
  // Estado para controlar qué módulos están abiertos/colapsados
  // Por defecto, abrimos el módulo que contiene la lección activa
  const [modulosAbiertos, setModulosAbiertos] = React.useState<Record<string, boolean>>(() => {
    const estadoInicial: Record<string, boolean> = {};
    modulos.forEach((modulo) => {
      const contieneActiva = modulo.lecciones.some((l) => l.id === leccionActivaId);
      // El módulo con la lección activa siempre arranca abierto; si no hay activa (o primer módulo), abierto también
      estadoInicial[modulo.id] = contieneActiva || modulos.length <= 2;
    });
    return estadoInicial;
  });

  const toggleModulo = (moduloId: string) => {
    setModulosAbiertos((prev) => ({
      ...prev,
      [moduloId]: !prev[moduloId],
    }));
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)]">
      {/* Cabecera del Temario Lateral */}
      <div className="border-b bg-[#1e3a8a] p-4 text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold tracking-tight text-white">
            Contenido del Curso
          </h2>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">
            {leccionesCompletadas}/{totalLecciones}
          </span>
        </div>

        {/* Barra de progreso miniatura */}
        <div className="mt-2.5">
          <div className="mb-1 flex items-center justify-between text-[11px] text-white/80">
            <span>Tu avance</span>
            <span className="font-bold">{porcentajeAvance}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-300"
              style={{ width: `${porcentajeAvance}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lista scrollable de Módulos Colapsables */}
      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {modulos.map((mod) => {
          const estaAbierto = !!modulosAbiertos[mod.id];
          const completadasEnModulo = mod.lecciones.filter((l) => l.completada).length;
          const totalEnModulo = mod.lecciones.length;
          const contieneActiva = mod.lecciones.some((l) => l.id === leccionActivaId);

          return (
            <div key={mod.id} className="py-1">
              {/* Botón Acordeón del Módulo */}
              <button
                type="button"
                onClick={() => toggleModulo(mod.id)}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-muted/40 ${
                  contieneActiva ? "bg-muted/30" : ""
                }`}
                aria-expanded={estaAbierto}
              >
                <div className="flex flex-col pr-2 min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                    Módulo {mod.orden}: {mod.titulo}
                  </p>
                  <span className="text-[10px] text-muted-foreground/70">
                    {completadasEnModulo} de {totalEnModulo} completadas
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                      estaAbierto ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Lista de Lecciones Desplegable */}
              {estaAbierto && (
                <ul className="mt-0.5 space-y-0.5 pb-2 animate-in fade-in-0 duration-150">
                  {mod.lecciones.map((lec) => {
                    const esLaActiva = lec.id === leccionActivaId;
                    return (
                      <li key={lec.id}>
                        <Link
                          href={`/aula/cursos/${slug}/${mod.id}/${lec.id}`}
                          className={`group flex items-center gap-2.5 px-4 py-2 text-xs transition-colors ${
                            esLaActiva
                              ? "border-l-4 border-[#1e3a8a] bg-[#1e3a8a]/10 font-bold text-[#1e3a8a] dark:border-blue-400 dark:bg-blue-500/15 dark:text-blue-400"
                              : "text-foreground hover:bg-muted/50"
                          }`}
                        >
                          {lec.completada ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          ) : esLaActiva ? (
                            <Play className="h-4 w-4 shrink-0 fill-current text-[#1e3a8a] dark:text-blue-400" />
                          ) : lec.tipoContenido === "proyecto" ? (
                            <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          ) : lec.tipoContenido === "quiz" ? (
                            <HelpCircle className="h-3.5 w-3.5 shrink-0 text-[#1e3a8a] dark:text-blue-400" />
                          ) : lec.tipoContenido === "documento" ? (
                            <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                          ) : lec.tipoContenido === "imagen" ? (
                            <ImageIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                          ) : lec.tipoContenido === "pdf" ? (
                            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                          )}
                          <span className="flex-1 truncate">
                            {lec.orden}. {lec.titulo}
                          </span>
                          {lec.tipoContenido === "proyecto" && (
                            <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700/60">
                              Proyecto
                            </span>
                          )}
                          {lec.tipoContenido === "quiz" && (
                            <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-extrabold text-blue-900 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-700/60">
                              Quiz
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
