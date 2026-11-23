"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { Button } from "@/components/ui/button";
import {
  registrarEnvioProyectoWhatsApp,
  type EstadoProyecto,
} from "@/server/aula/proyectos";
import { toast } from "sonner";

const WHATSAPP_NUMERO = "51924614131"; // Número oficial Amorelo

interface BotonEnviarProyectoWhatsAppProps {
  proyectoId: string;
  matriculaId: string;
  nombreAlumno: string;
  cursoNombre: string;
  moduloTitulo: string;
  tituloProyecto: string;
  estadoActual?: EstadoProyecto;
  onEstadoCambiado?: (nuevoEstado: EstadoProyecto) => void;
  variante?: "default" | "reenviar";
  className?: string;
}

export function BotonEnviarProyectoWhatsApp({
  proyectoId,
  matriculaId,
  nombreAlumno,
  cursoNombre,
  moduloTitulo,
  tituloProyecto,
  estadoActual = "pendiente",
  onEstadoCambiado,
  variante = "default",
  className,
}: BotonEnviarProyectoWhatsAppProps) {
  const [isPending, startTransition] = useTransition();

  const handleEnviar = () => {
    startTransition(async () => {
      // 1. Mensaje codificado dinámico sin nombres personales, dirigido a Amorelo
      const mensaje =
        `¡Hola Amorelo! Soy ${nombreAlumno}. Te envío la foto de mi proyecto "${tituloProyecto}" ` +
        `del curso "${cursoNombre}", ${moduloTitulo} para su revisión y calificación. ¡Espero sus comentarios!`;

      const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;

      // 2. Registrar el envío en base de datos para seguimiento
      const res = await registrarEnvioProyectoWhatsApp({
        proyectoId,
        matriculaId,
      });

      if (!res.ok) {
        toast.error(res.error || "No se pudo registrar el envío del proyecto.");
        return;
      }

      if (onEstadoCambiado) {
        onEstadoCambiado("enviado_whatsapp");
      }

      toast.success(
        "¡Envío registrado! Envia tu foto por WhatsApp para que el equipo de Amorelo la califique."
      );

      // 3. Abrir WhatsApp en nueva pestaña
      window.open(url, "_blank", "noopener,noreferrer");
    });
  };

  const textoBoton =
    variante === "reenviar"
      ? "Reenviar corrección por WhatsApp"
      : "Enviar proyecto por WhatsApp";

  return (
    <Button
      type="button"
      onClick={handleEnviar}
      disabled={isPending}
      className={`bg-emerald-600 font-bold text-white shadow-md hover:bg-emerald-700 active:scale-[0.99] transition-all ${className || ""}`}
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <WhatsappIcon className="mr-2 h-4 w-4 fill-current" />
      )}
      <span>{isPending ? "Preparando WhatsApp..." : textoBoton}</span>
    </Button>
  );
}
