// Acciones de progreso del aula: marcar/desmarcar lecciones completadas.

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { emitirCertificadoCursoAutomatico } from "@/server/certificados/emision";

export type ToggleProgresoResultado = {
  ok: boolean;
  completada: boolean;
  cursoCompletado?: boolean;
  certificado?: {
    id: string;
    codigo_verificacion: string;
    titulo: string;
    nombre_certificado: string;
    ruta_pdf: string | null;
  } | null;
  error?: string;
};

/**
 * Marca o desmarca una lección como completada (RF-EST-34).
 * Toggle: si ya está completada, la desmarca; si no, la marca.
 * Al alcanzar el 100% de las lecciones, emite automáticamente el certificado oficial.
 */
export async function toggleLeccionCompletada(
  leccionId: string,
): Promise<ToggleProgresoResultado> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, completada: false, error: "No autenticado" };

  // Verificar que la lección existe y el alumno tiene acceso
  const { data: leccion } = await supabase
    .from("lecciones")
    .select("id, modulos!inner(curso_id)")
    .eq("id", leccionId)
    .maybeSingle();

  if (!leccion) return { ok: false, completada: false, error: "Lección no encontrada" };

  const cursoId = (leccion.modulos as unknown as { curso_id: string }).curso_id;

  const { data: matricula } = await supabase
    .from("matriculas")
    .select("id")
    .eq("perfil_id", user.id)
    .eq("curso_id", cursoId)
    .eq("estado", "activa")
    .maybeSingle();

  if (!matricula) return { ok: false, completada: false, error: "Sin matrícula activa" };

  // Verificar si ya está completada
  const { data: existente } = await supabase
    .from("progreso_lecciones")
    .select("leccion_id")
    .eq("perfil_id", user.id)
    .eq("leccion_id", leccionId)
    .maybeSingle();

  if (existente) {
    // Desmarcar
    const { error } = await supabase
      .from("progreso_lecciones")
      .delete()
      .eq("perfil_id", user.id)
      .eq("leccion_id", leccionId);

    if (error) return { ok: false, completada: true, error: error.message };

    revalidatePath("/aula", "layout");
    return { ok: true, completada: false };
  } else {
    // Marcar como completada
    const { error } = await supabase
      .from("progreso_lecciones")
      .insert({ perfil_id: user.id, leccion_id: leccionId });

    if (error) return { ok: false, completada: false, error: error.message };

    // Verificar si alcanzó el 100% del curso
    let cursoCompletado = false;
    let certificadoGenerado = null;

    const { data: modulos } = await supabase
      .from("modulos")
      .select("id, lecciones(id)")
      .eq("curso_id", cursoId);

    const todasLeccionesIds: string[] = [];
    (modulos ?? []).forEach((m) => {
      (m.lecciones ?? []).forEach((l) => {
        todasLeccionesIds.push(l.id);
      });
    });

    const totalLecciones = todasLeccionesIds.length;

    if (totalLecciones > 0) {
      const { data: progreso } = await supabase
        .from("progreso_lecciones")
        .select("leccion_id")
        .eq("perfil_id", user.id)
        .in("leccion_id", todasLeccionesIds);

      const completadasCount = (progreso ?? []).length;

      if (completadasCount >= totalLecciones) {
        cursoCompletado = true;

        // Verificar si el curso tiene proyectos obligatorios que requieren aprobación de Brayan
        const { data: proyectosObligatorios } = await supabase
          .from("proyectos")
          .select("id")
          .in("leccion_id", todasLeccionesIds)
          .eq("es_obligatorio", true);

        const tieneProyectos = (proyectosObligatorios?.length ?? 0) > 0;

        if (tieneProyectos) {
          // Solo se emite si TODOS los proyectos obligatorios han sido aprobados por Brayan
          const proyectoIds = (proyectosObligatorios ?? []).map((p) => p.id);
          const { data: aprobados } = await supabase
            .from("entregas_proyectos")
            .select("id")
            .eq("matricula_id", matricula.id)
            .in("proyecto_id", proyectoIds)
            .eq("estado", "aprobado");

          const todosAprobados = (aprobados?.length ?? 0) >= proyectoIds.length;

          if (todosAprobados) {
            const resCert = await emitirCertificadoCursoAutomatico({
              matriculaId: matricula.id,
              perfilId: user.id,
              cursoId,
            });

            if (resCert.ok && resCert.certificado) {
              certificadoGenerado = resCert.certificado;
            }
          }
        } else {
          // Si el curso no tiene proyectos prácticos obligatorios, se emite normalmente
          const resCert = await emitirCertificadoCursoAutomatico({
            matriculaId: matricula.id,
            perfilId: user.id,
            cursoId,
          });

          if (resCert.ok && resCert.certificado) {
            certificadoGenerado = resCert.certificado;
          }
        }
      }
    }

    revalidatePath("/aula", "layout");
    revalidatePath("/aula/certificados");
    return {
      ok: true,
      completada: true,
      cursoCompletado,
      certificado: certificadoGenerado,
    };
  }
}
