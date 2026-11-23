// Server Actions para el seguimiento y entrega de Proyectos Prácticos (Aula Virtual)
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type EstadoProyecto = "pendiente" | "enviado_whatsapp" | "aprobado" | "observado";

export type DetalleProyectoLeccion = {
  id: string;
  leccion_id: string;
  titulo_proyecto: string;
  instrucciones: string | null;
  foto_referencia_url: string | null;
  es_obligatorio: boolean;
  entrega: {
    id: string;
    estado: EstadoProyecto;
    fecha_envio_whatsapp: string | null;
    fecha_aprobacion: string | null;
    comentarios_admin: string | null;
  } | null;
};

/**
 * Obtiene la definición del proyecto práctico asociado a una lección y el estado de entrega de la alumna.
 */
export async function obtenerProyectoLeccion({
  leccionId,
  matriculaId,
}: {
  leccionId: string;
  matriculaId: string;
}): Promise<{ ok: boolean; proyecto?: DetalleProyectoLeccion | null; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "No autenticado" };
  }

  // 1. Obtener la definición del proyecto para la lección
  const { data: proyecto, error: errProyecto } = await supabase
    .from("proyectos")
    .select("id, leccion_id, titulo_proyecto, instrucciones, foto_referencia_url, es_obligatorio")
    .eq("leccion_id", leccionId)
    .maybeSingle();

  if (errProyecto) {
    return { ok: false, error: errProyecto.message };
  }

  if (!proyecto) {
    return { ok: true, proyecto: null };
  }

  // 2. Obtener la entrega de la alumna si existe
  const { data: entrega } = await supabase
    .from("entregas_proyectos")
    .select("id, estado, fecha_envio_whatsapp, fecha_aprobacion, comentarios_admin")
    .eq("proyecto_id", proyecto.id)
    .eq("matricula_id", matriculaId)
    .maybeSingle();

  return {
    ok: true,
    proyecto: {
      id: proyecto.id,
      leccion_id: proyecto.leccion_id,
      titulo_proyecto: proyecto.titulo_proyecto,
      instrucciones: proyecto.instrucciones,
      foto_referencia_url: proyecto.foto_referencia_url,
      es_obligatorio: proyecto.es_obligatorio,
      entrega: entrega
        ? {
            id: entrega.id,
            estado: entrega.estado as EstadoProyecto,
            fecha_envio_whatsapp: entrega.fecha_envio_whatsapp,
            fecha_aprobacion: entrega.fecha_aprobacion,
            comentarios_admin: entrega.comentarios_admin,
          }
        : null,
    },
  };
}

/**
 * Registra que la alumna hizo clic en "Enviar a Brayan por WhatsApp" para este proyecto.
 * Cambia el estado a 'enviado_whatsapp' y registra el timestamp.
 */
export async function registrarEnvioProyectoWhatsApp({
  proyectoId,
  matriculaId,
}: {
  proyectoId: string;
  matriculaId: string;
}): Promise<{ ok: boolean; estado?: EstadoProyecto; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "No autenticado" };
  }

  // Verificar matrícula activa
  const { data: matricula } = await supabase
    .from("matriculas")
    .select("id, perfil_id")
    .eq("id", matriculaId)
    .eq("perfil_id", user.id)
    .eq("estado", "activa")
    .maybeSingle();

  if (!matricula) {
    return { ok: false, error: "Matrícula no encontrada o inactiva" };
  }

  const adminClient = createAdminClient();

  // Verificar si ya existe una entrega
  const { data: entregaExistente } = await adminClient
    .from("entregas_proyectos")
    .select("id, estado")
    .eq("proyecto_id", proyectoId)
    .eq("matricula_id", matriculaId)
    .maybeSingle();

  const ahora = new Date().toISOString();

  if (entregaExistente) {
    // Si ya está aprobado, no se sobreescribe el estado de aprobado
    if (entregaExistente.estado === "aprobado") {
      return { ok: true, estado: "aprobado" };
    }

    const { error: errUpdate } = await adminClient
      .from("entregas_proyectos")
      .update({
        estado: "enviado_whatsapp",
        fecha_envio_whatsapp: ahora,
        actualizado_en: ahora,
      })
      .eq("id", entregaExistente.id);

    if (errUpdate) {
      return { ok: false, error: errUpdate.message };
    }
  } else {
    // Insertar nueva entrega
    const { error: errInsert } = await adminClient.from("entregas_proyectos").insert({
      proyecto_id: proyectoId,
      matricula_id: matriculaId,
      perfil_id: user.id,
      estado: "enviado_whatsapp",
      fecha_envio_whatsapp: ahora,
    });

    if (errInsert) {
      return { ok: false, error: errInsert.message };
    }
  }

  revalidatePath("/aula", "layout");
  return { ok: true, estado: "enviado_whatsapp" };
}

