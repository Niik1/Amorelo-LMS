// Módulo de Configuración de Comprobantes y Facturación (A4 y Ticket).

import { FileText } from "lucide-react";
import { ModuloBanner } from "@/components/ui/modulo-banner";
import { obtenerConfiguracionComprobanteAction } from "@/server/configuracion/acciones";
import { ConfiguracionComprobantesForm } from "@/components/admin/configuracion/configuracion-comprobantes-form";

export const metadata = {
  title: "Configuración de Comprobantes | Panel Admin",
  description: "Personaliza el membrete, logo, canales de contacto, tratamiento de IGV y mensajes para boletas y tickets.",
};

export default async function AdminConfiguracionPage() {
  const configuracion = await obtenerConfiguracionComprobanteAction();

  return (
    <main className="flex w-full flex-1 flex-col gap-6 p-4 sm:p-6">
      <ModuloBanner
        titulo="Configuración de Comprobantes"
        descripcion="Personaliza el membrete, logo oficial, canales de contacto, tratamiento de IGV y leyendas legales para la emisión de boletas A4 y tickets."
        icono={FileText}
      />

      <ConfiguracionComprobantesForm configuracionInicial={configuracion} />
    </main>
  );
}
