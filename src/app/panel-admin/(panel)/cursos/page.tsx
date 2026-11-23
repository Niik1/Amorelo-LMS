// Admin: Catálogo de Cursos y Clases.
// Listado completo de cursos disponibles, creación de nuevos cursos y acceso al temario.

import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ModuloBanner } from "@/components/ui/modulo-banner";
import { TablaCursos, type CursoItem } from "@/components/admin/cursos/tabla-cursos";
import { ModalCrearCurso } from "@/components/admin/cursos/modal-crear-curso";
import type { CuponSimple } from "@/components/admin/cursos/simulador-ganancia-precios";

export const metadata = {
  title: "Cursos y Clases | Panel Admin Amorelo",
  robots: { index: false, follow: false },
};

export default async function AdminCursosPage() {
  const supabase = await createClient();

  const [{ data: cursos }, { data: cuponesData }] = await Promise.all([
    supabase
      .from("cursos")
      .select(`
        id,
        nombre,
        slug,
        descripcion,
        precio_pen,
        precio_usd,
        imagen_url,
        activo,
        creado_en,
        modulos (
          id,
          lecciones (id)
        )
      `)
      .order("creado_en", { ascending: false }),
    supabase
      .from("cupones")
      .select(
        "id, codigo, porcentaje, valido_desde, valido_hasta, usos_maximos, usos_actuales, activo"
      )
      .eq("activo", true)
      .order("creado_en", { ascending: false }),
  ]);

  const ahora = Date.now();
  const cuponesActivos: CuponSimple[] = (cuponesData ?? [])
    .filter((c) => {
      if (c.valido_desde && new Date(c.valido_desde).getTime() > ahora) return false;
      if (c.valido_hasta && new Date(c.valido_hasta).getTime() < ahora) return false;
      if (c.usos_maximos !== null && (c.usos_actuales ?? 0) >= c.usos_maximos) return false;
      return true;
    })
    .map((c) => ({
      id: c.id,
      codigo: c.codigo,
      porcentaje: Number(c.porcentaje),
    }));

  return (
    <main className="flex w-full flex-1 flex-col gap-6 p-6 sm:p-8">
      {/* Banner Principal con Botón de Creación */}
      <ModuloBanner
        titulo="Cursos y Clases"
        descripcion="Administra el catálogo de formación, precios, publicación y contenidos académicos."
        icono={BookOpen}
        acciones={<ModalCrearCurso cupones={cuponesActivos} />}
      />

      {/* Lista y Buscador de Cursos */}
      <TablaCursos
        cursos={(cursos ?? []) as unknown as CursoItem[]}
        cupones={cuponesActivos}
      />
    </main>
  );
}
