// Admin: Editor de Curso individual (Temario y Clases en Video + Revisión de Proyectos).

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Layers, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ModuloBanner } from "@/components/ui/modulo-banner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GestorTemario, type ModuloItem } from "@/components/admin/cursos/gestor-temario";
import { GestorProyectosCurso } from "@/components/admin/cursos/gestor-proyectos-curso";
import { listarAlumnosConProyectosCurso } from "@/server/admin/proyectos";

export const metadata = {
  title: "Gestión de Curso | Panel Admin Amorelo",
  robots: { index: false, follow: false },
};

export default async function AdminCursoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: curso }, { data: modulosData }] = await Promise.all([
    supabase
      .from("cursos")
      .select("id, nombre, slug, descripcion, imagen_url, precio_pen, precio_usd, activo")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("modulos")
      .select(`
        id,
        titulo,
        descripcion,
        orden,
        lecciones (
          id,
          titulo,
          descripcion,
          video_url,
          tipo_contenido,
          recurso_url,
          orden
        )
      `)
      .eq("curso_id", id)
      .order("orden", { ascending: true }),
  ]);

  if (!curso) {
    notFound();
  }

  // Extraer las lecciones del temario para alimentar de forma directa y sincronizada los proyectos
  const todasLeccionesCurso = (modulosData ?? []).flatMap(
    (m: any) => m.lecciones ?? []
  );

  const dataProyectos = await listarAlumnosConProyectosCurso(
    id,
    todasLeccionesCurso
  );

  // Ordenar lecciones dentro de cada módulo por orden numérico
  const modulosOrdenados: ModuloItem[] = (modulosData ?? []).map((m: any) => ({
    id: m.id,
    titulo: m.titulo,
    descripcion: m.descripcion,
    orden: m.orden,
    lecciones: (m.lecciones ?? []).sort((a: any, b: any) => a.orden - b.orden),
  }));

  return (
    <main className="flex w-full flex-1 flex-col gap-6 p-6 sm:p-8">
      {/* Botón Volver al Catálogo */}
      <div>
        <Link
          href="/panel-admin/cursos"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span>Volver al catálogo de cursos</span>
        </Link>
      </div>

      {/* Banner Principal del Curso */}
      <ModuloBanner
        titulo={curso.nombre}
        descripcion={`Ruta web: /cursos/${curso.slug} • Precio: S/ ${Number(curso.precio_pen).toFixed(2)}`}
        icono={BookOpen}
        acciones={
          <Badge
            variant={curso.activo ? "default" : "secondary"}
            className={
              curso.activo
                ? "bg-emerald-500/20 text-emerald-300 border-transparent font-bold px-3 py-1 text-xs"
                : "bg-white/20 text-white border-transparent font-bold px-3 py-1 text-xs"
            }
          >
            {curso.activo ? "Publicado (Activo)" : "Inhabilitado (Oculto)"}
          </Badge>
        }
      />

      {/* Pestañas de Gestión: Temario Académico vs Proyectos & Constancias */}
      <Tabs defaultValue="temario" className="w-full space-y-6">
        <div className="flex items-center">
          <TabsList className="w-full sm:w-fit grid grid-cols-2 sm:flex sm:items-center h-auto p-1 bg-muted/70 rounded-xl border border-border">
            <TabsTrigger
              value="temario"
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 py-2 text-xs font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs cursor-pointer"
            >
              <Layers className="size-3.5 sm:size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">Temario</span>
              <span className="hidden sm:inline">y Clases</span>
            </TabsTrigger>
            <TabsTrigger
              value="proyectos"
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 py-2 text-xs font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs cursor-pointer"
            >
              <Sparkles className="size-3.5 sm:size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">Proyectos</span>
              <span className="hidden sm:inline">&amp; Constancias</span>
              {dataProyectos.proyectos.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 min-w-5 px-1.5 text-[10px] font-extrabold flex items-center justify-center rounded-full"
                >
                  {dataProyectos.proyectos.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="temario" className="mt-0 space-y-6">
          <GestorTemario cursoId={curso.id} modulosIniciales={modulosOrdenados} />
        </TabsContent>

        <TabsContent value="proyectos" className="mt-0 space-y-6">
          <GestorProyectosCurso
            cursoId={curso.id}
            nombreCurso={curso.nombre}
            proyectosIniciales={dataProyectos.proyectos}
            alumnosIniciales={dataProyectos.alumnos}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
