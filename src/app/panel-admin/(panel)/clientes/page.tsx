// Módulo de Alumnos y Matrículas en Panel Admin (Item 5.5).
// Gestión de accesos, extensión de vigencia y matriculación manual para ventas por WhatsApp/Yape.

import { obtenerAlumnosMatriculadosAction } from "@/server/matriculas/acciones";
import { TablaAlumnosMatriculas } from "@/components/admin/matriculas/tabla-alumnos-matriculas";

export const metadata = {
  title: "Alumnos y Matrículas | Panel Admin Amorelo",
  robots: { index: false, follow: false },
};

interface AdminClientesPageProps {
  searchParams: Promise<{ buscar?: string }>;
}

export default async function AdminClientesPage({
  searchParams,
}: AdminClientesPageProps) {
  const { buscar } = await searchParams;
  const { matriculas, cursos } = await obtenerAlumnosMatriculadosAction();

  return (
    <main className="flex w-full flex-1 flex-col">
      <TablaAlumnosMatriculas
        matriculasIniciales={matriculas}
        cursos={cursos}
        busquedaInicial={buscar || ""}
      />
    </main>
  );
}
