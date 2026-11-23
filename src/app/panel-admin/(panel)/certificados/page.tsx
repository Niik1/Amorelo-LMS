// Módulo de Certificados Oficiales en Panel Admin.
// Visualización, emisión de certificados para talleres y rectificación trazable.

import { createClient } from "@/lib/supabase/server";
import {
  obtenerCertificadosAdminAction,
  obtenerTalleresParaEmisionAction,
} from "@/server/certificados/acciones-admin";
import { TablaCertificados } from "@/components/admin/certificados/tabla-certificados";

export const metadata = {
  title: "Certificados Oficiales | Panel Admin Amorelo",
  robots: { index: false, follow: false },
};

interface AdminCertificadosPageProps {
  searchParams: Promise<{ buscar?: string }>;
}

export default async function AdminCertificadosPage({
  searchParams,
}: AdminCertificadosPageProps) {
  const { buscar } = await searchParams;
  const supabase = await createClient();

  const [{ certificados, metricas }, { talleres }, { data: cursos }] = await Promise.all([
    obtenerCertificadosAdminAction(),
    obtenerTalleresParaEmisionAction(),
    supabase.from("cursos").select("id, nombre").order("nombre", { ascending: true }),
  ]);

  return (
    <main className="flex w-full flex-1 flex-col">
      <TablaCertificados
        certificadosIniciales={certificados}
        metricasIniciales={metricas}
        talleres={talleres}
        cursosDisponibles={(cursos ?? []).map((c) => ({ id: c.id, nombre: c.nombre }))}
        busquedaInicial={buscar || ""}
      />
    </main>
  );
}
