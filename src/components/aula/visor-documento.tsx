"use client";

import * as React from "react";
import { BookOpen, Sparkles, MessageCircle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface VisorDocumentoProps {
  titulo: string;
  contenido?: string | null;
  moduloTitulo: string;
  orden: number;
}

export function VisorDocumento({
  titulo,
  contenido,
  moduloTitulo,
  orden,
}: VisorDocumentoProps) {
  // Procesa el texto para renderizar párrafos, viñetas ("bolitos") y enlaces
  const renderContenido = (texto?: string | null) => {
    if (!texto) {
      return (
        <p className="text-sm italic text-muted-foreground">
          Esta lección de lectura aún no tiene contenido escrito.
        </p>
      );
    }

    const lineas = texto.split("\n");

    return (
      <div className="space-y-3 text-sm leading-relaxed sm:text-base sm:leading-relaxed text-foreground/90">
        {lineas.map((linea, index) => {
          const l = linea.trim();
          if (!l) return <div key={index} className="h-2" />;

          // Viñetas: Si empieza con "-", "*", "•"
          if (l.startsWith("- ") || l.startsWith("* ") || l.startsWith("• ")) {
            const itemTexto = l.substring(2);
            return (
              <div key={index} className="flex items-start gap-2.5 pl-2 sm:pl-4">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1e3a8a] dark:bg-blue-400" />
                <span className="text-foreground/90">{itemTexto}</span>
              </div>
            );
          }

          // Pasos numerados: ej "1.", "2."
          const matchPaso = l.match(/^(\d+)\.\s*(.+)/);
          if (matchPaso) {
            return (
              <div key={index} className="flex items-start gap-3 pl-2 sm:pl-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold text-[#1e3a8a] dark:bg-blue-950 dark:text-blue-300">
                  {matchPaso[1]}
                </span>
                <span className="pt-0.5 text-foreground/90 font-medium">{matchPaso[2]}</span>
              </div>
            );
          }

          // Subtítulos tipo markdown "### Subtitulo" o "## "
          if (l.startsWith("### ")) {
            return (
              <h3 key={index} className="pt-3 text-base font-bold text-foreground sm:text-lg">
                {l.substring(4)}
              </h3>
            );
          }
          if (l.startsWith("## ")) {
            return (
              <h2 key={index} className="pt-4 text-lg font-extrabold text-foreground sm:text-xl">
                {l.substring(3)}
              </h2>
            );
          }

          // Párrafo normal
          return (
            <p key={index} className="text-foreground/80">
              {linea}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-10 transition-colors">
      {/* Cabecera estilo Blackboard Ultra */}
      <div className="mb-6 border-b pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-blue-500/20 bg-blue-500/10 text-xs font-bold text-[#1e3a8a] dark:text-blue-400"
          >
            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
            Lectura y Guía
          </Badge>
          <span className="text-xs font-semibold text-muted-foreground">
            {moduloTitulo} • Lección {orden}
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          {titulo}
        </h1>
      </div>

      {/* Cuerpo editorial de la lección */}
      <div className="prose prose-slate dark:prose-invert max-w-none">
        {renderContenido(contenido)}
      </div>
    </div>
  );
}
