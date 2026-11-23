// Admin: Cupones — tabla con crear (diálogo), editar (lápiz),
// activar/inactivar y filtros (plan §8.4).

import { createClient } from "@/lib/supabase/server";
import { CuponesTabla, type FilaCupon } from "@/components/admin/cupones-tabla";

export const metadata = {
  title: "Cupones de Descuento | Panel Admin Amorelo",
  robots: { index: false, follow: false },
};

export default async function AdminCuponesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cupones")
    .select(
      "id,codigo,porcentaje,valido_desde,valido_hasta,usos_maximos,usos_actuales,activo,creado_en",
    )
    .order("creado_en", { ascending: false });

  const filas: FilaCupon[] = (data ?? []).map((c) => ({
    id: c.id,
    codigo: c.codigo,
    tipo_descuento: "porcentaje",
    valor_descuento: Number(c.porcentaje),
    valido_desde: c.valido_desde,
    valido_hasta: c.valido_hasta,
    usos_maximos: c.usos_maximos,
    usos_actuales: c.usos_actuales ?? 0,
    activo: c.activo,
    creado_en: c.creado_en,
  }));

  return (
    <main className="flex w-full flex-1 flex-col gap-6 p-6 sm:p-8">
      <CuponesTabla filas={filas} />
    </main>
  );
}
