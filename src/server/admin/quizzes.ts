// Server Actions administrativas para la creación, edición y gestión de Quizzes / Cuestionarios
"use server";

import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerAdminVerificado } from "@/server/auth/admin";
import { revalidatePath } from "next/cache";

export type OpcionAdmin = {
  id?: string;
  texto_opcion: string;
  es_correcta: boolean;
};

export type PreguntaAdmin = {
  id?: string;
  enunciado: string;
  orden: number;
  explicacion?: string | null;
  opciones: OpcionAdmin[];
};

export type QuizAdmin = {
  id: string;
  leccion_id: string;
  titulo: string;
  descripcion: string | null;
  porcentaje_minimo: number;
  intentos_permitidos: number | null;
  preguntas: PreguntaAdmin[];
};

export type GuardarQuizAdminInput = {
  leccionId: string;
  titulo: string;
  descripcion?: string | null;
  porcentajeMinimo: number;
  intentosPermitidos?: number | null;
  preguntas: PreguntaAdmin[];
};

/**
 * Obtiene la estructura completa de un Quiz para editarlo en el Panel Admin (incluye es_correcta).
 */
export async function obtenerQuizAdmin(
  leccionId: string
): Promise<{ ok: boolean; quiz?: QuizAdmin | null; error?: string }> {
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);

  if (!adminId) {
    return { ok: false, error: "No autorizado. Se requieren permisos de administrador." };
  }

  const adminClient = createAdminClient();

  // 1. Obtener Quiz
  const { data: quiz, error: errQuiz } = await adminClient
    .from("quizzes")
    .select("id, leccion_id, titulo, descripcion, porcentaje_minimo, intentos_permitidos")
    .eq("leccion_id", leccionId)
    .maybeSingle();

  if (errQuiz) {
    return { ok: false, error: errQuiz.message };
  }

  if (!quiz) {
    return { ok: true, quiz: null };
  }

  // 2. Obtener preguntas ordenadas
  const { data: preguntas, error: errPreguntas } = await adminClient
    .from("preguntas_quiz")
    .select("id, enunciado, orden, explicacion")
    .eq("quiz_id", quiz.id)
    .order("orden", { ascending: true });

  if (errPreguntas) {
    return { ok: false, error: errPreguntas.message };
  }

  const listaPreguntas = preguntas ?? [];
  const preguntaIds = listaPreguntas.map((p) => p.id);

  // 3. Obtener opciones con su bandera es_correcta
  const opcionesPorPregunta = new Map<string, OpcionAdmin[]>();
  if (preguntaIds.length > 0) {
    const { data: opciones, error: errOpciones } = await adminClient
      .from("opciones_quiz")
      .select("id, pregunta_id, texto_opcion, es_correcta")
      .in("pregunta_id", preguntaIds);

    if (errOpciones) {
      return { ok: false, error: errOpciones.message };
    }

    (opciones ?? []).forEach((op) => {
      const arr = opcionesPorPregunta.get(op.pregunta_id) || [];
      arr.push({
        id: op.id,
        texto_opcion: op.texto_opcion,
        es_correcta: op.es_correcta,
      });
      opcionesPorPregunta.set(op.pregunta_id, arr);
    });
  }

  return {
    ok: true,
    quiz: {
      id: quiz.id,
      leccion_id: quiz.leccion_id,
      titulo: quiz.titulo,
      descripcion: quiz.descripcion,
      porcentaje_minimo: quiz.porcentaje_minimo,
      intentos_permitidos: quiz.intentos_permitidos,
      preguntas: listaPreguntas.map((p) => ({
        id: p.id,
        enunciado: p.enunciado,
        orden: p.orden,
        explicacion: p.explicacion,
        opciones: opcionesPorPregunta.get(p.id) || [],
      })),
    },
  };
}

/**
 * Guarda o actualiza el cuestionario y sus preguntas en el Panel Admin.
 */
