"use client";

import { useState } from "react";
import {
  Calendar,
  Check,
  Copy,
  Download,
  ExternalLink,
  MapPin,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AccionesTicket({
  token,
  ticketCodigo,
  tallerNombre,
  fechaInicio,
  fechaFin,
  lugar,
  direccion,
  mapsUrl,
  className,
  esVencida = false,
}: {
  token: string;
  ticketCodigo: string;
  tallerNombre: string;
  fechaInicio: string;
  fechaFin: string;
  lugar: string;
  direccion?: string | null;
  mapsUrl?: string | null;
  className?: string;
  esVencida?: boolean;
}) {
  const [copiado, setCopiado] = useState(false);

  const handleCopiarEnlace = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setCopiado(true);
        toast.success("Enlace del ticket copiado al portapapeles");
        setTimeout(() => setCopiado(false), 2500);
      }
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  // Generar URL para Google Calendar
  const generarGoogleCalendarUrl = () => {
    try {
      const inicio = new Date(fechaInicio)
        .toISOString()
        .replace(/-|:|\.\d\d\d/g, "");
      const fin = new Date(fechaFin)
        .toISOString()
        .replace(/-|:|\.\d\d\d/g, "");
      const titulo = encodeURIComponent(`Taller Amorelo: ${tallerNombre}`);
      const ubicacion = encodeURIComponent(
        `${lugar}${direccion ? `, ${direccion}` : ""}`
      );
      const detalles = encodeURIComponent(
        `Tu entrada oficial para el Taller Presencial de Decoración y Globos Amorelo.\nCódigo de Ticket: ${ticketCodigo}\nMuestra tu QR al ingresar.`
      );
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${inicio}/${fin}&details=${detalles}&location=${ubicacion}`;
    } catch {
      return "#";
    }
  };

  // Ubicación en Google Maps (Modelo Híbrido: Si hay URL manual exacta se usa; si no, busca por texto)
  const queryMaps = encodeURIComponent(
    `${lugar}${direccion ? `, ${direccion}` : ""}`
  );
  const mapsFinalUrl =
    mapsUrl && mapsUrl.trim().length > 0
      ? mapsUrl.trim()
      : `https://www.google.com/maps/search/?api=1&query=${queryMaps}`;

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-2 pt-2", className)}>
      {/* Botón Descargar PDF si no está vencida */}
      {!esVencida ? (
        <a
          href={`/api/tickets/${token}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#1e3a8a] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#16294f] active:scale-95 transition-all dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          <Download className="size-3.5" />
          <span>Descargar Ticket PDF</span>
        </a>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-4 py-2.5 text-xs font-bold text-muted-foreground cursor-not-allowed">
          Ticket Inactivo / Anulado
        </span>
      )}

      {/* Botón Google Maps */}
      <a
        href={mapsFinalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <MapPin className="size-3.5 text-rose-500 dark:text-rose-400" />
        <span>Ver en Maps</span>
        <ExternalLink className="size-3 text-slate-400 dark:text-slate-400 ml-0.5" />
      </a>

      {/* Botón Agregar a Calendario */}
      {!esVencida && (
        <a
          href={generarGoogleCalendarUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <Calendar className="size-3.5 text-blue-600 dark:text-sky-400" />
          <span>Guardar en Calendario</span>
        </a>
      )}

      {/* Botón Compartir / Copiar */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopiarEnlace}
        className="h-9 gap-1.5 rounded-full px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
      >
        {copiado ? (
          <Check className="size-3.5 text-emerald-500" />
        ) : (
          <Share2 className="size-3.5 text-slate-500 dark:text-slate-400" />
        )}
        <span>{copiado ? "¡Copiado!" : "Compartir"}</span>
      </Button>
    </div>
  );
}
