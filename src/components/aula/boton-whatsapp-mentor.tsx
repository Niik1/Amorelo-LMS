// Botón de asesoría por WhatsApp con mensaje prellenado (RF-EST-36).
// Abre WhatsApp con el nombre del alumno, curso, módulo y lección.

"use client";

import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { Button } from "@/components/ui/button";

const WHATSAPP_NUMERO = "51924614131"; // Número oficial Amorelo

export function BotonWhatsAppMentor({
  nombreAlumno,
  cursoNombre,
  moduloTitulo,
  leccionTitulo,
}: {
  nombreAlumno: string;
  cursoNombre: string;
  moduloTitulo: string;
  leccionTitulo: string;
}) {
  const mensaje = encodeURIComponent(
    `Hola Amorelo, soy ${nombreAlumno}. Estoy viendo el curso "${cursoNombre}", ` +
      `Módulo "${moduloTitulo}", Lección "${leccionTitulo}" y tengo una consulta: `,
  );

  const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${mensaje}`;

  return (
    <Button
      variant="outline"
      className="border-emerald-500/30 font-bold text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
      onClick={() => window.open(url, "_blank")}
    >
      <WhatsappIcon className="mr-2 h-4 w-4 fill-current shrink-0" />
      Consultar al profesor
    </Button>
  );
}