export async function guardarQuizAdmin(
  input: GuardarQuizAdminInput
): Promise<{ ok: boolean; quizId?: string; error?: string }> {
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);

  if (!adminId) {
    return { ok: false, error: "No autorizado. Se requieren permisos de administrador." };
  }

  if (!input.titulo.trim()) {
    return { ok: false, error: "El título del cuestionario es obligatorio." };
  }

  if (!input.preguntas || input.preguntas.length === 0) {
    return { ok: false, error: "Debes agregar al menos una pregunta al cuestionario." };
  }

  // Validar cada pregunta
  for (let i = 0; i < input.preguntas.length; i++) {
    const preg = input.preguntas[i];
    if (!preg.enunciado.trim()) {
      return { ok: false, error: `La pregunta #${i + 1} no tiene enunciado.` };
    }
    if (!preg.opciones || preg.opciones.length < 2) {
      return { ok: false, error: `La pregunta #${i + 1} debe tener al menos 2 alternativas.` };
    }
    const correctas = preg.opciones.filter((op) => op.es_correcta);
    if (correctas.length === 0) {
      return { ok: false, error: `La pregunta #${i + 1} no tiene ninguna alternativa marcada como correcta.` };
    }
    for (let j = 0; j < preg.opciones.length; j++) {
      if (!preg.opciones[j].texto_opcion.trim()) {
        return { ok: false, error: `La alternativa #${j + 1} en la pregunta #${i + 1} está vacía.` };
      }
    }
  }

  const adminClient = createAdminClient();
  const ahora = new Date().toISOString();

  // 1. Upsert en quizzes
  const { data: quizExistente } = await adminClient
    .from("quizzes")
    .select("id")
    .eq("leccion_id", input.leccionId)
    .maybeSingle();

  let quizId = quizExistente?.id;

  if (quizExistente) {
    const { error: errUpdate } = await adminClient
      .from("quizzes")
      .update({
        titulo: input.titulo.trim(),
        descripcion: input.descripcion?.trim() || null,
        porcentaje_minimo: input.porcentajeMinimo,
        intentos_permitidos: input.intentosPermitidos || null,
        actualizado_en: ahora,
      })
      .eq("id", quizExistente.id);

    if (errUpdate) {
      return { ok: false, error: errUpdate.message };
    }
  } else {
    const { data: nuevoQuiz, error: errInsert } = await adminClient
      .from("quizzes")
      .insert({
        leccion_id: input.leccionId,
        titulo: input.titulo.trim(),
        descripcion: input.descripcion?.trim() || null,
        porcentaje_minimo: input.porcentajeMinimo,
        intentos_permitidos: input.intentosPermitidos || null,
        creado_en: ahora,
        actualizado_en: ahora,
      })
      .select("id")
      .single();

    if (errInsert || !nuevoQuiz) {
      return { ok: false, error: errInsert?.message || "Error al crear quiz" };
    }
    quizId = nuevoQuiz.id;
  }

  if (!quizId) {
    return { ok: false, error: "No se pudo determinar el ID del cuestionario." };
  }

  // 2. Limpiar preguntas anteriores para reinsertar la lista limpia (las opciones se eliminan por CASCADE)
  await adminClient.from("preguntas_quiz").delete().eq("quiz_id", quizId);

  // 3. Insertar preguntas y opciones
  for (let idx = 0; idx < input.preguntas.length; idx++) {
    const p = input.preguntas[idx];
    const { data: pregInsertada, error: errPreg } = await adminClient
      .from("preguntas_quiz")
      .insert({
        quiz_id: quizId,
        enunciado: p.enunciado.trim(),
        orden: idx + 1,
        explicacion: p.explicacion?.trim() || null,
        creado_en: ahora,
      })
      .select("id")
      .single();

    if (errPreg || !pregInsertada) {
      return { ok: false, error: errPreg?.message || "Error al guardar preguntas" };
    }

    const opcionesParaInsertar = p.opciones.map((op) => ({
      pregunta_id: pregInsertada.id,
      texto_opcion: op.texto_opcion.trim(),
      es_correcta: Boolean(op.es_correcta),
      creado_en: ahora,
    }));

    const { error: errOps } = await adminClient
      .from("opciones_quiz")
      .insert(opcionesParaInsertar);

    if (errOps) {
      return { ok: false, error: errOps.message };
    }
  }

  revalidatePath("/panel-admin/cursos", "page");
  revalidatePath("/aula", "layout");

  return { ok: true, quizId };
}

/**
 * Elimina un quiz asociado a una lección.
 */
export async function eliminarQuizAdmin(
  leccionId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);

  if (!adminId) {
    return { ok: false, error: "No autorizado." };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("quizzes")
    .delete()
    .eq("leccion_id", leccionId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
