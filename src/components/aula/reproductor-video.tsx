"use client";

import * as React from "react";
import { AlertCircle, ExternalLink, Play, VideoOff } from "lucide-react";
import { DriveVideo } from "@/components/DriveVideo";

interface ReproductorVideoProps {
  url?: string | null;
  titulo?: string;
}

export type TipoVideo = "drive" | "youtube" | "vimeo" | "loom" | "directo" | "desconocido";

export interface VideoParsed {
  tipo: TipoVideo;
  embedUrl: string;
}

export function parsearVideoUrl(rawUrl?: string | null): VideoParsed | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const url = rawUrl.trim();
  if (!url) return null;

  // 1. Google Drive
  // Formatos: drive.google.com/file/d/ID/... o drive.google.com/open?id=ID o drive.google.com/uc?id=ID
  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (driveFileMatch && driveFileMatch[1]) {
    return {
      tipo: "drive",
      embedUrl: `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`,
    };
  }

  const driveIdMatch = url.match(/drive\.google\.com\/(?:open|uc)\?(?:[^&]*&)*id=([a-zA-Z0-9_-]+)/i);
  if (driveIdMatch && driveIdMatch[1]) {
    return {
      tipo: "drive",
      embedUrl: `https://drive.google.com/file/d/${driveIdMatch[1]}/preview`,
    };
  }

  // 2. YouTube
  // Formatos: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    return {
      tipo: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`,
    };
  }

  // 3. Vimeo
  // Formatos: vimeo.com/123456789 o player.vimeo.com/video/123456789
  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      tipo: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0`,
    };
  }

  // 4. Loom
  // Formatos: loom.com/share/ID o loom.com/embed/ID
  const loomMatch = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/i);
  if (loomMatch && loomMatch[1]) {
    return {
      tipo: "loom",
      embedUrl: `https://www.loom.com/embed/${loomMatch[1]}`,
    };
  }

  // 5. Archivo directo (.mp4, .webm, .ogg o CDN)
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) || url.startsWith("blob:") || url.includes("/storage/v1/")) {
    return {
      tipo: "directo",
      embedUrl: url,
    };
  }

  // Fallback si empieza con http
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return {
      tipo: "directo",
      embedUrl: url,
    };
  }

  return {
    tipo: "desconocido",
    embedUrl: url,
  };
}

export function ReproductorVideo({ url, titulo }: ReproductorVideoProps) {
  const parsed = React.useMemo(() => parsearVideoUrl(url), [url]);

  if (!url || !parsed) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-slate-900 text-slate-400">
        <div className="flex flex-col items-center gap-2 p-6 text-center">
          <VideoOff className="h-10 w-10 text-slate-500" />
          <p className="text-sm font-medium">Esta lección no tiene video asignado aún.</p>
        </div>
      </div>
    );
  }

  // 1. Si es Google Drive, usamos el componente especializado con layout responsive optimizado para móvil
  if (parsed.tipo === "drive") {
    return <DriveVideo url={url} titulo={titulo} />;
  }

  // 2. Si es YouTube, Vimeo o Loom, usamos un iframe seguro y responsive
  if (
    parsed.tipo === "youtube" ||
    parsed.tipo === "vimeo" ||
    parsed.tipo === "loom"
  ) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-lg">
        <iframe
          src={parsed.embedUrl}
          title={titulo ?? "Video de la lección"}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  // Si es video directo (HTML5)
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      <video
        src={parsed.embedUrl}
        controls
        controlsList="nodownload"
        className="h-full w-full"
        playsInline
        preload="metadata"
      >
        Tu navegador no soporta la reproducción de video HTML5.
      </video>
    </div>
  );
}
