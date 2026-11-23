// Página principal del módulo de Reclamaciones en el Panel Admin.
// Carga Server-Side con protección de admin y renderiza la TablaReclamaciones interactiva.

import { obtenerReclamosAdminAction } from "@/server/reclamos/acciones-admin";
import { TablaReclamaciones } from "@/components/admin/reclamaciones/tabla-reclamaciones";

export const metadata = {
  title: "Libro de Reclamaciones | Panel Admin Amorelo",
  robots: { index: false, follow: false },
};

interface AdminReclamacionesPageProps {
  searchParams: Promise<{ buscar?: string }>;
}

export default async function AdminReclamacionesPage({
  searchParams,
}: AdminReclamacionesPageProps) {
  const { buscar } = await searchParams;
  const { reclamos } = await obtenerReclamosAdminAction();

  return (
    <main className="flex w-full flex-1 flex-col">
      <TablaReclamaciones
        reclamosIniciales={reclamos}
        busquedaInicial={buscar || ""}
      />
    </main>
  );
}
