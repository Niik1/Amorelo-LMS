"use client";

import * as React from "react";
import { AlertCircle, VideoOff } from "lucide-react";

/**
 * Constantes de dimensionamiento para la técnica "ancho virtual + scale":
 * - VIRTUAL_WIDTH: Ancho simulado que percibe el iframe para forzar la interfaz de escritorio de Google Drive.
 * - RATIO: Relación de aspecto 4:3 usada en móvil (0.75).
 * - VIRTUAL_HEIGHT: Alto virtual de referencia (donde la cinta de Drive se ve bien).
 */
export const VIRTUAL_WIDTH = 750;
export const RATIO = 0.75;
export const VIRTUAL_HEIGHT = Math.round(VIRTUAL_WIDTH * RATIO);

export interface DriveVideoProps {
  url?: string | null;
  title?: string;
  titulo?: string;
  className?: string;
}

export function extraerDriveId(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const url = rawUrl.trim();
  if (!url) return null;

  const matchFileD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (matchFileD?.[1]) return matchFileD[1];

  const matchQueryId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (matchQueryId?.[1]) return matchQueryId[1];

  if (/^[a-zA-Z0-9_-]{20,}$/.test(url)) {
    return url;
  }

  return null;
}

type FsMode = "none" | "container" | "other";

type FsDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void;
};

const exitAnyFullscreen = () => {
  const d = document as FsDocument;
  try {
    (d.exitFullscreen ?? d.webkitExitFullscreen)?.call(d);
  } catch {
    /* ignorar */
  }
};

/**
 * Reproductor de Google Drive con "ancho virtual + scale":
 * - Móvil vertical: iframe de 750x563 virtuales escalado al ancho real.
 * - Móvil en pantalla completa: el CONTENEDOR entra en fullscreen (horizontal).
 * - Al salir de pantalla completa (botón de Drive o cualquier otro), se vuelve
 *   directo a la miniatura de la lección, sin pasar por un fullscreen vertical.
 * - Escritorio (scale = 1): 100% nativo, sin transformaciones.
 */
export function DriveVideo({ url, title, titulo, className = "" }: DriveVideoProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const ownFsRef = React.useRef(false); // el contenedor está / estuvo en fullscreen propio
  const closingRef = React.useRef(false); // estamos saliendo por completo
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const [fsMode, setFsMode] = React.useState<FsMode>("none");
  const [canFs, setCanFs] = React.useState(false);

  const fileId = React.useMemo(() => extraerDriveId(url), [url]);
  const videoTitle = title ?? titulo ?? "Video de la clase";

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const c = container as HTMLDivElement & {
      webkitRequestFullscreen?: () => void;
    };
    setCanFs(
      typeof c.requestFullscreen === "function" ||
        typeof c.webkitRequestFullscreen === "function"
    );

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) setSize({ w: width, h: height });
      }
    });
    observer.observe(container);

    const unlockOrientation = () => {
      try {
        screen.orientation?.unlock?.();
      } catch {
        /* ignorar */
      }
    };

    const handleFs = () => {
      const d = document as FsDocument;
      const el = d.fullscreenElement ?? d.webkitFullscreenElement ?? null;

      // 1) Nada en fullscreen: volvimos a la miniatura
      if (!el) {
        ownFsRef.current = false;
        closingRef.current = false;
        setFsMode("none");
        unlockOrientation();
        return;
      }

      // 2) El contenedor está en fullscreen
      if (el === container) {
        // Si estábamos cerrando (el iframe de Drive pidió su propio fullscreen
        // y ya salimos de él), salimos también del contenedor.
        if (closingRef.current) {
          exitAnyFullscreen();
          return;
        }
        ownFsRef.current = true;
        setFsMode("container");
        try {
          const orientation = screen.orientation as ScreenOrientation & {
            lock?: (o: string) => Promise<void>;
          };
          orientation?.lock?.("landscape")?.catch(() => {});
        } catch {
          /* ignorar */
        }
        return;
      }

      // 3) Otro elemento (el iframe de Drive) tomó el fullscreen.
      //    Si veníamos de fullscreen propio, significa que tocaron el botón
      //    "salir" de Drive: cerramos todo para volver a la miniatura.
      if (ownFsRef.current) {
        closingRef.current = true;
        exitAnyFullscreen();
        return;
      }

      setFsMode("other");
    };

    document.addEventListener("fullscreenchange", handleFs);
    document.addEventListener("webkitfullscreenchange", handleFs);

    return () => {
      observer.disconnect();
      document.removeEventListener("fullscreenchange", handleFs);
      document.removeEventListener("webkitfullscreenchange", handleFs);
    };
  }, []);

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const c = containerRef.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => void })
      | null;
    if (!c) return;

    const d = document as FsDocument;
    const current = d.fullscreenElement ?? d.webkitFullscreenElement;

    if (current) {
      closingRef.current = true;
      exitAnyFullscreen();
    } else {
      closingRef.current = false;
      (c.requestFullscreen ?? c.webkitRequestFullscreen)?.call(c);
    }
  };

  if (!url) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-slate-900 text-slate-400">
        <div className="flex flex-col items-center gap-2 p-6 text-center">
          <VideoOff className="h-10 w-10 text-slate-500" />
          <p className="text-sm font-medium">Esta lección no tiene video asignado aún.</p>
        </div>
      </div>
    );
  }

  if (!fileId) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-amber-500/20 bg-slate-900 text-slate-400">
        <div className="flex flex-col items-center gap-2 p-6 text-center">
          <AlertCircle className="h-10 w-10 text-amber-500" />
          <p className="text-sm font-medium text-slate-300">
            No se pudo cargar el video de Google Drive.
          </p>
          <p className="text-xs text-slate-500">
            Verifica que el enlace sea un enlace de compartir válido de Google Drive.
          </p>
        </div>
      </div>
    );
  }

  const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  const inOwnFs = fsMode === "container";

  // Escala: por ancho siempre; en fullscreen propio también por alto
  let scale = 1;
  if (size.w > 0) {
    scale = Math.min(1, size.w / VIRTUAL_WIDTH);
    if (inOwnFs && size.h > 0) {
      scale = Math.min(scale, size.h / VIRTUAL_HEIGHT);
    }
  }
  const isScaled = scale < 1 && fsMode !== "other";

  const iframeStyle: React.CSSProperties = isScaled
    ? {
        position: "absolute",
        left: 0,
        top: 0,
        width: inOwnFs ? `${Math.round(size.w / scale)}px` : `${VIRTUAL_WIDTH}px`,
        height: inOwnFs ? `${Math.round(size.h / scale)}px` : `${VIRTUAL_HEIGHT}px`,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }
    : {
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
      };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-black shadow-lg ${
        inOwnFs ? "h-full rounded-none" : "aspect-[4/3] sm:aspect-video rounded-2xl"
      } ${className}`}
    >
      <iframe
        src={embedUrl}
        title={videoTitle}
        style={iframeStyle}
        className="border-0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
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

      {/* Solo móvil: cubre el botón de pantalla completa de Drive.
          - En miniatura: entra a fullscreen del CONTENEDOR (conserva el escalado).
          - En fullscreen: sale y vuelve a la miniatura. */}
      {isScaled && canFs && (
        <button
          type="button"
          aria-label={inOwnFs ? "Salir de pantalla completa" : "Pantalla completa"}
          onClick={toggleFullscreen}
          className="absolute bottom-0 right-0 z-10 h-11 w-11 bg-transparent"
        />
      )}
    </div>
  );
}

export default DriveVideo;
