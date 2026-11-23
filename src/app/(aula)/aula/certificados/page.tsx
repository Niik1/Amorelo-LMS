// Aula: Mis Constancias Oficiales (RF-EST-37).
// Constancias de finalización y aprobación de proyectos emitidas al alumno por Amorelo.

import { redirect } from "next/navigation";
import { Award, Download, ExternalLink, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ModuloBanner } from "@/components/ui/modulo-banner";
import {
  IndicadorAvanceProyectos,
  type CursoConProyectosResumen,
} from "@/components/aula/indicador-avance-proyectos";
import { obtenerResumenProyectosCurso } from "@/server/aula/proyectos";
import Link from "next/link";

export default async function MisConstanciasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect_to=/aula/certificados");

  // 1. Obtener matrículas del alumno con información del curso
  const { data: matriculas } = await supabase
    .from("matriculas")
    .select("id, curso_id, estado, cursos(id, nombre, slug)")
    .eq("perfil_id", user.id)
    .eq("estado", "activa");

  const matriculaIds = (matriculas ?? []).map((m) => m.id);

  // 2. Obtener resumen de avance de proyectos para cada curso matriculado
  const cursosConProyectos: CursoConProyectosResumen[] = [];

  if (matriculas && matriculas.length > 0) {
    for (const mat of matriculas) {
      if (mat.curso_id && mat.cursos) {
        const cursoInfo = mat.cursos as unknown as { id: string; nombre: string; slug: string };
        const resumen = await obtenerResumenProyectosCurso({
          cursoId: mat.curso_id,
          matriculaId: mat.id,
        });

        // Solo incluir cursos que tienen proyectos prácticos definidos
        if (resumen.totalProyectos > 0) {
          cursosConProyectos.push({
            cursoId: mat.curso_id,
            cursoNombre: cursoInfo.nombre,
            cursoSlug: cursoInfo.slug,
            matriculaId: mat.id,
            resumen,
          });
        }
      }
    }
  }

  // 3. Obtener constancias/certificados ya emitidos
  let certificados: Array<{
    id: string;
    codigo_verificacion: string;
    tipo: string;
    titulo: string;
    nombre_certificado: string;
    emitido_en: string;
    ruta_pdf: string | null;
  }> = [];

  if (matriculaIds.length > 0) {
    const { data } = await supabase
      .from("certificados")
      .select("id, codigo_verificacion, tipo, titulo, nombre_certificado, emitido_en, ruta_pdf")
      .in("matricula_id", matriculaIds)
      .in("estado", ["vigente", "emitido"])
      .order("emitido_en", { ascending: false });

    if (data) {
      certificados = data;
    }
  }

  return (
    <main className="flex w-full flex-1 flex-col min-w-0 gap-8 p-4 sm:p-6 max-w-full">
      {/* Banner Principal */}
      <ModuloBanner
        titulo="Mis Constancias Oficiales"
        descripcion="Constancias de aprobación de proyectos y finalización emitidas a tu nombre por Amorelo."
        icono={Award}
      />

      {/* Indicador de Avance de Proyectos Prácticos */}
      {cursosConProyectos.length > 0 && (
        <IndicadorAvanceProyectos cursosConProyectos={cursosConProyectos} />
      )}

      {/* Sección de Constancias Emitidas */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-[#1e3a8a] dark:text-blue-400" />
          <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
            Constancias Emitidas
          </h2>
        </div>

        {certificados.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {certificados.map((cert) => (
              <div
                key={cert.id}
                className="overflow-hidden rounded-2xl border bg-card p-5 sm:p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                      🎓 Constancia de Finalización
                    </span>
                    <h3 className="mt-2 text-base font-extrabold text-foreground">
                      {cert.titulo}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Emitido a: <strong className="text-foreground">{cert.nombre_certificado}</strong>
                    </p>
                  </div>
                  <Award className="h-7 w-7 text-amber-500 shrink-0 ml-2" />
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                  <span>
                    Código:{" "}
                    <strong className="font-mono text-foreground font-bold">
                      {cert.codigo_verificacion}
                    </strong>
                  </span>
                  <span>
                    {new Date(cert.emitido_en).toLocaleDateString("es-PE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="mt-5 flex gap-2">
                  <Button
                    nativeButton={false}
                    render={
                      <a
                        href={cert.ruta_pdf || `/api/certificados/${cert.codigo_verificacion}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                    className="flex-1 bg-[#1e3a8a] font-bold text-white shadow-sm hover:bg-[#16294f] dark:bg-blue-600"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar PDF
                  </Button>
                  <Button
                    variant="outline"
                    nativeButton={false}
                    render={
                      <Link
                        href={`/verificar?codigo=${cert.codigo_verificacion}`}
                        target="_blank"
                      />
                    }
                    className="flex-1 font-bold"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Verificar QR
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card p-10 sm:p-12 text-center">
            <Award className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-base font-bold text-foreground">
              Aún no tienes constancias emitidas
            </h3>
            <p className="mt-2 max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Al completar el 100% de las clases y tener todos tus proyectos prácticos aprobados por el equipo de Amorelo, tu constancia oficial aparecerá aquí disponible para descargar y verificar.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
