// Admin: Listado y Gestión de Comprobantes de Pago (Serie B001).
// Zero Storage: Renderizado de PDF al vuelo en memoria.

import { TablaComprobantes } from "@/components/admin/comprobantes/tabla-comprobantes";
import { obtenerComprobantesAction } from "@/server/comprobantes/acciones";

export const metadata = {
  title: "Comprobantes de Pago | Panel Admin Amorelo",
  robots: { index: false, follow: false },
};

export default async function AdminComprobantesPage() {
  const { comprobantes } = await obtenerComprobantesAction();

  return (
    <main className="flex w-full flex-1 flex-col">
      {/* Tabla Unificada con Banner, Filtros Reactivos y Vista Responsiva */}
      <TablaComprobantes comprobantesIniciales={comprobantes ?? []} />
    </main>
  );
}
