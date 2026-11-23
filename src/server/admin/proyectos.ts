// Server Actions administrativas para la gestión y aprobación de proyectos y emisión de constancias por Brayan
"use server";

import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerAdminVerificado } from "@/server/auth/admin";
import { emitirCertificadoCursoAutomatico } from "@/server/certificados/emision";
import { revalidatePath } from "next/cache";

export type EstadoProyecto = "pendiente" | "enviado_whatsapp" | "aprobado" | "observado";

/**
 * Aprueba o actualiza el estado de un proyecto de un alumno desde el panel administrativo.
 */
export async function cambiarEstadoProyectoAdmin({
  proyectoId,
  matriculaId,
  perfilId,
  nuevoEstado,
  comentarios,
}: {
  proyectoId: string;
  matriculaId: string;
  perfilId: string;
  nuevoEstado: EstadoProyecto;
  comentarios?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);

  if (!adminId) {
    return { ok: false, error: "No autorizado. Se requieren permisos de administrador." };
  }

  const adminClient = createAdminClient();
  const ahora = new Date().toISOString();

  // Buscar entrega existente
  const { data: entregaExistente } = await adminClient
    .from("entregas_proyectos")
    .select("id")
    .eq("proyecto_id", proyectoId)
    .eq("matricula_id", matriculaId)
    .maybeSingle();

  if (entregaExistente) {
    const { error: errUpdate } = await adminClient
      .from("entregas_proyectos")
      .update({
        estado: nuevoEstado,
        fecha_aprobacion: nuevoEstado === "aprobado" ? ahora : null,
        aprobado_por: nuevoEstado === "aprobado" ? adminId : null,
        comentarios_admin: comentarios || null,
        actualizado_en: ahora,
      })
      .eq("id", entregaExistente.id);

    if (errUpdate) {
      return { ok: false, error: errUpdate.message };
    }
  } else {
    const { error: errInsert } = await adminClient.from("entregas_proyectos").insert({
      proyecto_id: proyectoId,
      matricula_id: matriculaId,
      perfil_id: perfilId,
      estado: nuevoEstado,
      fecha_aprobacion: nuevoEstado === "aprobado" ? ahora : null,
      aprobado_por: nuevoEstado === "aprobado" ? adminId : null,
      comentarios_admin: comentarios || null,
      fecha_envio_whatsapp: ahora,
    });

    if (errInsert) {
      return { ok: false, error: errInsert.message };
    }
  }

  revalidatePath("/panel-admin", "layout");
  revalidatePath("/aula", "layout");
  return { ok: true };
}

/**
 * Obtiene la lista de todos los alumnos de un curso con su avance de proyectos
 * para la botonera de revisión de Brayan.
 * Soporta recibir lecciones directas del Server Component para consistencia 100% garantizada con el temario.
 */
