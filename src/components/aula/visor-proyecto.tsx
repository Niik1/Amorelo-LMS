"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Maximize2,
  FileText,
  Camera,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { BotonEnviarProyectoWhatsApp } from "./boton-enviar-proyecto-whatsapp";
import type { DetalleProyectoLeccion, EstadoProyecto } from "@/server/aula/proyectos";

interface VisorProyectoProps {
  proyecto: DetalleProyectoLeccion;
  matriculaId: string;
  nombreAlumno: string;
  cursoNombre: string;
  moduloTitulo: string;
  leccionTitulo: string;
}

export function VisorProyecto({
  proyecto,
  matriculaId,
  nombreAlumno,
  cursoNombre,
  moduloTitulo,
  leccionTitulo,
}: VisorProyectoProps) {
  const [estadoEntrega, setEstadoEntrega] = useState<EstadoProyecto>(
    proyecto.entrega?.estado || "pendiente"
  );
  const [modalFotoAbierto, setModalFotoAbierto] = useState(false);

  const fechaEnvioFormateada = proyecto.entrega?.fecha_envio_whatsapp
    ? new Date(proyecto.entrega.fecha_envio_whatsapp).toLocaleDateString("es-PE", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const fechaAprobacionFormateada = proyecto.entrega?.fecha_aprobacion
    ? new Date(proyecto.entrega.fecha_aprobacion).toLocaleDateString("es-PE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Banner de Estado de Entrega */}
      {estadoEntrega === "aprobado" && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-900 dark:text-emerald-200">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300">
              ¡Proyecto aprobado con éxito por Amorelo! 🎉
            </h3>
            <p className="mt-1 text-xs text-emerald-700/90 dark:text-emerald-300/80 leading-relaxed">
              Tu trabajo práctico ha sido evaluado y validado.
              {fechaAprobacionFormateada && ` Fecha de aprobación: ${fechaAprobacionFormateada}.`}
              {" "}Este proyecto cuenta como completado para la emisión de tu Constancia Oficial.
            </p>
          </div>
        </div>
      )}

      {estadoEntrega === "enviado_whatsapp" && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
          <Clock className="h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-extrabold text-amber-800 dark:text-amber-300">
                En espera de revisión por el equipo de Amorelo
              </h3>
              {fechaEnvioFormateada && (
                <span className="text-[11px] font-semibold text-amber-700/80 dark:text-amber-300/70">
                  • Enviado el {fechaEnvioFormateada}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-amber-700/90 dark:text-amber-300/80 leading-relaxed">
              Registramos el envío de tu proyecto. El equipo de Amorelo revisará tu foto por WhatsApp y
              actualizará tu calificación en el aula.
            </p>
            <div className="mt-3">
              <BotonEnviarProyectoWhatsApp
                proyectoId={proyecto.id}
                matriculaId={matriculaId}
                nombreAlumno={nombreAlumno}
                cursoNombre={cursoNombre}
                moduloTitulo={moduloTitulo}
                tituloProyecto={proyecto.titulo_proyecto}
                estadoActual={estadoEntrega}
                onEstadoCambiado={setEstadoEntrega}
                variante="reenviar"
                className="text-xs h-9"
              />
            </div>
          </div>
        </div>
      )}

      {estadoEntrega === "observado" && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-900 dark:text-rose-200">
          <AlertCircle className="h-6 w-6 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-extrabold text-rose-800 dark:text-rose-300">
              Tu proyecto tiene observaciones del equipo de Amorelo
            </h3>
            {proyecto.entrega?.comentarios_admin ? (
              <div className="mt-2 rounded-xl bg-white/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3 text-xs text-rose-950 dark:text-rose-100">
                <span className="font-bold block mb-1">Notas de corrección:</span>
                <p className="whitespace-pre-line">{proyecto.entrega.comentarios_admin}</p>
              </div>
            ) : (
              <p className="mt-1 text-xs text-rose-700/90 dark:text-rose-300/80 leading-relaxed">
                Por favor revisa los comentarios recibidos por WhatsApp, realiza las mejoras en tu práctica y vuelve a enviarlo cuando esté listo.
              </p>
            )}
            <div className="mt-3">
              <BotonEnviarProyectoWhatsApp
                proyectoId={proyecto.id}
                matriculaId={matriculaId}
                nombreAlumno={nombreAlumno}
                cursoNombre={cursoNombre}
                moduloTitulo={moduloTitulo}
                tituloProyecto={proyecto.titulo_proyecto}
                estadoActual={estadoEntrega}
                onEstadoCambiado={setEstadoEntrega}
                variante="reenviar"
              />
            </div>
          </div>
        </div>
      )}

      {estadoEntrega === "pendiente" && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-50/60 dark:bg-blue-950/20 p-4 text-blue-950 dark:text-blue-200">
          <Info className="h-5 w-5 shrink-0 text-[#1e3a8a] dark:text-blue-400 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-bold text-[#1e3a8a] dark:text-blue-300 uppercase tracking-wide">
              Paso a paso de entrega
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Aún no has enviado este proyecto. Lee las instrucciones, elabora tu diseño guiándote de la foto modelo y cuando lo tengas listo, tómale una foto clara y presiona el botón para enviarlo a Amorelo por WhatsApp.
            </p>
          </div>
        </div>
      )}

      {/* 2. Tarjeta Principal del Proyecto */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b bg-muted/30 px-5 py-4 dark:bg-muted/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1e3a8a]/10 text-[#1e3a8a] dark:bg-blue-400/20 dark:text-blue-300 shrink-0">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1e3a8a] dark:text-blue-400 block">
                  {moduloTitulo}
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-foreground">
                  {proyecto.titulo_proyecto}
                </h2>
              </div>
            </div>
            {proyecto.es_obligatorio ? (
              <Badge className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700/60 font-extrabold shadow-none hover:bg-amber-100">
                Obligatorio para Constancia
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs font-medium">
                Proyecto Opcional
              </Badge>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* FOTO MODELO DE REFERENCIA */}
          {proyecto.foto_referencia_url ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5" />
                  Foto Modelo de Referencia
                </span>
                <span className="text-[11px] text-muted-foreground">
                  (Haz clic sobre la imagen para ampliar)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setModalFotoAbierto(true)}
                className="group relative aspect-video sm:aspect-[16/9] w-full max-h-[460px] overflow-hidden rounded-xl border bg-muted/20 cursor-zoom-in shadow-inner text-left focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                aria-label="Ver foto modelo ampliada"
              >
                <Image
                  src={proyecto.foto_referencia_url}
                  alt={proyecto.titulo_proyecto}
                  fill
                  className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                  sizes="(max-width: 1024px) 100vw, 800px"
                  priority
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-sm">
                  <Maximize2 className="h-5 w-5" />
                  <span>Ver foto ampliada</span>
                </div>
              </button>

              <Dialog open={modalFotoAbierto} onOpenChange={setModalFotoAbierto}>
                <DialogContent className="max-w-4xl p-2 sm:p-4 bg-background/95 backdrop-blur-md">
                  <DialogTitle className="text-sm font-bold px-2 pt-2 text-foreground">
                    Modelo de referencia: {proyecto.titulo_proyecto}
                  </DialogTitle>
                  <div className="relative aspect-[4/3] sm:aspect-[16/9] w-full max-h-[80vh] overflow-hidden rounded-lg mt-2">
                    <Image
                      src={proyecto.foto_referencia_url}
                      alt={proyecto.titulo_proyecto}
                      fill
                      className="object-contain"
                      sizes="100vw"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : null}

          {/* INSTRUCCIONES DEL PROYECTO */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a] dark:text-blue-400 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Instrucciones del Proyecto
            </span>
            <div className="rounded-xl border bg-muted/20 p-4 sm:p-5">
              {proyecto.instrucciones ? (
                <div className="text-sm leading-relaxed text-foreground whitespace-pre-line space-y-2">
                  {proyecto.instrucciones}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Sigue las indicaciones de la clase para elaborar tu práctica y envíala a través de WhatsApp para recibir retroalimentación.
                </p>
              )}
            </div>
          </div>

          {/* BOTÓN DE ACCIÓN PRINCIPAL (Si no está aprobado) */}
          {estadoEntrega !== "aprobado" && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border bg-card p-4 sm:p-5 shadow-sm">
              <div className="space-y-0.5 text-center sm:text-left">
                <p className="text-sm font-extrabold text-foreground">
                  ¿Terminaste tu proyecto práctico?
                </p>
                <p className="text-xs text-muted-foreground">
                  Presiona el botón para abrir WhatsApp y adjuntar la foto de tu trabajo final.
                </p>
              </div>

              <BotonEnviarProyectoWhatsApp
                proyectoId={proyecto.id}
                matriculaId={matriculaId}
                nombreAlumno={nombreAlumno}
                cursoNombre={cursoNombre}
                moduloTitulo={moduloTitulo}
                tituloProyecto={proyecto.titulo_proyecto}
                estadoActual={estadoEntrega}
                onEstadoCambiado={setEstadoEntrega}
                variante={estadoEntrega === "observado" ? "reenviar" : "default"}
                className="w-full sm:w-auto"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