/**
 * Devuelve el resumen de proyectos obligatorios y el estado de avance para una matrícula en un curso.
 */
export async function obtenerResumenProyectosCurso({
  cursoId,
  matriculaId,
}: {
  cursoId: string;
  matriculaId: string;
}) {
  const supabase = await createClient();

  // 1. Obtener datos del curso (slug) y todas las lecciones del curso
  const { data: cursoData } = await supabase
    .from("cursos")
    .select("slug")
    .eq("id", cursoId)
    .maybeSingle();

  const cursoSlug = cursoData?.slug || "";

  const { data: modulos } = await supabase
    .from("modulos")
    .select("id, orden, titulo, lecciones(id, titulo, orden, tipo_contenido)")
    .eq("curso_id", cursoId)
    .order("orden", { ascending: true });

  const leccionesIds: string[] = [];
  const leccionesInfoMap = new Map<string, { moduloId: string; orden: number; titulo: string }>();

  (modulos ?? []).forEach((m) => {
    (m.lecciones ?? []).forEach((l) => {
      leccionesIds.push(l.id);
      leccionesInfoMap.set(l.id, {
        moduloId: m.id,
        orden: l.orden,
        titulo: l.titulo,
      });
    });
  });

  if (leccionesIds.length === 0) {
    return {
      totalProyectos: 0,
      proyectosObligatorios: 0,
      aprobadosCount: 0,
      todosAprobados: true,
      proyectos: [],
    };
  }

  // 2. Obtener proyectos definidos
  const { data: proyectos } = await supabase
    .from("proyectos")
    .select("id, leccion_id, titulo_proyecto, es_obligatorio")
    .in("leccion_id", leccionesIds);

  if (!proyectos || proyectos.length === 0) {
    return {
      totalProyectos: 0,
      proyectosObligatorios: 0,
      aprobadosCount: 0,
      todosAprobados: true,
      proyectos: [],
    };
  }

  const proyectoIds = proyectos.map((p) => p.id);

  // 3. Obtener entregas de esta matrícula
  const { data: entregas } = await supabase
    .from("entregas_proyectos")
    .select("id, proyecto_id, estado, fecha_envio_whatsapp, fecha_aprobacion, comentarios_admin")
    .in("proyecto_id", proyectoIds)
    .eq("matricula_id", matriculaId);

  const entregasMap = new Map((entregas ?? []).map((e) => [e.proyecto_id, e]));

  const proyectosConEstado = proyectos.map((p) => {
    const entrega = entregasMap.get(p.id);
    const leccionInfo = leccionesInfoMap.get(p.leccion_id);
    return {
      ...p,
      moduloId: leccionInfo?.moduloId || "",
      leccionOrden: leccionInfo?.orden || 1,
      leccionTitulo: leccionInfo?.titulo || p.titulo_proyecto,
      cursoSlug,
      estado: (entrega?.estado || "pendiente") as EstadoProyecto,
      fecha_envio_whatsapp: entrega?.fecha_envio_whatsapp || null,
      fecha_aprobacion: entrega?.fecha_aprobacion || null,
      comentarios_admin: entrega?.comentarios_admin || null,
    };
  });

  const obligatorios = proyectosConEstado.filter((p) => p.es_obligatorio);
  const aprobadosCount = obligatorios.filter((p) => p.estado === "aprobado").length;
  const todosAprobados = obligatorios.length > 0 && aprobadosCount >= obligatorios.length;

  return {
    totalProyectos: proyectosConEstado.length,
    proyectosObligatorios: obligatorios.length,
    aprobadosCount,
    todosAprobados,
    proyectos: proyectosConEstado,
  };
}