export async function listarAlumnosConProyectosCurso(
  cursoId: string,
  leccionesDirectas?: Array<{
    id: string;
    titulo: string;
    descripcion?: string | null;
    recurso_url?: string | null;
    tipo_contenido?: string;
  }>
) {
  const adminClient = createAdminClient();

  // 1. Obtener las lecciones del curso
  let todasLecciones = leccionesDirectas;
  if (!todasLecciones || todasLecciones.length === 0) {
    const { data: modulos } = await adminClient
      .from("modulos")
      .select("id")
      .eq("curso_id", cursoId);

    const modulosIds = (modulos ?? []).map((m) => m.id);

    if (modulosIds.length > 0) {
      const { data: lecciones } = await adminClient
        .from("lecciones")
        .select("id, titulo, descripcion, recurso_url, tipo_contenido, modulo_id")
        .in("modulo_id", modulosIds);

      todasLecciones = lecciones ?? [];
    } else {
      todasLecciones = [];
    }
  }

  // 2. Extraer las lecciones que tienen formato proyecto
  const leccionesProyecto = (todasLecciones ?? []).filter(
    (l) => l.tipo_contenido === "proyecto"
  );
  const leccionesProyectoIds = leccionesProyecto.map((l) => l.id);

  if (leccionesProyectoIds.length === 0) {
    return {
      proyectos: [],
      alumnos: [],
    };
  }

  // 3. Buscar proyectos definidos en tabla proyectos
  const { data: proyectosDb } = await adminClient
    .from("proyectos")
    .select("id, leccion_id, titulo_proyecto, es_obligatorio")
    .in("leccion_id", leccionesProyectoIds);

  const proyectosDbMap = new Map((proyectosDb ?? []).map((p) => [p.leccion_id, p]));

  // Auto-sincronizar y garantizar que cada lección proyecto tenga su registro
  const listaProyectos = await Promise.all(
    leccionesProyecto.map(async (l) => {
      const proy = proyectosDbMap.get(l.id);
      if (proy) {
        return proy;
      }

      // Si no existe, crear la fila en la tabla proyectos con adminClient
      const { data: creado } = await adminClient
        .from("proyectos")
        .upsert(
          {
            leccion_id: l.id,
            titulo_proyecto: l.titulo,
            instrucciones: l.descripcion || null,
            foto_referencia_url: l.recurso_url || null,
            es_obligatorio: true,
          },
          { onConflict: "leccion_id" }
        )
        .select("id, leccion_id, titulo_proyecto, es_obligatorio")
        .maybeSingle();

      return (
        creado || {
          id: l.id,
          leccion_id: l.id,
          titulo_proyecto: l.titulo,
          es_obligatorio: true,
        }
      );
    })
  );

  // 2. Obtener las matrículas activas del curso
  const { data: matriculas } = await adminClient
    .from("matriculas")
    .select(`
      id,
      estado,
      otorgada_en,
      perfil_id,
      profiles (
        id,
        nombre_completo,
        cliente_id,
        clientes (
          id,
          nombres,
          apellidos,
          telefono,
          correo
        )
      )
    `)
    .eq("curso_id", cursoId)
    .eq("estado", "activa")
    .order("otorgada_en", { ascending: false });

  if (!matriculas || matriculas.length === 0) {
    return {
      proyectos: listaProyectos,
      alumnos: [],
    };
  }

  const matriculaIds = matriculas.map((m) => m.id);

  // 3. Obtener todas las entregas de estos proyectos
  const { data: entregas } = await adminClient
    .from("entregas_proyectos")
    .select("id, proyecto_id, matricula_id, estado, fecha_envio_whatsapp, fecha_aprobacion")
    .in("matricula_id", matriculaIds);

  // 4. Obtener certificados/constancias ya emitidos
  const { data: certificados } = await adminClient
    .from("certificados")
    .select("id, matricula_id, codigo_verificacion, estado, ruta_pdf, emitido_en")
    .in("matricula_id", matriculaIds)
    .in("estado", ["vigente", "emitido"]);

  const entregasMap = new Map<string, NonNullable<typeof entregas>[number]>();
  (entregas ?? []).forEach((e) => {
    entregasMap.set(`${e.matricula_id}_${e.proyecto_id}`, e);
  });

  const certsMap = new Map((certificados ?? []).map((c) => [c.matricula_id, c]));

  const obligatorios = listaProyectos.filter((p) => p.es_obligatorio);

  const alumnos = matriculas.map((mat) => {
    const profile = mat.profiles as unknown as {
      id: string;
      nombre_completo: string | null;
      cliente_id: string | null;
      clientes: {
        id: string;
        nombres: string;
        apellidos: string;
        telefono: string | null;
        correo: string | null;
      } | null;
    } | null;

    const nombre =
      profile?.clientes?.nombres && profile.clientes.apellidos
        ? `${profile.clientes.nombres} ${profile.clientes.apellidos}`
        : profile?.nombre_completo || "Alumna Amorelo";

    const telefono = profile?.clientes?.telefono || null;
    const correo = profile?.clientes?.correo || null;

    // Estado por cada proyecto
    const estadosProyectos = listaProyectos.map((proy) => {
      const entrega = entregasMap.get(`${mat.id}_${proy.id}`);
      return {
        proyectoId: proy.id,
        titulo: proy.titulo_proyecto,
        esObligatorio: proy.es_obligatorio,
        estado: (entrega?.estado || "pendiente") as EstadoProyecto,
        fechaEnvio: entrega?.fecha_envio_whatsapp || null,
        fechaAprobacion: entrega?.fecha_aprobacion || null,
      };
    });

    const aprobadosCount = estadosProyectos.filter(
      (ep) => ep.esObligatorio && ep.estado === "aprobado",
    ).length;

    const todosObligatoriosAprobados =
      obligatorios.length === 0 || aprobadosCount >= obligatorios.length;

    const cert = certsMap.get(mat.id) || null;

    return {
      matriculaId: mat.id,
      perfilId: mat.perfil_id,
      nombre,
      telefono,
      correo,
      estadosProyectos,
      aprobadosCount,
      totalObligatorios: obligatorios.length,
      todosObligatoriosAprobados,
      constancia: cert
        ? {
            id: cert.id,
            codigo: cert.codigo_verificacion,
            rutaPdf: cert.ruta_pdf,
            emitidoEn: cert.emitido_en,
          }
        : null,
    };
  });

  return {
    proyectos: listaProyectos,
    alumnos,
  };
}

/**
 * Emite manualmente la Constancia de Finalización oficial para un alumno
 * una vez que Brayan confirmó sus proyectos.
 */
export async function emitirConstanciaManualAdmin({
  matriculaId,
  cursoId,
  perfilId,
}: {
  matriculaId: string;
  cursoId: string;
  perfilId: string;
}) {
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);

  if (!adminId) {
    return { ok: false, error: "No autorizado" };
  }

  // Emite el certificado/constancia con idempotencia y genera el PDF
  const resultado = await emitirCertificadoCursoAutomatico({
    matriculaId,
    perfilId,
    cursoId,
  });

  if (!resultado.ok) {
    return { ok: false, error: resultado.error };
  }

  revalidatePath("/panel-admin", "layout");
  revalidatePath("/aula", "layout");
  revalidatePath("/aula/certificados");

  return {
    ok: true,
    constancia: resultado.certificado,
  };
}
