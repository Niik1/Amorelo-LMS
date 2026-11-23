// Admin: Módulo de Talleres Presenciales y Control de Acceso.
// Lista de eventos, métricas de ocupación y lanzador de escáner de puerta.
// Fase 4: Item 4.3 y 4.4 del Checklist.

import { CalendarDays } from "lucide-react";
import { ModuloBanner } from "@/components/ui/modulo-banner";
import { obtenerTalleresAdmin } from "@/server/talleres/consultas";
import { TablaTalleres } from "@/components/admin/talleres/tabla-talleres";
import { EscanerPuertaDialog } from "@/components/admin/talleres/escaner-puerta-dialog";
import { ModalCrearTaller } from "@/components/admin/talleres/modal-crear-taller";

export const metadata = {
  title: "Talleres Presenciales | Panel Admin Amorelo",
  robots: { index: false, follow: false },
};

export default async function AdminTalleresPage() {
  const talleres = await obtenerTalleresAdmin();

  return (
    <main className="flex w-full flex-1 flex-col gap-6 p-6 sm:p-8">
      {/* Banner Principal con Validador Global de Puerta y Botón de Creación */}
      <ModuloBanner
        titulo="Talleres Presenciales"
        descripcion="Gestión de cupos, control de asistencia en puerta con escáner QR y reservas por WhatsApp."
        icono={CalendarDays}
        acciones={
          <div className="flex flex-wrap items-center gap-2.5">
            <EscanerPuertaDialog />
            <ModalCrearTaller />
          </div>
        }
      />

      {/* Listado de Talleres */}
      <TablaTalleres talleres={talleres} />
    </main>
  );
}
