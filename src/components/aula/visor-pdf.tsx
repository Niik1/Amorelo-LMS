"use client";

import * as React from "react";
import { FileText, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface VisorPdfProps {
  url?: string | null;
  titulo: string;
}

export function VisorPdf({ url, titulo }: VisorPdfProps) {
  if (!url) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl border bg-slate-900 text-slate-400">
        <div className="flex flex-col items-center gap-2 p-6 text-center">
          <FileText className="h-10 w-10 text-slate-500" />
          <p className="text-sm font-medium">No se ha vinculado un archivo PDF para esta clase.</p>
        </div>
      </div>
    );
  }

  // Si es enlace de Google Drive, aseguramos /preview para que el visor de Google funcione embebido
  let embedUrl = url;
  if (url.includes("drive.google.com")) {
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
    if (driveMatch && driveMatch[1]) {
      embedUrl = `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-lg">
      {/* Barra superior estilo Blackboard */}
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-emerald-500/20 bg-emerald-500/10 text-xs font-bold text-emerald-600 dark:text-emerald-400"
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Documento PDF
          </Badge>
          <span className="hidden text-xs font-semibold text-muted-foreground sm:inline line-clamp-1">
            {titulo}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Visor protegido</span>
        </div>
      </div>

      {/* Visor interactivo embebido */}
      <div className="relative h-[550px] sm:h-[700px] w-full bg-slate-950">
        <iframe
          src={embedUrl}
          title={titulo}
          className="h-full w-full border-0"
          allow="fullscreen"
          loading="lazy"
        />

        {/* Escudo transparente en esquina superior derecha:
            Bloquea el botón de salida externa (pop-out) que redirigiría fuera del aula */}
        <div
          className="absolute top-0 right-0 z-20 h-16 w-24 bg-transparent cursor-default select-none pointer-events-auto"
          aria-hidden="true"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      </div>
    </div>
  );
}
