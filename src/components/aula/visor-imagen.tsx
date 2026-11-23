"use client";

import * as React from "react";
import { Image as ImageIcon, ZoomIn, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface VisorImagenProps {
  url?: string | null;
  titulo: string;
}

export function VisorImagen({ url, titulo }: VisorImagenProps) {
  const [zoom, setZoom] = React.useState(false);

  if (!url) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl border bg-slate-900 text-slate-400">
        <div className="flex flex-col items-center gap-2 p-6 text-center">
          <ImageIcon className="h-10 w-10 text-slate-500" />
          <p className="text-sm font-medium">No se ha cargado una imagen para esta clase.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border bg-black shadow-lg">
        {/* Barra superior de herramientas de imagen */}
        <div className="flex items-center justify-between border-b border-white/10 bg-black/60 px-4 py-2.5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-white/20 bg-white/10 text-xs text-white">
              <ImageIcon className="mr-1 h-3 w-3" />
              Infografía / Canva
            </Badge>
            <span className="hidden text-xs text-white/70 sm:inline line-clamp-1">
              {titulo}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setZoom(true)}
              className="h-7 gap-1 px-2 text-xs text-white hover:bg-white/20 hover:text-white"
            >
              <ZoomIn className="h-3.5 w-3.5" />
              <span>Ampliar</span>
            </Button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Abrir original</span>
            </a>
          </div>
        </div>

        {/* Visor de la Imagen */}
        <div
          onClick={() => setZoom(true)}
          className="flex min-h-[300px] sm:min-h-[420px] max-h-[680px] w-full cursor-zoom-in items-center justify-center bg-slate-950 p-2 sm:p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={titulo}
            className="max-h-[650px] w-auto max-w-full rounded-lg object-contain shadow-2xl transition-transform hover:scale-[1.01]"
            loading="lazy"
          />
        </div>
      </div>

      {/* Modal Lightbox de Pantalla Completa */}
      {zoom && (
        <div
          onClick={() => setZoom(false)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/95 p-4 backdrop-blur-md animate-in fade-in-0 duration-200"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={titulo}
            className="max-h-[92vh] max-w-[95vw] rounded-lg object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
